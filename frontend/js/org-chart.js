
/* ========================================
   Tasfina 組織図画面専用JavaScript
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================
       サンプルメンバーデータ
    ===================================== */

    const members = {

        president: {
            id: "president",
            name: "山田 太郎",
            reading: "やまだ たろう",
            department: "代表取締役",
            role: "全門管理者",
            employeeId: "A001",
            email: "taro.yamada@tasfina.jp",
            score: 3.2,
            change: 0.2,
            shifts: {
                normal: 15,
                remote: 4,
                morning: 0,
                paid: 1,
                holiday: 3
            }
        },

        salesManager: {
            id: "salesManager",
            name: "田中 美咲",
            reading: "たなか みさき",
            department: "営業部",
            role: "部門管理者",
            employeeId: "S001",
            email: "misaki.tanaka@tasfina.jp",
            score: 2.1,
            change: -0.3,
            shifts: {
                normal: 12,
                remote: 2,
                morning: 0,
                paid: 1,
                holiday: 3
            }
        },

        developmentManager: {
            id: "developmentManager",
            name: "佐藤 花子",
            reading: "さとう はなこ",
            department: "開発部",
            role: "部門管理者",
            employeeId: "D001",
            email: "hanako.sato@tasfina.jp",
            score: 3.4,
            change: 0.4,
            shifts: {
                normal: 15,
                remote: 4,
                morning: 1,
                paid: 0,
                holiday: 4
            }
        },

        supportManager: {
            id: "supportManager",
            name: "渡辺 直樹",
            reading: "わたなべ なおき",
            department: "サポート部",
            role: "部門管理者",
            employeeId: "P001",
            email: "naoki.watanabe@tasfina.jp",
            score: 2.8,
            change: -0.1,
            shifts: {
                normal: 16,
                remote: 1,
                morning: 2,
                paid: 0,
                holiday: 4
            }
        },

        sales1: {
            id: "sales1",
            name: "鈴木 一郎",
            reading: "すずき いちろう",
            department: "営業1課",
            role: "リーダー",
            employeeId: "S002",
            email: "ichiro.suzuki@tasfina.jp",
            score: 2.5,
            change: 0.1,
            shifts: {
                normal: 17,
                remote: 1,
                morning: 0,
                paid: 0,
                holiday: 4
            }
        },

        sales2: {
            id: "sales2",
            name: "高橋 健",
            reading: "たかはし けん",
            department: "営業2課",
            role: "リーダー",
            employeeId: "S003",
            email: "ken.takahashi@tasfina.jp",
            score: 3.0,
            change: 0.2,
            shifts: {
                normal: 18,
                remote: 0,
                morning: 0,
                paid: 1,
                holiday: 4
            }
        },

        sales3: {
            id: "sales3",
            name: "中村 優香",
            reading: "なかむら ゆうか",
            department: "営業3課",
            role: "リーダー",
            employeeId: "S004",
            email: "yuka.nakamura@tasfina.jp",
            score: 1.8,
            change: -0.2,
            shifts: {
                normal: 13,
                remote: 4,
                morning: 0,
                paid: 2,
                holiday: 4
            }
        },

        development1: {
            id: "development1",
            name: "伊藤 翔",
            reading: "いとう しょう",
            department: "開発1課",
            role: "リーダー",
            employeeId: "D002",
            email: "sho.ito@tasfina.jp",
            score: 3.6,
            change: 0.5,
            shifts: {
                normal: 14,
                remote: 6,
                morning: 0,
                paid: 0,
                holiday: 4
            }
        },

        development2: {
            id: "development2",
            name: "加藤 彩",
            reading: "かとう あや",
            department: "開発2課",
            role: "リーダー",
            employeeId: "D003",
            email: "aya.kato@tasfina.jp",
            score: 2.7,
            change: -0.2,
            shifts: {
                normal: 15,
                remote: 5,
                morning: 0,
                paid: 0,
                holiday: 4
            }
        },

        development3: {
            id: "development3",
            name: "小林 楓",
            reading: "こばやし かえで",
            department: "開発3課",
            role: "リーダー",
            employeeId: "D004",
            email: "kaede.kobayashi@tasfina.jp",
            score: 2.4,
            change: -0.1,
            shifts: {
                normal: 16,
                remote: 4,
                morning: 0,
                paid: 0,
                holiday: 4
            }
        },

        support1: {
            id: "support1",
            name: "山口 大輔",
            reading: "やまぐち だいすけ",
            department: "カスタマーサポート課",
            role: "リーダー",
            employeeId: "P002",
            email: "daisuke.yamaguchi@tasfina.jp",
            score: 3.1,
            change: 0.3,
            shifts: {
                normal: 18,
                remote: 1,
                morning: 0,
                paid: 0,
                holiday: 4
            }
        },

        support2: {
            id: "support2",
            name: "木村 里奈",
            reading: "きむら りな",
            department: "運用サポート課",
            role: "リーダー",
            employeeId: "P003",
            email: "rina.kimura@tasfina.jp",
            score: 2.0,
            change: -0.4,
            shifts: {
                normal: 14,
                remote: 4,
                morning: 0,
                paid: 1,
                holiday: 4
            }
        }

    };

    /* =====================================
       組織データ
    ===================================== */

    const departments = [

        {
            id: "sales",
            name: "営業部",
            className: "sales",
            manager: "salesManager",
            count: 12,
            teams: [
                {
                    name: "営業1課",
                    manager: "sales1",
                    count: 5
                },
                {
                    name: "営業2課",
                    manager: "sales2",
                    count: 4
                },
                {
                    name: "営業3課",
                    manager: "sales3",
                    count: 3
                }
            ]
        },

        {
            id: "development",
            name: "開発部",
            className: "development",
            manager: "developmentManager",
            count: 10,
            teams: [
                {
                    name: "開発1課",
                    manager: "development1",
                    count: 4
                },
                {
                    name: "開発2課",
                    manager: "development2",
                    count: 3
                },
                {
                    name: "開発3課",
                    manager: "development3",
                    count: 3
                }
            ]
        },

        {
            id: "support",
            name: "サポート部",
            className: "support",
            manager: "supportManager",
            count: 8,
            teams: [
                {
                    name: "カスタマーサポート課",
                    manager: "support1",
                    count: 4
                },
                {
                    name: "運用サポート課",
                    manager: "support2",
                    count: 4
                }
            ]
        }

    ];

    /* =====================================
       HTML要素
    ===================================== */

    const treeElement =
        document.getElementById("organizationTree");

    const searchInput =
        document.getElementById("orgSearch");

    const levelSelect =
        document.getElementById("orgLevel");

    const noResults =
        document.getElementById("orgNoResults");

    let selectedMemberId = "salesManager";

    /* =====================================
       安全なHTML文字列変換
    ===================================== */

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    /* =====================================
       組織カード作成
    ===================================== */

    function createCard(title, memberId, count = null, type = "") {

        const member = members[memberId];

        const selectedClass =
            selectedMemberId === memberId ? "is-selected" : "";

        const countHtml = count === null
            ? ""
            : `<span class="org-card-count">
                    <i class="bi bi-people-fill"></i>
                    ${count}名
               </span>`;

        return `
            <button
                type="button"
                class="org-card ${type} ${selectedClass}"
                data-member-id="${escapeHtml(memberId)}"
            >
                <div class="org-card-header">
                    ${escapeHtml(title)}
                </div>

                <div class="org-card-body">

                    <div class="org-card-avatar">
                        <i class="bi bi-person-fill"></i>
                    </div>

                    <div class="org-card-person">
                        <strong>${escapeHtml(member.name)}</strong>
                        <small>${escapeHtml(member.role)}</small>
                    </div>

                    ${countHtml}

                </div>
            </button>
        `;
    }

    /* =====================================
       組織図描画
    ===================================== */

    function renderOrganization() {

        const rootHtml = `
            <div class="org-tree-root">
                ${createCard(
                    "代表取締役",
                    "president",
                    null,
                    "org-root-card"
                )}
            </div>
        `;

        const branchesHtml = departments.map(department => {

            const teamsHtml = department.teams.map(team => {

                return `
                    <div class="org-team-item">
                        ${createCard(
                            team.name,
                            team.manager,
                            team.count,
                            "org-team-card"
                        )}
                    </div>
                `;

            }).join("");

            return `
                <div
                    class="org-branch ${department.className}"
                    data-department="${department.id}"
                >

                    ${createCard(
                        department.name,
                        department.manager,
                        department.count,
                        "org-department-card"
                    )}

                    <div class="org-teams">
                        ${teamsHtml}
                    </div>

                </div>
            `;

        }).join("");

        treeElement.innerHTML = `
            ${rootHtml}
            <div class="org-tree-branches">
                ${branchesHtml}
            </div>
        `;

        applyFilters();
    }

    /* =====================================
       メンバー詳細表示
    ===================================== */

    function showMemberDetail(memberId) {

        const member = members[memberId];

        if (!member) return;

        selectedMemberId = memberId;

        document.getElementById("detailName")
            .textContent = member.name;

        document.getElementById("detailReading")
            .textContent = member.reading;

        document.getElementById("detailDepartment")
            .textContent = member.department;

        document.getElementById("detailRole")
            .textContent = member.role;

        document.getElementById("detailEmployeeId")
            .textContent = member.employeeId;

        document.getElementById("detailEmail")
            .textContent = member.email;

        document.getElementById("detailScore")
            .textContent = member.score.toFixed(1);

        // 前月比
        const changeElement =
            document.getElementById("detailScoreChange");

        const isIncrease = member.change > 0;

        changeElement.classList.toggle(
            "increase",
            isIncrease
        );

        const changeIcon = isIncrease
            ? "bi-arrow-up"
            : member.change < 0
                ? "bi-arrow-down"
                : "bi-dash";

        changeElement.innerHTML = `
            <i class="bi ${changeIcon}"></i>
            <span>${member.change > 0 ? "+" : ""}${member.change.toFixed(1)}</span>
            <small>（前月比）</small>
        `;

        // シフト一覧
        const shiftTypes = [
            ["normal", "通常出勤"],
            ["remote", "在宅勤務"],
            ["morning", "午前休"],
            ["paid", "有給休暇"],
            ["holiday", "休日"]
        ];

        document.getElementById("detailShiftList")
            .innerHTML = shiftTypes.map(([key, label]) => `
                <div class="org-shift-row">
                    <span class="org-shift-label ${key}">
                        ${label}
                    </span>
                    <span class="org-shift-count">
                        ${member.shifts[key]}日
                    </span>
                </div>
            `).join("");

        // 選択カードの強調
        document.querySelectorAll(".org-card")
            .forEach(card => {
                card.classList.toggle(
                    "is-selected",
                    card.dataset.memberId === memberId
                );
            });

        // 編集画面へ渡すメンバーID
        document.getElementById("editMemberButton")
            .dataset.memberId = memberId;

        // シフト画面への遷移先
        document.getElementById("memberShiftLink")
            .href = `shifts.html?member=${encodeURIComponent(memberId)}`;
    }

    /* =====================================
       検索・階層フィルター
    ===================================== */

    function applyFilters() {

        const keyword = searchInput.value
            .trim()
            .toLocaleLowerCase("ja");

        const departmentOnly =
            levelSelect.value === "department";

        treeElement.classList.toggle(
            "department-only",
            departmentOnly
        );

        let hasMatch = false;

        const rootCard =
            treeElement.querySelector(".org-root-card");

        const president = members.president;

        const rootMatches = (
            president.name + president.reading + "代表取締役"
        ).toLocaleLowerCase("ja").includes(keyword);

        rootCard.classList.toggle(
            "search-match",
            keyword !== "" && rootMatches
        );

        if (rootMatches) hasMatch = true;

        departments.forEach(department => {

            const branch = treeElement.querySelector(
                `[data-department="${department.id}"]`
            );

            const manager = members[department.manager];

            const departmentText = (
                department.name +
                manager.name +
                manager.reading
            ).toLocaleLowerCase("ja");

            const departmentMatches =
                departmentText.includes(keyword);

            let teamMatches = false;

            const teamCards =
                branch.querySelectorAll(".org-team-card");

            department.teams.forEach((team, index) => {

                const teamManager = members[team.manager];

                const teamText = (
                    team.name +
                    teamManager.name +
                    teamManager.reading
                ).toLocaleLowerCase("ja");

                const matches = teamText.includes(keyword);

                teamCards[index].classList.toggle(
                    "search-match",
                    keyword !== "" && matches
                );

                if (matches) teamMatches = true;
            });

            const matches =
                keyword === "" ||
                departmentMatches ||
                teamMatches;

            branch.classList.toggle(
                "search-hidden",
                !matches
            );

            branch.querySelector(".org-department-card")
                .classList.toggle(
                    "search-match",
                    keyword !== "" && departmentMatches
                );

            if (matches) hasMatch = true;
        });

        noResults.hidden = hasMatch;

    }

    /* =====================================
       イベント
    ===================================== */

    // カードクリック
    treeElement.addEventListener("click", event => {

        const card = event.target.closest(".org-card");

        if (!card) return;

        showMemberDetail(card.dataset.memberId);
    });

    // 検索
    searchInput.addEventListener("input", applyFilters);

    // 階層切り替え
    levelSelect.addEventListener("change", applyFilters);

    // 編集ボタン
    document.getElementById("editMemberButton")
        .addEventListener("click", event => {

            const memberId = event.currentTarget.dataset.memberId;

            // 編集画面は今後実装
            window.location.href =
                `profile-edit.html?member=${encodeURIComponent(memberId)}`;
        });

    /* =====================================
       初期表示
    ===================================== */

    renderOrganization();
    showMemberDetail(selectedMemberId);

});
