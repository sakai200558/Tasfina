
/* ========================================
   Tasfina 負担スコアランキング
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ========================================
       サンプルデータ
    ======================================== */

    const members = [
        {
            id: 1,
            name: "田中 美咲",
            department: "営業部",
            score: 4.8,
            change: 0.6,
            shifts: 18,
            breakdown: [1.8, 0.8, 0.5, 0, 1.7],
            counts: [8, 4, 2, 0, 4]
        },
        {
            id: 2,
            name: "伊藤 翔",
            department: "開発部",
            score: 4.2,
            change: 0.4,
            shifts: 16,
            breakdown: [1.6, 0.8, 0.5, 0, 1.3],
            counts: [7, 4, 2, 0, 3]
        },
        {
            id: 3,
            name: "高橋 健",
            department: "営業部",
            score: 3.9,
            change: 0.3,
            shifts: 15,
            breakdown: [1.5, 0.7, 0.5, 0, 1.2],
            counts: [7, 3, 2, 0, 3]
        },
        {
            id: 4,
            name: "渡辺 直樹",
            department: "サポート部",
            score: 3.1,
            change: 0.2,
            shifts: 12,
            breakdown: [1.2, 0.6, 0.5, 0, 0.8],
            counts: [5, 3, 2, 0, 2]
        },
        {
            id: 5,
            name: "中村 優香",
            department: "営業部",
            score: 2.8,
            change: 0,
            shifts: 13,
            breakdown: [1.2, 0.6, 0.4, 0, 0.6],
            counts: [6, 3, 2, 0, 2]
        },
        {
            id: 6,
            name: "佐藤 花子",
            department: "開発部",
            score: 2.5,
            change: -0.3,
            shifts: 11,
            breakdown: [1.1, 0.5, 0.4, 0, 0.5],
            counts: [5, 3, 1, 0, 2]
        },
        {
            id: 7,
            name: "山口 大輔",
            department: "サポート部",
            score: 2.1,
            change: -0.4,
            shifts: 10,
            breakdown: [0.9, 0.5, 0.3, 0, 0.4],
            counts: [4, 3, 1, 0, 2]
        },
        {
            id: 8,
            name: "小林 楓",
            department: "営業部",
            score: 1.8,
            change: -0.5,
            shifts: 9,
            breakdown: [0.8, 0.4, 0.3, 0, 0.3],
            counts: [4, 2, 1, 0, 2]
        },
        {
            id: 9,
            name: "加藤 彩",
            department: "企画部",
            score: 1.2,
            change: -0.2,
            shifts: 8,
            breakdown: [0.5, 0.3, 0.2, 0, 0.2],
            counts: [3, 2, 1, 0, 2]
        },
        {
            id: 10,
            name: "鈴木 一郎",
            department: "開発部",
            score: 0.8,
            change: -0.1,
            shifts: 6,
            breakdown: [0.3, 0.2, 0.1, 0, 0.2],
            counts: [2, 1, 1, 0, 2]
        }
    ];

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

    /* ========================================
       状態
    ======================================== */

    const now = new Date();

    let displayedYear = now.getFullYear();
    let displayedMonth = now.getMonth();

    let activeTab = "members";
    let selectedMemberId = 1;

    const monthLabel = document.getElementById("currentMonth");

    /* ========================================
       補助関数
    ======================================== */

    function formatScore(value) {
        return Number(value).toFixed(1);
    }

    function formatChange(value) {
        const number = Number(value);

        if (number > 0) {
            return {
                text: `↑ +${number.toFixed(1)}`,
                className: "change-up"
            };
        }

        if (number < 0) {
            return {
                text: `↓ ${number.toFixed(1)}`,
                className: "change-down"
            };
        }

        return {
            text: "→ ±0.0",
            className: "change-neutral"
        };
    }

    function updateMonthLabel() {
        monthLabel.textContent =
            `${displayedYear}年${displayedMonth + 1}月`;
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

    function getFilteredMembers() {
        const department = document.getElementById(
            "departmentFilter"
        ).value;

        const shiftType = document.getElementById(
            "shiftFilter"
        ).value;

        return members
            .filter(member => {
                return department === "all" ||
                    member.department === department;
            })
            .filter(member => {
                if (shiftType === "all") {
                    return true;
                }

                const index = {
                    normal: 0,
                    remote: 1,
                    morning: 2
                }[shiftType];

                return member.counts[index] > 0;
            })
            .sort((a, b) => b.score - a.score);
    }

    function buildBreakdownBar(member) {
        const total = 6;

        return `
            <div class="score-breakdown">
                ${member.breakdown.map((value, index) => {
                    const width = Math.max(
                        0,
                        Math.min(100, value / total * 100)
                    );

                    return `
                        <span
                            class="breakdown-${breakdownClasses[index]}"
                            style="width:${width}%"
                            title="${breakdownLabels[index]}: ${formatScore(value)}pt"
                        ></span>
                    `;
                }).join("")}
            </div>
        `;
    }

    /* ========================================
       フィルター
    ======================================== */

    function initializeDepartments() {
        const select = document.getElementById(
            "departmentFilter"
        );

        const departments = [
            ...new Set(members.map(member => member.department))
        ];

        departments.forEach(department => {
            const option = document.createElement("option");
            option.value = department;
            option.textContent = department;
            select.appendChild(option);
        });
    }

    /* ========================================
       サマリー表示
    ======================================== */

    function renderSummary() {
        const filtered = getFilteredMembers();

        if (filtered.length === 0) {
            ["averageScore", "maximumScore", "minimumScore"]
                .forEach(id => {
                    document.getElementById(id).textContent = "-";
                });

            ["averageChange", "maximumChange", "minimumChange"]
                .forEach(id => {
                    document.getElementById(id).textContent = "";
                });

            return;
        }

        const average = filtered.reduce(
            (sum, member) => sum + member.score, 0
        ) / filtered.length;

        const highest = filtered[0];
        const lowest = filtered[filtered.length - 1];

        const averageChange = filtered.reduce(
            (sum, member) => sum + member.change, 0
        ) / filtered.length;

        const values = [
            ["averageScore", "averageChange", average, averageChange],
            ["maximumScore", "maximumChange", highest.score, highest.change],
            ["minimumScore", "minimumChange", lowest.score, lowest.change]
        ];

        values.forEach(([scoreId, changeId, score, change]) => {
            document.getElementById(scoreId).textContent =
                formatScore(score);

            const changeElement = document.getElementById(changeId);
            const formatted = formatChange(change);

            changeElement.textContent = formatted.text;
            changeElement.className = formatted.className;
        });
    }

    /* ========================================
       メンバーランキング
    ======================================== */

    function renderMemberRanking() {
        const tbody = document.getElementById(
            "memberRankingBody"
        );

        const pageSize = Number(
            document.getElementById("pageSize").value
        );

        const filtered = getFilteredMembers();
        const visible = filtered.slice(0, pageSize);

        tbody.innerHTML = "";

        if (visible.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        該当するメンバーはいません。
                    </td>
                </tr>
            `;
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
                    ${
                        rank <= 3
                            ? `<span class="rank-medal rank-${rank}">${rank}</span>`
                            : rank
                    }
                </td>

                <td>
                    <div class="member-cell">
                        <span class="member-avatar">
                            <i class="bi bi-person-circle"></i>
                        </span>
                        ${member.name}
                    </div>
                </td>

                <td>${member.department}</td>

                <td class="${member.score >= 3.5 ? "score-red" : ""}">
                    ${formatScore(member.score)} pt
                </td>

                <td class="${change.className}">
                    ${change.text}
                </td>

                <td>${buildBreakdownBar(member)}</td>

                <td>${member.shifts}回</td>
            `;

            row.addEventListener("click", () => {
                selectedMemberId = member.id;
                renderMemberRanking();
                renderMemberDetail();
            });

            tbody.appendChild(row);
        });
    }

    /* ========================================
       部門ランキング
    ======================================== */

    function renderDepartmentRanking() {
        const tbody = document.getElementById(
            "departmentRankingBody"
        );

        const filtered = getFilteredMembers();

        const grouped = {};

        filtered.forEach(member => {
            if (!grouped[member.department]) {
                grouped[member.department] = [];
            }

            grouped[member.department].push(member);
        });

        const departments = Object.entries(grouped)
            .map(([name, people]) => {
                const total = people.reduce(
                    (sum, member) => sum + member.score, 0
                );

                return {
                    name,
                    count: people.length,
                    total,
                    average: total / people.length
                };
            })
            .sort((a, b) => b.average - a.average);

        tbody.innerHTML = "";

        departments.forEach((department, index) => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${department.name}</td>
                <td>${department.count}人</td>
                <td>${formatScore(department.average)} pt</td>
                <td>${formatScore(department.total)} pt</td>
            `;

            tbody.appendChild(row);
        });
    }

    /* ========================================
       推移グラフ（サンプル）
    ======================================== */

    function renderTrendChart() {
        const chart = document.getElementById("trendChart");

        const average = getFilteredMembers().length
            ? getFilteredMembers().reduce(
                (sum, member) => sum + member.score, 0
            ) / getFilteredMembers().length
            : 0;

        // 仮の推移データ
        const offsets = [-0.4, -0.2, 0.1, -0.1, 0.2, 0];

        chart.innerHTML = "";

        offsets.forEach((offset, index) => {
            const monthDate = new Date(
                displayedYear,
                displayedMonth - 5 + index,
                1
            );

            const value = Math.max(0, average + offset);
            const height = Math.min(180, value / 5 * 180);

            const column = document.createElement("div");
            column.className = "trend-column";

            const label = document.createElement("span");
            label.className = "trend-value";
            label.textContent = `${formatScore(value)}pt`;

            const bar = document.createElement("div");
            bar.className = "trend-bar";
            bar.style.height = `${height}px`;

            const month = document.createElement("span");
            month.className = "trend-label";
            month.textContent = `${monthDate.getMonth() + 1}月`;

            column.append(label, bar, month);
            chart.appendChild(column);
        });
    }

    /* ========================================
       選択メンバー詳細
    ======================================== */

    function renderMemberDetail() {
        const container = document.getElementById(
            "selectedMemberDetail"
        );

        const filtered = getFilteredMembers();

        let member = filtered.find(
            item => item.id === selectedMemberId
        );

        if (!member) {
            member = filtered[0];
        }

        if (!member) {
            container.innerHTML = `
                <p class="text-muted">
                    表示できるメンバーがいません。
                </p>
            `;
            return;
        }

        selectedMemberId = member.id;

        const change = formatChange(member.change);

        container.innerHTML = `
            <div class="ranking-detail-profile">

                <span class="member-avatar large">
                    <i class="bi bi-person-circle"></i>
                </span>

                <div class="ranking-detail-name">
                    <strong>${member.name}</strong>
                    <small>${member.department}</small>
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
                        (${displayedYear}年${displayedMonth + 1}月)
                    </small>
                </h3>

                <ul class="ranking-detail-list">
                    ${member.breakdown.map((value, index) => `
                        <li>
                            <span>
                                <i
                                    class="ranking-detail-dot legend-color ${breakdownClasses[index]}"
                                ></i>
                                ${breakdownLabels[index]}
                            </span>
                            <strong>${formatScore(value)} pt</strong>
                        </li>
                    `).join("")}
                </ul>
            </div>

            <div class="ranking-detail-section">
                <h3>
                    シフト実績
                    (${displayedMonth + 1}月)
                    <small>${member.shifts}回</small>
                </h3>

                <ul class="ranking-detail-list">
                    ${member.counts.map((count, index) => `
                        <li>
                            <span>
                                <i
                                    class="ranking-detail-dot legend-color ${breakdownClasses[index]}"
                                ></i>
                                ${
                                    index === 4
                                        ? "休日"
                                        : breakdownLabels[index]
                                }
                            </span>
                            <strong>${count}回</strong>
                        </li>
                    `).join("")}
                </ul>
            </div>
        `;
    }

    /* ========================================
       タブ切り替え
    ======================================== */

    function initializeTabs() {
        const tabs = document.querySelectorAll(".ranking-tab");

        const panels = {
            members: document.getElementById("membersPanel"),
            departments: document.getElementById("departmentsPanel"),
            trend: document.getElementById("trendPanel")
        };

        tabs.forEach(tab => {
            tab.addEventListener("click", () => {
                activeTab = tab.dataset.tab;

                tabs.forEach(item => {
                    const isActive = item === tab;

                    item.classList.toggle("active", isActive);
                    item.setAttribute(
                        "aria-selected",
                        String(isActive)
                    );
                });

                Object.entries(panels).forEach(([key, panel]) => {
                    panel.hidden = key !== activeTab;
                });

                document.getElementById(
                    "rankingLegend"
                ).hidden = activeTab !== "members";

                document.getElementById(
                    "rankingDetailPanel"
                ).hidden = activeTab !== "members";

                renderAll();
            });
        });
    }

    /* ========================================
       全体再描画
    ======================================== */

    function renderAll() {
        renderSummary();
        renderMemberRanking();
        renderDepartmentRanking();
        renderTrendChart();
        renderMemberDetail();
    }

    /* ========================================
       イベント登録
    ======================================== */

    document.getElementById("previousMonth")
        .addEventListener("click", () => changeMonth(-1));

    document.getElementById("nextMonth")
        .addEventListener("click", () => changeMonth(1));

    document.getElementById("currentMonthButton")
        .addEventListener("click", () => {
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
        document.getElementById(id)
            .addEventListener("change", renderAll);
    });

    document.getElementById("editMemberButton")
        .addEventListener("click", () => {
            alert(
                "メンバー編集画面との連携は今後実装します。"
            );
        });

    document.getElementById("viewMemberShifts")
        .addEventListener("click", () => {
            window.location.href = "shifts.html";
        });

    /* ========================================
       初期化
    ======================================== */

    initializeDepartments();
    initializeTabs();
    updateMonthLabel();
    renderAll();

});
