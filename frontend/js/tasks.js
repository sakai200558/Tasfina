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
    let currentUserId = null; // ★ ここに追加

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
            currentUserId = null; 

             try {
                const userRes = await fetch('../../backend/api_users.php');
                if (userRes.ok) {
                    const userData = await userRes.json();
                    currentUserId = userData.current_user_id ?? null;
                }
            } catch (e) {
                console.error('ユーザーID取得エラー:', e);
            }
            
            // データベースの列名をフロントエンド用のプロパティ名に変換する
            tasks = Array.isArray(data) ? data.map(task => {
                
                const isMine = Number(task.assigned_user_id) === Number(currentUserId);
                const isRequested = Number(task.created_by) === Number(currentUserId) && !isMine;

                let category = "others";
                if (isMine) {
                    category = "mine";
                } else if (isRequested) {
                    category = "requested";
                }

                return {
                    id: task.id,
                    name: task.title || "",                        
                    assignee: task.user_name || "担当者なし", 
                    creator: task.creator_name || "不明", // ★ この1行を追加
                    assigned_user_id: task.assigned_user_id,
                    created_by: task.created_by,
                    dueDate: task.due_date || "",                  
                    
                    // ★ ここで translateStatus 関数に通して日本語に変換する！
                    status: translateStatus(task.status), 
                    
                    category: category, 
                    hours: Number(task.estimated_hours || 0),      
                    points: Number(task.calculated_burden_pts || 0),
                    workType: task.work_type || "-",
                    evidence: task.evidence || "未提出",
                    requestedHours: task.requested_hours ? Number(task.requested_hours) : null, // ★ 追加
                    hoursReason: task.hours_change_reason || "" ,
                                      // ★ ここを追加
                    priority: task.priority || "medium",
                    difficulty: Number(task.difficulty_level || 3),
                    discomfort: Number(task.discomfort_level || 3),
                    startDate: task.start_date || ""

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
        // 1. 進行中：自分のタスクのうち「未着手」または「進行中」のもの
        const progressCount = tasks.filter(
            task => task.category === "mine" &&
                (task.status === "未着手" || task.status === "進行中" || task.status === "assigned")
        ).length;

        // 2. 承認待ち：自分が担当しているか、自分が承認者（requested）である「承認待ち」のもの
        const pendingCount = tasks.filter(
           task => (task.category === "mine" || task.category === "requested") &&
                (task.status === "承認待ち" || task.status === "工数変更承認待ち")
        ).length;

        // 3. 完了：自分のタスクのうち「完了」したもの
        const doneCount = tasks.filter(
            task => task.category === "mine" && task.status === "完了"
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
                matchesTab = task.status === "承認待ち" || task.status === "工数変更承認待ち";
            } else if (activeTab === "others") {
                // ★ 自分以外のタスク（他メンバー ＋ 自分が依頼したタスク）をすべて表示
                matchesTab = task.category === "others" || task.category === "requested";
            } else if (activeTab === "mine") {
                // ★ 「自分のタスク」は進行中と工数変更承認待ちのみ表示する
                matchesTab = task.category === "mine" &&
                    (task.status === "進行中" || task.status === "工数変更承認待ち");
            } else {
                matchesTab = task.category === activeTab; // "requested" など
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
            case "assigned": return "進行中";
            case "in_progress": return "進行中";
            case "pending": return "承認待ち";
            case "hours_pending": return "工数変更承認待ち"; // ★ 追加
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

  // ★ 自分が担当者（作業者）かどうかを判定
        const isAssignee = task && Number(task.assigned_user_id) === Number(currentUserId);

               // ★ 担当者本人でない場合は、申請ボタンを無効化（承認待ち中も無効化）
        hoursButton.disabled = !task || !isAssignee || task.status === "完了" || task.status === "承認待ち" || task.status === "工数変更承認待ち";
        completeButton.disabled =
            !task || !isAssignee || task.status === "完了" ||
            task.status === "承認待ち" || task.status === "工数変更承認待ち";

        // ★ 「承認待ち」または「工数変更承認待ち」かつ「依頼者本人」のときだけ承認ボタンを表示
        const approveButton = document.getElementById("approveTaskButton");
        if (approveButton) {
            const isRequester = task && Number(task.created_by) === Number(currentUserId);
            const isPendingStatus = task && (task.status === "承認待ち" || task.status === "工数変更承認待ち");
            approveButton.style.display = (isPendingStatus && isRequester)
                ? "inline-block"
                : "none";

            if (task && task.status === "工数変更承認待ち") {
                approveButton.textContent = "工数変更を承認する";
            } else {
                approveButton.textContent = "承認する（ポイント付与）";
            }
        }
         // ★ 差し戻しボタンの表示制御を追加
        const rejectButton = document.getElementById("rejectTaskButton");
        if (rejectButton) {
            const isRequester = task && Number(task.created_by) === Number(currentUserId);
            const isPendingStatus = task && (task.status === "承認待ち" || task.status === "工数変更承認待ち");
            rejectButton.style.display = (isPendingStatus && isRequester)
                ? "inline-block"
                : "none";
        }

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
            ["依頼者", task.creator || "不明"],
            ["想定工数", `${Number(task.hours || 0).toFixed(1)}時間`],
            ["算出ポイント", `${Number(task.points || 0).toFixed(1)}pt`],
            ["業務タイプ", task.workType || "-"],
            ["エビデンス", task.evidence || "未提出"]
        ];

          // ★ 工数変更の承認待ち中は、申請内容と理由を詳細に表示する
        if (task.status === "工数変更承認待ち" && task.requestedHours) {
            items.push(["工数変更申請", `${task.requestedHours.toFixed(1)}時間へ変更（理由: ${task.hoursReason || "なし"}）`]);
        }
                // ★ 差し戻し理由が入っている場合は詳細に表示する
        if (task.status === "進行中" && task.hoursReason && task.hoursReason.startsWith("【差し戻し】")) {
            items.push(["前回差し戻し理由", task.hoursReason.replace("【差し戻し】", "")]);
        }


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

         // ★ ここから5行を追加
        document.getElementById("editPriority").value = task.priority || "medium";
        document.getElementById("editDifficulty").value = String(task.difficulty || 3);
        document.getElementById("editDiscomfort").value = String(task.discomfort || 3);
        document.getElementById("editStartDate").value = task.startDate ? task.startDate.slice(0, 10).replace(/\//g, "-") : "";
        document.getElementById("editDueDate").value = task.dueDate ? task.dueDate.slice(0, 10).replace(/\//g, "-") : "";

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
    status: "pending"
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
       タスク承認・ポイント付与 (PHPへ送信)
    ======================================== */
      const approveTaskButton = document.getElementById("approveTaskButton");
    if (approveTaskButton) {
        approveTaskButton.addEventListener("click", async () => {
            const task = getSelectedTask();
            if (!task) return;

            const isHoursApproval = task.status === "工数変更承認待ち";
            const confirmMsg = isHoursApproval
                ? `「${task.name}」の工数を ${task.requestedHours}時間 に変更することを承認しますか？`
                : `「${task.name}」を承認して、担当者に ${task.points}pt を付与しますか？`;

            if (!confirm(confirmMsg)) {
                return;
            }

            try {
                const response = await fetch('../../backend/api_update_status.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: task.id,
                        status: isHoursApproval ? 'approve_hours' : 'completed'
                    })
                });

                const result = await response.json();
                if (result.status === 'success') {
                    showToast(result.message);
                    await fetchTasks();
                } else {
                    showToast(result.message || '承認に失敗しました。');
                }
            } catch (error) {
                console.error('承認エラー:', error);
                showToast('通信エラーが発生しました。');
            }
        });
    }
        // ★ 差し戻し（理由入力つき）処理を追加
    const rejectTaskButton = document.getElementById("rejectTaskButton");
    if (rejectTaskButton) {
        rejectTaskButton.addEventListener("click", async () => {
            const task = getSelectedTask();
            if (!task) return;

            const isHoursApproval = task.status === "工数変更承認待ち";
            const promptMsg = isHoursApproval
                ? `「${task.name}」の工数変更申請を差し戻します。\n差し戻し理由を入力してください：`
                : `「${task.name}」の完了申請を差し戻します。\n差し戻し理由を入力してください：`;

            const rejectReason = prompt(promptMsg);
            if (rejectReason === null) return;
            if (rejectReason.trim() === "") {
                showToast("差し戻し理由を入力してください。");
                return;
            }

            try {
                const response = await fetch('../../backend/api_update_status.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: task.id,
                        status: isHoursApproval ? 'reject_hours' : 'reject_complete',
                        reject_reason: rejectReason.trim()
                    })
                });

                const result = await response.json();
                if (result.status === 'success') {
                    showToast(result.message || '差し戻しました。');
                    await fetchTasks();
                } else {
                    showToast(result.message || '差し戻しに失敗しました。');
                }
            } catch (error) {
                console.error('差し戻しエラー:', error);
                showToast('通信エラーが発生しました。');
            }
        });
    }


    /* ========================================
       初期化実行
    ======================================== */
    fetchTasks();
});