
/* ========================================
   Tasfina ガントチャート
   週間表示・PHP連携版
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================
       API設定
    ===================================== */

    const API_URL = "../../backend/natume_api.php";

    /* =====================================
       状態管理
    ===================================== */

    let currentDate = new Date();

    let tasks = [];

    let requestId = 0;

    let isLoading = false;

    let errorMessage = "";

    /* =====================================
       HTML要素の取得
    ===================================== */

    const chart =
        document.getElementById("ganttChart");

    const periodLabel =
        document.getElementById("currentPeriod");

    const taskCount =
        document.getElementById("ganttTaskCount");

    const loadingLabel =
        document.getElementById("ganttLoading");

    const errorArea =
        document.getElementById("ganttError");

    const prevButton =
        document.getElementById("prevPeriod");

    const nextButton =
        document.getElementById("nextPeriod");

    const todayButton =
        document.getElementById("todayButton");

    if (!chart || !periodLabel) {

        console.error(
            "ガントチャートのHTML要素が見つかりません。"
        );

        return;
    }

    /* =====================================
       日付処理
    ===================================== */

    function parseDate(value) {

        if (value === null || value === undefined) {
            return null;
        }

        if (value instanceof Date) {

            if (Number.isNaN(value.getTime())) {
                return null;
            }

            return new Date(
                value.getFullYear(),
                value.getMonth(),
                value.getDate()
            );
        }

        const text = String(value).trim();

        if (!text) {
            return null;
        }

        // YYYY-MM-DD
        // YYYY/MM/DD
        // YYYY-MM-DD HH:mm:ss
        // YYYY-MM-DDTHH:mm:ss
        // に対応

        const match = text.match(
            /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/
        );

        if (!match) {
            return null;
        }

        const year = Number(match[1]);

        const month = Number(match[2]);

        const day = Number(match[3]);

        const date = new Date(
            year,
            month - 1,
            day
        );

        // 不正な日付を除外
        if (
            date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== day
        ) {
            return null;
        }

        return date;
    }

    function addDays(date, amount) {

        const result = new Date(date);

        result.setDate(
            result.getDate() + amount
        );

        return result;
    }

    function dayDiff(first, second) {

        const a = Date.UTC(
            first.getFullYear(),
            first.getMonth(),
            first.getDate()
        );

        const b = Date.UTC(
            second.getFullYear(),
            second.getMonth(),
            second.getDate()
        );

        return Math.round(
            (b - a) / 86400000
        );
    }

    function formatDate(date) {

        if (!date) {
            return "";
        }

        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("/");
    }

    function formatDateForAPI(date) {

        if (!date) {
            return "";
        }

        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");
    }

    function escapeHTML(value) {

        return String(value ?? "").replace(
            /[&<>"']/g,
            char => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            })[char]
        );
    }

    /* =====================================
       週間表示期間の取得
    ===================================== */

    function getWeekRange() {

        const day = currentDate.getDay();

        // 月曜日を開始日とする
        const mondayOffset = (day + 6) % 7;

        const start = addDays(
            currentDate,
            -mondayOffset
        );

        const end = addDays(start, 6);

        return {
            start: start,
            end: end,
            count: 7,
            width: 120
        };
    }

    /* =====================================
       PHPデータ変換
    ===================================== */

    function normalizeTask(task, index) {

        // APIのカラム名を画面用に変換
        const id =
            task.task_id ??
            task.id ??
            index + 1;

        const name =
            task.task_name ??
            task.name ??
            task.title ??
            `タスク ${index + 1}`;

        // 開始日
        const startValue =
            task.start_date ??
            task.start ??
            task.startDate ??
            null;

        // 終了日
        const endValue =
            task.due_date ??
            task.end_date ??
            task.end ??
            task.dueDate ??
            null;

        let start = parseDate(startValue);

        let end = parseDate(endValue);

        // 開始日と終了日が逆の場合は補正
        if (start && end && start > end) {

            const temporary = start;

            start = end;

            end = temporary;
        }

        return {
            id: id,
            name: String(name),
            start: start,
            end: end
        };
    }

    /* =====================================
       表示期間との重複判定
    ===================================== */

    function isTaskInRange(task, range) {

        if (!task.start && !task.end) {
            return false;
        }

        // 片方だけ日付がある場合は
        // その日を単日タスクとして扱う
        const start = task.start || task.end;

        const end = task.end || task.start;

        return (
            start <= range.end &&
            end >= range.start
        );
    }

    /* =====================================
       PHPからタスク取得
    ===================================== */

    async function fetchTasks() {

        const currentRequestId = ++requestId;

        const range = getWeekRange();

        const before =
            formatDateForAPI(range.start);

        const after =
            formatDateForAPI(range.end);

        const requestData =
            new URLSearchParams();

        requestData.append("before", before);

        requestData.append("after", after);

        isLoading = true;

        errorMessage = "";

        renderChart();

        console.log("PHPへ送信:", {
            before: before,
            after: after
        });

        try {

            const response = await fetch(API_URL, {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded;charset=UTF-8",

                    "Accept": "application/json"
                },

                credentials: "same-origin",

                body: requestData.toString()

            });

            if (!response.ok) {

                throw new Error(
                    `HTTPエラー: ${response.status}`
                );
            }

            const responseText =
                await response.text();

            let result;

            try {

                result = JSON.parse(responseText);

            } catch (error) {

                console.error(
                    "PHPからの応答:",
                    responseText
                );

                throw new Error(
                    "PHPから正しいJSON形式の応答がありません。"
                );
            }

            if (result.success !== true) {

                throw new Error(
                    result.comment ||
                    result.message ||
                    "タスクの取得に失敗しました。"
                );
            }

            if (!Array.isArray(result.tasks)) {

                throw new Error(
                    "PHPからのタスクデータが配列ではありません。"
                );
            }

            // 古い通信結果は反映しない
            if (currentRequestId !== requestId) {
                return;
            }

            console.log(
                "PHPから取得したタスク:",
                result.tasks
            );

            /* =====================================
               タスクデータを変換
            ===================================== */

            tasks = result.tasks.map(
                (task, index) =>
                    normalizeTask(task, index)
            );

            console.log(
                "変換後のタスク:",
                tasks
            );

            /* =====================================
               描画
            ===================================== */

            isLoading = false;

            renderChart();

        } catch (error) {

            if (currentRequestId !== requestId) {
                return;
            }

            console.error(
                "タスク取得エラー:",
                error
            );

            tasks = [];

            isLoading = false;

            errorMessage =
                error.message ||
                "タスクの取得に失敗しました。";

            renderChart();
        }
    }

    /* =====================================
       ガントチャート描画
    ===================================== */

    function renderChart() {

        const range = getWeekRange();

        const totalWidth =
            range.count * range.width;

        chart.style.setProperty(
            "--timeline-width",
            `${totalWidth}px`
        );

        chart.style.setProperty(
            "--column-width",
            `${range.width}px`
        );

        /* =====================================
           期間表示
        ===================================== */

        periodLabel.textContent =
            `${formatDate(range.start)} ～ ${formatDate(range.end)}`;

        /* =====================================
           エラー表示
        ===================================== */

        if (errorArea) {

            errorArea.hidden = !errorMessage;

            errorArea.textContent = errorMessage;
        }

        /* =====================================
           読み込み状態
        ===================================== */

        if (loadingLabel) {

            loadingLabel.textContent =
                isLoading ? "読み込み中..." : "";
        }

        /* =====================================
           表示対象タスク取得
        ===================================== */

        const visibleTasks = tasks.filter(
            task => isTaskInRange(task, range)
        );

        if (taskCount) {

            taskCount.textContent =
                isLoading
                    ? "タスクを読み込み中..."
                    : `表示中のタスク：${visibleTasks.length}件`;
        }

        /* =====================================
           日付ヘッダー
        ===================================== */

        const weekdays = [
            "日", "月", "火", "水", "木", "金", "土"
        ];

        let html = `
            <div class="gantt-row gantt-header">

                <div class="gantt-cell">
                    タスク名
                </div>

                <div class="gantt-dates">
        `;

        for (let i = 0; i < range.count; i++) {

            const date = addDays(range.start, i);

            const day = date.getDay();

            const dayClass =
                day === 0 ? "sunday" :
                day === 6 ? "saturday" : "";

            const today = new Date();

            const isToday =
                dayDiff(date, today) === 0;

            html += `
                <div class="
                    gantt-date
                    ${dayClass}
                    ${isToday ? "today" : ""}
                ">

                    ${date.getMonth() + 1}/${date.getDate()}

                    <div>
                        (${weekdays[day]})
                    </div>

                </div>
            `;
        }

        html += `
                </div>
            </div>
        `;

        /* =====================================
           タスク行の描画
        ===================================== */

        visibleTasks.forEach(task => {

            const start =
                task.start || task.end;

            const end =
                task.end || task.start;

            if (!start || !end) {
                return;
            }

            /* =====================================
               タスク期間の計算
            ===================================== */

            const offset =
                dayDiff(range.start, start);

            const duration =
                dayDiff(start, end) + 1;

            const visibleStart =
                Math.max(0, offset);

            const visibleEnd =
                Math.min(
                    range.count,
                    offset + duration
                );

            /* =====================================
               バーの位置と幅
            ===================================== */

            let barHTML = "";

            if (visibleEnd > visibleStart) {

                const left =
                    visibleStart * range.width + 6;

                const width =
                    Math.max(
                        12,
                        (visibleEnd - visibleStart) *
                        range.width - 12
                    );

                const startText =
                    formatDate(start);

                const endText =
                    formatDate(end);

                const tooltip =
                    `${task.name}：${startText} ～ ${endText}`;

                barHTML = `
                    <div
                        class="gantt-task-bar"
                        style="
                            left: ${left}px;
                            width: ${width}px;
                        "
                        title="${escapeHTML(tooltip)}"
                    >
                        <span class="gantt-bar-label">
                            ${escapeHTML(task.name)}
                        </span>
                    </div>
                `;
            }

            /* =====================================
               タスク名とタイムライン
            ===================================== */

            html += `
                <div class="gantt-row gantt-task-row">

                    <div
                        class="gantt-cell gantt-name"
                        title="${escapeHTML(task.name)}"
                    >
                        <i class="bi bi-list-task"></i>

                        <span>
                            ${escapeHTML(task.name)}
                        </span>
                    </div>

                    <div class="gantt-timeline">
                        ${barHTML}
                    </div>

                </div>
            `;
        });

        /* =====================================
           タスクが存在しない場合
        ===================================== */

        if (
            visibleTasks.length === 0 &&
            !isLoading &&
            !errorMessage
        ) {

            html += `
                <div class="gantt-empty">

                    <i class="bi bi-calendar-x"></i>

                    <p>
                        この期間にタスクはありません。
                    </p>

                </div>
            `;
        }

        /* =====================================
           読み込み中
        ===================================== */

        if (isLoading) {

            html += `
                <div class="gantt-empty">

                    <div
                        class="spinner-border text-primary"
                        role="status"
                    >
                        <span class="visually-hidden">
                            読み込み中
                        </span>
                    </div>

                    <p>
                        タスクを読み込んでいます...
                    </p>

                </div>
            `;
        }

        chart.innerHTML = html;
    }

    /* =====================================
       画面更新
    ===================================== */

    function updateGantt() {

        // 前の週のデータをクリア
        tasks = [];

        // PHPから最新データ取得
        fetchTasks();
    }

    /* =====================================
       前週へ移動
    ===================================== */

    prevButton?.addEventListener("click", () => {

        currentDate = addDays(
            currentDate,
            -7
        );

        updateGantt();
    });

    /* =====================================
       翌週へ移動
    ===================================== */

    nextButton?.addEventListener("click", () => {

        currentDate = addDays(
            currentDate,
            7
        );

        updateGantt();
    });

    /* =====================================
       今週へ戻る
    ===================================== */

    todayButton?.addEventListener("click", () => {

        currentDate = new Date();

        updateGantt();
    });

    /* =====================================
       初期表示
    ===================================== */

    updateGantt();

});
