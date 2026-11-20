
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
       バックエンドAPI
    ===================================== */

    const API_URL = "../../backend/groups-new.php";


    /* =====================================
       選択中の部門カラーを取得
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


    /* =====================================
       文字数カウントイベント
    ===================================== */

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

                    const matches =
                        name.includes(keyword);

                    option.classList.toggle(
                        "is-hidden",
                        !matches
                    );

                });

        });

    }


    /* =====================================
       フォーム初期化
    ===================================== */

    function resetDepartmentForm() {

        form.reset();

        // 文字数カウントを初期化
        updateCharacterCount();

        // メンバー検索結果を再表示
        document.querySelectorAll(".member-option")
            .forEach(option => {

                option.classList.remove("is-hidden");

            });

    }


    /* =====================================
       部門追加（API通信）
    ===================================== */

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

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

        const members =
            getSelectedMembers();

        const manager =
            managerSelect.value;

        const parentDepartment =
            parentSelect.value;

        const description =
            descriptionInput.value.trim();

        const icon =
            iconSelect.value;

        const color =
            getSelectedColor();


        /* =====================================
           PHPに送信するJSONデータ
        ===================================== */

        const departmentData = {

            name: departmentName,

            parentDepartment: parentDepartment,

            description: description,

            icon: icon,

            color: color,

            manager: manager,

            members: members

        };


        /* =====================================
           登録確認
        ===================================== */

        const parentName =
            parentSelect.options[
                parentSelect.selectedIndex
            ].text;

        const message =
            `以下の内容で部門を作成しますか？\n\n` +
            `部門名：${departmentName}\n` +
            `上位部門：${parentName}\n` +
            `管理者：${manager || "未設定"}\n` +
            `メンバー数：${members.length}名`;

        if (!window.confirm(message)) {
            return;
        }


        /* =====================================
           二重送信防止
        ===================================== */

        if (submitButton?.disabled) {
            return;
        }

        const originalButtonHTML =
            submitButton?.innerHTML || "";

        if (submitButton) {

            submitButton.disabled = true;

            submitButton.textContent = "登録中...";

        }


        /* =====================================
           PHPへJSON形式でPOST送信
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
               PHPからのレスポンス取得
            ===================================== */

            const result = await response.json();


            /* =====================================
               HTTPエラー確認
            ===================================== */

            if (!response.ok) {

                throw new Error(
                    result.message ||
                    result.comment ||
                    "部門の登録に失敗しました。"
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

                // フォームを初期化
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
               ボタンを元の状態に戻す
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
