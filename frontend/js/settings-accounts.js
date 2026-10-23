
/* ========================================
   アカウント管理画面
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    const STORAGE_KEY = "tasfina_accounts_demo_v1";

    const roleNames = {
        1000: "全社管理者",
        2000: "部門管理者",
        3000: "一般メンバー",
        4000: "閲覧専用"
    };

    const roleClasses = {
        1000: "role-admin",
        2000: "role-manager",
        3000: "role-member",
        4000: "role-viewer"
    };

    const sampleUsers = [
        { id: 1, name: "山田 太郎", email: "taro.yamada@tasfina.co.jp", department: "営業部", role: 1000, active: true, expiry: "2025-12-31", image: "" },
        { id: 2, name: "田中 美咲", email: "misaki.tanaka@tasfina.co.jp", department: "営業部", role: 2000, active: true, expiry: "", image: "" },
        { id: 3, name: "佐藤 花子", email: "hanako.sato@tasfina.co.jp", department: "開発部", role: 2000, active: true, expiry: "", image: "" },
        { id: 4, name: "伊藤 翔", email: "sho.ito@tasfina.co.jp", department: "開発部", role: 3000, active: true, expiry: "", image: "" },
        { id: 5, name: "高橋 健", email: "ken.takahashi@tasfina.co.jp", department: "サポート部", role: 3000, active: true, expiry: "", image: "" },
        { id: 6, name: "渡辺 直樹", email: "naoki.watanabe@tasfina.co.jp", department: "サポート部", role: 3000, active: true, expiry: "", image: "" },
        { id: 7, name: "加藤 優", email: "yu.kato@tasfina.co.jp", department: "営業部", role: 3000, active: false, expiry: "", image: "" },
        { id: 8, name: "中村 愛", email: "ai.nakamura@tasfina.co.jp", department: "開発部", role: 3000, active: true, expiry: "", image: "" }
    ];

    function loadUsers() {
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return Array.isArray(stored) ? stored : structuredClone(sampleUsers);
        } catch {
            return structuredClone(sampleUsers);
        }
    }

    let users = loadUsers();
    let selectedUserId = users[0]?.id ?? null;
    let selectedIds = new Set();
    let currentPage = 1;
    let isCreating = false;
    let pendingImage = "";

    const $ = id => document.getElementById(id);

    const tableBody = $("userTableBody");
    const form = $("userForm");

    function saveUsers() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
            return true;
        } catch (error) {
            console.error("ユーザー保存エラー:", error);
            showMessage("保存できませんでした。ブラウザの保存容量を確認してください。", true);
            return false;
        }
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[char]));
    }

    function showMessage(message, error = false) {
        $("userFormMessage").textContent = message;
        $("userFormMessage").classList.toggle("error", error);
    }

    function getFilteredUsers() {
        const search = $("userSearch").value.trim().toLowerCase();
        const department = $("departmentFilter").value;
        const role = $("roleFilter").value;
        const status = $("statusFilter").value;

        return users.filter(user => {
            const matchesSearch =
                user.name.toLowerCase().includes(search) ||
                user.email.toLowerCase().includes(search);

            const matchesDepartment =
                !department || user.department === department;

            const matchesRole =
                !role || String(user.role) === role;

            const matchesStatus =
                !status ||
                (status === "active" && user.active) ||
                (status === "inactive" && !user.active);

            return matchesSearch &&
                matchesDepartment &&
                matchesRole &&
                matchesStatus;
        });
    }

    function renderTable() {
        const filtered = getFilteredUsers();
        const pageSize = Number($("pageSize").value);
        const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

        currentPage = Math.min(currentPage, totalPages);

        const start = (currentPage - 1) * pageSize;
        const pageUsers = filtered.slice(start, start + pageSize);

        tableBody.innerHTML = pageUsers.map(user => {
            const selected = selectedUserId === user.id && !isCreating;
            const checked = selectedIds.has(user.id);

            return `
                <tr data-user-id="${user.id}" class="${selected ? "selected-row" : ""}">
                    <td>
                        <input
                            type="checkbox"
                            class="user-checkbox"
                            data-id="${user.id}"
                            ${checked ? "checked" : ""}
                            aria-label="${escapeHTML(user.name)}を選択"
                        >
                    </td>

                    <td>
                        <span class="accounts-user-name">
                            <span class="accounts-avatar">
                                ${user.image
                                    ? `<img src="${escapeHTML(user.image)}" alt="">`
                                    : `<i class="bi bi-person-fill"></i>`
                                }
                            </span>
                            ${escapeHTML(user.name)}
                        </span>
                    </td>

                    <td>${escapeHTML(user.email)}</td>
                    <td>${escapeHTML(user.department)}</td>

                    <td>
                        <span class="accounts-role ${roleClasses[user.role] || "role-viewer"}">
                            ${escapeHTML(roleNames[user.role] || "不明")}
                        </span>
                    </td>

                    <td>
                        <span class="accounts-status ${user.active ? "" : "inactive"}">
                            <span class="accounts-status-dot"></span>
                            ${user.active ? "有効" : "無効"}
                        </span>
                    </td>

                    <td>
                        <div class="accounts-row-actions">
                            <button
                                type="button"
                                class="accounts-icon-button edit-user"
                                data-id="${user.id}"
                                aria-label="${escapeHTML(user.name)}を編集"
                            >
                                <i class="bi bi-pencil-fill"></i>
                            </button>

                            <button
                                type="button"
                                class="accounts-icon-button delete delete-user"
                                data-id="${user.id}"
                                aria-label="${escapeHTML(user.name)}を削除"
                            >
                                <i class="bi bi-trash-fill"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        該当するユーザーはいません。
                    </td>
                </tr>
            `;
        }

        $("userCountText").textContent = filtered.length
            ? `全${filtered.length}件中 ${start + 1} - ${start + pageUsers.length}件を表示`
            : "0件を表示";

        $("currentPageNumber").textContent = currentPage;
        $("previousPage").disabled = currentPage === 1;
        $("nextPage").disabled = currentPage >= totalPages;

        $("selectAllUsers").checked =
            pageUsers.length > 0 &&
            pageUsers.every(user => selectedIds.has(user.id));

        updateBulkControls();
    }

    function renderAvatar() {
        $("profileAvatar").innerHTML = pendingImage
            ? `<img src="${escapeHTML(pendingImage)}" alt="プロフィール画像">`
            : `<i class="bi bi-person-fill"></i>`;
    }

    function showUserDetails(id) {
        const user = users.find(item => item.id === id);
        if (!user) return;

        isCreating = false;
        selectedUserId = id;
        pendingImage = user.image || "";

        $("detailHeading").textContent = "ユーザー詳細・編集";
        $("userName").value = user.name;
        $("userEmail").value = user.email;
        $("userPassword").value = "";
        $("userDepartment").value = user.department;
        $("userRole").value = String(user.role);
        $("userActive").checked = user.active;
        $("userExpiry").value = user.expiry || "";

        $("userDetailPanel").hidden = false;
        showMessage("");
        updateStatusText();
        renderAvatar();
        renderTable();
    }

    function startCreatingUser() {
        isCreating = true;
        selectedUserId = null;
        pendingImage = "";

        form.reset();

        $("detailHeading").textContent = "新規ユーザー追加";
        $("userDepartment").value = "営業部";
        $("userRole").value = "3000";
        $("userActive").checked = true;
        $("userDetailPanel").hidden = false;

        showMessage("");
        updateStatusText();
        renderAvatar();
        renderTable();
    }

    function updateStatusText() {
        $("userActiveText").textContent =
            $("userActive").checked ? "有効" : "無効";
    }

    function deleteUser(id) {
        const user = users.find(item => item.id === id);
        if (!user) return;

        if (!confirm(`${user.name} を削除しますか？`)) return;

        users = users.filter(item => item.id !== id);
        selectedIds.delete(id);

        if (!saveUsers()) return;

        if (selectedUserId === id) {
            selectedUserId = users[0]?.id ?? null;

            if (selectedUserId !== null) {
                showUserDetails(selectedUserId);
            } else {
                $("userDetailPanel").hidden = true;
            }
        }

        renderTable();
    }

    function updateBulkControls() {
        $("selectedUserCount").textContent =
            `選択件数：${selectedIds.size}件`;

        const action = $("bulkAction").value;

        $("bulkDepartment").disabled = action !== "department";

        $("executeBulkButton").disabled =
            selectedIds.size === 0 ||
            !action ||
            (action === "department" && !$("bulkDepartment").value);
    }

    function executeBulkAction() {
        const action = $("bulkAction").value;
        const department = $("bulkDepartment").value;

        if (!selectedIds.size || !action) return;

        if (action === "department" && !department) {
            alert("変更先の部門を選択してください。");
            return;
        }

        if (action === "delete") {
            if (!confirm(`選択した${selectedIds.size}件のユーザーを削除しますか？`)) {
                return;
            }

            users = users.filter(user => !selectedIds.has(user.id));
        } else {
            users.forEach(user => {
                if (!selectedIds.has(user.id)) return;

                if (action === "activate") user.active = true;
                if (action === "deactivate") user.active = false;
                if (action === "department") user.department = department;
            });
        }

        if (!saveUsers()) return;

        selectedIds.clear();
        $("bulkAction").value = "";
        $("bulkDepartment").value = "";

        if (!users.some(user => user.id === selectedUserId)) {
            selectedUserId = users[0]?.id ?? null;
        }

        if (selectedUserId !== null) {
            showUserDetails(selectedUserId);
        } else {
            $("userDetailPanel").hidden = true;
        }

        renderTable();
    }

    /* ========================================
       フォーム保存
    ======================================== */

    form.addEventListener("submit", event => {
        event.preventDefault();

        const name = $("userName").value.trim();
        const email = $("userEmail").value.trim();
        const password = $("userPassword").value;
        const department = $("userDepartment").value;
        const role = Number($("userRole").value);
        const active = $("userActive").checked;
        const expiry = $("userExpiry").value;

        if (!name || !email || !department) {
            showMessage("必須項目を入力してください。", true);
            return;
        }

        if (!$("userEmail").checkValidity()) {
            showMessage("正しいメールアドレスを入力してください。", true);
            return;
        }

        const duplicate = users.some(user =>
            user.email.toLowerCase() === email.toLowerCase() &&
            user.id !== selectedUserId
        );

        if (duplicate) {
            showMessage("このメールアドレスは既に登録されています。", true);
            return;
        }

        if (password && password.length < 8) {
            showMessage("パスワードは8文字以上で入力してください。", true);
            return;
        }

        if (isCreating) {
            const nextId = Math.max(0, ...users.map(user => user.id)) + 1;

            users.push({
                id: nextId,
                name,
                email,
                department,
                role,
                active,
                expiry,
                image: pendingImage
            });

            selectedUserId = nextId;
            isCreating = false;
        } else {
            const user = users.find(item => item.id === selectedUserId);
            if (!user) return;

            Object.assign(user, {
                name,
                email,
                department,
                role,
                active,
                expiry,
                image: pendingImage
            });
        }

        if (!saveUsers()) return;

        showUserDetails(selectedUserId);
        showMessage("ユーザー情報を保存しました。");
    });

    /* ========================================
       テーブル操作
    ======================================== */

    tableBody.addEventListener("click", event => {
        if (event.target.closest(".user-checkbox")) return;

        const deleteButton = event.target.closest(".delete-user");

        if (deleteButton) {
            deleteUser(Number(deleteButton.dataset.id));
            return;
        }

        const row = event.target.closest("tr[data-user-id]");

        if (row) {
            showUserDetails(Number(row.dataset.userId));
        }
    });

    tableBody.addEventListener("change", event => {
        if (!event.target.matches(".user-checkbox")) return;

        const id = Number(event.target.dataset.id);

        if (event.target.checked) {
            selectedIds.add(id);
        } else {
            selectedIds.delete(id);
        }

        renderTable();
    });

    $("selectAllUsers").addEventListener("change", event => {
        const filtered = getFilteredUsers();
        const size = Number($("pageSize").value);
        const start = (currentPage - 1) * size;

        filtered.slice(start, start + size).forEach(user => {
            if (event.target.checked) {
                selectedIds.add(user.id);
            } else {
                selectedIds.delete(user.id);
            }
        });

        renderTable();
    });

    /* ========================================
       ボタン・検索・絞り込み
    ======================================== */

    $("addUserButton").addEventListener("click", startCreatingUser);

    $("cancelEditButton").addEventListener("click", () => {
        if (selectedUserId !== null) {
            showUserDetails(selectedUserId);
        } else if (users.length) {
            showUserDetails(users[0].id);
        } else {
            $("userDetailPanel").hidden = true;
        }
    });

    $("closeDetailButton").addEventListener("click", () => {
        $("userDetailPanel").hidden = true;
    });

    $("userActive").addEventListener("change", updateStatusText);

    $("togglePasswordButton").addEventListener("click", () => {
        const input = $("userPassword");
        const visible = input.type === "password";

        input.type = visible ? "text" : "password";
        $("togglePasswordButton").textContent = visible ? "非表示" : "表示";
    });

    ["userSearch", "departmentFilter", "roleFilter", "statusFilter", "pageSize"]
        .forEach(id => {
            const element = $(id);
            const eventName = id === "userSearch" ? "input" : "change";

            element.addEventListener(eventName, () => {
                currentPage = 1;
                renderTable();
            });
        });

    $("previousPage").addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });

    $("nextPage").addEventListener("click", () => {
        currentPage++;
        renderTable();
    });

    $("bulkAction").addEventListener("change", updateBulkControls);
    $("bulkDepartment").addEventListener("change", updateBulkControls);
    $("executeBulkButton").addEventListener("click", executeBulkAction);

    /* ========================================
       プロフィール画像
    ======================================== */

    $("profileImage").addEventListener("change", event => {
        const file = event.target.files[0];
        if (!file) return;

        if (!["image/jpeg", "image/png"].includes(file.type)) {
            showMessage("PNGまたはJPG画像を選択してください。", true);
            return;
        }

        if (file.size > 1024 * 1024) {
            showMessage("画像は1MB以下にしてください。", true);
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            pendingImage = reader.result;
            renderAvatar();
        };

        reader.readAsDataURL(file);
        event.target.value = "";
    });

    /* ========================================
       初期表示
    ======================================== */

    if (selectedUserId !== null) {
        showUserDetails(selectedUserId);
    } else {
        $("userDetailPanel").hidden = true;
        renderTable();
    }

});
