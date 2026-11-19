
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

    // 現在の日付を初期表示
    let currentDate = new Date();

    // PHPから取得したタスク
    let tasks = [];

    // 通信の競合を防止
    let requestId = 0;

    const chart =
        document.getElementById("ganttChart");

    const periodLabel =
        document.getElementById("currentPeriod");

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

        const dateText = String(value).slice(0, 10);

        const [year, month, day] =
            dateText.split("-").map(Number);

        return new Date(year, month - 1, day);
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

        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("/");
    }

    function formatDateForAPI(date) {

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

        // 日曜日を終了日とする
        const end = addDays(start, 6);

        return {
            start,
            end,
            count: 7,
            width: 120
        };
    }

    /* =====================================
       PHPからタスク取得
    ===================================== */

    async function fetchTasks() {

        const currentRequestId = ++requestId;

        const range = getWeekRange();

        // before = 開始日
        const before = formatDateForAPI(range.start);

        // after = 終了日
        const after = formatDateForAPI(range.end);

        // POST送信用データ
        const requestData = new URLSearchParams();

        requestData.append("before", before);
        requestData.append("after", after);

        console.log("PHPへ送信:", {
            before: before,
            after: after
        });

        try {

            const response = await fetch(API_URL, {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded;charset=UTF-8"
                },

                credentials: "same-origin",

                body: requestData.toString()

            });

            if (!response.ok) {

                throw new Error(
                    `HTTPエラー: ${response.status}`
                );
            }

            const result = await response.json();

            if (result.success !== true) {

                throw new Error(
                    result.comment ||
                    result.message ||
                    "タスクの取得に失敗しました。"
                );
            }

            if (!Array.isArray(result.tasks)) {

                throw new Error(
                    "PHPからのタスクデータが不正です。"
                );
            }

            // 古い通信結果は反映しない
            if (currentRequestId !== requestId) {
                return;
            }

            console.log("PHPから取得:", result.tasks);

            // DBのカラム名を画面用に変換
            tasks = result.tasks.map(task => ({

                id: task.task_id,

                name: task.task_name,

                start: String(task.start_date ?? "").slice(0, 10),

                end: String(task.due_date ?? "").slice(0, 10)

            }));

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

            renderChart();

            const errorMessage = document.createElement("p");

            errorMessage.className =
                "gantt-empty p-3";

            errorMessage.textContent =
                "タスクの取得に失敗しました。";

            chart.appendChild(errorMessage);
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

            html += `
                <div class="gantt-date ${dayClass}">

                    ${date.getMonth() + 1}/${date.getDate()}

                    <div>(${weekdays[day]})</div>

                </div>
            `;
        }

        html += `
                </div>
            </div>
        `;

        /* =====================================
           タスク表示
        ===================================== */

        tasks.forEach(task => {

            if (!task.start || !task.end) {
                return;
            }

            const start = parseDate(task.start);

            const end = parseDate(task.end);

            if (
                Number.isNaN(start.getTime()) ||
                Number.isNaN(end.getTime())
            ) {
                return;
            }

            const offset =
                dayDiff(range.start, start);

            const duration =
                dayDiff(start, end) + 1;

            const visibleStart =
                Math.max(0, offset);

            const visibleEnd = Math.min(
                range.count,
                offset + duration
            );

            let barHTML = "";

            if (visibleEnd > visibleStart) {

                const left =
                    visibleStart * range.width + 6;

                const width =
                    (visibleEnd - visibleStart) *
                    range.width - 12;

                barHTML = `
                    <div
                        class="gantt-task-bar"
                        style="
                            left:${left}px;
                            width:${width}px;
                        "
                        title="${escapeHTML(task.start)} ～ ${escapeHTML(task.end)}"
                    ></div>
                `;
            }

            html += `
                <div class="gantt-row gantt-task-row">

                    <div class="gantt-cell gantt-name">
                        ${escapeHTML(task.name)}
                    </div>

                    <div class="gantt-timeline">
                        ${barHTML}
                    </div>

                </div>
            `;
        });

        if (tasks.length === 0) {

            html += `
                <div class="gantt-empty p-3">
                    この期間にタスクはありません。
                </div>
            `;
        }

        chart.innerHTML = html;
    }

    /* =====================================
       画面更新
    ===================================== */

    function updateGantt() {

        // 期間表示を更新
        renderChart();

        // PHPからタスク取得
        fetchTasks();
    }

    /* =====================================
       前週へ移動
    ===================================== */

    document.getElementById("prevPeriod")
        ?.addEventListener("click", () => {

            currentDate = addDays(
                currentDate,
                -7
            );

            tasks = [];

            updateGantt();
        });

    /* =====================================
       翌週へ移動
    ===================================== */

    document.getElementById("nextPeriod")
        ?.addEventListener("click", () => {

            currentDate = addDays(
                currentDate,
                7
            );

            tasks = [];

            updateGantt();
        });

    /* =====================================
       初期表示
    ===================================== */

    updateGantt();

});
