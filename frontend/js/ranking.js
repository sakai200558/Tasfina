
/* ========================================
   Tasfina 負担スコアランキング
   データベース連携版
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================
       API設定・状態管理
    ===================================== */

    const API_URL = "../../backend/ranking.php";

    let members = [];
    let selectedMemberId = null;
    let activeTab = "members";

    const now = new Date();

    let displayedYear = now.getFullYear();
    let displayedMonth = now.getMonth();

    const getElement = id =>
        document.getElementById(id);

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

    /* =====================================
       表示用関数
    ===================================== */

    function escapeHtml(value) {
        return String(value ?? "").replace(
            /[&<>"']/g,
            character => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            })[character]
        );
    }

    function formatScore(value) {
        if (
            value === null ||
            value === undefined ||
            value === "" ||
            !Number.isFinite(Number(value))
        ) {
            return "-";
        }

        return Number(value).toFixed(1);
    }

    function formatChange(value) {
        if (
            value === null ||
            value === undefined ||
            !Number.isFinite(Number(value))
        ) {
            return {
                text: "未取得",
                className: "change-neutral"
            };
        }

        const number = Number(value);

        if (number > 0) {
            return {
                text: `↑ +${formatScore(number)}`,
                className: "change-up"
            };
        }

        if (number < 0) {
            return {
                text: `↓ ${formatScore(number)}`,
                className: "change-down"
            };
        }

        return {
            text: "→ ±0.0",
            className: "change-neutral"
        };
    }

    function formatCount(value, unit = "回") {
        return value === null || value === undefined
            ? "未取得"
            : `${value}${unit}`;
    }

    function showTableMessage(id, message, colspan) {
        const tbody = getElement(id);

        if (!tbody) return;

        tbody.replaceChildren();

        const row = tbody.insertRow();
        const cell = row.insertCell();

        cell.colSpan = colspan;
        cell.className = "text-center py-4";
        cell.textContent = message;
    }

    /* =====================================
       PHPからランキングを取得
    ===================================== */

    async function loadRanking() {

        showTableMessage(
            "memberRankingBody",
            "ランキングを読み込み中...",
            7
        );

        try {

            const response = await fetch(API_URL, {
                method: "GET",
                credentials: "same-origin",
                headers: {
                    "Accept": "application/json"
                },
                cache: "no-store"
            });

            if (response.status === 401) {
                window.location.href = "login.html";
                return;
            }

            const result = await response.json();

            if (!response.ok || result.success !== true) {
                throw new Error(
                    result.message ||
                    "ランキングの取得に失敗しました。"
                );
            }

            if (!Array.isArray(result.users)) {
                throw new Error(
                    "ランキングのデータ形式が不正です。"
                );
            }

            // PHPのJSONを画面用データに変換
            members = result.users.map(user => ({
                id: Number(user.user_id),
                name: user.display_name || "名前未設定",
                department: user.department_name ?? "未取得",
                score: Number(user.total_score),
                change: user.change ?? null,
                shifts: user.shifts ?? null,
                breakdown: Array.isArray(user.breakdown)
                    ? user.breakdown
                    : null,
                counts: Array.isArray(user.counts)
                    ? user.counts
                    : null,
                workHours: user.work_hours ?? null,
                busyDays: user.busy_days ?? null,
                taskCount: user.task_count ?? null,
                tasks: Array.isArray(user.tasks)
                    ? user.tasks
                    : []
            }))
            .filter(member =>
                Number.isFinite(member.id) &&
                Number.isFinite(member.score)
            )
            .sort((a, b) => b.score - a.score);

            if (
                !members.some(
                    member => member.id === selectedMemberId
                )
            ) {
                selectedMemberId = members[0]?.id ?? null;
            }

            initializeDepartments();
            renderAll();

            console.log(
                "ランキング取得成功:",
                members
            );

        } catch (error) {

            console.error(
                "ランキング取得エラー:",
                error
            );

            members = [];
            selectedMemberId = null;

            renderAll();

            showTableMessage(
                "memberRankingBody",
                error.message ||
                "ランキングを取得できませんでした。",
                7
            );
        }
    }

    /* =====================================
       月表示
    ===================================== */

    function updateMonthLabel() {
        const element = getElement("currentMonth");

        if (element) {
            element.textContent =
                `${displayedYear}年${displayedMonth + 1}月`;
        }
    }

    function changeMonth(offset) {
        const date = new Date(
            displayedYear,
            displayedMonth + offset,
            1
        );

        displayedYear = date.getFullYear();
        displayedMonth = date.getMonth();

        updateMonthLabel();
        renderAll();
    }

    /* =====================================
       フィルター
    ===================================== */

    function initializeDepartments() {

        const select = getElement("departmentFilter");
        if (!select) return;

        const previousValue = select.value;

        select.replaceChildren(
            new Option("すべて", "all")
        );

        const departments = [
            ...new Set(
                members
                    .map(member => member.department)
                    .filter(name => name !== "未取得")
            )
        ];

        departments.forEach(name => {
            select.add(new Option(name, name));
        });

        if (
            [...select.options].some(
                option => option.value === previousValue
            )
        ) {
            select.value = previousValue;
        }
    }

    function getFilteredMembers() {

        const department =
            getElement("departmentFilter")?.value ?? "all";

        const shiftType =
            getElement("shiftFilter")?.value ?? "all";

        const shiftIndex = {
            normal: 0,
            remote: 1,
            morning: 2
        }[shiftType];

        return members.filter(member => {

            const matchesDepartment =
                department === "all" ||
                member.department === department;

            // countsがない場合、勤務種別での
            // 判定ができないため該当なしとする
            const matchesShift =
                shiftType === "all" ||
                (
                    Array.isArray(member.counts) &&
                    Number(member.counts[shiftIndex] || 0) > 0
                );

            return matchesDepartment && matchesShift;

        }).sort((a, b) => b.score - a.score);
    }

    /* =====================================
       スコア内訳バー
    ===================================== */

    function buildBreakdownBar(member) {

        if (!Array.isArray(member.breakdown)) {
            return '<span class="text-muted">未取得</span>';
        }

        const total = member.breakdown.reduce(
            (sum, value) => sum + Number(value || 0),
            0
        );

        if (total <= 0) {
            return '<span class="text-muted">内訳なし</span>';
        }

        return `
            <div class="score-breakdown">
                ${member.breakdown.map((value, index) => {
                    const width =
                        Number(value || 0) / total * 100;

                    const label =
                        breakdownLabels[index] || "その他";

                    const cssClass =
                        breakdownClasses[index] || "normal";

                    return `
                        <span
                            class="breakdown-${cssClass}"
                            style="width:${width}%"
                            title="${label}: ${formatScore(value)}pt"
                        ></span>
                    `;
                }).join("")}
            </div>
        `;
    }

    /* =====================================
       サマリー
    ===================================== */

    function renderSummary() {

        const filtered = getFilteredMembers();

        const scoreIds = [
            "averageScore",
            "maximumScore",
            "minimumScore"
        ];

        const changeIds = [
            "averageChange",
            "maximumChange",
            "minimumChange"
        ];

        if (filtered.length === 0) {
            scoreIds.forEach(id => {
                const element = getElement(id);
                if (element) element.textContent = "-";
            });

            changeIds.forEach(id => {
                const element = getElement(id);
                if (element) element.textContent = "";
            });

            return;
        }

        const average = filtered.reduce(
            (sum, member) => sum + member.score,
            0
        ) / filtered.length;

        const highest = filtered[0];
        const lowest = filtered[filtered.length - 1];

        const scores = [
            average,
            highest.score,
            lowest.score
        ];

        scores.forEach((score, index) => {
            const element = getElement(scoreIds[index]);

            if (element) {
                element.textContent = formatScore(score);
            }
        });

        // 前月比は現在のPHPでは取得できない
        changeIds.forEach(id => {
            const element = getElement(id);

            if (element) {
                element.textContent = "前月比未取得";
                element.className = "change-neutral";
            }
        });
    }

    /* =====================================
       詳細モーダル起動
    ===================================== */

    function openMemberDetail(member) {

        selectedMemberId = member.id;

        renderMemberRanking();
        renderMemberDetail();

        if (
            window.TasfinaRankingDetail &&
            typeof window.TasfinaRankingDetail.open === "function"
        ) {
            window.TasfinaRankingDetail.open(
                member,
                {
                    year: displayedYear,
                    month: displayedMonth + 1
                }
            );
        } else {
            console.error(
                "ranking-detail.js が読み込まれていません。"
            );

            alert(
                "詳細モーダルを読み込めませんでした。"
            );
        }
    }

    /* =====================================
       メンバーランキング
    ===================================== */

    function renderMemberRanking() {

        const tbody = getElement("memberRankingBody");
        if (!tbody) return;

        const pageSize = Number(
            getElement("pageSize")?.value || 10
        );

        const allFiltered = getFilteredMembers();
        const visible = allFiltered.slice(0, pageSize);

        tbody.replaceChildren();

        if (visible.length === 0) {
            showTableMessage(
                "memberRankingBody",
                "該当するメンバーはいません。",
                7
            );
            return;
        }

        visible.forEach((member, index) => {

            const rank = index + 1;
            const change = formatChange(member.change);

            const row = document.createElement("tr");

            if (member.id === selectedMemberId) {
                row.classList.add("selected");
            }

            row.innerHTML = `
                <td>
                    ${rank <= 3
                        ? `<span class="rank-medal rank-${rank}">${rank}</span>`
                        : rank}
                </td>

                <td>
                    <div class="member-cell">
                        <span class="member-avatar">
                            <i class="bi bi-person-circle"></i>
                        </span>
                        ${escapeHtml(member.name)}
                    </div>
                </td>

                <td>${escapeHtml(member.department)}</td>

                <td class="${member.score >= 3.5 ? "score-red" : ""}">
                    ${formatScore(member.score)} pt
                </td>

                <td class="${change.className}">
                    ${change.text}
                </td>

                <td>${buildBreakdownBar(member)}</td>

                <td>${formatCount(member.shifts)}</td>
            `;

            row.addEventListener("click", () => {
                openMemberDetail(member);
            });

            row.tabIndex = 0;

            row.setAttribute(
                "aria-label",
                `${member.name}の負担スコア詳細を表示`
            );

            row.addEventListener("keydown", event => {
                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {
                    event.preventDefault();
                    openMemberDetail(member);
                }
            });

            tbody.appendChild(row);
        });
    }

    /* =====================================
       部門ランキング
    ===================================== */

    function renderDepartmentRanking() {

        const tbody = getElement("departmentRankingBody");
        if (!tbody) return;

        const filtered = getFilteredMembers();

        const grouped = new Map();

        filtered.forEach(member => {

            if (member.department === "未取得") {
                return;
            }

            if (!grouped.has(member.department)) {
                grouped.set(member.department, []);
            }

            grouped.get(member.department).push(member);
        });

        const departments = [...grouped.entries()]
            .map(([name, people]) => {

                const total = people.reduce(
                    (sum, member) => sum + member.score,
                    0
                );

                return {
                    name,
                    count: people.length,
                    total,
                    average: total / people.length
                };
            })
            .sort((a, b) => b.average - a.average);

        tbody.replaceChildren();

        if (departments.length === 0) {
            showTableMessage(
                "departmentRankingBody",
                "部門情報が未取得、または該当する部門がありません。",
                5
            );
            return;
        }

        departments.forEach((department, index) => {

            const row = tbody.insertRow();

            [
                index + 1,
                department.name,
                `${department.count}人`,
                `${formatScore(department.average)} pt`,
                `${formatScore(department.total)} pt`
            ].forEach(value => {
                const cell = row.insertCell();
                cell.textContent = value;
            });
        });
    }

    /* =====================================
       推移グラフ
    ===================================== */

    function renderTrendChart() {

        const chart = getElement("trendChart");
        if (!chart) return;

        chart.replaceChildren();

        const message = document.createElement("p");

        message.className = "text-muted text-center py-4";
        message.textContent =
            "月別のスコア履歴が未取得のため、推移グラフは表示できません。";

        chart.appendChild(message);
    }

    /* =====================================
       右側のメンバー詳細
    ===================================== */

    function renderMemberDetail() {

        const container = getElement("selectedMemberDetail");
        if (!container) return;

        const filtered = getFilteredMembers();

        const member = filtered.find(
            item => item.id === selectedMemberId
        ) || filtered[0];

        if (!member) {
            container.textContent =
                "表示できるメンバーがいません。";
            return;
        }

        selectedMemberId = member.id;

        const change = formatChange(member.change);

        const breakdownHtml = Array.isArray(member.breakdown)
            ? member.breakdown.map((value, index) => `
                <li>
                    <span>
                        <i class="ranking-detail-dot legend-color ${breakdownClasses[index] || "normal"}"></i>
                        ${breakdownLabels[index] || "その他"}
                    </span>
                    <strong>${formatScore(value)} pt</strong>
                </li>
            `).join("")
            : '<li>内訳データは未取得です。</li>';

        const countsHtml = Array.isArray(member.counts)
            ? member.counts.map((count, index) => `
                <li>
                    <span>
                        <i class="ranking-detail-dot legend-color ${breakdownClasses[index] || "normal"}"></i>
                        ${index === 4
                            ? "繁忙日"
                            : breakdownLabels[index] || "その他"}
                    </span>
                    <strong>${count}回</strong>
                </li>
            `).join("")
            : '<li>シフト実績は未取得です。</li>';

        container.innerHTML = `
            <div class="ranking-detail-profile">

                <span class="member-avatar large">
                    <i class="bi bi-person-circle"></i>
                </span>

                <div class="ranking-detail-name">
                    <strong>${escapeHtml(member.name)}</strong>
                    <small>${escapeHtml(member.department)}</small>
                </div>

                <div class="ranking-detail-total">
                    <span>負担スコア</span>
                    <strong>${formatScore(member.score)}</strong>
                    <small>pt</small>
                </div>

            </div>

            <div class="ranking-detail-change">
                前月比
                <strong class="${change.className}">
                    ${change.text}
                </strong>
            </div>

            <div class="ranking-detail-section">
                <h3>
                    スコアの内訳
                    <small>
                        （期間別データ未取得）
                    </small>
                </h3>

                <ul class="ranking-detail-list">
                    ${breakdownHtml}
                </ul>
            </div>

            <div class="ranking-detail-section">
                <h3>
                    シフト実績
                    <small>${formatCount(member.shifts)}</small>
                </h3>

                <ul class="ranking-detail-list">
                    ${countsHtml}
                </ul>
            </div>
        `;
    }

    /* =====================================
       タブ切り替え
    ===================================== */

    function initializeTabs() {

        const tabs =
            document.querySelectorAll(".ranking-tab");

        const panels = {
            members: getElement("membersPanel"),
            departments: getElement("departmentsPanel"),
            trend: getElement("trendPanel")
        };

        function activateTab(tabName) {

            activeTab = tabName;

            tabs.forEach(tab => {

                const isActive =
                    tab.dataset.tab === tabName;

                tab.classList.toggle("active", isActive);

                tab.setAttribute(
                    "aria-selected",
                    String(isActive)
                );

                tab.tabIndex = isActive ? 0 : -1;
            });

            Object.entries(panels).forEach(
                ([key, panel]) => {
                    if (panel) {
                        panel.hidden = key !== tabName;
                    }
                }
            );

            const legend = getElement("rankingLegend");
            const detailPanel =
                getElement("rankingDetailPanel");

            if (legend) {
                legend.hidden = tabName !== "members";
            }

            if (detailPanel) {
                detailPanel.hidden = tabName !== "members";
            }

            renderAll();
        }

        tabs.forEach(tab => {
            tab.addEventListener("click", () => {
                activateTab(tab.dataset.tab);
            });
        });

        activateTab("members");
    }

    /* =====================================
       全体描画
    ===================================== */

    function renderAll() {
        renderSummary();
        renderMemberRanking();
        renderDepartmentRanking();
        renderTrendChart();
        renderMemberDetail();
    }

    /* =====================================
       イベント登録
    ===================================== */

    getElement("previousMonth")
        ?.addEventListener("click", () => {
            changeMonth(-1);
        });

    getElement("nextMonth")
        ?.addEventListener("click", () => {
            changeMonth(1);
        });

    getElement("currentMonthButton")
        ?.addEventListener("click", () => {
            displayedYear = now.getFullYear();
            displayedMonth = now.getMonth();

            updateMonthLabel();
            renderAll();
        });

    [
        "shiftFilter",
        "departmentFilter",
        "pageSize"
    ].forEach(id => {
        getElement(id)?.addEventListener(
            "change",
            renderAll
        );
    });

    getElement("editMemberButton")
        ?.addEventListener("click", () => {
            alert(
                "メンバー編集機能は今後実装します。"
            );
        });

    getElement("viewMemberShifts")
        ?.addEventListener("click", () => {
            window.location.href = "shift.html";
        });

    /* =====================================
       初期化
    ===================================== */

    updateMonthLabel();
    initializeTabs();
    loadRanking();

});
