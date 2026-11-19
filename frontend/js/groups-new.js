
/* ========================================
   Tasfina 部門追加専用JavaScript
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    // =====================================
    // HTML要素の取得
    // =====================================

    const form = document.getElementById("departmentForm");

    if (!form) {
        return;
    }

    const nameInput = document.getElementById("departmentName");
    const parentSelect = document.getElementById("parentDepartment");
    const descriptionInput = document.getElementById("departmentDescription");
    const iconSelect = document.getElementById("departmentIcon");
    const managerSelect = document.getElementById("departmentManager");
    const memberSearch = document.getElementById("memberSearch");

    const submitButton = form.querySelector(
        'button[type="submit"]'
    );

    const memberCheckboxes = document.querySelectorAll(
        "#memberList input[type='checkbox']"
    );

    const colorRadios = document.querySelectorAll(
        "input[name='departmentColor']"
    );

    // =====================================
    // バックエンドAPIのURL
    // =====================================

    const API_URL = "../../backend/groups-new.php";

    // =====================================
    // カラー設定
    // =====================================

    const colorSettings = {
        blue: {
            accent: "#0866d8",
            tint: "#eaf4ff"
        },
        green: {
            accent: "#32b985",
            tint: "#e2f8ee"
        },
        yellow: {
            accent: "#e7a923",
            tint: "#fff4d4"
        },
        orange: {
            accent: "#f58235",
            tint: "#fff0e2"
        },
        red: {
            accent: "#ef5969",
            tint: "#ffe8eb"
        },
        purple: {
            accent: "#9b65ce",
            tint: "#f3e9ff"
        },
        gray: {
            accent: "#8492a6",
            tint: "#edf1f5"
        }
    };

    function getSelectedColor() {
        return document.querySelector(
            "input[name='departmentColor']:checked"
        )?.value || "blue";
    }

    // =====================================
    // 選択メンバー取得
    // =====================================

    function getSelectedMembers() {
        return Array.from(memberCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);
    }

    // =====================================
    // 文字数カウント
    // =====================================

    function updateCharacterCount() {
        document.getElementById("nameCount").textContent =
            Array.from(nameInput.value).length;

        document.getElementById("descriptionCount").textContent =
            Array.from(descriptionInput.value).length;
    }

    // =====================================
    // 組織図・確認欄の更新
    // =====================================

    function updatePreview() {

        const departmentName = nameInput.value.trim();

        const parentName =
            parentSelect.options[parentSelect.selectedIndex].text;

        const managerName =
            managerSelect.value || "管理者未設定";

        const members = getSelectedMembers();
        const selectedColor = getSelectedColor();
        const color = colorSettings[selectedColor];

        const iconClass = iconSelect.value;

        const iconName =
            iconSelect.options[iconSelect.selectedIndex].text
                .replace("（デフォルト）", "");

        document.getElementById("previewDepartmentName")
            .textContent = departmentName || "部門名";

        document.getElementById("previewManager")
            .textContent = managerName;

        document.getElementById("previewMemberCount")
            .textContent = `${members.length}名`;

        document.getElementById("previewIcon")
            .className = `bi ${iconClass}`;

        const preview = document.getElementById(
            "newDepartmentPreview"
        );

        preview.style.setProperty(
            "--department-accent",
            color.accent
        );

        preview.style.setProperty(
            "--department-tint",
            color.tint
        );

        document.getElementById("confirmName")
            .textContent = departmentName || "—";

        document.getElementById("confirmParent")
            .textContent = parentName;

        document.getElementById("confirmColor")
            .style.backgroundColor = color.accent;

        document.getElementById("confirmIcon")
            .className = `bi ${iconClass}`;

        document.getElementById("confirmIconName")
            .textContent = iconName;

        document.getElementById("confirmManager")
            .textContent = managerSelect.value || "—";

        document.getElementById("confirmMemberCount")
            .textContent = `${members.length}名`;

        document.querySelectorAll(".org-department")
            .forEach(department => {
                department.classList.toggle(
                    "parent-selected",
                    department.dataset.dept === parentSelect.value
                );
            });

        updateCharacterCount();
    }

    // =====================================
    // メンバー検索
    // =====================================

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

    // =====================================
    // 入力変更イベント
    // =====================================

    [
        nameInput,
        parentSelect,
        descriptionInput,
        iconSelect,
        managerSelect
    ].forEach(element => {

        element.addEventListener("input", updatePreview);
        element.addEventListener("change", updatePreview);

    });

    colorRadios.forEach(radio => {
        radio.addEventListener("change", updatePreview);
    });

    memberCheckboxes.forEach(checkbox => {
        checkbox.addEventListener("change", updatePreview);
    });

    // =====================================
    // 部門追加（API通信）
    // =====================================

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        if (!form.reportValidity()) {
            return;
        }

        const departmentName = nameInput.value.trim();

        if (!departmentName) {

            nameInput.setCustomValidity(
                "部門名を入力してください"
            );

            nameInput.reportValidity();
            nameInput.setCustomValidity("");

            return;
        }

        const members = getSelectedMembers();
        const manager = managerSelect.value;

        // =====================================
        // 送信するJSONデータ
        // =====================================

        const departmentData = {
            name: departmentName,
            parentDepartment: parentSelect.value,
            description: descriptionInput.value.trim(),
            icon: iconSelect.value,
            color: getSelectedColor(),
            manager: manager,
            members: members
        };

        // =====================================
        // 登録確認
        // =====================================

        const message =
            `以下の内容で部門を作成しますか？\n\n` +
            `部門名：${departmentName}\n` +
            `上位部門：${parentSelect.options[parentSelect.selectedIndex].text}\n` +
            `管理者：${manager || "未設定"}\n` +
            `メンバー数：${members.length}名`;

        if (!window.confirm(message)) {
            return;
        }

        // =====================================
        // 二重送信防止
        // =====================================

        if (submitButton?.disabled) {
            return;
        }

        const originalButtonText =
            submitButton?.textContent || "";

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "登録中...";
        }

        // =====================================
        // PHPへJSON形式でPOST送信
        // =====================================

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

            // =====================================
            // PHPからのレスポンス取得
            // =====================================

            const result = await response.json();

            // =====================================
            // HTTPエラー
            // =====================================

            if (!response.ok) {

                throw new Error(
                    result.message ||
                    result.comment ||
                    "部門の登録に失敗しました。"
                );
            }

            // =====================================
            // 登録成功
            // =====================================

            if (result.success === true) {

                alert(
                    result.message ||
                    result.comment ||
                    "部門を正常に登録しました。"
                );

                // フォームを初期化
                form.reset();

                // プレビューを更新
                updatePreview();

            } else {

                throw new Error(
                    result.message ||
                    result.comment ||
                    "部門の登録に失敗しました。"
                );

            }

        } catch (error) {

            console.error("部門追加エラー:", error);

            alert(
                error.message ||
                "サーバーとの通信に失敗しました。"
            );

        } finally {

            // ボタンを元の状態に戻す
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }

        }

    });

    // =====================================
    // 初期表示
    // =====================================

    updatePreview();

});
