
/* ========================================
   Tasfina 負担スコア詳細モーダル
======================================== */

(() => {

    const MODAL_PATH = "../modals/ranking-detail.html";

    const breakdownLabels = [
        "通常勤務",
        "在宅勤務",
        "午前休",
        "有給休暇",
        "繁忙期補正"
    ];

    const breakdownClasses = [
        "normal",
        "remote",
        "morning",
        "leave",
        "busy"
    ];

    let modalElement = null;
    let modalInstance = null;
    let loadingPromise = null;

    // =====================================
    // 表示用補助関数
    // =====================================

    function setText(id, value) {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
    }

    function formatScore(value) {
        return Number(value).toFixed(1);
    }

    function formatChange(value) {
        const number = Number(value);

        if (number > 0) {
            return {
                text: `↑ +${formatScore(number)} pt`,
                className: "ranking-modal-change-up"
            };
        }

        if (number < 0) {
            return {
                text: `↓ ${formatScore(number)} pt`,
                className: "ranking-modal-change-down"
            };
        }

        return {
            text: "→ ±0.0 pt",
            className: "ranking-modal-change-neutral"
        };
    }

    function formatHours(value) {
        if (value === null || value === undefined) {
            return "未取得";
        }

        return `${Number(value).toFixed(1)}時間`;
    }

    function formatCount(value, unit) {
        if (value === null || value === undefined) {
            return "未取得";
        }

        return `${value}${unit}`;
    }

    // =====================================
    // モーダルHTMLの読み込み
    // =====================================

    async function loadModal() {

        if (modalElement && modalInstance) {
            return modalInstance;
        }

        if (loadingPromise) {
            return loadingPromise;
        }

        loadingPromise = (async () => {

            if (!window.bootstrap?.Modal) {
                throw new Error(
                    "BootstrapのJavaScriptが読み込まれていません。"
                );
            }

            const response = await fetch(MODAL_PATH);

            if (!response.ok) {
                throw new Error(
                    "ランキング詳細モーダルの読み込みに失敗しました。"
                );
            }

            const html = await response.text();

            const template = document.createElement("template");
            template.innerHTML = html.trim();

            const element = template.content.querySelector(
                "#rankingDetailModal"
            );

            if (!element) {
                throw new Error(
                    "ranking-detail.html にモーダルがありません。"
                );
            }

            document.body.appendChild(element);

            modalElement = element;

            modalInstance = new bootstrap.Modal(modalElement);

            return modalInstance;

        })();

        try {
            return await loadingPromise;
        } finally {
            loadingPromise = null;
        }
    }

    // =====================================
    // スコア内訳
    // =====================================

    function renderBreakdown(member) {

        const bar = document.getElementById(
            "rankingModalBreakdownBar"
        );

        const list = document.getElementById(
            "rankingModalBreakdownList"
        );

        bar.replaceChildren();
        list.replaceChildren();

        const values = Array.isArray(member.breakdown)
            ? member.breakdown
            : [];

        const total = values.reduce(
            (sum, value) => sum + Number(value || 0),
            0
        );

        if (!values.length) {
            list.textContent = "内訳データはまだありません。";
            return;
        }

        values.forEach((value, index) => {

            const number = Number(value || 0);
            const label = breakdownLabels[index] || "その他";
            const className = breakdownClasses[index] || "normal";

            // 内訳バー
            const segment = document.createElement("span");

            segment.className =
                `ranking-modal-breakdown-segment ${className}`;

            segment.style.width = total > 0
                ? `${number / total * 100}%`
                : "0%";

            segment.title = `${label}: ${formatScore(number)}pt`;

            bar.appendChild(segment);

            // 内訳リスト
            const item = document.createElement("div");
            item.className = "ranking-modal-breakdown-item";

            const labelElement = document.createElement("span");
            labelElement.className = "ranking-modal-breakdown-label";

            const dot = document.createElement("i");
            dot.className =
                `ranking-modal-breakdown-dot ${className}`;

            const text = document.createElement("span");
            text.textContent = label;

            labelElement.append(dot, text);

            const score = document.createElement("strong");
            score.textContent = `${formatScore(number)} pt`;

            item.append(labelElement, score);
            list.appendChild(item);

        });
    }

    // =====================================
    // タスク別ポイント
    // =====================================

    function renderTasks(member) {

        const tbody = document.getElementById(
            "rankingModalTaskBody"
        );

        tbody.replaceChildren();

        const tasks = Array.isArray(member.tasks)
            ? member.tasks
            : [];

        if (!tasks.length) {

            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 4;
            cell.textContent =
                "タスク別の実績データはまだ登録されていません。";

            cell.className = "text-center text-muted py-4";

            row.appendChild(cell);
            tbody.appendChild(row);

            setText("rankingModalTaskTotal", "未取得");

            return null;
        }

        let total = 0;
        let allPointsAvailable = true;

        tasks.forEach(task => {

            const row = document.createElement("tr");

            const nameCell = document.createElement("td");
            nameCell.textContent = task.name ?? "-";

            const hoursCell = document.createElement("td");
            hoursCell.textContent = formatHours(task.hours);

            const formulaCell = document.createElement("td");
            formulaCell.textContent = task.formula ?? "未設定";

            const pointsCell = document.createElement("td");

            if (task.points === null || task.points === undefined) {
                pointsCell.textContent = "未取得";
                allPointsAvailable = false;
            } else {
                pointsCell.textContent =
                    `${formatScore(task.points)} pt`;

                total += Number(task.points);
            }

            row.append(
                nameCell,
                hoursCell,
                formulaCell,
                pointsCell
            );

            tbody.appendChild(row);
        });

        if (!allPointsAvailable) {
            setText("rankingModalTaskTotal", "未取得");
            return null;
        }

        setText(
            "rankingModalTaskTotal",
            `${formatScore(total)} pt`
        );

        return total;
    }

    // =====================================
    // 計算根拠
    // =====================================

    function renderCalculation(member, taskTotal) {

        const breakdown = Array.isArray(member.breakdown)
            ? member.breakdown
            : [];

        if (breakdown.length < 5) {

            [
                "rankingModalBaseScore",
                "rankingModalBusyBonus",
                "rankingModalTaskPoints",
                "rankingModalCalculatedTotal"
            ].forEach(id => setText(id, "未取得"));

            setText(
                "rankingModalCalculationNote",
                "スコア内訳のデータがありません。"
            );

            return;
        }

        const baseScore = breakdown
            .slice(0, 4)
            .reduce((sum, value) => sum + Number(value || 0), 0);

        const busyBonus = Number(breakdown[4] || 0);

        const calculatedTotal = baseScore + busyBonus;

        setText(
            "rankingModalBaseScore",
            `${formatScore(baseScore)} pt`
        );

        setText(
            "rankingModalBusyBonus",
            `+${formatScore(busyBonus)} pt`
        );

        setText(
            "rankingModalTaskPoints",
            taskTotal === null
                ? "未取得"
                : `${formatScore(taskTotal)} pt（参考）`
        );

        setText(
            "rankingModalCalculatedTotal",
            `${formatScore(calculatedTotal)} pt`
        );

        setText(
            "rankingModalCalculationNote",
            "現在のランキングの総負担スコアは、勤務区分スコアと" +
            "繁忙期補正の合計として表示しています。" +
            "タスクポイントは現時点では別の参考情報であり、" +
            "二重計上を防ぐため合計には加算していません。" +
            "正式な計算式はバックエンドのスコア設定と統一してください。"
        );
    }

    // =====================================
    // メンバー情報表示
    // =====================================

    function renderMember(member, period) {

        setText("rankingModalMemberName", member.name ?? "-");

        setText(
            "rankingModalDepartment",
            member.department ?? "-"
        );

        setText(
            "rankingModalPeriod",
            `${period.year}年${period.month}月`
        );

        setText(
            "rankingModalTotalScore",
            formatScore(member.score)
        );

        const change = formatChange(member.change ?? 0);

        const changeElement = document.getElementById(
            "rankingModalChange"
        );

        changeElement.textContent = change.text;
        changeElement.className = change.className;

        setText(
            "rankingModalWorkHours",
            formatHours(member.workHours)
        );

        setText(
            "rankingModalTaskCount",
            formatCount(member.taskCount, "件")
        );

        setText(
            "rankingModalShiftCount",
            formatCount(member.shifts, "回")
        );

        setText(
            "rankingModalBusyDays",
            formatCount(member.busyDays, "回")
        );

        renderBreakdown(member);

        const taskTotal = renderTasks(member);

        renderCalculation(member, taskTotal);
    }

    // =====================================
    // モーダルを開く
    // =====================================

    async function openRankingDetail(member, period) {

        try {

            const modal = await loadModal();

            const status = document.getElementById(
                "rankingModalStatus"
            );

            const content = document.getElementById(
                "rankingModalContent"
            );

            status.hidden = true;
            content.hidden = false;

            renderMember(member, period);

            modal.show();

        } catch (error) {

            console.error(
                "負担スコア詳細モーダルエラー:",
                error
            );

            alert(
                "負担スコア詳細を表示できませんでした。"
            );

        }
    }

    // ranking.js から呼び出す公開関数
    window.TasfinaRankingDetail = {
        open: openRankingDetail
    };

})();
