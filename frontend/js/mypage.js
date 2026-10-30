
/* ========================================
   Tasfina マイページ専用JavaScript
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ========================================
       ログイン中のユーザー情報取得
    ======================================== */

    loadMyPageUser();

    /* ========================================
       所属部門コードのコピー
    ======================================== */

    const copyButton =
        document.getElementById("copyDeptCode");

    const copyMessage =
        document.getElementById("copyMessage");

    let messageTimer;

    function showCopyMessage(message) {

        if (!copyMessage) {
            return;
        }

        copyMessage.textContent = message;

        copyMessage.classList.add("show");

        clearTimeout(messageTimer);

        messageTimer = setTimeout(() => {

            copyMessage.classList.remove("show");

        }, 2500);

    }

    if (copyButton) {

        copyButton.addEventListener("click", async () => {

            const deptCode = copyButton.dataset.code;

            try {

                await navigator.clipboard.writeText(
                    deptCode
                );

                showCopyMessage(
                    "所属部門コードをコピーしました"
                );

            } catch (error) {

                console.error(
                    "コピーに失敗しました:",
                    error
                );

                showCopyMessage(
                    "コピーに失敗しました"
                );

            }

        });

    }

    /* ========================================
       プロフィール編集（仮処理）
    ======================================== */

    const editProfileButton =
        document.getElementById("editProfileButton");

    if (editProfileButton) {

        editProfileButton.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                alert(
                    "プロフィール編集機能は準備中です。"
                );

            }
        );

    }

});


/* ========================================
   ログイン中のユーザー情報取得
======================================== */

async function loadMyPageUser() {

    const nameElement =
        document.getElementById("mypageUserName");

    const emailElement =
        document.getElementById("mypageUserEmail");

    const roleElement =
        document.getElementById("mypageUserRole");

    if (!nameElement || !emailElement) {
        return;
    }

    try {

        /* =====================================
           PHPへリクエスト送信
        ===================================== */

        const response = await fetch(
            "../../backend/userprofile.php",
            {
                method: "GET",

                credentials: "same-origin",

                headers: {
                    "Accept": "application/json"
                }
            }
        );

        /* =====================================
           未ログインの場合
        ===================================== */

        if (response.status === 401) {

            window.location.href = "login.html";

            return;
        }

        /* =====================================
           HTTPエラー確認
        ===================================== */

        if (!response.ok) {

            throw new Error(
                "ユーザー情報の取得に失敗しました。"
            );

        }

        /* =====================================
           JSON取得
        ===================================== */

        const result = await response.json();

        if (
            result.success !== true ||
            !result.user
        ) {

            throw new Error(
                result.message ||
                "ユーザー情報を取得できませんでした。"
            );

        }

        /* =====================================
           ユーザー名表示
        ===================================== */

        nameElement.textContent =
            result.user.name || "名前未設定";

        /* =====================================
           メールアドレス表示
        ===================================== */

        emailElement.textContent =
            result.user.email || "メールアドレス未設定";

        /* =====================================
           役職表示
        ===================================== */

        if (roleElement) {

            const roleNames = {
                "1000": "全社管理者",
                "2000": "部門管理者",
                "3000": "一般メンバー",
                "4000": "閲覧専用"
            };

            const roleCode = String(
                result.user.role_code ?? ""
            );

            const roleName =
                roleNames[roleCode] || "権限未設定";

            const jobTitle =
                result.user.job_title;

            roleElement.textContent =
                jobTitle
                    ? `${jobTitle}／${roleName}`
                    : roleName;

        }

        console.log(
            "ユーザー情報取得成功:",
            result.user
        );

    } catch (error) {

        console.error(
            "ユーザー情報取得エラー:",
            error
        );

        nameElement.textContent =
            "取得できませんでした";

        emailElement.textContent = "";

        if (roleElement) {
            roleElement.textContent = "";
        }

    }

}
