
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

    const copyButton = document.getElementById("copyDeptCode");
    const copyMessage = document.getElementById("copyMessage");

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

                await navigator.clipboard.writeText(deptCode);

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

        editProfileButton.addEventListener("click", (event) => {

            event.preventDefault();

            alert("プロフィール編集機能は準備中です。");

        });

    }

});


/* ========================================
   ログイン中のユーザー情報取得
======================================== */

async function loadMyPageUser() {

    const nameElement = document.getElementById(
        "mypageUserName"
    );

    const emailElement = document.getElementById(
        "mypageUserEmail"
    );

    if (!nameElement || !emailElement) {
        return;
    }

    try {

        const response = await fetch(
            "../../backend/get-user.php",
            {
                method: "GET",
                credentials: "same-origin",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        // 未ログインの場合
        if (response.status === 401) {

            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            throw new Error(
                "ユーザー情報の取得に失敗しました。"
            );
        }

        const result = await response.json();

        if (result.success !== true || !result.user) {
            throw new Error(
                result.message || "取得に失敗しました。"
            );
        }

        // ユーザー名を表示
        nameElement.textContent = result.user.name;

        // メールアドレスを表示
        emailElement.textContent = result.user.email;

    } catch (error) {

        console.error("ユーザー情報取得エラー:", error);

        nameElement.textContent = "取得できませんでした";
        emailElement.textContent = "";

    }

}
