
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


    /* ========================================
       コピー結果メッセージ
    ======================================== */

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


    /* ========================================
       所属部門コードのコピー処理
    ======================================== */

    if (copyButton) {

        copyButton.addEventListener("click", async () => {

            const deptCode =
                copyButton.dataset.code || "";

            if (!deptCode) {

                showCopyMessage(
                    "コピーできる所属部門コードがありません"
                );

                return;
            }

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

    /*
       プロフィール編集モーダルの処理は
       profile-edit.js に任せます。

       ここではクリックイベントを
       重複登録しません。
    */

});


/* ========================================
   所属部門表示の更新
======================================== */

function updateMyPageDepartment(user) {

    const departmentElement =
        document.getElementById("mypageDepartment");

    const copyButton =
        document.getElementById("copyDeptCode");

    if (!departmentElement) {
        return;
    }

    const departmentName =
        String(user.department_name ?? "").trim();

    const departmentCode =
        String(user.department_code ?? "").trim();


    /* ========================================
       所属部門がある場合
    ======================================== */

    if (departmentName || departmentCode) {

        departmentElement.textContent =
            departmentName
                ? `所属部門：${departmentName}`
                : `所属部門コード：${departmentCode}`;

        if (copyButton) {

            copyButton.dataset.code =
                departmentCode;

            copyButton.hidden =
                !departmentCode;

        }

        return;
    }


    /* ========================================
       所属部門がない場合
    ======================================== */

    departmentElement.textContent =
        "所属部門：未所属";

    if (copyButton) {

        copyButton.dataset.code = "";

        copyButton.hidden = true;

    }

}


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

    const departmentElement =
        document.getElementById("mypageDepartment");

    const copyButton =
        document.getElementById("copyDeptCode");

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
                `ユーザー情報の取得に失敗しました。HTTP ${response.status}`
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

        const user = result.user;


        /* =====================================
           ユーザー名表示
        ===================================== */

        nameElement.textContent =
            user.name || "名前未設定";


        /* =====================================
           メールアドレス表示
        ===================================== */

        emailElement.textContent =
            user.email || "メールアドレス未設定";


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

            const roleCode =
                String(user.role_code ?? "");

            const roleName =
                roleNames[roleCode] || "権限未設定";

            const jobTitle =
                user.job_title;

            roleElement.textContent =
                jobTitle
                    ? `${jobTitle}／${roleName}`
                    : roleName;

        }


        /* =====================================
           所属部門表示
        ===================================== */

        updateMyPageDepartment(user);


        console.log(
            "ユーザー情報取得成功:",
            user
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

        if (departmentElement) {

            departmentElement.textContent =
                "所属部門：取得できませんでした";

        }

        if (copyButton) {

            copyButton.dataset.code = "";

            copyButton.hidden = true;

        }

    }

}
