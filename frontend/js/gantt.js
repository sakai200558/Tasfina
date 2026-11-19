
/* ========================================
   Tasfina ガントチャート
   週間表示・PHP連携版
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================
       API設定
    ===================================== */

    const API_URL = "../../backend/naume_api.php";

    /* =====================================
       タスクデータ（仮データ）
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

    // 初期表示する日付
    let currentDate = new Date(2024, 9, 17);

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

        const [year, month, day] =
            value.split("-").map(Number);

        return new Date(
            year,
            month - 1,
            day
        );
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
            String(
                date.getMonth() + 1
            ).padStart(2, "0"),
            String(
                date.getDate()
            ).padStart(2, "0")
        ].join("/");
    }

    function formatDateForAPI(date) {

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

        // 月曜日を週の開始日とする
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
            start,
            end,
            count: 7,
            width: 120
        };
    }

    /* =====================================
       PHPへ表示期間をPOST送信
    ===================================== */

    async function sendPeriodToPHP() {

        const range = getWeekRange();

        // PHPに送るデータ
        const requestData = {
            before: formatDateForAPI(range.start),
            after: formatDateForAPI(range.end)
        };

        console.log(
            "PHPへ送信する期間:",
            requestData
        );

        try {

            const response = await fetch(API_URL, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                credentials: "same-origin",

                body: JSON.stringify(requestData)

            });

            if (!response.ok) {

                throw new Error(
                    `HTTPエラー: ${response.status}`
                );
            }

            const result = await response.json();

            if (result.success === false) {

                throw new Error(
                    result.message ||
                    "PHP側でエラーが発生しました。"
                );
            }

            console.log(
                "PHPからの応答:",
                result
            );

            return result;

        } catch (error) {

            console.error(
                "PHPへの期間送信に失敗しました:",
                error
            );

            return null;
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
           タスク表示
        ===================================== */

        tasks.forEach(task => {

            const start =
                parseDate(task.start);

            const end =
                parseDate(task.end);

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

        chart.innerHTML = html;
    }

    /* =====================================
       画面更新とPHP送信
    ===================================== */

    function updateGantt() {

        // ガントチャートを更新
        renderChart();

        // 表示期間をPHPに送信
        sendPeriodToPHP();
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

            updateGantt();
        });

    /* =====================================
       初期表示
    ===================================== */

    updateGantt();

});
