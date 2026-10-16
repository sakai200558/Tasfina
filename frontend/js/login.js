
/* ========================================
   Tasfina ログイン画面専用JavaScript
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    const togglePassword = document.getElementById("togglePassword");

    const loginError = document.getElementById("loginError");
    const loginButton = document.getElementById("loginButton");


    // =====================================
    // エラーメッセージ表示
    // =====================================

    function showError(message) {
        loginError.textContent = message;
        loginError.hidden = false;
    }

    function clearError() {
        loginError.textContent = "";
        loginError.hidden = true;
    }


    // =====================================
    // パスワード表示・非表示切替
    // =====================================

    togglePassword.addEventListener("click", () => {

        const isHidden = passwordInput.type === "password";

        passwordInput.type = isHidden ? "text" : "password";

        togglePassword.setAttribute(
            "aria-pressed",
            String(isHidden)
        );

        togglePassword.setAttribute(
            "aria-label",
            isHidden
                ? "パスワードを隠す"
                : "パスワードを表示"
        );

    });


    // =====================================
    // ログイン処理
    // =====================================

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        clearError();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // メールアドレス未入力
        if (email === "") {
            showError("メールアドレスを入力してください。");
            emailInput.focus();
            return;
        }

        // メールアドレス形式チェック
        if (!emailInput.validity.valid) {
            showError("正しいメールアドレスを入力してください。");
            emailInput.focus();
            return;
        }

        // パスワード未入力
        if (password === "") {
            showError("パスワードを入力してください。");
            passwordInput.focus();
            return;
        }

        // バックエンド未接続のため、認証は行わない
        showError(
            "現在ログイン機能を準備中です。画面の表示と入力チェックのみ確認できます。"
        );

    });

});
