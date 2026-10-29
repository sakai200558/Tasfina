
/* ========================================
   Tasfina 部門詳細モーダル専用JavaScript
======================================== */

(() => {
    "use strict";

    const MODAL_PATH = "../modals/department-detail.html";

    // =====================================
    // 仮データ
    // =====================================
    // 人数・出勤状況・スコア・タスクはテスト用。
    // 本番ではPHP APIから取得する。

    const departmentData = {
        sales: {
            name: "営業部",
            manager: "田中 美咲",
            mode: "通常運用",
            count: 12,
            attendance: {
                office: 8,
                remote: 2,
                leave: 1,
                absent: 1
            },
            totalScore: 31.6,
            members: [
                ["田中 美咲", "部門管理者", "出勤中"],
                ["鈴木 一郎", "営業1課 リーダー", "出勤中"],
                ["高橋 健", "営業2課 リーダー", "在宅勤務"],
                ["中村 優香", "営業3課 リーダー", "出勤中"],
                ["佐々木 翔太", "一般メンバー", "出勤中"],
                ["山本 結衣", "一般メンバー", "有給休暇"]
            ],
            tasks: [
                ["月次営業報告の作成", "田中 美咲", "2026-11-05", "進行中"],
                ["新規顧客向け提案書", "鈴木 一郎", "2026-11-08", "進行中"],
                ["営業実績の集計", "高橋 健", "2026-10-28", "遅延"]
            ]
        },

        development: {
            name: "開発部",
            manager: "佐藤 花子",
            mode: "繁忙期運用",
            count: 10,
            attendance: {
                office: 5,
                remote: 4,
                leave: 1,
                absent: 0
            },
            totalScore: 39.0,
            members: [
                ["佐藤 花子", "部門管理者", "出勤中"],
                ["伊藤 翔", "開発1課 リーダー", "在宅勤務"],
                ["加藤 彩", "開発2課 リーダー", "出勤中"],
                ["小林 楓", "開発3課 リーダー", "在宅勤務"],
                ["松本 大地", "一般メンバー", "出勤中"]
            ],
            tasks: [
                ["ログインAPIの実装", "伊藤 翔", "2026-11-02", "進行中"],
                ["シフト管理画面の改修", "加藤 彩", "2026-11-06", "進行中"],
                ["結合テスト", "小林 楓", "2026-10-25", "遅延"],
                ["データベース設計の見直し", "佐藤 花子", "2026-11-10", "進行中"]
            ]
        },

        support: {
            name: "サポート部",
            manager: "渡辺 直樹",
            mode: "通常運用",
            count: 8,
            attendance: {
                office: 6,
                remote: 1,
                leave: 1,
                absent: 0
            },
            totalScore: 14.4,
            members: [
                ["渡辺 直樹", "部門管理者", "出勤中"],
                ["山口 大輔", "カスタマーサポート課 リーダー", "出勤中"],
                ["木村 里奈", "運用サポート課 リーダー", "在宅勤務"],
                ["井上 美月", "一般メンバー", "出勤中"]
            ],
            tasks: [
                ["問い合わせ履歴の整理", "山口 大輔", "2026-11-03", "進行中"],
                ["FAQページの更新", "木村 里奈", "2026-11-12", "進行中"]
            ]
        }
    };

    // 課の仮データ
    const teamData = [
        ["sales-1", "営業1課", "鈴木 一郎", 5, 13.0, "sales"],
        ["sales-2", "営業2課", "高橋 健", 4, 11.6, "sales"],
        ["sales-3", "営業3課", "中村 優香", 3, 7.0, "sales"],
        ["development-1", "開発1課", "伊藤 翔", 4, 17.2, "development"],
        ["development-2", "開発2課", "加藤 彩", 3, 12.0, "development"],
        ["development-3", "開発3課", "小林 楓", 3, 9.8, "development"],
        ["support-1", "カスタマーサポート課", "山口 大輔", 4, 8.2, "support"],
        ["support-2", "運用サポート課", "木村 里奈", 4, 6.2, "support"]
    ];

    teamData.forEach(([id, name, manager, count, score, parentId]) => {
        const parent = departmentData[parentId];
        const ratio = count / parent.count;

        // 課ごとの出勤状況の仮データ
        const office = Math.min(
            count,
            Math.round(parent.attendance.office * ratio)
        );
        const remote = Math.min(
            count - office,
            Math.round(parent.attendance.remote * ratio)
        );
        const leave = Math.min(
            count - office - remote,
            Math.round(parent.attendance.leave * ratio)
        );

        departmentData[id] = {
            name,
            manager,
            mode: parent.mode,
            count,
            totalScore: score,
            attendance: {
                office,
                remote,
                leave,
                absent: count - office - remote - leave
            },
            members: [
                [manager, "リーダー", "出勤中"]
            ],
            tasks: parent.tasks.slice(0, 2)
        };
    });

    let loadingPromise = null;

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function getLoadStatus(average) {
        // テスト用の閾値。正式な閾値はスコア設定と連動させる。
        if (average >= 4) {
            return {
                label: "高負荷",
                className: "critical",
                message: "業務負荷が高い状態です。担当業務の再配分を検討してください。"
            };
        }

        if (average >= 2.5) {
            return {
                label: "やや高い",
                className: "busy",
                message: "一部のメンバーに負担が集中していないか確認してください。"
            };
        }

        return {
            label: "適正",
            className: "normal",
            message: "現在の平均負担スコアは適正範囲です。"
        };
    }

    async function ensureModalLoaded() {
        const existing = document.getElementById(
            "departmentDetailModal"
        );

        if (existing) return existing;

        if (!loadingPromise) {
            loadingPromise = (async () => {
                const response = await fetch(MODAL_PATH);

                if (!response.ok) {
                    throw new Error(
                        `モーダルHTMLの取得に失敗: ${response.status}`
                    );
                }

                const html = await response.text();
                const wrapper = document.createElement("div");
                wrapper.innerHTML = html;

                const modal = wrapper.querySelector(
                    "#departmentDetailModal"
                );

                if (!modal) {
                    throw new Error(
                        "departmentDetailModal が見つかりません。"
                    );
                }

                document.body.appendChild(modal);
                return modal;
            })().catch(error => {
                loadingPromise = null;
                throw error;
            });
        }

        return loadingPromise;
    }

    function renderMembers(members) {
        const container = document.getElementById(
            "deptDetailMembers"
        );

        container.replaceChildren();

        members.forEach(([name, role, status]) => {
            const item = document.createElement("div");
            item.className = "dept-detail-member";

            item.innerHTML = `
                <div class="dept-detail-avatar">
                    <i class="bi bi-person-fill"></i>
                </div>
                <div class="dept-detail-member-info">
                    <strong>${escapeHtml(name)}</strong>
                    <small>${escapeHtml(role)}</small>
                </div>
                <span class="dept-detail-member-status">
                    ${escapeHtml(status)}
                </span>
            `;

            container.appendChild(item);
        });
    }

    function renderAttendance(attendance) {
        const container = document.getElementById(
            "deptDetailAttendance"
        );

        const items = [
            ["出勤中", attendance.office],
            ["在宅勤務", attendance.remote],
            ["有給休暇", attendance.leave],
            ["欠勤・その他", attendance.absent]
        ];

        container.innerHTML = items.map(([label, count]) => `
            <div class="dept-detail-attendance-item">
                <span>${escapeHtml(label)}</span>
                <strong>${count}名</strong>
            </div>
        `).join("");
    }

    function renderTasks(tasks) {
        const container = document.getElementById(
            "deptDetailTasks"
        );

        if (tasks.length === 0) {
            container.innerHTML = `
                <p class="dept-detail-empty">
                    現在担当中のタスクはありません。
                </p>
            `;
            return;
        }

        container.innerHTML = tasks.map(
            ([name, assignee, deadline, status]) => `
                <article class="dept-detail-task">
                    <strong class="dept-detail-task-title">
                        ${escapeHtml(name)}
                    </strong>

                    <div class="dept-detail-task-meta">
                        <span>
                            <i class="bi bi-person"></i>
                            ${escapeHtml(assignee)}
                        </span>
                        <span>
                            <i class="bi bi-calendar"></i>
                            ${escapeHtml(deadline)}
                        </span>
                    </div>

                    <span class="dept-detail-task-badge ${
                        status === "遅延" ? "delayed" : ""
                    }">
                        ${escapeHtml(status)}
                    </span>
                </article>
            `
        ).join("");
    }

    function renderDepartment(data) {
        const average = data.count > 0
            ? data.totalScore / data.count
            : 0;

        const status = getLoadStatus(average);

        const present =
            data.attendance.office + data.attendance.remote;

        const setText = (id, value) => {
            document.getElementById(id).textContent = value;
        };

        setText("departmentDetailTitle", data.name);
        setText("deptDetailManager", `責任者：${data.manager}`);
        setText("deptDetailCount", `${data.count}名`);
        setText("deptDetailPresent", `${present}名`);
        setText("deptDetailTaskCount", `${data.tasks.length}件`);
        setText(
            "deptDetailTotalScore",
            `${data.totalScore.toFixed(1)}pt`
        );
        setText(
            "deptDetailAverageScore",
            `${average.toFixed(1)}pt`
        );
        setText("deptDetailLoadMessage", status.message);
        setText(
            "deptDetailMemberLabel",
            `サンプル表示 ${data.members.length}名 / 所属 ${data.count}名`
        );

        const modeClass =
            data.mode === "繁忙期運用" ? "busy" : "normal";

        document.getElementById("deptDetailMode").innerHTML = `
            <span class="dept-detail-pill ${modeClass}">
                ${escapeHtml(data.mode)}
            </span>
        `;

        document.getElementById("deptDetailLoadStatus").innerHTML = `
            <span class="dept-detail-pill ${status.className}">
                ${status.label}
            </span>
        `;

        const progress = document.getElementById(
            "deptDetailProgress"
        );

        const progressBar = document.getElementById(
            "deptDetailProgressBar"
        );

        progress.setAttribute(
            "aria-valuenow",
            String(Math.min(5, average))
        );

        progressBar.style.width =
            `${Math.min(100, average / 5 * 100)}%`;

        progressBar.className =
            `dept-detail-progress-bar ${status.className}`;

        renderMembers(data.members);
        renderAttendance(data.attendance);
        renderTasks(data.tasks);
    }

    // =====================================
    // 外部から呼び出す公開関数
    // =====================================

    async function open(departmentId) {
        const data = departmentData[departmentId];

        if (!data) {
            console.warn(
                "部門データが見つかりません:",
                departmentId
            );
            return;
        }

        try {
            if (
                typeof bootstrap === "undefined" ||
                !bootstrap.Modal
            ) {
                throw new Error(
                    "Bootstrap JavaScriptが読み込まれていません。"
                );
            }

            const modalElement = await ensureModalLoaded();

            renderDepartment(data);

            const modal = bootstrap.Modal.getOrCreateInstance(
                modalElement
            );

            modal.show();
        } catch (error) {
            console.error("部門詳細モーダルエラー:", error);
            alert(
                "部門詳細を表示できませんでした。Consoleを確認してください。"
            );
        }
    }

    window.TasfinaDepartmentDetail = {
        open
    };

})();
