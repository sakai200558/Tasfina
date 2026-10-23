
/* ========================================
   Tasfina タスク管理
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ========================================
       サンプルタスクデータ
    ======================================== */

    const tasks = [
        {
            id: 1,
            name: "月次報告書作成",
            assignee: "山田",
            dueDate: "2026-10-20",
            status: "進行中",
            category: "mine",
            hours: 4.0,
            points: 4.8,
            workType: "専門・集中（1.2倍）",
            evidence: "未提出"
        },
        {
            id: 2,
            name: "顧客資料確認",
            assignee: "佐藤",
            dueDate: "2026-10-18",
            status: "承認待ち",
            category: "mine",
            hours: 2.0,
            points: 2.4,
            workType: "専門・集中（1.2倍）",
            evidence: "提出済み"
        },
        {
            id: 3,
            name: "業務マニュアル更新",
            assignee: "鈴木",
            dueDate: "2026-10-25",
            status: "完了",
            category: "mine",
            hours: 3.0,
            points: 3.0,
            workType: "通常業務（1.0倍）",
            evidence: "提出済み"
        },
        {
            id: 4,
            name: "画面レイアウト作成",
            assignee: "田中",
            dueDate: "2026-10-27",
            status: "進行中",
            category: "others",
            hours: 5.0,
            points: 6.0,
            workType: "専門・集中（1.2倍）",
            evidence: "未提出"
        },
        {
            id: 5,
            name: "データベース設計",
            assignee: "佐藤",
            dueDate: "2026-10-29",
            status: "進行中",
            category: "requested",
            hours: 6.0,
            points: 7.2,
            workType: "専門・集中（1.2倍）",
            evidence: "未提出"
        },
        {
            id: 6,
            name: "ログイン機能確認",
            assignee: "山田",
            dueDate: "2026-10-19",
            status: "承認待ち",
            category: "pending",
            hours: 2.0,
            points: 2.0,
            workType: "通常業務（1.0倍）",
            evidence: "提出済み"
        },
        {
            id: 7,
            name: "テスト項目作成",
            assignee: "鈴木",
            dueDate: "2026-10-30",
            status: "完了",
            category: "others",
            hours: 3.0,
            points: 3.0,
            workType: "通常業務（1.0倍）",
            evidence: "提出済み"
        }
    ];

    /* ========================================
       要素取得
    ======================================== */

    const tableBody =
        document.getElementById("taskTableBody");

    const searchInput =
        document.getElementById("taskSearch");

    const assigneeFilter =
        document.getElementById("assigneeFilter");

    const tabs =
        document.querySelectorAll(".task-tab");

    const detailContainer =
        document.getElementById("selectedTaskDetail");

    const hoursButton =
        document.getElementById("requestHoursButton");

    const completeButton =
        document.getElementById("requestCompleteButton");

    let activeTab = "mine";
    let selectedTaskId = 1;

    /* ========================================
       集計カード
    ======================================== */

    function updateSummary() {

        const progressCount = tasks.filter(
            task => task.status === "進行中"
        ).length;

        const pendingCount = tasks.filter(
            task => task.status === "承認待ち"
        ).length;

        const doneCount = tasks.filter(
            task => task.status === "完了"
        ).length;

        document.getElementById("progressCount")
            .textContent = `${progressCount}件`;

        document.getElementById("pendingCount")
            .textContent = `${pendingCount}件`;

        document.getElementById("doneCount")
            .textContent = `${doneCount}件`;
    }

    /* ========================================
       担当者フィルター
    ======================================== */

    function initializeAssigneeFilter() {

        const assignees = [
            ...new Set(tasks.map(task => task.assignee))
        ];

        assignees.forEach(assignee => {

            const option = document.createElement("option");

            option.value = assignee;
            option.textContent = assignee;

            assigneeFilter.appendChild(option);
        });
    }

    /* ========================================
       表示対象タスク
    ======================================== */

    function getFilteredTasks() {

        const keyword = searchInput.value.trim().toLowerCase();

        const assignee = assigneeFilter.value;

        return tasks.filter(task => {

            const matchesTab =
                activeTab === "pending"
                    ? task.status === "承認待ち"
                    : task.category === activeTab;

            const matchesKeyword =
                task.name.toLowerCase().includes(keyword);

            const matchesAssignee =
                !assignee || task.assignee === assignee;

            return matchesTab &&
                matchesKeyword &&
                matchesAssignee;
        });
    }

    /* ========================================
       タスク一覧描画
    ======================================== */

    function renderTasks() {

        const filteredTasks = getFilteredTasks();

        tableBody.innerHTML = "";

        if (filteredTasks.length === 0) {

            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 4;
            cell.textContent = "該当するタスクはありません。";
            cell.className = "task-empty";

            row.appendChild(cell);
            tableBody.appendChild(row);

        } else {

            filteredTasks.forEach(task => {

                const row = document.createElement("tr");

                row.tabIndex = 0;

                if (task.id === selectedTaskId) {
                    row.classList.add("selected");
                }

                const cells = [
                    task.name,
                    task.assignee,
                    formatDate(task.dueDate),
                    task.status
                ];

                cells.forEach((value, index) => {

                    const cell = document.createElement("td");

                    cell.textContent = value;

                    if (index === 0) {
                        cell.classList.add("task-name");
                    }

                    row.appendChild(cell);
                });

                row.addEventListener("click", () => {
                    selectTask(task.id);
                });

                row.addEventListener("keydown", event => {

                    if (event.key === "Enter" ||
                        event.key === " ") {

                        event.preventDefault();
                        selectTask(task.id);
                    }
                });

                tableBody.appendChild(row);
            });
        }

        document.getElementById("taskResultCount")
            .textContent = `${filteredTasks.length}件を表示中`;

        const selectedVisible = filteredTasks.some(
            task => task.id === selectedTaskId
        );

        if (!selectedVisible) {
            selectedTaskId = filteredTasks.length
                ? filteredTasks[0].id
                : null;
        }

        // 選択行の背景を同期
        const rows = tableBody.querySelectorAll("tr");

        rows.forEach((row, index) => {

            row.classList.toggle(
                "selected",
                filteredTasks[index]?.id === selectedTaskId
            );
        });

        renderTaskDetail();
    }

    /* ========================================
       日付表示
    ======================================== */

    function formatDate(dateString) {

        const [, month, day] = dateString.split("-");

        return `${Number(month)}/${Number(day)}`;
    }

    /* ========================================
       タスク選択
    ======================================== */

    function selectTask(taskId) {

        selectedTaskId = taskId;

        renderTasks();
    }

    /* ========================================
       選択中タスクの詳細
    ======================================== */

    function getSelectedTask() {

        return tasks.find(
            task => task.id === selectedTaskId
        ) || null;
    }

    function renderTaskDetail() {

        const task = getSelectedTask();

        detailContainer.innerHTML = "";

        hoursButton.disabled = !task;
        completeButton.disabled =
            !task || task.status === "完了" ||
            task.status === "承認待ち";

        if (!task) {

            const empty = document.createElement("p");

            empty.className = "task-empty";
            empty.textContent = "タスクを選択してください。";

            detailContainer.appendChild(empty);
            return;
        }

        const name = document.createElement("p");

        name.className = "task-detail-name";
        name.textContent = task.name;

        detailContainer.appendChild(name);

        const grid = document.createElement("div");

        grid.className = "task-detail-grid";

        const items = [
            ["想定工数", `${task.hours.toFixed(1)}時間`],
            ["算出ポイント", `${task.points.toFixed(1)}pt`],
            ["業務タイプ", task.workType],
            ["エビデンス", task.evidence]
        ];

        items.forEach(([label, value]) => {

            const item = document.createElement("div");

            item.className = "task-detail-item";

            const labelElement = document.createElement("p");
            labelElement.textContent = label;

            const valueElement = document.createElement("strong");
            valueElement.textContent = value;

            item.appendChild(labelElement);
            item.appendChild(valueElement);

            grid.appendChild(item);
        });

        detailContainer.appendChild(grid);
    }

    /* ========================================
       タブ切り替え
    ======================================== */

    tabs.forEach(tab => {

        tab.addEventListener("click", () => {

            activeTab = tab.dataset.tab;

            tabs.forEach(item => {

                const active = item === tab;

                item.classList.toggle("active", active);

                item.setAttribute(
                    "aria-selected",
                    String(active)
                );
            });

            renderTasks();
        });
    });

    /* ========================================
       検索・絞り込み
    ======================================== */

    searchInput.addEventListener("input", renderTasks);

    assigneeFilter.addEventListener("change", renderTasks);

    /* ========================================
       モーダルを開く
    ======================================== */

    hoursButton.addEventListener("click", () => {

        const task = getSelectedTask();

        if (!task) return;

        document.getElementById("workHoursForm").reset();

        document.getElementById("hoursError")
            .textContent = "";

        document.getElementById("hoursTaskName")
            .textContent = task.name;

        document.getElementById("currentHours")
            .value = task.hours;

        document.getElementById("requestedHours")
            .value = task.hours;

        bootstrap.Modal.getOrCreateInstance(
            document.getElementById("workHoursModal")
        ).show();
    });

    completeButton.addEventListener("click", () => {

        const task = getSelectedTask();

        if (!task) return;

        document.getElementById("taskCompleteForm").reset();

        document.getElementById("completeError")
            .textContent = "";

        document.getElementById("completeTaskName")
            .textContent = task.name;

        document.getElementById("actualHours")
            .value = task.hours;

        bootstrap.Modal.getOrCreateInstance(
            document.getElementById("taskCompleteModal")
        ).show();
    });

    /* ========================================
       工数変更申請
    ======================================== */

    document.getElementById("workHoursForm")
        .addEventListener("submit", event => {

            event.preventDefault();

            const task = getSelectedTask();

            if (!task) return;

            const requestedHours = Number(
                document.getElementById("requestedHours").value
            );

            const reason = document.getElementById(
                "hoursReason"
            ).value.trim();

            const error = document.getElementById("hoursError");

            error.textContent = "";

            if (!Number.isFinite(requestedHours) ||
                requestedHours <= 0 ||
                requestedHours === task.hours ||
                !reason) {

                error.textContent =
                    "変更後の工数と変更理由を正しく入力してください。";

                return;
            }

            const requestData = {
                taskId: task.id,
                currentHours: task.hours,
                requestedHours,
                reason
            };

            console.log("工数変更申請（仮）", requestData);

            bootstrap.Modal.getInstance(
                document.getElementById("workHoursModal")
            ).hide();

            showToast(
                "工数変更申請の内容を確認しました（デモ）。"
            );
        });

    /* ========================================
       完了申請
    ======================================== */

    document.getElementById("taskCompleteForm")
        .addEventListener("submit", event => {

            event.preventDefault();

            const task = getSelectedTask();

            if (!task) return;

            const actualHours = Number(
                document.getElementById("actualHours").value
            );

            const report = document.getElementById(
                "completeReport"
            ).value.trim();

            const evidence = document.getElementById(
                "completeEvidence"
            ).files[0];

            const error = document.getElementById(
                "completeError"
            );

            error.textContent = "";

            if (!Number.isFinite(actualHours) ||
                actualHours <= 0 ||
                !report) {

                error.textContent =
                    "実績工数と完了報告を正しく入力してください。";

                return;
            }

            if (evidence && evidence.size > 10 * 1024 * 1024) {

                error.textContent =
                    "添付ファイルは10MB以下にしてください。";

                return;
            }

            const requestData = {
                taskId: task.id,
                actualHours,
                report,
                evidenceName: evidence?.name || null
            };

            console.log("完了申請（仮）", requestData);

            bootstrap.Modal.getInstance(
                document.getElementById("taskCompleteModal")
            ).hide();

            showToast(
                "完了申請の内容を確認しました（デモ）。"
            );
        });

    /* ========================================
       通知
    ======================================== */

    function showToast(message) {

        const area = document.getElementById("toastArea");

        const toast = document.createElement("div");

        toast.className = "task-toast";
        toast.textContent = message;

        area.appendChild(toast);
    }

    /* ========================================
       初期表示
    ======================================== */

    initializeAssigneeFilter();
    updateSummary();
    renderTasks();

});
