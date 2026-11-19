/* ========================================
   Tasfina タスク管理 (バックエンド連携版)
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    let tasks = [];
    let users = []; // ユーザー一覧を保持

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
    let selectedTaskId = null;

    /* ========================================
       🚀 バックエンドからタスク一覧を取得する関数
    ======================================== */
  async function fetchTasks() {
        try {
            const response = await fetch('../../backend/api_tasks.php');
            if (!response.ok) {
                throw new Error('サーバーからのデータ取得に失敗しました');
            }
            
            const data = await response.json();
            
            // 💡 ここで currentUserId を定義する！
            const currentUserId = 101; 
            
            // データベースの列名をフロントエンド用のプロパティ名に変換する
            tasks = Array.isArray(data) ? data.map(task => {
                
                // 担当者IDが自分のIDと一致していれば "mine"、違えば "others" に分類
                const isMine = Number(task.assigned_user_id) === Number(currentUserId);

                return {
           id: task.id,
                    name: task.title || "",                        
                    assignee: task.user_name || "担当者なし", 
                    assigned_user_id: task.assigned_user_id,
                    dueDate: task.due_date || "",                  
                    
                    // ★ ここで translateStatus 関数に通して日本語に変換する！
                    status: translateStatus(task.status), 
                    
                    category: isMine ? "mine" : "others", 
                    hours: Number(task.estimated_hours || 0),      
                    points: Number(task.calculated_burden_pts || 0),
                    workType: task.work_type || "-",
                    evidence: task.evidence || "未提出"
                };
            }) : [];

            initializeAssigneeFilter();
            updateSummary();
            
            if (tasks.length > 0 && selectedTaskId === null) {
                selectedTaskId = tasks[0].id;
            }

            renderTasks();
        } catch (error) {
            console.error("データ取得エラー:", error);
            showToast("タスクの読み込みに失敗しました。");
        }
    }

/* ========================================
       集計カード
    ======================================== */
    function updateSummary() {
        const progressCount = tasks.filter(
            task => task.status === "進行中" || task.status === "in_progress"
        ).length;

        const pendingCount = tasks.filter(
            task => task.status === "承認待ち" || task.status === "pending"
        ).length;

        const doneCount = tasks.filter(
            task => task.status === "完了" || task.status === "completed" || task.status === "done" || task.status === "closed"
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
        assigneeFilter.innerHTML = '<option value="">担当者（すべて）</option>';

        const assignees = [
            ...new Set(tasks.map(task => task.assignee))
        ];

        assignees.forEach(assignee => {
            if (!assignee) return;
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
            let matchesTab = false;

            if (activeTab === "pending") {
                matchesTab = task.status === "承認待ち";
            } else if (activeTab === "others") {
                matchesTab = task.category === "others"; // 他メンバータブのとき
            } else {
                matchesTab = task.category === activeTab; // "mine" など
            }

            const taskName = (task.name || "").toLowerCase();
            const matchesKeyword = taskName.includes(keyword);

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
                    cell.textContent = value || "";

                    if (index === 0) {
                        cell.classList.add("task-name");
                    }

                    row.appendChild(cell);
                });

                row.addEventListener("click", () => {
                    selectTask(task.id);
                });

                row.addEventListener("keydown", event => {
                    if (event.key === "Enter" || event.key === " ") {
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
        if (!dateString) return "";
        const parts = dateString.split("-");
        if (parts.length < 3) return dateString;
        return `${Number(parts[1])}/${Number(parts[2])}`;
    }

    /* ========================================
       タスク選択
    ======================================== */

    function selectTask(taskId) {
        selectedTaskId = taskId;
        renderTasks();
    }

    /* ========================================
       ステータスの日本語変換
    ======================================== */
    function translateStatus(status) {
        switch (status) {
            case "assigned": return "未着手";
            case "in_progress": return "進行中";
            case "pending": return "承認待ち";
            case "completed": 
            case "done":      // ★ 追加
            case "closed":    // ★ 追加
                return "完了";
            default: return status || "未着手";
        }
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
            ["想定工数", `${Number(task.hours || 0).toFixed(1)}時間`],
            ["算出ポイント", `${Number(task.points || 0).toFixed(1)}pt`],
            ["業務タイプ", task.workType || "-"],
            ["エビデンス", task.evidence || "未提出"]
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
                item.setAttribute("aria-selected", String(active));
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
        document.getElementById("hoursError").textContent = "";
        document.getElementById("hoursTaskName").textContent = task.name;
        document.getElementById("currentHours").value = task.hours;
        document.getElementById("requestedHours").value = task.hours;

        bootstrap.Modal.getOrCreateInstance(
            document.getElementById("workHoursModal")
        ).show();
    });

    completeButton.addEventListener("click", () => {
        const task = getSelectedTask();
        if (!task) return;

        document.getElementById("taskCompleteForm").reset();
        document.getElementById("completeError").textContent = "";
        document.getElementById("completeTaskName").textContent = task.name;
        document.getElementById("actualHours").value = task.hours;

        bootstrap.Modal.getOrCreateInstance(
            document.getElementById("taskCompleteModal")
        ).show();
    });

    /* ========================================
       工数変更申請 (PHPへ送信)
    ======================================== */

    document.getElementById("workHoursForm")
        .addEventListener("submit", async event => {
            event.preventDefault();

            const task = getSelectedTask();
            if (!task) return;

            const requestedHours = Number(
                document.getElementById("requestedHours").value
            );
            const reason = document.getElementById("hoursReason").value.trim();
            const error = document.getElementById("hoursError");

            error.textContent = "";

            if (!Number.isFinite(requestedHours) ||
                requestedHours <= 0 ||
                requestedHours === task.hours ||
                !reason) {
                error.textContent = "変更後の工数と変更理由を正しく入力してください。";
                return;
            }

            const requestData = {
                id: task.id,
                currentHours: task.hours,
                requestedHours,
                reason
            };

            try {
                const response = await fetch('../../backend/api_update_task.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestData)
                });

                const result = await response.json();

                if (result.success) {
                    bootstrap.Modal.getInstance(
                        document.getElementById("workHoursModal")
                    ).hide();

                    showToast("工数変更を申請しました。");
                    fetchTasks();
                } else {
                    error.textContent = result.message || "申請に失敗しました。";
                }
            } catch (err) {
                console.error(err);
                error.textContent = "通信エラーが発生しました。";
            }
        });

    /* ========================================
       完了申請 (PHPへ送信)
    ======================================== */

    document.getElementById("taskCompleteForm")
        .addEventListener("submit", async event => {
            event.preventDefault();

            const task = getSelectedTask();
            if (!task) return;

            const actualHours = Number(
                document.getElementById("actualHours").value
            );
            const report = document.getElementById("completeReport").value.trim();
            const evidence = document.getElementById("completeEvidence").files[0];
            const error = document.getElementById("completeError");

            error.textContent = "";

            if (!Number.isFinite(actualHours) || actualHours <= 0 || !report) {
                error.textContent = "実績工数と完了報告を正しく入力してください。";
                return;
            }

            if (evidence && evidence.size > 10 * 1024 * 1024) {
                error.textContent = "添付ファイルは10MB以下にしてください。";
                return;
            }

            // PHP側（api_update_status.php）が受け取る id と status を持つオブジェクトにする
const requestData = {
    id: task.id,
    status: "completed"
};

            try {
                const response = await fetch('../../backend/api_update_status.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestData)   
                });

                const result = await response.json();

                if (result.status==="success") {
                    bootstrap.Modal.getInstance(
                        document.getElementById("taskCompleteModal")
                    ).hide();

                    showToast("完了申請の内容を確認しました。");
                    fetchTasks();
                } else {
                    error.textContent = result.message || "申請に失敗しました。";
                }
            } catch (err) {
                console.error(err);
                error.textContent = "通信エラーが発生しました。";
            }
        });

    /* ========================================
       通知トースト表示
    ======================================== */

    function showToast(message) {
        const area = document.getElementById("toastArea");
        if (!area) return;

        const toast = document.createElement("div");
        toast.className = "task-toast";
        toast.textContent = message;
        area.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    /* ========================================
       初期化実行
    ======================================== */
    fetchTasks();
});