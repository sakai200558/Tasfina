
/* ========================================
   Tasfina 業務タイプ・倍率編集
======================================== */

document.addEventListener("DOMContentLoaded", async () => {

    const modalContainer = document.getElementById(
        "workTypeEditModalContainer"
    );

    const openButton = document.getElementById(
        "openWorkTypeEditButton"
    );

    if (!modalContainer || !openButton) {
        return;
    }

    /* ========================================
       初期データ
    ======================================== */

    const defaultWorkTypes = [
        {
            id: 1,
            name: "定型・通常",
            multiplier: 1.0,
            enabled: true
        },
        {
            id: 2,
            name: "専門・集中",
            multiplier: 1.2,
            enabled: true
        },
        {
            id: 3,
            name: "高負荷",
            multiplier: 1.3,
            enabled: true
        },
        {
            id: 4,
            name: "突発・緊急",
            multiplier: 1.5,
            enabled: true
        }
    ];

    let workTypes = structuredClone(defaultWorkTypes);

    let editingWorkTypes = [];

    let nextId = 5;

    /* ========================================
       モーダルHTMLの読み込み
    ======================================== */

    try {

        const response = await fetch(
            "../modals/work-type-edit.html"
        );

        if (!response.ok) {
            throw new Error(
                "モーダルHTMLの読み込みに失敗しました。"
            );
        }

        modalContainer.innerHTML =
            await response.text();

    } catch (error) {

        console.error(error);

        return;
    }

    /* ========================================
       要素取得
    ======================================== */

    const modalElement = document.getElementById(
        "workTypeEditModal"
    );

    const tableBody = document.getElementById(
        "workTypeTableBody"
    );

    const addButton = document.getElementById(
        "addWorkTypeButton"
    );

    const saveButton = document.getElementById(
        "saveWorkTypeButton"
    );

    const messageElement = document.getElementById(
        "workTypeMessage"
    );

    if (
        !modalElement ||
        !tableBody ||
        !addButton ||
        !saveButton ||
        !window.bootstrap
    ) {
        console.error(
            "業務タイプ編集モーダルの初期化に失敗しました。"
        );
        return;
    }

    const modal = bootstrap.Modal.getOrCreateInstance(
        modalElement
    );

    /* ========================================
       メッセージ表示
    ======================================== */

    function showMessage(message, type = "danger") {

        messageElement.textContent = message;

        messageElement.className =
            `alert alert-${type}`;

    }

    function clearMessage() {

        messageElement.textContent = "";

        messageElement.className = "alert d-none";

    }

    /* ========================================
       HTML生成用
    ======================================== */

    function createInput(type, className, value) {

        const input = document.createElement("input");

        input.type = type;

        input.className = className;

        input.value = value;

        return input;

    }

    /* ========================================
       テーブル描画
    ======================================== */

    function renderTable() {

        tableBody.innerHTML = "";

        editingWorkTypes.forEach((workType) => {

            const row = document.createElement("tr");

            row.dataset.id = String(workType.id);

            /* 業務タイプ名 */

            const nameCell = document.createElement("td");

            const nameInput = createInput(
                "text",
                "form-control work-type-name-input",
                workType.name
            );

            nameInput.maxLength = 30;

            nameInput.required = true;

            nameInput.setAttribute(
                "aria-label",
                "業務タイプ名"
            );

            nameInput.addEventListener("input", () => {

                workType.name = nameInput.value;

            });

            nameCell.appendChild(nameInput);

            /* 倍率 */

            const multiplierCell =
                document.createElement("td");

            const multiplierWrapper =
                document.createElement("div");

            multiplierWrapper.className =
                "work-type-multiplier-wrapper";

            const multiplierInput = createInput(
                "number",
                "form-control work-type-multiplier-input",
                workType.multiplier
            );

            multiplierInput.min = "0.1";

            multiplierInput.max = "10";

            multiplierInput.step = "0.1";

            multiplierInput.required = true;

            multiplierInput.setAttribute(
                "aria-label",
                "業務倍率"
            );

            multiplierInput.addEventListener(
                "input",
                () => {

                    workType.multiplier =
                        multiplierInput.value;

                }
            );

            const multiplierLabel =
                document.createElement("span");

            multiplierLabel.textContent = "倍";

            multiplierWrapper.append(
                multiplierInput,
                multiplierLabel
            );

            multiplierCell.appendChild(
                multiplierWrapper
            );

            /* 有効・無効 */

            const enabledCell =
                document.createElement("td");

            const switchWrapper =
                document.createElement("div");

            switchWrapper.className =
                "form-check form-switch";

            const enabledInput =
                document.createElement("input");

            enabledInput.type = "checkbox";

            enabledInput.className =
                "form-check-input";

            enabledInput.checked =
                workType.enabled;

            enabledInput.id =
                `workTypeEnabled${workType.id}`;

            const enabledLabel =
                document.createElement("label");

            enabledLabel.className =
                "form-check-label";

            enabledLabel.htmlFor =
                enabledInput.id;

            enabledLabel.textContent =
                workType.enabled ? "有効" : "無効";

            enabledInput.addEventListener(
                "change",
                () => {

                    workType.enabled =
                        enabledInput.checked;

                    enabledLabel.textContent =
                        workType.enabled
                            ? "有効"
                            : "無効";

                }
            );

            switchWrapper.append(
                enabledInput,
                enabledLabel
            );

            enabledCell.appendChild(
                switchWrapper
            );

            /* 削除 */

            const deleteCell =
                document.createElement("td");

            const deleteButton =
                document.createElement("button");

            deleteButton.type = "button";

            deleteButton.className =
                "btn btn-outline-danger btn-sm work-type-delete-button";

            deleteButton.innerHTML =
                '<i class="bi bi-trash"></i> 削除';

            deleteButton.addEventListener(
                "click",
                () => {

                    editingWorkTypes =
                        editingWorkTypes.filter(
                            (item) =>
                                item.id !== workType.id
                        );

                    renderTable();

                }
            );

            deleteCell.appendChild(
                deleteButton
            );

            row.append(
                nameCell,
                multiplierCell,
                enabledCell,
                deleteCell
            );

            tableBody.appendChild(row);

        });

    }

    /* ========================================
       モーダルを開く
    ======================================== */

    openButton.addEventListener("click", () => {

        editingWorkTypes = structuredClone(
            workTypes
        );

        clearMessage();

        renderTable();

        modal.show();

    });

    /* ========================================
       業務タイプ追加
    ======================================== */

    addButton.addEventListener("click", () => {

        editingWorkTypes.push({
            id: nextId++,
            name: "",
            multiplier: 1.0,
            enabled: true
        });

        renderTable();

        const inputs = tableBody.querySelectorAll(
            ".work-type-name-input"
        );

        inputs[inputs.length - 1]?.focus();

    });

    /* ========================================
       入力チェック
    ======================================== */

    function validateWorkTypes() {

        if (editingWorkTypes.length === 0) {

            showMessage(
                "業務タイプを1件以上登録してください。"
            );

            return false;
        }

        const names = new Set();

        for (const workType of editingWorkTypes) {

            const name = String(
                workType.name
            ).trim();

            const multiplier = Number(
                workType.multiplier
            );

            if (!name) {

                showMessage(
                    "業務タイプ名を入力してください。"
                );

                return false;
            }

            if (names.has(name)) {

                showMessage(
                    "同じ名前の業務タイプは登録できません。"
                );

                return false;
            }

            names.add(name);

            if (
                workType.multiplier === "" ||
                !Number.isFinite(multiplier) ||
                multiplier < 0.1 ||
                multiplier > 10 ||
                Math.abs(multiplier * 10 -
                    Math.round(multiplier * 10)) > 1e-8
            ) {

                showMessage(
                    "倍率は0.1～10.0の範囲で、0.1刻みで入力してください。"
                );

                return false;
            }

        }

        return true;

    }

    /* ========================================
       保存処理
    ======================================== */

    saveButton.addEventListener("click", () => {

        clearMessage();

        if (!validateWorkTypes()) {
            return;
        }

        workTypes = editingWorkTypes.map(
            (workType) => ({
                id: workType.id,
                name: workType.name.trim(),
                multiplier: Number(
                    workType.multiplier
                ),
                enabled: workType.enabled
            })
        );

        /* =====================================
           今後PHP APIと接続する部分
        ===================================== */

        console.log(
            "保存した業務タイプ:",
            workTypes
        );

        // 現在は画面内だけに保存します。
        // DB保存APIが完成したら、ここでfetchします。

        modal.hide();

        alert(
            "業務タイプの設定を保存しました。\n" +
            "※ 現在は画面内のみの保存です。"
        );

    });

});
