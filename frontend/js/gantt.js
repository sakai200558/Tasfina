
/* ========================================
   Tasfina ガントチャート専用JavaScript
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================
       サンプルデータ
    ===================================== */

    const tasks = [
        {
            id: 1,
            name: "月次報告書作成",
            department: "営業部",
            assignee: "山田 太郎",
            start: "2024-10-14",
            end: "2024-10-20",
            hours: 4.0,
            points: 4.8,
            workType: "専門・集中（1.2倍）",
            status: "progress",
            evidence: "未提出",
            dependency: "—",
            milestone: "2024-10-20",
            memo: "月次の営業報告書を作成し、関係部署へ提出する。"
        },
        {
            id: 2,
            name: "顧客資料確認",
            department: "営業部",
            assignee: "佐藤 花子",
            start: "2024-10-15",
            end: "2024-10-17",
            hours: 2.0,
            points: 2.0,
            workType: "定型・通常（1.0倍）",
            status: "pending",
            evidence: "提出済み",
            dependency: "月次報告書作成",
            memo: "顧客資料の確認を行う。"
        },
        {
            id: 3,
            name: "提案資料作成",
            department: "営業部",
            assignee: "高橋 健",
            start: "2024-10-16",
            end: "2024-10-18",
            hours: 3.0,
            points: 3.0,
            workType: "定型・通常（1.0倍）",
            status: "completed",
            evidence: "提出済み",
            dependency: "顧客資料確認",
            memo: "顧客向けの提案資料を作成する。"
        },
        {
            id: 4,
            name: "業務マニュアル更新",
            department: "開発部",
            assignee: "鈴木 一郎",
            start: "2024-10-17",
            end: "2024-10-19",
            hours: 3.0,
            points: 3.0,
            workType: "定型・通常（1.0倍）",
            status: "progress",
            evidence: "未提出",
            dependency: "—",
            memo: "既存の業務マニュアルを更新する。"
        },
        {
            id: 5,
            name: "新システム検証",
            department: "開発部",
            assignee: "田中 美咲",
            start: "2024-10-18",
            end: "2024-10-19",
            hours: 1.5,
            points: 1.5,
            workType: "定型・通常（1.0倍）",
            status: "notstarted",
            evidence: "未提出",
            dependency: "業務マニュアル更新",
            memo: "新システムの動作確認を行う。"
        },
        {
            id: 6,
            name: "会議資料作成",
            department: "総務部",
            assignee: "伊藤 翔",
            start: "2024-10-16",
            end: "2024-10-17",
            hours: 2.0,
            points: 2.0,
            workType: "定型・通常（1.0倍）",
            status: "overdue",
            evidence: "未提出",
            dependency: "—",
            memo: "社内会議用の資料を作成する。"
        }
    ];

    const statusNames = {
        progress: "進行中",
        pending: "承認待ち",
        completed: "完了",
        notstarted: "未着手",
        overdue: "期限超過"
    };

    /* =====================================
       状態管理
    ===================================== */

    let currentView = "week";
    let currentDate = new Date(2024, 9, 17);
    let selectedTaskId = 1;

    const collapsedDepartments = new Set();

    const chart = document.getElementById("ganttChart");
    const detail = document.getElementById("taskDetail");
    const periodLabel = document.getElementById("currentPeriod");

    const assigneeFilter = document.getElementById("assigneeFilter");
    const departmentFilter = document.getElementById("departmentFilter");
    const statusFilter = document.getElementById("statusFilter");

    /* =====================================
       日付処理
    ===================================== */

    function parseDate(value) {
        const [year, month, day] = value.split("-").map(Number);
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
            start = addDays(currentDate, -mondayOffset);
            count = 8;
            width = 110;
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

            width = 48;
        }

        return { start, count, width };
    }

    /* =====================================
       HTML文字列の安全処理
    ===================================== */

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    /* =====================================
       フィルター
    ===================================== */

    function initializeFilters() {
        const assignees = [...new Set(tasks.map(t => t.assignee))];
        const departments = [...new Set(tasks.map(t => t.department))];

        assignees.forEach(name => {
            const option = new Option(name, name);
            assigneeFilter.add(option);
        });

        departments.forEach(name => {
            const option = new Option(name, name);
            departmentFilter.add(option);
        });
    }

    function filteredTasks() {
        return tasks.filter(task => {
            return (
                (assigneeFilter.value === "all" ||
                    task.assignee === assigneeFilter.value) &&
                (departmentFilter.value === "all" ||
                    task.department === departmentFilter.value) &&
                (statusFilter.value === "all" ||
                    task.status === statusFilter.value)
            );
        });
    }

    /* =====================================
       ガントチャート描画
    ===================================== */

    function renderChart() {
        const range = getRange();
        const totalWidth = range.count * range.width;

        chart.style.setProperty("--timeline-width", `${totalWidth}px`);
        chart.style.setProperty("--column-width", `${range.width}px`);

        periodLabel.textContent =
            `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;

        const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

        let html = `
            <div class="gantt-row gantt-header">
                <div class="gantt-cell">タスク名</div>
                <div class="gantt-cell">担当</div>
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

        html += `</div></div>`;

        const visibleTasks = filteredTasks();
        const departments = [...new Set(visibleTasks.map(t => t.department))];

        departments.forEach(department => {
            const collapsed = collapsedDepartments.has(department);

            html += `
                <div class="gantt-row gantt-department">
                    <div class="gantt-cell">
                        <button type="button"
                            class="department-toggle ${collapsed ? "collapsed" : ""}"
                            data-department="${escapeHTML(department)}"
                            aria-expanded="${!collapsed}">
                            <i class="bi bi-chevron-down"></i>
                            ${escapeHTML(department)}
                        </button>
                    </div>
                    <div class="gantt-cell"></div>
                    <div class="gantt-timeline"></div>
                </div>
            `;

            if (collapsed) return;

            visibleTasks
                .filter(task => task.department === department)
                .forEach(task => {

                    const start = parseDate(task.start);
                    const end = parseDate(task.end);

                    const offset = dayDiff(range.start, start);
                    const duration = dayDiff(start, end) + 1;

                    const visibleStart = Math.max(0, offset);
                    const visibleEnd = Math.min(range.count, offset + duration);

                    let barHTML = "";

                    if (visibleEnd > visibleStart) {
                        const left = visibleStart * range.width + 6;
                        const width = (visibleEnd - visibleStart) * range.width - 12;

                        barHTML = `
                            <div class="gantt-task-bar ${task.status}"
                                style="left:${left}px;width:${width}px">
                            </div>
                        `;

                        const labelLeft = Math.min(
                            left + width + 8,
                            totalWidth - 48
                        );

                        barHTML += `
                            <span class="gantt-task-hours"
                                style="left:${labelLeft}px">
                                ${task.hours.toFixed(1)}h
                            </span>
                        `;
                    }

                    if (task.milestone) {
                        const milestoneDate = parseDate(task.milestone);
                        const milestoneOffset = dayDiff(range.start, milestoneDate);

                        if (milestoneOffset >= 0 && milestoneOffset < range.count) {
                            barHTML += `
                                <span class="gantt-milestone"
                                    style="left:${(milestoneOffset + 0.5) * range.width - 8}px">
                                </span>
                            `;
                        }
                    }

                    html += `
                        <div class="gantt-row gantt-task-row ${selectedTaskId === task.id ? "selected" : ""}"
                            data-task-id="${task.id}"
                            tabindex="0"
                            role="button"
                            aria-label="${escapeHTML(task.name)}の詳細を表示">
                            <div class="gantt-cell gantt-name">
                                ${escapeHTML(task.name)}
                            </div>
                            <div class="gantt-cell gantt-assignee">
                                ${escapeHTML(task.assignee.split(" ")[0])}
                            </div>
                            <div class="gantt-timeline">
                                ${barHTML}
                            </div>
                        </div>
                    `;
                });
        });

        if (visibleTasks.length === 0) {
            html += `
                <div class="gantt-empty p-4">
                    条件に一致するタスクがありません。
                </div>
            `;
        }

        chart.innerHTML = html;

        chart.querySelectorAll(".department-toggle").forEach(button => {
            button.addEventListener("click", () => {
                const name = button.dataset.department;

                if (collapsedDepartments.has(name)) {
                    collapsedDepartments.delete(name);
                } else {
                    collapsedDepartments.add(name);
                }

                renderChart();
            });
        });

        chart.querySelectorAll(".gantt-task-row").forEach(row => {
            const select = () => {
                selectedTaskId = Number(row.dataset.taskId);
                renderChart();
                renderDetail();
            };

            row.addEventListener("click", select);

            row.addEventListener("keydown", event => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    select();
                }
            });
        });
    }

    /* =====================================
       タスク詳細
    ===================================== */

    function renderDetail() {
        const task = tasks.find(t => t.id === selectedTaskId);

        if (!task) {
            detail.innerHTML = '<p class="gantt-empty">タスクを選択してください。</p>';
            return;
        }

        detail.innerHTML = `
            <h3>${escapeHTML(task.name)}</h3>

            <div class="gantt-detail-content">

                <dl>
                    <dt>担当者</dt>
                    <dd>${escapeHTML(task.assignee)}</dd>

                    <dt>部門</dt>
                    <dd>${escapeHTML(task.department)}</dd>

                    <dt>開始日</dt>
                    <dd>${formatDate(parseDate(task.start))}</dd>

                    <dt>終了日</dt>
                    <dd>${formatDate(parseDate(task.end))}</dd>

                    <dt>想定工数</dt>
                    <dd>${task.hours.toFixed(1)} 時間</dd>
                </dl>

                <dl>
                    <dt>算出ポイント</dt>
                    <dd>${task.points.toFixed(1)} pt</dd>

                    <dt>業務タイプ</dt>
                    <dd>${escapeHTML(task.workType)}</dd>

                    <dt>ステータス</dt>
                    <dd>
                        <span class="gantt-status ${task.status}">
                            ${statusNames[task.status]}
                        </span>
                    </dd>

                    <dt>エビデンス</dt>
                    <dd>${escapeHTML(task.evidence)}</dd>

                    <dt>依存タスク</dt>
                    <dd>${escapeHTML(task.dependency)}</dd>
                </dl>

                <div class="gantt-detail-note">
                    <label for="ganttMemo" class="form-label">メモ</label>
                    <textarea id="ganttMemo" readonly>${escapeHTML(task.memo)}</textarea>

                    <div class="gantt-detail-actions">
                        <button type="button" class="btn btn-outline-primary" id="requestHours">
                            工数変更申請
                        </button>

                        <button type="button" class="btn btn-primary" id="requestComplete">
                            完了申請
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById("requestHours").addEventListener("click", () => {
            alert("工数変更申請モーダルは今後接続予定です。");
        });

        document.getElementById("requestComplete").addEventListener("click", () => {
            alert("タスク完了申請モーダルは今後接続予定です。");
        });
    }

    /* =====================================
       期間切り替え
    ===================================== */

    document.querySelectorAll(".gantt-view-switch button")
        .forEach(button => {
            button.addEventListener("click", () => {
                currentView = button.dataset.view;

                document.querySelectorAll(".gantt-view-switch button")
                    .forEach(item => item.classList.remove("active"));

                button.classList.add("active");
                renderChart();
            });
        });

    document.getElementById("prevPeriod").addEventListener("click", () => {
        if (currentView === "day") {
            currentDate = addDays(currentDate, -1);
        } else if (currentView === "week") {
            currentDate = addDays(currentDate, -7);
        } else {
            currentDate = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() - 1,
                1
            );
        }

        renderChart();
    });

    document.getElementById("nextPeriod").addEventListener("click", () => {
        if (currentView === "day") {
            currentDate = addDays(currentDate, 1);
        } else if (currentView === "week") {
            currentDate = addDays(currentDate, 7);
        } else {
            currentDate = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() + 1,
                1
            );
        }

        renderChart();
    });

    document.getElementById("todayButton").addEventListener("click", () => {
        currentDate = new Date();
        renderChart();
    });

    [assigneeFilter, departmentFilter, statusFilter].forEach(filter => {
        filter.addEventListener("change", () => {
            renderChart();
        });
    });

    /* =====================================
       初期表示
    ===================================== */

    initializeFilters();
    renderChart();
    renderDetail();

});
