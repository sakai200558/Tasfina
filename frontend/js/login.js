
/* ========================================
   Tasfina ログイン処理
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ========================================
       要素取得
    ======================================== */

    const loginForm = document.getElementById("loginForm");

    const emailInput = document.getElementById("email");

    const passwordInput = document.getElementById("password");

    const togglePassword = document.getElementById("togglePassword");

    const loginError = document.getElementById("loginError");

    const loginButton = document.getElementById("loginButton");


    /* ========================================
       エラー表示
    ======================================== */

    function showError(message) {

        loginError.textContent = message;

        loginError.hidden = false;
    }


    /* ========================================
       エラーを消す
    ======================================== */

    function clearError() {

        loginError.textContent = "";

        loginError.hidden = true;

        emailInput.classList.remove("is-invalid");

        passwordInput.classList.remove("is-invalid");
    }


    /* ========================================
       パスワード表示切り替え
    ======================================== */

    togglePassword.addEventListener("click", () => {

        const isPassword =
            passwordInput.type === "password";

        passwordInput.type = isPassword
            ? "text"
            : "password";

        togglePassword.setAttribute(
            "aria-pressed",
            String(isPassword)
        );

        togglePassword.setAttribute(
            "aria-label",
            isPassword
                ? "パスワードを隠す"
                : "パスワードを表示"
        );

        const icon = togglePassword.querySelector("i");

        icon.className = isPassword
            ? "bi bi-eye-slash"
            : "bi bi-eye";

    });


    /* ========================================
       ログインフォーム送信
    ======================================== */

    loginForm.addEventListener("submit", async (event) => {

        // 通常のフォーム送信を停止
        event.preventDefault();

        clearError();


        /* ========================================
           入力値取得
        ======================================== */

        const email = emailInput.value.trim();

        const password = passwordInput.value;


        /* ========================================
           入力チェック
        ======================================== */

        if (!emailInput.validity.valid) {

            emailInput.classList.add("is-invalid");

            showError(
                "正しいメールアドレスを入力してください。"
            );

            return;
        }

        if (!password) {

            passwordInput.classList.add("is-invalid");

            showError(
                "パスワードを入力してください。"
            );

            return;
        }


        /* ========================================
           JSON形式に変換
        ======================================== */

        const loginData = {
            email: email,
            password: password
        };


        /* ========================================
           ログインボタンを無効化
        ======================================== */

        loginButton.disabled = true;

        loginButton.textContent = "ログイン中...";


        /* ========================================
           PHPにJSONを送信
        ======================================== */

        try {

            const response = await fetch(
                "../../backend/login.php",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },

                    credentials: "same-origin",

                    body: JSON.stringify(loginData)
                }
            );


            /* ========================================
               PHPのレスポンスを取得
            ======================================== */

            const result = await response.json();


            /* ========================================
               ログイン成功
            ======================================== */

            if (response.ok && result.login === true) {

                window.location.href = "mypage.html";

                return;
            }


            /* ========================================
               ログイン失敗
            ======================================== */

            showError(
                result.message ||
                "メールアドレスまたはパスワードが違います。"
            );

        } catch (error) {

            console.error("ログインエラー:", error);

            showError(
                "サーバーとの通信に失敗しました。"
            );

        } finally {

            loginButton.disabled = false;

            loginButton.textContent = "ログイン";
        }

    });

});
