
/* ========================================
   Tasfina 新規登録画面専用JavaScript
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    const registerForm = document.getElementById("registerForm");

    const usernameInput = document.getElementById("username");
    const emailInput = document.getElementById("email");

    const passwordInput = document.getElementById("password");
    const passwordConfirmInput =
        document.getElementById("passwordConfirm");

    const deptCodeInput = document.getElementById("deptCode");
    const specialCodeInput = document.getElementById("specialCode");

    const registerError = document.getElementById("registerError");


    // =====================================
    // エラー表示
    // =====================================

    function showError(message) {
        registerError.textContent = message;
        registerError.hidden = false;
    }

    function clearError() {
        registerError.textContent = "";
        registerError.hidden = true;
    }


    // =====================================
    // パスワード表示切替
    // =====================================

    document.querySelectorAll(".register-password-toggle")
        .forEach(button => {

            button.addEventListener("click", () => {

                const targetId = button.dataset.target;
                const input = document.getElementById(targetId);

                const isHidden = input.type === "password";

                input.type = isHidden ? "text" : "password";

                const icon = button.querySelector("i");

                icon.className = isHidden
                    ? "bi bi-eye-slash"
                    : "bi bi-eye";

                button.setAttribute(
                    "aria-pressed",
                    String(isHidden)
                );

                button.setAttribute(
                    "aria-label",
                    isHidden
                        ? "パスワードを隠す"
                        : "パスワードを表示"
                );

            });

        });


    // =====================================
    // 新規登録処理
    // =====================================

    registerForm.addEventListener("submit", (event) => {

        event.preventDefault();

        clearError();

        // 入力値取得
        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();

        const password = passwordInput.value;
        const passwordConfirm = passwordConfirmInput.value;

        const deptCode = deptCodeInput.value.trim();
        const specialCode = specialCodeInput.value.trim();


        // ユーザー名チェック
        if (username === "") {
            showError("ユーザー名を入力してください。");
            usernameInput.focus();
            return;
        }

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

        // 半角英数字8文字以上
        const passwordPattern = /^[a-zA-Z0-9]{8,}$/;

        if (!passwordPattern.test(password)) {
            showError(
                "パスワードは半角英数字8文字以上で入力してください。"
            );
            passwordInput.focus();
            return;
        }

        // 確認用パスワード未入力
        if (passwordConfirm === "") {
            showError("確認用パスワードを入力してください。");
            passwordConfirmInput.focus();
            return;
        }

        // パスワード一致チェック
        if (password !== passwordConfirm) {
            showError("パスワードが一致していません。");
            passwordConfirmInput.focus();
            return;
        }

        // =====================================
        // バックエンド連携予定
        // =====================================

        // 今後、ここで登録APIへ送信する
        // 例：
        // POST /api/register
        //
        // {
        //   username,
        //   email,
        //   password,
        //   dept_code: deptCode,
        //   special_code: specialCode
        // }

        // 現在は認証・登録API未接続
        showError(
            "現在、新規登録機能を準備中です。入力チェックのみ確認できます。"
        );

    });

});
