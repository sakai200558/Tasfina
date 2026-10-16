
/* ========================================
   Tasfina ログイン専用JavaScript
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");
    const loginError = document.getElementById("loginError");

    /* =====================================
       パスワード表示切り替え
    ===================================== */

    togglePassword.addEventListener("click", () => {

        const isHidden = password.type === "password";

        password.type = isHidden ? "text" : "password";

        togglePassword.setAttribute(
            "aria-pressed",
            String(isHidden)
        );

        togglePassword.setAttribute(
            "aria-label",
            isHidden ? "パスワードを隠す" : "パスワードを表示"
        );

        togglePassword.querySelector("i").className =
            isHidden ? "bi bi-eye-slash" : "bi bi-eye";

    });

    /* =====================================
       ログインフォーム
    ===================================== */

    loginForm.addEventListener("submit", (event) => {

        event.preventDefault();

        // 前回のエラーを初期化
        loginError.hidden = true;
        loginError.textContent = "";

        email.classList.remove("is-invalid");
        password.classList.remove("is-invalid");

        let isValid = true;

        // メールアドレス
        if (!email.validity.valid) {

            email.classList.add("is-invalid");
            isValid = false;

        }

        // パスワード
        if (!password.value.trim()) {

            password.classList.add("is-invalid");
            isValid = false;

        }

        if (!isValid) {
            return;
        }

        // バックエンド接続前の仮処理
        loginError.textContent =
            "入力内容を確認しました。ログイン認証機能は現在開発中です。";

        loginError.hidden = false;

        // TODO:
        // バックエンドAPIにメールアドレスと
        // パスワードを送信して認証する

    });

    /* =====================================
       入力時にエラー表示を解除
    ===================================== */

    [email, password].forEach(input => {

        input.addEventListener("input", () => {
            input.classList.remove("is-invalid");
        });

    });

});
