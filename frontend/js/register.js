
/* ========================================
   Tasfina 新規登録画面
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ========================================
       要素の取得
    ======================================== */

    const registerForm = document.getElementById("registerForm");

    const usernameInput = document.getElementById("username");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const passwordConfirmInput = document.getElementById("passwordConfirm");
    const deptCodeInput = document.getElementById("deptCode");
    const specialCodeInput = document.getElementById("specialCode");

    const registerButton = document.getElementById("registerButton");
    const registerError = document.getElementById("registerError");

    /* ========================================
       エラーメッセージ表示
    ======================================== */

    function showError(message) {
        registerError.textContent = message;
        registerError.hidden = false;
    }

    function clearError() {
        registerError.textContent = "";
        registerError.hidden = true;
    }

    /* ========================================
       パスワード表示・非表示切り替え
    ======================================== */

    const passwordToggleButtons = document.querySelectorAll(
        ".register-password-toggle"
    );

    passwordToggleButtons.forEach(button => {

        button.addEventListener("click", () => {

            const targetId = button.dataset.target;
            const targetInput = document.getElementById(targetId);

            if (!targetInput) {
                return;
            }

            const isPassword = targetInput.type === "password";

            targetInput.type = isPassword ? "text" : "password";

            button.setAttribute(
                "aria-pressed",
                String(isPassword)
            );

            button.setAttribute(
                "aria-label",
                isPassword
                    ? "パスワードを非表示"
                    : "パスワードを表示"
            );

            const icon = button.querySelector("i");

            if (icon) {
                icon.className = isPassword
                    ? "bi bi-eye-slash"
                    : "bi bi-eye";
            }

        });

    });

    /* ========================================
       新規登録フォーム送信
    ======================================== */

    registerForm.addEventListener("submit", async (event) => {

        // 通常のフォーム送信を停止
        event.preventDefault();

        clearError();

        /* ========================================
           入力値の取得
        ======================================== */

        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const passwordConfirm = passwordConfirmInput.value;
        const deptCode = deptCodeInput.value.trim();
        const specialCode = specialCodeInput.value.trim();

        /* ========================================
           入力チェック
        ======================================== */

        if (!username) {
            showError("ユーザー名を入力してください。");
            usernameInput.focus();
            return;
        }

        if (!email) {
            showError("メールアドレスを入力してください。");
            emailInput.focus();
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            showError("正しいメールアドレスを入力してください。");
            emailInput.focus();
            return;
        }

        if (!password) {
            showError("パスワードを入力してください。");
            passwordInput.focus();
            return;
        }

        if (password.length < 8) {
            showError("パスワードは8文字以上で入力してください。");
            passwordInput.focus();
            return;
        }

        if (password !== passwordConfirm) {
            showError("パスワードが一致していません。");
            passwordConfirmInput.focus();
            return;
        }

        /* ========================================
           PHPに送信するJSONデータ
        ======================================== */

        const registerData = {
            username: username,
            email: email,
            password: password,
            deptCode: deptCode,
            specialCode: specialCode
        };

        /* ========================================
           二重送信防止
        ======================================== */

        registerButton.disabled = true;
        registerButton.textContent = "登録中...";

        /* ========================================
           register.phpへPOST送信
        ======================================== */

        try {

            const response = await fetch(
                "../../backend/register.php",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },

                    body: JSON.stringify(registerData)
                }
            );

            /* ========================================
               PHPからのJSONレスポンス
            ======================================== */

            const result = await response.json();

            if (!response.ok) {
                showError(
                    result.message || "登録処理に失敗しました。"
                );
                return;
            }

            /* ========================================
               登録成功
            ======================================== */

            if (result.success === true) {

    // 登録成功後はログイン画面へ
    window.location.href = "login.html";

} else {

    showError(
        result.comment || "新規登録に失敗しました。"
    );

}

        } catch (error) {

            console.error("新規登録エラー:", error);

            showError(
                "サーバーとの通信に失敗しました。時間をおいて再度お試しください。"
            );

        } finally {

            // 送信ボタンを元に戻す
            registerButton.disabled = false;
            registerButton.textContent = "新規アカウント登録";

        }

    });

});
