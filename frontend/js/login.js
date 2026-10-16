/* ========================================
   Tasfina ログイン専用JavaScript
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");
    const loginError = document.getElementById("loginError");
    const loginButton = document.getElementById("loginButton");

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

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        // エラー表示を初期化
        loginError.hidden = true;
        loginError.textContent = "";

        email.classList.remove("is-invalid");
        password.classList.remove("is-invalid");

        let isValid = true;

        // メールアドレスの入力チェック
        if (!email.validity.valid) {

            email.classList.add("is-invalid");
            isValid = false;

        }

        // パスワードの入力チェック
        if (!password.value.trim()) {

            password.classList.add("is-invalid");
            isValid = false;

        }

        if (!isValid) {
            return;
        }

        /* =====================================
           PHPへログインリクエスト送信
        ===================================== */

        loginButton.disabled = true;
        loginButton.textContent = "ログイン中...";

        try {

            const response = await fetch(
                "../../backend/login.php",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email: email.value.trim(),
                        password: password.value
                    })
                }
            );

            if (!response.ok) {
                throw new Error("サーバーエラーが発生しました。");
            }

            const result = await response.json();

            /* =====================================
               ログイン成功
            ===================================== */

            if (result.success === true) {

                window.location.href = "mypage.html";

            } else {

                loginError.textContent =
                    result.message || "ログインに失敗しました。";

                loginError.hidden = false;

            }

        } catch (error) {

            console.error("ログインエラー:", error);

            loginError.textContent =
                "サーバーとの通信に失敗しました。";

            loginError.hidden = false;

        } finally {

            loginButton.disabled = false;
            loginButton.textContent = "ログイン";

        }

    });

    /* =====================================
       入力時にエラー表示を解除
    ===================================== */

    [email, password].forEach(input => {

        input.addEventListener("input", () => {

            input.classList.remove("is-invalid");

            loginError.hidden = true;

        });

    });

});