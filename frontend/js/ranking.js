
/* ========================================
   Tasfina 負担スコアランキング
   サンプルデータ版
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    // =====================================
    // サンプルデータ（10人）
    // =====================================

    const members = [
        {
            id: 1,
            name: "田中 美咲",
            department: "営業部",
            score: 4.8,
            change: 0.6,
            shifts: 18,
            breakdown: [1.8, 0.8, 0.5, 0, 1.7],
            counts: [8, 4, 2, 0, 4],
            workHours: 142.5,
            busyDays: 4,
            tasks: [
                {
                    name: "月次報告書の作成",
                    hours: 4,
                    formula: "4時間 × 0.1pt/時間",
                    points: 0.4
                },
                {
                    name: "顧客資料の作成",
                    hours: 6,
                    formula: "6時間 × 0.1pt/時間",
                    points: 0.6
                },
                {
                    name: "定例会議の準備",
                    hours: 2,
                    formula: "2時間 × 0.1pt/時間",
                    points: 0.2
                }
            ]
        },
        {
            id: 2,
            name: "伊藤 翔",
            department: "開発部",
            score: 4.2,
            change: 0.4,
            shifts: 16,
            breakdown: [1.6, 0.8, 0.5, 0, 1.3],
            counts: [7, 4, 2, 0, 3],
            workHours: 136,
            busyDays: 3,
            tasks: [
                {
                    name: "API実装",
                    hours: 8,
                    formula: "8時間 × 0.1pt/時間",
                    points: 0.8
                },
                {
                    name: "コードレビュー",
                    hours: 3,
                    formula: "3時間 × 0.1pt/時間",
                    points: 0.3
                }
            ]
        },
        {
            id: 3,
            name: "高橋 健",
            department: "営業部",
            score: 3.9,
            change: 0.3,
            shifts: 15,
            breakdown: [1.5, 0.7, 0.5, 0, 1.2],
            counts: [7, 3, 2, 0, 3],
            workHours: 128,
            busyDays: 3,
            tasks: [
                {
                    name: "顧客訪問準備",
                    hours: 5,
                    formula: "5時間 × 0.1pt/時間",
                    points: 0.5
                }
            ]
        },
        {
            id: 4,
            name: "渡辺 直樹",
            department: "サポート部",
            score: 3.1,
            change: 0.2,
            shifts: 12,
            breakdown: [1.2, 0.6, 0.5, 0, 0.8],
            counts: [5, 3, 2, 0, 2],
            workHours: 101.5,
            busyDays: 2,
            tasks: [
                {
                    name: "問い合わせ対応",
                    hours: 7,
                    formula: "7時間 × 0.1pt/時間",
                    points: 0.7
                }
            ]
        },
        {
            id: 5,
            name: "中村 優香",
            department: "営業部",
            score: 2.8,
            change: 0,
            shifts: 13,
            breakdown: [1.2, 0.6, 0.4, 0, 0.6],
            counts: [6, 3, 2, 0, 2],
            workHours: 108,
            busyDays: 2,
            tasks: [
                {
                    name: "提案書作成",
                    hours: 6,
                    formula: "6時間 × 0.1pt/時間",
                    points: 0.6
                }
            ]
        },
        {
            id: 6,
            name: "佐藤 花子",
            department: "開発部",
            score: 2.5,
            change: -0.3,
            shifts: 11,
            breakdown: [1.1, 0.5, 0.4, 0, 0.5],
            counts: [5, 3, 1, 0, 2],
            workHours: 92,
            busyDays: 2,
            tasks: [
                {
                    name: "画面デザイン調整",
                    hours: 4,
                    formula: "4時間 × 0.1pt/時間",
                    points: 0.4
                }
            ]
        },
        {
            id: 7,
            name: "山口 大輔",
            department: "サポート部",
            score: 2.1,
            change: -0.4,
            shifts: 10,
            breakdown: [0.9, 0.5, 0.3, 0, 0.4],
            counts: [4, 3, 1, 0, 2],
            workHours: 80,
            busyDays: 2,
            tasks: [
                {
                    name: "FAQ更新",
                    hours: 3,
                    formula: "3時間 × 0.1pt/時間",
                    points: 0.3
                }
            ]
        },
        {
            id: 8,
            name: "小林 楓",
            department: "営業部",
            score: 1.8,
            change: -0.5,
            shifts: 9,
            breakdown: [0.8, 0.4, 0.3, 0, 0.3],
            counts: [4, 2, 1, 0, 2],
            workHours: 72,
            busyDays: 2,
            tasks: [
                {
                    name: "営業日報",
                    hours: 2,
                    formula: "2時間 × 0.1pt/時間",
                    points: 0.2
                }
            ]
        },
        {
            id: 9,
            name: "加藤 彩",
            department: "企画部",
            score: 1.2,
            change: -0.2,
            shifts: 8,
            breakdown: [0.5, 0.3, 0.2, 0, 0.2],
            counts: [3, 2, 1, 0, 2],
            workHours: 64,
            busyDays: 2,
            tasks: [
                {
                    name: "企画案整理",
                    hours: 3,
                    formula: "3時間 × 0.1pt/時間",
                    points: 0.3
                }
            ]
        },
        {
            id: 10,
            name: "鈴木 一郎",
            department: "開発部",
            score: 0.8,
            change: -0.1,
            shifts: 6,
            breakdown: [0.3, 0.2, 0.1, 0, 0.2],
            counts: [2, 1, 1, 0, 2],
            workHours: 48,
            busyDays: 2,
            tasks: [
                {
                    name: "テストケース作成",
                    hours: 2,
                    formula: "2時間 × 0.1pt/時間",
                    points: 0.2
                }
            ]
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

    // =====================================
    // 状態管理
    // =====================================

    const now = new Date();

    let displayedYear = now.getFullYear();
    let displayedMonth = now.getMonth();

    let activeTab = "members";
    let selectedMemberId = 1;

    const getElement = id => document.getElementById(id);

    // =====================================
    // 共通関数
    // =====================================

    function formatScore(value) {
        return Number(value).toFixed(1);
    }

    function formatChange(value) {

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

    function escapeHtml(value) {

        return String(value).replace(
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

    // =====================================
    // 月切り替え
    // =====================================

    function updateMonthLabel() {

        getElement("currentMonth").textContent =
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

    // =====================================
    // フィルター
    // =====================================

    function getFilteredMembers() {

        const department =
            getElement("departmentFilter").value;

        const shiftType =
            getElement("shiftFilter").value;

        const shiftIndex = {
            normal: 0,
            remote: 1,
            morning: 2
        }[shiftType];

        return members
            .filter(member => {
                return department === "all" ||
                    member.department === department;
            })
            .filter(member => {
                return shiftType === "all" ||
                    member.counts[shiftIndex] > 0;
            })
            .sort((a, b) => b.score - a.score);
    }

    function initializeDepartments() {

        const select = getElement("departmentFilter");

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

    // =====================================
    // スコア内訳バー
    // =====================================

    function buildBreakdownBar(member) {

        const total = member.breakdown.reduce(
            (sum, value) => sum + value,
            0
        );

        return `
            <div class="score-breakdown">
                ${member.breakdown.map((value, index) => {

                    const width = total > 0
                        ? value / total * 100
                        : 0;

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

    // =====================================
    // サマリー表示
    // =====================================

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
                getElement(id).textContent = "-";
            });

            changeIds.forEach(id => {
                getElement(id).textContent = "";
            });

            return;
        }

        const average = filtered.reduce(
            (sum, member) => sum + member.score,
            0
        ) / filtered.length;

        const averageChange = filtered.reduce(
            (sum, member) => sum + member.change,
            0
        ) / filtered.length;

        const highest = filtered[0];
        const lowest = filtered[filtered.length - 1];

        const summary = [
            [average, averageChange],
            [highest.score, highest.change],
            [lowest.score, lowest.change]
        ];

        summary.forEach(([score, change], index) => {

            getElement(scoreIds[index]).textContent =
                formatScore(score);

            const changeElement = getElement(changeIds[index]);
            const formatted = formatChange(change);

            changeElement.textContent = formatted.text;
            changeElement.className = formatted.className;
        });
    }

    // =====================================
    // 詳細モーダル起動
    // =====================================

    function openMemberDetail(member) {

        selectedMemberId = member.id;

        // 既存の右側パネルも更新
        renderMemberRanking();
        renderMemberDetail();

        // モーダルを表示
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

    // =====================================
    // メンバーランキング
    // =====================================

    function renderMemberRanking() {

        const tbody = getElement("memberRankingBody");

        const pageSize = Number(
            getElement("pageSize").value
        );

        const visible = getFilteredMembers().slice(0, pageSize);

        tbody.replaceChildren();

        if (visible.length === 0) {

            const row = tbody.insertRow();
            const cell = row.insertCell();

            cell.colSpan = 7;
            cell.className = "text-center py-4";
            cell.textContent = "該当するメンバーはいません。";

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

                <td>${member.shifts}回</td>
            `;

            // クリックでモーダルを開く
            row.addEventListener("click", () => {
                openMemberDetail(member);
            });

            // キーボードでも開けるようにする
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

        }); // ← 前回抜けていた重要な閉じ括弧

    } // ← renderMemberRanking の終了

    // =====================================
    // 部門ランキング
    // =====================================

    function renderDepartmentRanking() {

        const tbody = getElement("departmentRankingBody");
        const filtered = getFilteredMembers();

        const grouped = new Map();

        filtered.forEach(member => {

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

            const row = tbody.insertRow();
            const cell = row.insertCell();

            cell.colSpan = 5;
            cell.className = "text-center py-4";
            cell.textContent = "該当する部門はありません。";

            return;
        }

        departments.forEach((department, index) => {

            const row = tbody.insertRow();

            const values = [
                index + 1,
                department.name,
                `${department.count}人`,
                `${formatScore(department.average)} pt`,
                `${formatScore(department.total)} pt`
            ];

            values.forEach(value => {

                const cell = row.insertCell();
                cell.textContent = value;
            });
        });
    }

    // =====================================
    // 推移グラフ
    // =====================================

    function renderTrendChart() {

        const chart = getElement("trendChart");
        const filtered = getFilteredMembers();

        const average = filtered.length
            ? filtered.reduce(
                (sum, member) => sum + member.score,
                0
            ) / filtered.length
            : 0;

        // 仮の月別変動値
        const offsets = [-0.4, -0.2, 0.1, -0.1, 0.2, 0];

        chart.replaceChildren();

        offsets.forEach((offset, index) => {

            const monthDate = new Date(
                displayedYear,
                displayedMonth - 5 + index,
                1
            );

            const value = Math.max(0, average + offset);

            const height = Math.min(
                180,
                value / 5 * 180
            );

            const column = document.createElement("div");
            column.className = "trend-column";

            const valueLabel = document.createElement("span");
            valueLabel.className = "trend-value";
            valueLabel.textContent = `${formatScore(value)}pt`;

            const bar = document.createElement("div");
            bar.className = "trend-bar";
            bar.style.height = `${height}px`;

            const monthLabel = document.createElement("span");
            monthLabel.className = "trend-label";
            monthLabel.textContent =
                `${monthDate.getMonth() + 1}月`;

            column.append(
                valueLabel,
                bar,
                monthLabel
            );

            chart.appendChild(column);
        });
    }

    // =====================================
    // 右側の選択メンバー詳細
    // =====================================

    function renderMemberDetail() {

        const container = getElement("selectedMemberDetail");

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
                        (${displayedYear}年${displayedMonth + 1}月)
                    </small>
                </h3>

                <ul class="ranking-detail-list">

                    ${member.breakdown.map((value, index) => `
                        <li>
                            <span>
                                <i class="ranking-detail-dot legend-color ${breakdownClasses[index]}"></i>
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
                                <i class="ranking-detail-dot legend-color ${breakdownClasses[index]}"></i>
                                ${index === 4
                                    ? "繁忙日"
                                    : breakdownLabels[index]}
                            </span>
                            <strong>${count}回</strong>
                        </li>
                    `).join("")}

                </ul>

            </div>
        `;
    }

    // =====================================
    // タブ切り替え
    // =====================================

    function initializeTabs() {

        const tabs = document.querySelectorAll(".ranking-tab");

        const panels = {
            members: getElement("membersPanel"),
            departments: getElement("departmentsPanel"),
            trend: getElement("trendPanel")
        };

        function activateTab(tabName) {

            activeTab = tabName;

            // タブボタンの表示を変更
            tabs.forEach(tab => {

                const isActive = tab.dataset.tab === tabName;

                tab.classList.toggle("active", isActive);

                tab.setAttribute(
                    "aria-selected",
                    String(isActive)
                );

                tab.tabIndex = isActive ? 0 : -1;
            });

            // 対象パネルだけ表示
            Object.entries(panels).forEach(([key, panel]) => {

                panel.hidden = key !== tabName;
            });

            // 凡例と右側詳細はメンバータブのみ
            getElement("rankingLegend").hidden =
                tabName !== "members";

            getElement("rankingDetailPanel").hidden =
                tabName !== "members";

            renderAll();
        }

        tabs.forEach(tab => {

            tab.addEventListener("click", () => {
                activateTab(tab.dataset.tab);
            });
        });

        // 初期タブ
        activateTab("members");
    }

    // =====================================
    // 全体再描画
    // =====================================

    function renderAll() {

        renderSummary();
        renderMemberRanking();
        renderDepartmentRanking();
        renderTrendChart();
        renderMemberDetail();
    }

    // =====================================
    // イベント登録
    // =====================================

    getElement("previousMonth")
        .addEventListener("click", () => {
            changeMonth(-1);
        });

    getElement("nextMonth")
        .addEventListener("click", () => {
            changeMonth(1);
        });

    getElement("currentMonthButton")
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

        getElement(id).addEventListener(
            "change",
            renderAll
        );
    });

    getElement("editMemberButton")
        .addEventListener("click", () => {

            alert(
                "メンバー編集画面との連携は今後実装します。"
            );
        });

    getElement("viewMemberShifts")
        .addEventListener("click", () => {

            window.location.href = "shift.html";
        });

    // =====================================
    // 初期化
    // =====================================

    initializeDepartments();
    updateMonthLabel();
    initializeTabs();

});
