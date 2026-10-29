
/* ========================================
   Tasfina パスワード再設定専用JavaScript
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    // =====================================
    // HTML要素の取得
    // =====================================

    const form = document.getElementById(
        "forgotPasswordForm"
    );

    const emailInput = document.getElementById(
        "email"
    );

    const submitButton = document.getElementById(
        "forgotPasswordButton"
    );

    const buttonText = document.getElementById(
        "forgotPasswordButtonText"
    );

    const errorElement = document.getElementById(
        "forgotPasswordError"
    );

    const successElement = document.getElementById(
        "forgotPasswordSuccess"
    );

    const successText = document.getElementById(
        "forgotPasswordSuccessText"
    );

    if (!form || !emailInput || !submitButton) {
        return;
    }

    // =====================================
    // バックエンドAPIのURL
    // =====================================

    const API_URL = "../../backend/forgot-password.php";

    // =====================================
    // エラー表示
    // =====================================

    function showError(message) {

        errorElement.textContent = message;
        errorElement.hidden = false;

        successElement.hidden = true;
    }

    function clearMessages() {

        errorElement.textContent = "";
        errorElement.hidden = true;

        successElement.hidden = true;
    }

    // =====================================
    // フォーム送信
    // =====================================

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        clearMessages();

        // =====================================
        // 入力値取得
        // =====================================

        const email = emailInput.value.trim();

        // =====================================
        // 入力チェック
        // =====================================

        if (!email) {

            showError(
                "メールアドレスを入力してください。"
            );

            emailInput.focus();
            return;
        }

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {

            showError(
                "正しいメールアドレスを入力してください。"
            );

            emailInput.focus();
            return;
        }

        // =====================================
        // 二重送信防止
        // =====================================

        if (submitButton.disabled) {
            return;
        }

        submitButton.disabled = true;
        buttonText.textContent = "送信中...";

        // =====================================
        // PHPへJSON送信
        // =====================================

        try {

            const response = await fetch(API_URL, {

                method: "POST",

                credentials: "same-origin",

                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },

                body: JSON.stringify({
                    email: email
                })

            });

            // =====================================
            // PHPからのレスポンス
            // =====================================

            const result = await response.json();

            if (!response.ok || result.success !== true) {

                throw new Error(
                    result.message ||
                    result.comment ||
                    "再設定のリクエストに失敗しました。"
                );

            }

            // =====================================
            // 成功時の表示
            // =====================================

            successText.textContent =
                "入力されたメールアドレスに対応するアカウントがある場合、" +
                "パスワード再設定用のメールをお送りします。";

            successElement.hidden = false;

            // 送信後はメールアドレスを保持
            // 再送信したい場合にも利用できる

        } catch (error) {

            console.error(
                "パスワード再設定エラー:",
                error
            );

            showError(
                error.message ||
                "サーバーとの通信に失敗しました。"
            );

        } finally {

            submitButton.disabled = false;
            buttonText.textContent =
                "再設定用メールを送信";

        }

    });

});
