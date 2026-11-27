/* ========================================
   新規タスク作成モーダル（インライン対応版）
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    const openButton = document.getElementById("openTaskCreateModal") || document.getElementById("openTaskModalBtn");
    let currentUserId = null;

    // 1. ページ読み込み時に担当者一覧を必ず読み込む
    loadAssignees();

    // 2. モーダルを開くボタンのイベント
    if (openButton) {
        openButton.addEventListener("click", async () => {
            await loadAssignees();
            const modalElement = document.getElementById("taskCreateModal") || document.getElementById("taskModal");
            if (modalElement && typeof bootstrap !== "undefined") {
                const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
                modal.show();
            }
        });
    }

    // 3. フォームの送信処理を初期化
    const form = document.getElementById("taskCreateForm");
    if (form) {
        form.addEventListener("submit", async event => {
            event.preventDefault();

            const titleInput = document.getElementById("taskTitle");
            const titleError = document.getElementById("titleError");
            const formMessage = document.getElementById("formMessage");

            if (titleError) titleError.textContent = "";
            if (formMessage) formMessage.textContent = "";

            const title = titleInput ? titleInput.value.trim() : "";
            const checkedAssignees = Array.from(document.querySelectorAll('input[name="assignee_checkbox"]:checked')).map(cb => cb.value);
            const approverSelect = document.getElementById("approver");
            const approver = approverSelect ? approverSelect.value : "";
            const priority = document.getElementById("priority").value;
            const description = document.getElementById("taskDescription") ? document.getElementById("taskDescription").value.trim() : "";
            const startDate = document.getElementById("startDate").value;
            const dueDate = document.getElementById("dueDate").value;

            const difficultyLevel = document.getElementById("difficultyLevel").value;
            const discomfortLevel = document.getElementById("discomfortLevel").value;

            /* 入力チェック */
            if (!title) {
                if (titleError) titleError.textContent = "タスク名を入力してください。";
                if (titleInput) titleInput.focus();
                return;
            }

            if (checkedAssignees.length === 0 || !startDate || !dueDate) {
                if (formMessage) formMessage.textContent = "担当者を1人以上選択し、必須項目をすべて入力してください。";
                return;
            }

            /* 自分のタスクが含まれるなら承認者を必須にする */
            const isSelfTask = currentUserId !== null && checkedAssignees.some(id => String(id) === String(currentUserId));
            if (isSelfTask && !approver) {
                if (formMessage) {
                    formMessage.style.color = "#d84c4c";
                    formMessage.textContent = "自分のタスクが含まれる場合は、承認者を選択してください。";
                }
                return;
            }

            if (dueDate < startDate) {
                if (formMessage) formMessage.textContent = "期限は開始日以降に設定してください。";
                return;
            }

            /* 送信データ（PHPの api_create_task.php に合わせる） */
            const taskData = {
                title,
                description,
                assignees: checkedAssignees,
                assignee: checkedAssignees,
                approver: isSelfTask ? approver : null,
                difficulty_level: parseFloat(difficultyLevel),
                discomfort_level: parseFloat(discomfortLevel),
                estimated_hours: 4.0,
                due_date: dueDate
            };

            try {
                const response = await fetch("../../backend/api_create_task.php", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(taskData)
                });

                const result = await response.json();

                if (result.status === "success") {
                    if (formMessage) {
                        formMessage.style.color = "#2b9a70";
                        formMessage.textContent = "タスクが正常に登録されました！";
                    }

                    /* モーダルを閉じる */
                    const modalElement = document.getElementById("taskCreateModal");
                    const modal = bootstrap.Modal.getInstance(modalElement);

                    setTimeout(() => {
                        if (modal) modal.hide();
                        form.reset();
                        location.reload(); // 一覧を更新するためにリロード
                    }, 1000);

                } else {
                    if (formMessage) {
                        formMessage.style.color = "#d84c4c";
                        formMessage.textContent = "エラー: " + result.message;
                    }
                }

            } catch (error) {
                console.error("通信エラー:", error);
                if (formMessage) {
                    formMessage.style.color = "#d84c4c";
                    formMessage.textContent = "サーバーとの通信に失敗しました。";
                }
            }
        });

    }

        // ★ ここから追加
    function ensureApproverField(assigneeSelect) {
        let wrapper = document.getElementById("approverWrapper");
        if (!wrapper) {
            wrapper = document.createElement("div");
            wrapper.id = "approverWrapper";
            wrapper.className = "mb-3";
            wrapper.innerHTML = `
                <label for="approver" class="form-label">
                    承認者 <span class="badge bg-danger">必須</span>
                </label>
                <select id="approver" class="form-select">
                    <option value="">承認者を選択してください</option>
                </select>
                <div class="form-text">自分のタスクは他のメンバーの承認が必要です。</div>
            `;
            const assigneeGroup = assigneeSelect.closest(".mb-3") || assigneeSelect.parentElement;
            assigneeGroup.insertAdjacentElement("afterend", wrapper);
            assigneeSelect.addEventListener("change", toggleApproverVisibility);
        }
        return document.getElementById("approver");
    }

    function toggleApproverVisibility() {
        const wrapper = document.getElementById("approverWrapper");
        if (!wrapper) return;

        const checkedIds = Array.from(document.querySelectorAll('input[name="assignee_checkbox"]:checked')).map(cb => String(cb.value));
        const isSelf = currentUserId !== null && checkedIds.includes(String(currentUserId));
        wrapper.style.display = isSelf ? "block" : "none";
    }
    // ★ ここまで追加



      /* ========================================
       担当者セレクトボックスにメンバー一覧を読み込む
    ======================================== */
    async function loadAssignees() {
        try {
            const response = await fetch("../../backend/api_users.php", { credentials: "same-origin" });
            if (!response.ok) {
                throw new Error("ユーザー一覧の取得に失敗しました");
            }
            const data = await response.json();
            const users = Array.isArray(data) ? data : (Array.isArray(data.users) ? data.users : []);
            currentUserId = data.current_user_id
                ?? data.login_user_id
                ?? data.user_id
                ?? window.currentUserId
                ?? null;

            const assigneeSelect = document.getElementById("assignee");
            let anchorEl = assigneeSelect;

            if (assigneeSelect) {
                assigneeSelect.style.display = "none";
                assigneeSelect.removeAttribute("required");
                const assigneeLabel = document.querySelector('label[for="assignee"]');
                if (assigneeLabel) assigneeLabel.removeAttribute("for");
            } else {
                // select#assignee が無い場合は「担当者」ラベルの直後に差し込む
                const labels = Array.from(document.querySelectorAll("#taskCreateForm label, #taskCreateForm .form-label"));
                anchorEl = labels.find(el => el.textContent.includes("担当者")) || document.getElementById("priority")?.parentElement;
            }

            if (!anchorEl) return;

                     // 自分を一番上に並べ替える
            const sortedUsers = [...users].sort((a, b) => {
                const aMe = currentUserId !== null && String(a.id ?? a.user_id ?? "") === String(currentUserId);
                const bMe = currentUserId !== null && String(b.id ?? b.user_id ?? "") === String(currentUserId);
                return (aMe === bMe) ? 0 : (aMe ? -1 : 1);
            });

            // ツールバー（選択中人数 ＋ 全員選択/解除ボタン）
            let toolbar = document.getElementById("assigneeToolbar");
            if (!toolbar) {
                toolbar = document.createElement("div");
                toolbar.id = "assigneeToolbar";
                toolbar.className = "assignee-toolbar";
                toolbar.innerHTML = `
                    <span id="assigneeSelectedCount">選択中: 0名</span>
                    <button type="button" id="toggleAllAssigneesBtn" class="assignee-select-all-btn">全員選択 / 解除</button>
                `;
                anchorEl.insertAdjacentElement("afterend", toolbar);
            }

            let checkboxList = document.getElementById("assigneeCheckboxList");
            if (!checkboxList) {
                checkboxList = document.createElement("div");
                checkboxList.id = "assigneeCheckboxList";
                toolbar.insertAdjacentElement("afterend", checkboxList);
            }

            const approverSelect = ensureApproverField(checkboxList);

            checkboxList.innerHTML = "";
            approverSelect.innerHTML = '<option value="">承認者を選択してください</option>';

            const updateSelectedCount = () => {
                const count = checkboxList.querySelectorAll('input[name="assignee_checkbox"]:checked').length;
                const countEl = document.getElementById("assigneeSelectedCount");
                if (countEl) countEl.textContent = `選択中: ${count}名`;
            };

            sortedUsers.forEach(user => {
                const uid = String(user.id ?? user.user_id ?? "");
                const uname = user.name ?? user.display_name ?? "";
                const isMe = currentUserId !== null && uid === String(currentUserId);

                const itemDiv = document.createElement("div");
                itemDiv.className = "form-check";

                const cb = document.createElement("input");
                cb.type = "checkbox";
                cb.name = "assignee_checkbox";
                cb.className = "form-check-input";
                cb.id = `assignee_cb_${uid}`;
                cb.value = uid;
                if (isMe) {
                    cb.checked = true;
                }
                cb.addEventListener("change", () => {
                    toggleApproverVisibility();
                    updateSelectedCount();
                });

                const label = document.createElement("label");
                label.className = "form-check-label";
                label.htmlFor = `assignee_cb_${uid}`;
                label.textContent = isMe ? `${uname}（自分）` : uname;

                itemDiv.appendChild(cb);
                itemDiv.appendChild(label);
                checkboxList.appendChild(itemDiv);

                if (!isMe) {
                    const appOption = document.createElement("option");
                    appOption.value = uid;
                    appOption.textContent = uname;
                    approverSelect.appendChild(appOption);
                }
            });

            const toggleAllBtn = document.getElementById("toggleAllAssigneesBtn");
            if (toggleAllBtn) {
                toggleAllBtn.onclick = () => {
                    const boxes = Array.from(checkboxList.querySelectorAll('input[name="assignee_checkbox"]'));
                    const allChecked = boxes.every(b => b.checked);
                    boxes.forEach(b => { b.checked = !allChecked; });
                    toggleApproverVisibility();
                    updateSelectedCount();
                };
            }

            updateSelectedCount();
            toggleApproverVisibility();

        } catch (error) {
            console.error("メンバー読み込みエラー:", error);
        }
    }
});
