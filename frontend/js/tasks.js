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

          const approvalNeededCount = tasks.filter(
            task => Number(task.created_by) === Number(currentUserId) &&
                (task.status === "承認待ち" || task.status === "工数変更承認待ち")
        ).length;

        const pendingTab = document.querySelector('.task-tab[data-tab="pending"]');
        if (pendingTab) {
            let badge = pendingTab.querySelector(".tab-badge");
            if (approvalNeededCount > 0) {
                if (!badge) {
                    badge = document.createElement("span");
                    badge.className = "tab-badge";
                    pendingTab.appendChild(badge);
                }
                badge.textContent = approvalNeededCount;
            } else if (badge) {
                badge.remove();
            }
        }
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
                } else if (activeTab === "completed") {
                    // ★ 上の「完了 〇件」カードと同じく、自分が担当して完了したタスクのみ表示
                    matchesTab = task.category === "mine" && task.status === "完了";
                } else if (activeTab === "others") {
                    // ★ 未完了の他メンバー・依頼タスクを表示
                    matchesTab = (task.category === "others" || task.category === "requested") &&
                        task.status !== "完了";
                } else if (activeTab === "mine") {
                    // ★ 「自分のタスク」は進行中と工数変更承認待ちのみ表示
                    matchesTab = task.category === "mine" &&
                        (task.status === "進行中" || task.status === "工数変更承認待ち");
                } else {
                    matchesTab = task.category === activeTab && task.status !== "完了";
                }

                const taskName = (task.name || "").toLowerCase();
                const matchesKeyword = taskName.includes(keyword);

                const matchesAssignee =
                    !assignee || task.assignee === assignee;

                return matchesTab &&
                    matchesKeyword &&
                    matchesAssignee;
            })
            .sort((a, b) => {
                // 期限が未設定のものは一番下へ配置
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;

                // 期限が近い（早い）順に並び替え
                return new Date(a.dueDate) - new Date(b.dueDate);
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

                    if (index === 0) {
                        cell.classList.add("task-name");
                        cell.textContent = value || "";
                    } else if (index === 2) {
                        // ★ 期限列（index === 2）の色分け判定
                        cell.textContent = value || "";
                        const dueClass = getDueDateClass(task.dueDate, task.status);
                        if (dueClass) {
                            cell.classList.add(dueClass);
                        }
                    } else if (index === 3) {
                        const badge = document.createElement("span");
                        badge.className = `status-badge ${getStatusBadgeClass(value)}`;
                        badge.textContent = value || "";
                        cell.appendChild(badge);
                    } else {
                        cell.textContent = value || "";
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
     function getStatusBadgeClass(statusText) {
        switch (statusText) {
            case "進行中": return "status-progress";
            case "承認待ち":
            case "工数変更承認待ち":
                return "status-pending";
            case "完了": return "status-done";
            default: return "status-default";
        }
    }

        // ★ 期限切れ・間近（3日以内）のクラス判定
    function getDueDateClass(dueDateStr, statusText) {
        if (!dueDateStr || statusText === "完了") return "";

        const due = new Date(dueDateStr);
        if (isNaN(due.getTime())) return "";

        // 時刻を 00:00:00 に揃えて日数差を計算
        due.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diffDays = Math.floor((due - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return "due-overdue"; // 期限切れ
        } else if (diffDays <= 3) {
            return "due-soon"; // 3日以内
        }
        return "";
    }



    /* ========================================
       選択中タスクの詳細
    ======================================== */

    function getSelectedTask() {
        return tasks.find(
            task => task.id === selectedTaskId
        ) || null;
    }

    async function renderTaskDetail(){
        const task = getSelectedTask();

        detailContainer.innerHTML = "";

  // ★ 自分が担当者（作業者）かどうかを判定
        const isAssignee = task && Number(task.assigned_user_id) === Number(currentUserId);

               // ★ 担当者本人でない場合は、申請ボタンを無効化（承認待ち中も無効化）
        hoursButton.disabled = !task || !isAssignee || task.status === "完了" || task.status === "承認待ち" || task.status === "工数変更承認待ち";
        completeButton.disabled =
            !task || !isAssignee || task.status === "完了" ||
            task.status === "承認待ち" || task.status === "工数変更承認待ち";

        // ★ 「承認待ち」タブを開いていて、かつ「承認待ち・工数変更承認待ち」＆「承認者本人」のときだけ承認ボタンを表示
        const approveButton = document.getElementById("approveTaskButton");
        if (approveButton) {
            const isRequester = activeTab === "pending" && task && Number(task.created_by) === Number(currentUserId);
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

        // ★ 差し戻しボタンの表示制御（「承認待ち」タブの時だけ表示）
        const rejectButton = document.getElementById("rejectTaskButton");
        if (rejectButton) {
            const isRequester = activeTab === "pending" && task && Number(task.created_by) === Number(currentUserId);
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

                // ★ ここから追加（reports.json の読み込み）
        let reportData = null;
        try {
            const res = await fetch(`../../backend/reports.json?t=${Date.now()}`);
            if (res.ok) {
                const allReports = await res.json();
                reportData = allReports[String(task.id)] || null;
            }
        } catch (e) {}
        // ★ ここまで追加

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
             ["エビデンス", (reportData && reportData.file_path)
            ? { url: reportData.file_path, text: `${reportData.file_name}（提出済み）` }
            : (task.evidence || "未提出")],
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

             if (label === "完了報告" || label === "工数変更申請") {
                item.classList.add("is-wide");
            } else if (label === "前回差し戻し理由") {
                item.classList.add("is-wide", "is-reject");
            }

            const labelElement = document.createElement("p");
            labelElement.textContent = label;

            const valueElement = document.createElement("strong");
             // ★ ここから書き換え（リンク用データなら <a> タグを作る）
            if (typeof value === "object" && value !== null && value.url) {
                const link = document.createElement("a");
                link.href = value.url;
                link.textContent = value.text;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                valueElement.appendChild(link);
            } else {
                valueElement.textContent = value;
            }
        
            item.appendChild(labelElement);
            item.appendChild(valueElement);
            grid.appendChild(item);
        });

        detailContainer.appendChild(grid);
}

    /* ========================================
       タブ切り替え
    ======================================== */

       // ★ 「完了 3件」のカード全体（.task-summary-card）を確実に取得する
    const doneCountEl = document.getElementById("doneCount");
    const doneCard = doneCountEl ? doneCountEl.closest(".task-summary-card") : null;


    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            activeTab = tab.dataset.tab;

            if (doneCard) {
                doneCard.classList.remove("active");
            }

            tabs.forEach(item => {
                const active = item === tab;
                item.classList.toggle("active", active);
                item.setAttribute("aria-selected", String(active));
            });

            renderTasks();
        });
    });

    if (doneCard) {
        doneCard.classList.add("is-clickable");
        doneCard.title = "クリックして完了済みタスクを表示";
        doneCard.addEventListener("click", () => {
            tabs.forEach(t => {
                t.classList.remove("active");
                t.setAttribute("aria-selected", "false");
            });
            doneCard.classList.add("active");
            activeTab = "completed";
            selectedTaskId = null;
            renderTasks();
        });
    }


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

            const report = document.getElementById("completeReport").value.trim();
            const evidenceFiles = document.getElementById("completeEvidence").files;
            const error = document.getElementById("completeError");

            error.textContent = "";

            if (!report) {
                error.textContent = "完了報告を入力してください。";
                return;
            }

            if (evidenceFiles.length > 0 && evidenceFiles[0].size > 5 * 1024 * 1024) {
                error.textContent = "添付ファイルは5MB以下にしてください。";
                return;
            }

            // FormDataにテキストとファイルを詰める
            const formData = new FormData();
            formData.append("id", task.id);
            formData.append("status", "pending");
            formData.append("report", report);
            if (evidenceFiles.length > 0) {
                formData.append("evidence", evidenceFiles[0]);
            }

            try {
                const response = await fetch('../../backend/api_update_status.php', {
                    method: 'POST',
                    body: formData // headersは書かない（ブラウザが自動設定）
                });

                const result = await response.json();

                if (result.status === "success") {
                    bootstrap.Modal.getInstance(
                        document.getElementById("taskCompleteModal")
                    ).hide();

                    showToast("完了申請を送信しました。");
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