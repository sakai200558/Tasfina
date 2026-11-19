
/* ========================================
   Tasfina プロフィール編集
======================================== */

document.addEventListener("DOMContentLoaded", async () => {

    const openButton =
        document.getElementById("openProfileEdit");

    const modalContainer =
        document.getElementById("profileEditModalContainer");

    if (!openButton || !modalContainer) return;

    const GET_API = "../../backend/profile-get.php";
    const UPDATE_API = "../../backend/profile-update.php";

    try {
        // モーダルHTML読み込み
        await loadModal(
            "profileEditModalContainer",
            "../modals/profile-edit.html"
        );

    } catch (error) {
        console.error("モーダル読み込みエラー:", error);
        openButton.disabled = true;
        return;
    }

    const modalElement =
        document.getElementById("profileEditModal");

    const modal =
        bootstrap.Modal.getOrCreateInstance(modalElement);

    const form =
        document.getElementById("profileEditForm");

    const nameInput =
        document.getElementById("profileEditName");

    const emailInput =
        document.getElementById("profileEditEmail");

    const departmentInput =
        document.getElementById("profileEditDepartment");

    const roleInput =
        document.getElementById("profileEditRole");

    const messageBox =
        document.getElementById("profileEditMessage");

    const saveButton =
        document.getElementById("profileEditSaveButton");

    let canEdit = false;

    // 権限名称
    const roleNames = {
        "1000": "全社管理者",
        "2000": "部門管理者",
        "3000": "一般メンバー",
        "4000": "閲覧専用"
    };

    /* ========================================
       メッセージ表示
    ======================================== */

    function showMessage(message, type = "danger") {

        messageBox.textContent = message;

        messageBox.className = `alert alert-${type}`;

        messageBox.hidden = false;
    }

    function clearMessage() {
        messageBox.textContent = "";
        messageBox.hidden = true;
    }

    /* ========================================
       保存ボタンの状態
    ======================================== */

    function setSaving(saving) {

        saveButton.disabled = saving || !canEdit;

        saveButton.innerHTML = saving
            ? '<span class="spinner-border spinner-border-sm me-2"></span>保存中...'
            : '<i class="bi bi-check-lg me-1"></i>変更を保存';
    }

    /* ========================================
       プロフィール情報取得
    ======================================== */

    async function loadProfile() {

        clearMessage();

        canEdit = false;
        saveButton.disabled = true;

        const response = await fetch(GET_API, {
            method: "GET",
            credentials: "same-origin",
            headers: {
                "Accept": "application/json"
            }
        });

        const result = await response.json();

        if (!response.ok || result.success !== true) {
            throw new Error(
                result.comment ||
                "プロフィール情報の取得に失敗しました。"
            );
        }

        const user = result.user;

        nameInput.value = user.name ?? "";
        emailInput.value = user.email ?? "";

        departmentInput.value =
            user.department ?? "未設定";

        const roleCode = String(user.role_code ?? "");

        roleInput.value =
            roleNames[roleCode] ?? "不明";

        canEdit = ["1000", "2000", "3000"]
            .includes(roleCode);

        nameInput.readOnly = !canEdit;
        emailInput.readOnly = !canEdit;
        saveButton.disabled = !canEdit;

        if (!canEdit) {
            showMessage(
                "このアカウントではプロフィールを編集できません。",
                "warning"
            );
        }
    }

    /* ========================================
       モーダルを開く
    ======================================== */

    openButton.addEventListener("click", async () => {

        try {
            await loadProfile();
            modal.show();

        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    });

    /* ========================================
       プロフィール保存
    ======================================== */

    form.addEventListener("submit", async (event) => {

        event.preventDefault();
        clearMessage();

        if (!canEdit) {
            showMessage("編集権限がありません。");
            return;
        }

        if (!form.reportValidity()) return;

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();

        if (!name) {
            showMessage("ユーザー名を入力してください。");
            return;
        }

        const profileData = {
            name: name,
            email: email
        };

        setSaving(true);

        try {

            const response = await fetch(UPDATE_API, {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(profileData)
            });

            const result = await response.json();

            if (!response.ok || result.success !== true) {
                throw new Error(
                    result.comment ||
                    "プロフィールの更新に失敗しました。"
                );
            }

            // マイページ表示更新
            const mypageName =
                document.getElementById("mypageUserName");

            const mypageEmail =
                document.getElementById("mypageUserEmail");

            if (mypageName) {
                mypageName.textContent = name;
            }

            if (mypageEmail) {
                mypageEmail.textContent = email;
            }

            modal.hide();

            alert("プロフィールを更新しました。");

        } catch (error) {

            console.error("プロフィール更新エラー:", error);

            showMessage(error.message);

        } finally {
            setSaving(false);
        }
    });

});
