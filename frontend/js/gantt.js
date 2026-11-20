
/* ========================================
   Tasfina ガントチャート
   週間表示・PHP連携版

   開始日：created_at
   終了日：due_date

   週跨ぎタスク対応
   完了タスクの色分け対応
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
       HTML要素取得
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
            "ガントチャートの要素が見つかりません。"
        );
        return;
    }

    /* =====================================
       日付解析
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

        if (
            date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== day
        ) {
            return null;
        }

        return date;
    }

    /* =====================================
       日付加算
    ===================================== */

    function addDays(date, amount) {

        const result = new Date(date);

        result.setDate(
            result.getDate() + amount
        );

        return result;
    }

    /* =====================================
       日数差計算
    ===================================== */

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

    /* =====================================
       日付表示
    ===================================== */

    function formatDate(date) {

        if (!date) {
            return "";
        }

        return [
            date.getFullYear(),
            String(
                date.getMonth() + 1
            ).padStart(2, "0"),
            String(
                date.getDate()
            ).padStart(2, "0")
        ].join("/");
    }

    /* =====================================
       API送信用日付
    ===================================== */

    function formatDateForAPI(date) {

        if (!date) {
            return "";
        }

        return [
            date.getFullYear(),
            String(
                date.getMonth() + 1
            ).padStart(2, "0"),
            String(
                date.getDate()
            ).padStart(2, "0")
        ].join("-");
    }

    /* =====================================
       HTMLエスケープ
    ===================================== */

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
       週間表示期間取得

       月曜日開始
       日曜日終了
    ===================================== */

    function getWeekRange() {

        const day = currentDate.getDay();

        const mondayOffset =
            (day + 6) % 7;

        const start = addDays(
            currentDate,
            -mondayOffset
        );

        const end = addDays(
            start,
            6
        );

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

        const id =
            task.id ??
            task.task_id ??
            index + 1;

        const name =
            task.title ??
            task.task_name ??
            task.name ??
            `タスク ${index + 1}`;

        /*
           PHPから返却される日付

           start_date = DATE(created_at)
           end_date   = due_date
        */

        const startValue =
            task.start_date ??
            task.created_at ??
            task.start ??
            null;

        const endValue =
            task.end_date ??
            task.due_date ??
            task.end ??
            null;

        const start =
            parseDate(startValue);

        const end =
            parseDate(endValue);

        /* =====================================
           ステータス取得

           DBのstatusカラムを使用
        ===================================== */

        const status =
            String(task.status ?? "").trim();

        return {
            id: id,
            name: String(name),
            start: start,
            end: end,
            status: status
        };
    }

    /* =====================================
       完了判定
    ===================================== */

    function isCompletedTask(task) {

        return task.status === "completed";
    }

    /* =====================================
       表示期間との重複判定
    ===================================== */

    function isTaskInRange(task, range) {

        if (!task.start || !task.end) {
            return false;
        }

        return (
            task.start <= range.end &&
            task.end >= range.start
        );
    }

    /* =====================================
       PHPからタスク取得
    ===================================== */

    async function fetchTasks() {

        const currentRequestId =
            ++requestId;

        const range =
            getWeekRange();

        const before =
            formatDateForAPI(range.start);

        const after =
            formatDateForAPI(range.end);

        const requestData =
            new URLSearchParams();

        requestData.append(
            "before",
            before
        );

        requestData.append(
            "after",
            after
        );

        isLoading = true;
        errorMessage = "";
        tasks = [];

        renderChart();

        console.log(
            "PHPへ送信する期間:",
            {
                before: before,
                after: after
            }
        );

        try {

            /* =====================================
               API通信
            ===================================== */

            const response = await fetch(
                API_URL,
                {
                    method: "POST",

                    credentials: "same-origin",

                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded;charset=UTF-8",

                        "Accept":
                            "application/json"
                    },

                    body:
                        requestData.toString()
                }
            );

            /* =====================================
               レスポンス取得
            ===================================== */

            const responseText =
                await response.text();

            let result;

            try {

                result =
                    JSON.parse(responseText);

            } catch (error) {

                console.error(
                    "PHPレスポンス:",
                    responseText
                );

                throw new Error(
                    "PHPから正しいJSON形式の応答がありません。"
                );
            }

            /* =====================================
               HTTPエラー
            ===================================== */

            if (!response.ok) {

                throw new Error(
                    result.comment ||
                    result.message ||
                    `HTTPエラー: ${response.status}`
                );
            }

            /* =====================================
               API処理結果確認
            ===================================== */

            if (result.success !== true) {

                throw new Error(
                    result.comment ||
                    result.message ||
                    "タスク取得に失敗しました。"
                );
            }

            if (!Array.isArray(result.tasks)) {

                throw new Error(
                    "タスクデータが配列ではありません。"
                );
            }

            /* =====================================
               古い通信結果を破棄
            ===================================== */

            if (
                currentRequestId !== requestId
            ) {
                return;
            }

            console.log(
                "PHPから取得したタスク:",
                result.tasks
            );

            /* =====================================
               データ変換
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
               読み込み完了
            ===================================== */

            isLoading = false;

            renderChart();

        } catch (error) {

            if (
                currentRequestId !== requestId
            ) {
                return;
            }

            console.error(
                "ガントチャート取得エラー:",
                error
            );

            tasks = [];
            isLoading = false;

            errorMessage =
                error.message ||
                "タスク取得に失敗しました。";

            renderChart();
        }
    }

    /* =====================================
       ガントチャート描画
    ===================================== */

    function renderChart() {

        const range =
            getWeekRange();

        const totalWidth =
            range.count * range.width;

        /* =====================================
           CSS変数設定
        ===================================== */

        chart.style.setProperty(
            "--timeline-width",
            `${totalWidth}px`
        );

        chart.style.setProperty(
            "--column-width",
            `${range.width}px`
        );

        /* =====================================
           表示期間
        ===================================== */

        periodLabel.textContent =
            `${formatDate(range.start)} ～ ${formatDate(range.end)}`;

        /* =====================================
           エラー表示
        ===================================== */

        if (errorArea) {

            errorArea.hidden =
                !errorMessage;

            errorArea.textContent =
                errorMessage;
        }

        /* =====================================
           読み込み表示
        ===================================== */

        if (loadingLabel) {

            loadingLabel.textContent =
                isLoading
                    ? "読み込み中..."
                    : "";
        }

        /* =====================================
           表示対象タスク
        ===================================== */

        const visibleTasks = tasks.filter(
            task =>
                isTaskInRange(task, range)
        );

        if (taskCount) {

            taskCount.textContent =
                isLoading
                    ? "タスクを読み込み中..."
                    : `表示中のタスク：${visibleTasks.length}件`;
        }

        /* =====================================
           曜日一覧
        ===================================== */

        const weekdays = [
            "日",
            "月",
            "火",
            "水",
            "木",
            "金",
            "土"
        ];

        /* =====================================
           ヘッダー描画
        ===================================== */

        let html = `
            <div class="gantt-row gantt-header">

                <div class="gantt-cell">
                    タスク名
                </div>

                <div class="gantt-dates">
        `;

        for (
            let i = 0;
            i < range.count;
            i++
        ) {

            const date =
                addDays(range.start, i);

            const day =
                date.getDay();

            const dayClass =
                day === 0
                    ? "sunday"
                    : day === 6
                        ? "saturday"
                        : "";

            const today =
                new Date();

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
           タスク行描画
        ===================================== */

        visibleTasks.forEach(task => {

            const start =
                task.start;

            const end =
                task.end;

            if (!start || !end) {
                return;
            }

            /* =====================================
               表示週との交差期間

               開始日が前週の場合：
               今週の月曜日から描画

               終了日が翌週の場合：
               今週の日曜日まで描画
            ===================================== */

            const visibleStartDate =
                start > range.start
                    ? start
                    : range.start;

            const visibleEndDate =
                end < range.end
                    ? end
                    : range.end;

            /* =====================================
               バー位置計算
            ===================================== */

            const startOffset =
                dayDiff(
                    range.start,
                    visibleStartDate
                );

            const visibleDays =
                dayDiff(
                    visibleStartDate,
                    visibleEndDate
                ) + 1;

            const left =
                startOffset * range.width + 6;

            const width =
                Math.max(
                    12,
                    visibleDays * range.width - 12
                );

            /* =====================================
               完了ステータス判定
            ===================================== */

            const isCompleted =
                isCompletedTask(task);

            const statusClass =
                isCompleted
                    ? "is-completed"
                    : "";

            /* =====================================
               ツールチップ
            ===================================== */

            const tooltip =
                `${task.name}\n` +
                `開始日：${formatDate(start)}\n` +
                `終了日：${formatDate(end)}\n` +
                `ステータス：${task.status || "未設定"}`;

            /* =====================================
               タスクバー

               完了タスク：
               グレー＋チェックアイコン

               その他：
               従来の青色
            ===================================== */

            const barHTML = `
                <div
                    class="gantt-task-bar ${statusClass}"
                    style="
                        left: ${left}px;
                        width: ${width}px;
                    "
                    title="${escapeHTML(tooltip)}"
                >

                    <span class="gantt-bar-label">
                        ${escapeHTML(task.name)}
                    </span>

                    ${isCompleted
                        ? `
                            <i
                                class="bi bi-check-circle-fill gantt-complete-icon"
                                aria-label="完了"
                            ></i>
                        `
                        : ""
                    }

                </div>
            `;

            /* =====================================
               タスク行
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

        /* =====================================
           HTML反映
        ===================================== */

        chart.innerHTML = html;
    }

    /* =====================================
       画面更新
    ===================================== */

    function updateGantt() {

        tasks = [];

        fetchTasks();
    }

    /* =====================================
       前週へ移動
    ===================================== */

    prevButton?.addEventListener(
        "click",
        () => {

            currentDate = addDays(
                currentDate,
                -7
            );

            updateGantt();
        }
    );

    /* =====================================
       翌週へ移動
    ===================================== */

    nextButton?.addEventListener(
        "click",
        () => {

            currentDate = addDays(
                currentDate,
                7
            );

            updateGantt();
        }
    );

    /* =====================================
       今週へ戻る
    ===================================== */

    todayButton?.addEventListener(
        "click",
        () => {

            currentDate = new Date();

            updateGantt();
        }
    );

    /* =====================================
       初期表示
    ===================================== */

    updateGantt();

});
