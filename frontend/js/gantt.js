
/* ========================================
   Tasfina ガントチャート
   シンプル期間表示版
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================
       タスクデータ
    ===================================== */

    const tasks = [
        {
            id: 1,
            name: "月次報告書作成",
            start: "2024-10-14",
            end: "2024-10-20"
        },
        {
            id: 2,
            name: "顧客資料確認",
            start: "2024-10-15",
            end: "2024-10-17"
        },
        {
            id: 3,
            name: "提案資料作成",
            start: "2024-10-16",
            end: "2024-10-18"
        },
        {
            id: 4,
            name: "業務マニュアル更新",
            start: "2024-10-17",
            end: "2024-10-19"
        },
        {
            id: 5,
            name: "新システム検証",
            start: "2024-10-18",
            end: "2024-10-19"
        },
        {
            id: 6,
            name: "会議資料作成",
            start: "2024-10-16",
            end: "2024-10-17"
        }
    ];

    /* =====================================
       状態管理
    ===================================== */

    let currentView = "week";

    // サンプルデータの期間を初期表示
    let currentDate = new Date(2024, 9, 17);

    let selectedTaskId = 1;

    const chart = document.getElementById("ganttChart");
    const detail = document.getElementById("taskDetail");
    const periodLabel = document.getElementById("currentPeriod");

    if (!chart || !detail || !periodLabel) {
        console.error(
            "ガントチャートのHTML要素が見つかりません。"
        );
        return;
    }

    /* =====================================
       日付処理
    ===================================== */

    function parseDate(value) {
        const [year, month, day] =
            value.split("-").map(Number);

        return new Date(year, month - 1, day);
    }

    function addDays(date, amount) {
        const result = new Date(date);
        result.setDate(result.getDate() + amount);
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

        return Math.round((b - a) / 86400000);
    }

    function formatDate(date) {
        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("/");
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
       表示期間の計算
    ===================================== */

    function getRange() {

        let start;
        let count;
        let width;

        if (currentView === "day") {

            start = addDays(currentDate, -1);
            count = 3;
            width = 200;

        } else if (currentView === "week") {

            const day = currentDate.getDay();
            const mondayOffset = (day + 6) % 7;

            start = addDays(
                currentDate,
                -mondayOffset
            );

            count = 7;
            width = 120;

        } else {

            start = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                1
            );

            count = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() + 1,
                0
            ).getDate();

            width = 45;
        }

        return { start, count, width };
    }

    /* =====================================
       期間ラベル
    ===================================== */

    function updatePeriodLabel() {

        const range = getRange();

        const end = addDays(
            range.start,
            range.count - 1
        );

        if (currentView === "month") {

            periodLabel.textContent =
                `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;

        } else {

            periodLabel.textContent =
                `${formatDate(range.start)} ～ ${formatDate(end)}`;

        }
    }

    /* =====================================
       ガントチャート描画
    ===================================== */

    function renderChart() {

        const range = getRange();

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

        updatePeriodLabel();

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

            const date = addDays(
                range.start,
                i
            );

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

        tasks.forEach(task => {

            const start = parseDate(task.start);
            const end = parseDate(task.end);

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
                        class="gantt-task-bar period"
                        style="left:${left}px;width:${width}px"
                        title="${escapeHTML(task.start)} ～ ${escapeHTML(task.end)}"
                    ></div>
                `;
            }

            html += `
                <div
                    class="gantt-row gantt-task-row ${selectedTaskId === task.id ? "selected" : ""}"
                    data-task-id="${task.id}"
                    tabindex="0"
                    role="button"
                    aria-label="${escapeHTML(task.name)}の期間を表示"
                >

                    <div class="gantt-cell gantt-name">
                        ${escapeHTML(task.name)}
                    </div>

                    <div class="gantt-timeline">
                        ${barHTML}
                    </div>

                </div>
            `;
        });

        chart.innerHTML = html;

        /* =====================================
           タスク選択
        ===================================== */

        chart.querySelectorAll(".gantt-task-row")
            .forEach(row => {

                const selectTask = () => {

                    selectedTaskId =
                        Number(row.dataset.taskId);

                    renderChart();
                    renderDetail();
                };

                row.addEventListener(
                    "click",
                    selectTask
                );

                row.addEventListener(
                    "keydown",
                    event => {

                        if (
                            event.key === "Enter" ||
                            event.key === " "
                        ) {
                            event.preventDefault();
                            selectTask();
                        }
                    }
                );
            });
    }

    /* =====================================
       選択タスク詳細
    ===================================== */

    function renderDetail() {

        const task = tasks.find(
            item => item.id === selectedTaskId
        );

        if (!task) {

            detail.innerHTML = `
                <p class="gantt-empty">
                    タスクを選択してください。
                </p>
            `;

            return;
        }

        const start = parseDate(task.start);
        const end = parseDate(task.end);

        const duration =
            dayDiff(start, end) + 1;

        detail.innerHTML = `
            <h3>${escapeHTML(task.name)}</h3>

            <div class="gantt-detail-content">

                <dl>
                    <dt>開始日</dt>
                    <dd>${formatDate(start)}</dd>

                    <dt>終了日</dt>
                    <dd>${formatDate(end)}</dd>

                    <dt>期間</dt>
                    <dd>${duration}日間</dd>
                </dl>

                <div class="gantt-detail-actions">

                    <button
                        type="button"
                        class="btn btn-primary"
                        id="requestComplete"
                    >
                        <i class="bi bi-check-circle"></i>
                        完了申請
                    </button>

                </div>

            </div>
        `;
    }

    /* =====================================
       表示単位切り替え
    ===================================== */

    document.querySelectorAll(
        ".gantt-view-switch button"
    ).forEach(button => {

        button.addEventListener("click", () => {

            currentView = button.dataset.view;

            document.querySelectorAll(
                ".gantt-view-switch button"
            ).forEach(item => {
                item.classList.remove("active");
            });

            button.classList.add("active");

            renderChart();
        });
    });

    /* =====================================
       前後の期間へ移動
    ===================================== */

    document.getElementById("prevPeriod")
        ?.addEventListener("click", () => {

            if (currentView === "day") {

                currentDate = addDays(
                    currentDate,
                    -1
                );

            } else if (currentView === "week") {

                currentDate = addDays(
                    currentDate,
                    -7
                );

            } else {

                currentDate = new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() - 1,
                    1
                );
            }

            renderChart();
        });

    document.getElementById("nextPeriod")
        ?.addEventListener("click", () => {

            if (currentView === "day") {

                currentDate = addDays(
                    currentDate,
                    1
                );

            } else if (currentView === "week") {

                currentDate = addDays(
                    currentDate,
                    7
                );

            } else {

                currentDate = new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() + 1,
                    1
                );
            }

            renderChart();
        });

    /* =====================================
       今日へ移動
    ===================================== */

    document.getElementById("todayButton")
        ?.addEventListener("click", () => {

            currentDate = new Date();

            renderChart();
        });

    /* =====================================
       モーダル用選択タスク取得
    ===================================== */

    window.getGanttSelectedTask = () => {

        const task = tasks.find(
            item => item.id === selectedTaskId
        );

        if (!task) {
            return null;
        }

        // 既存のモーダルが参照する
        // プロパティを維持する
        return {
            ...task,
            department: "",
            assignee: "",
            hours: 0,
            points: 0,
            status: "progress"
        };
    };

    /* =====================================
       モーダルHTML読み込み
    ===================================== */

    async function initializeModalHTML() {

        try {

            if (typeof loadModal !== "function") {
                throw new Error(
                    "common.js のloadModalが見つかりません。"
                );
            }

            await loadModal(
                "ganttModals",
                "../modals/gantt-modals.html"
            );

            if (
                !document.getElementById(
                    "taskCompleteModal"
                )
            ) {
                throw new Error(
                    "完了申請モーダルが見つかりません。"
                );
            }

            console.log(
                "完了申請モーダルを読み込みました。"
            );

        } catch (error) {

            console.error(
                "モーダル読み込みエラー:",
                error
            );
        }
    }

    /* =====================================
       初期表示
    ===================================== */

    renderChart();
    renderDetail();

    initializeModalHTML();

});
