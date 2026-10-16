
/* ========================================
   Tasfina 部門追加専用JavaScript
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    // =====================================
    // HTML要素の取得
    // =====================================

    const form = document.getElementById("departmentForm");

    const nameInput = document.getElementById("departmentName");
    const parentSelect = document.getElementById("parentDepartment");
    const descriptionInput = document.getElementById("departmentDescription");
    const iconSelect = document.getElementById("departmentIcon");
    const managerSelect = document.getElementById("departmentManager");
    const memberSearch = document.getElementById("memberSearch");

    const memberCheckboxes = document.querySelectorAll(
        "#memberList input[type='checkbox']"
    );

    const colorRadios = document.querySelectorAll(
        "input[name='departmentColor']"
    );

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

        // 部門名
        document.getElementById("previewDepartmentName")
            .textContent = departmentName || "部門名";

        // 管理者
        document.getElementById("previewManager")
            .textContent = managerName;

        // メンバー数
        document.getElementById("previewMemberCount")
            .textContent = `${members.length}名`;

        // 部門アイコン
        document.getElementById("previewIcon")
            .className = `bi ${iconClass}`;

        // 部門カラー
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

        // 確認欄
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

        // 選択した上位部門を強調
        document.querySelectorAll(".org-department")
            .forEach(department => {
                department.classList.toggle(
                    "parent-selected",
                    department.dataset.dept === parentSelect.value
                );
            });

        // 文字数更新
        updateCharacterCount();
    }

    // =====================================
    // メンバー検索
    // =====================================

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
    // 部門追加（デモ処理）
    // =====================================

    form.addEventListener("submit", event => {

        event.preventDefault();

        if (!form.reportValidity()) {
            return;
        }

        const departmentName = nameInput.value.trim();

        if (!departmentName) {
            nameInput.setCustomValidity("部門名を入力してください");
            nameInput.reportValidity();
            nameInput.setCustomValidity("");
            return;
        }

        const members = getSelectedMembers();
        const manager = managerSelect.value;

        const message =
            `以下の内容で部門を作成しますか？\n\n` +
            `部門名：${departmentName}\n` +
            `上位部門：${parentSelect.options[parentSelect.selectedIndex].text}\n` +
            `管理者：${manager || "未設定"}\n` +
            `メンバー数：${members.length}名`;

        if (!window.confirm(message)) {
            return;
        }

        // 現段階ではAPI通信を行わない
        alert(
            "部門追加のデモ処理が完了しました。\n" +
            "実際のデータベースには登録されていません。"
        );

    });

    // 初期表示
    updatePreview();

});
