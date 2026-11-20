
/* ========================================
   Tasfina 部門追加専用JavaScript
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================
       HTML要素の取得
    ===================================== */

    const form =
        document.getElementById("departmentForm");

    if (!form) {
        return;
    }

    const nameInput =
        document.getElementById("departmentName");

    const parentSelect =
        document.getElementById("parentDepartment");

    const descriptionInput =
        document.getElementById("departmentDescription");

    const iconSelect =
        document.getElementById("departmentIcon");

    const managerSelect =
        document.getElementById("departmentManager");

    const memberSearch =
        document.getElementById("memberSearch");

    const nameCount =
        document.getElementById("nameCount");

    const descriptionCount =
        document.getElementById("descriptionCount");

    const submitButton = form.querySelector(
        'button[type="submit"]'
    );

    const memberCheckboxes = document.querySelectorAll(
        "#memberList input[type='checkbox']"
    );

    /* =====================================
       バックエンドAPIのURL
    ===================================== */

    const API_URL = "../../backend/bumontuika.php";


    /* =====================================
       選択中の部門カラー取得
    ===================================== */

    function getSelectedColor() {

        const selectedRadio = document.querySelector(
            "input[name='departmentColor']:checked"
        );

        return selectedRadio?.value || "blue";

    }


    /* =====================================
       選択メンバー取得
    ===================================== */

    function getSelectedMembers() {

        return Array.from(memberCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);

    }


    /* =====================================
       文字数カウント
    ===================================== */

    function updateCharacterCount() {

        if (nameCount) {

            nameCount.textContent =
                Array.from(nameInput.value).length;

        }

        if (descriptionCount) {

            descriptionCount.textContent =
                Array.from(descriptionInput.value).length;

        }

    }

    nameInput.addEventListener(
        "input",
        updateCharacterCount
    );

    descriptionInput.addEventListener(
        "input",
        updateCharacterCount
    );


    /* =====================================
       メンバー検索
    ===================================== */

    if (memberSearch) {

        memberSearch.addEventListener("input", () => {

            const keyword = memberSearch.value
                .trim()
                .toLocaleLowerCase("ja");

            document.querySelectorAll(".member-option")
                .forEach(option => {

                    const name = option.textContent
                        .toLocaleLowerCase("ja");

                    option.classList.toggle(
                        "is-hidden",
                        !name.includes(keyword)
                    );

                });

        });

    }


    /* =====================================
       フォーム初期化
    ===================================== */

    function resetDepartmentForm() {

        form.reset();

        updateCharacterCount();

        if (memberSearch) {
            memberSearch.value = "";
        }

        document.querySelectorAll(".member-option")
            .forEach(option => {

                option.classList.remove("is-hidden");

            });

    }


    /* =====================================
       部門追加処理
    ===================================== */

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        // 二重送信防止
        if (submitButton?.disabled) {
            return;
        }

        /* =====================================
           入力チェック
        ===================================== */

        if (!form.reportValidity()) {
            return;
        }

        const departmentName =
            nameInput.value.trim();

        if (!departmentName) {

            nameInput.setCustomValidity(
                "部門名を入力してください"
            );

            nameInput.reportValidity();

            nameInput.setCustomValidity("");

            return;
        }

        /* =====================================
           入力値取得
        ===================================== */

        const parentDepartment =
            parentSelect.value;

        const description =
            descriptionInput.value.trim();

        const color =
            getSelectedColor();

        const icon =
            iconSelect.value;

        const manager =
            managerSelect.value;

        const members =
            getSelectedMembers();


        /* =====================================
           PHPへ送信するデータ
        ===================================== */

        const departmentData = {

            name: departmentName,

            parentDepartment: parentDepartment,

            description: description,

            color: color,

            icon: icon,

            manager: manager,

            members: members

        };


        /* =====================================
           登録確認
        ===================================== */

        const parentName =
            parentSelect.options[
                parentSelect.selectedIndex
            ].text.trim();

        const message =
            `以下の内容で部門を作成しますか？\n\n` +
            `部門名：${departmentName}\n` +
            `上位部門：${parentName}\n` +
            `部門カラー：${color}\n` +
            `部門アイコン：${icon}\n` +
            `管理者：${manager || "未設定"}\n` +
            `メンバー数：${members.length}名`;

        if (!window.confirm(message)) {
            return;
        }


        /* =====================================
           送信ボタン無効化
        ===================================== */

        const originalButtonHTML =
            submitButton?.innerHTML || "";

        if (submitButton) {

            submitButton.disabled = true;

            submitButton.textContent = "登録中...";

        }


        /* =====================================
           PHPへPOST送信
        ===================================== */

        try {

            const response = await fetch(API_URL, {

                method: "POST",

                credentials: "same-origin",

                headers: {

                    "Content-Type": "application/json",

                    "Accept": "application/json"

                },

                body: JSON.stringify(departmentData)

            });


            /* =====================================
               PHPレスポンス取得
            ===================================== */

            const responseText = await response.text();

            let result;

            try {

                result = JSON.parse(responseText);

            } catch (parseError) {

                console.error(
                    "PHPレスポンス:",
                    responseText
                );

                throw new Error(
                    "サーバーから正しいJSON形式の応答がありませんでした。"
                );

            }


            /* =====================================
               HTTPエラー
            ===================================== */

            if (!response.ok) {

                throw new Error(
                    result.message ||
                    result.comment ||
                    `登録に失敗しました。（HTTP ${response.status}）`
                );

            }


            /* =====================================
               登録成功
            ===================================== */

            if (result.success === true) {

                alert(
                    result.message ||
                    result.comment ||
                    "部門を正常に登録しました。"
                );

                resetDepartmentForm();

            } else {

                throw new Error(
                    result.message ||
                    result.comment ||
                    "部門の登録に失敗しました。"
                );

            }

        } catch (error) {

            console.error(
                "部門追加エラー:",
                error
            );

            alert(
                error.message ||
                "サーバーとの通信に失敗しました。"
            );

        } finally {

            /* =====================================
               送信ボタン復元
            ===================================== */

            if (submitButton) {

                submitButton.disabled = false;

                submitButton.innerHTML =
                    originalButtonHTML;

            }

        }

    });


    /* =====================================
       初期表示
    ===================================== */

    updateCharacterCount();

});
