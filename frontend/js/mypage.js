
/* ========================================
   Tasfina マイページ専用JavaScript
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    // =====================================
    // 所属部門コードのコピー
    // =====================================

    const copyButton = document.getElementById("copyDeptCode");
    const copyMessage = document.getElementById("copyMessage");

    let messageTimer;

    function showCopyMessage(message) {

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


    // =====================================
    // プロフィール編集（仮処理）
    // =====================================

    const editProfileButton =
        document.getElementById("editProfileButton");

    if (editProfileButton) {

        editProfileButton.addEventListener("click", (event) => {

            event.preventDefault();

            // 後からプロフィール編集モーダルを実装
            alert("プロフィール編集機能は準備中です。");

        });

    }

});
