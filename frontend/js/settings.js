
/* ========================================
   Tasfina 設定画面
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ========================================
       要素取得
    ======================================== */

    const tabs = document.querySelectorAll(".settings-tab");

    const panels = document.querySelectorAll(
        ".settings-tab-panel"
    );

    const themeButtons = document.querySelectorAll(
        ".theme-color"
    );

    const saveButton = document.getElementById(
        "saveSettingsButton"
    );

    const settingsMessage = document.getElementById(
        "settingsMessage"
    );

    const storageKey = "tasfina_settings_demo_v1";

    let selectedTheme = "#0065c8";


    /* ========================================
       タブ切り替え
    ======================================== */

    tabs.forEach(tab => {

        tab.addEventListener("click", () => {

            const target = tab.dataset.tab;

            tabs.forEach(item => {

                const active = item === tab;

                item.classList.toggle("active", active);

                if (active) {
                    item.setAttribute("aria-current", "page");
                } else {
                    item.removeAttribute("aria-current");
                }
            });

            panels.forEach(panel => {

                panel.hidden = panel.dataset.panel !== target;

            });
        });
    });


    /* ========================================
       文字数カウント
    ======================================== */

    function setupCharacterCount(inputId, countId) {

        const input = document.getElementById(inputId);

        const counter = document.getElementById(countId);

        if (!input || !counter) {
            return;
        }

        function updateCount() {

            counter.textContent =
                `${input.value.length} / ${input.maxLength}`;
        }

        input.addEventListener("input", updateCount);

        updateCount();
    }

    setupCharacterCount(
        "systemName",
        "systemNameCount"
    );

    setupCharacterCount(
        "companyName",
        "companyNameCount"
    );


    /* ========================================
       ON/OFFスイッチ表示
    ======================================== */

    function updateSwitchState(input) {

        const control = input.closest(".switch-control");

        if (!control) {
            return;
        }

        const state = control.querySelector(".switch-state");

        if (!state) {
            return;
        }

        state.textContent = input.checked ? "ON" : "OFF";
    }

    const switches = document.querySelectorAll(
        ".switch-control input[type='checkbox']"
    );

    switches.forEach(input => {

        input.addEventListener("change", () => {
            updateSwitchState(input);
        });

        updateSwitchState(input);
    });


    /* ========================================
       テーマカラー選択
    ======================================== */

    function setThemeColor(color) {

        const target = Array.from(themeButtons).find(
            button => button.dataset.color === color
        );

        if (!target) {
            return;
        }

        selectedTheme = color;

        themeButtons.forEach(button => {

            const selected = button === target;

            button.classList.toggle("selected", selected);

            button.setAttribute(
                "aria-pressed",
                String(selected)
            );
        });
    }

    themeButtons.forEach(button => {

        button.addEventListener("click", () => {

            setThemeColor(button.dataset.color);

        });
    });


    /* ========================================
       ロゴ画像
    ======================================== */

    const logoFile = document.getElementById("logoFile");

    const logoFileName = document.getElementById(
        "logoFileName"
    );

    logoFile.addEventListener("change", () => {

        const file = logoFile.files[0];

        if (!file) {
            logoFileName.textContent = "";
            return;
        }

        const allowedTypes = [
            "image/png",
            "image/jpeg"
        ];

        if (!allowedTypes.includes(file.type)) {

            logoFile.value = "";

            logoFileName.textContent =
                "PNGまたはJPG画像を選択してください。";

            return;
        }

        logoFileName.textContent =
            `選択中：${file.name}`;
    });


    /* ========================================
       設定項目の取得
    ======================================== */

    const settingIds = [
        "systemName",
        "companyName",
        "timeZone",
        "weekStart",
        "dateFormat",
        "timeFormat",
        "minimumPasswordLength",
        "requireUppercase",
        "requireLowercase",
        "requireNumber",
        "requireSymbol",
        "passwordExpiry",
        "passwordHistory",
        "autoBackup",
        "backupRetention",
        "showSidebar",
        "enableAnimation",
        "itemsPerPage",
        "featureChat",
        "featureFiles",
        "featureTasks",
        "featureGantt",
        "featureRanking",
        "featureOrgChart",
        "featureShiftRoulette"
    ];


    /* ========================================
       設定値を収集
    ======================================== */

    function collectSettings() {

        const settings = {
            themeColor: selectedTheme
        };

        settingIds.forEach(id => {

            const element = document.getElementById(id);

            if (!element) {
                return;
            }

            if (element.type === "checkbox") {

                settings[id] = element.checked;

            } else {

                settings[id] = element.value;
            }
        });

        return settings;
    }


    /* ========================================
       設定値を画面に反映
    ======================================== */

    function applySettings(settings) {

        settingIds.forEach(id => {

            const element = document.getElementById(id);

            if (!element || !(id in settings)) {
                return;
            }

            if (element.type === "checkbox") {

                element.checked = settings[id];

                updateSwitchState(element);

            } else {

                element.value = settings[id];
            }
        });

        if (settings.themeColor) {
            setThemeColor(settings.themeColor);
        }

        document.getElementById("systemNameCount")
            .textContent =
            `${document.getElementById("systemName").value.length} / 50`;

        document.getElementById("companyNameCount")
            .textContent =
            `${document.getElementById("companyName").value.length} / 100`;
    }


    /* ========================================
       メッセージ表示
    ======================================== */

    function showMessage(message, isError = false) {

        settingsMessage.textContent = message;

        settingsMessage.classList.toggle(
            "error",
            isError
        );
    }


    /* ========================================
       設定保存
    ======================================== */

    saveButton.addEventListener("click", () => {

        const systemName = document.getElementById(
            "systemName"
        ).value.trim();

        const companyName = document.getElementById(
            "companyName"
        ).value.trim();

        const minimumPasswordLength = Number(
            document.getElementById(
                "minimumPasswordLength"
            ).value
        );

        if (!systemName || !companyName) {

            showMessage(
                "システム名と企業名を入力してください。",
                true
            );

            return;
        }

        if (
            !Number.isInteger(minimumPasswordLength) ||
            minimumPasswordLength < 8 ||
            minimumPasswordLength > 128
        ) {

            showMessage(
                "パスワードの最小文字数は8～128文字で設定してください。",
                true
            );

            return;
        }

        const settings = collectSettings();

        settings.systemName = systemName;
        settings.companyName = companyName;

        try {

            localStorage.setItem(
                storageKey,
                JSON.stringify(settings)
            );

            showMessage(
                "設定を保存しました（このブラウザ内のデモ保存）。"
            );

        } catch (error) {

            console.error("設定保存エラー:", error);

            showMessage(
                "設定を保存できませんでした。",
                true
            );
        }
    });


    /* ========================================
       保存済み設定を読み込む
    ======================================== */

    function loadSettings() {

        try {

            const saved = localStorage.getItem(storageKey);

            if (!saved) {
                return;
            }

            const settings = JSON.parse(saved);

            if (
                settings &&
                typeof settings === "object" &&
                !Array.isArray(settings)
            ) {

                applySettings(settings);
            }

        } catch (error) {

            console.error("設定読み込みエラー:", error);
        }
    }


    /* ========================================
       バックアップ実行（デモ）
    ======================================== */

    document.getElementById("runBackupButton")
        .addEventListener("click", () => {

            showMessage(
                "バックアップ機能は現在デモです。実際のバックアップは作成されません。"
            );
        });


    /* ========================================
       全データ削除（デモ）
    ======================================== */

    const deleteButton = document.getElementById(
        "deleteAllDataButton"
    );

    const deleteModalElement = document.getElementById(
        "deleteConfirmModal"
    );

    deleteButton.addEventListener("click", () => {

        const modal = bootstrap.Modal.getOrCreateInstance(
            deleteModalElement
        );

        modal.show();
    });

    document.getElementById("confirmDeleteButton")
        .addEventListener("click", () => {

            const modal = bootstrap.Modal.getInstance(
                deleteModalElement
            );

            modal.hide();

            showMessage(
                "デモ画面のため、データ削除は実行していません。"
            );
        });


    /* ========================================
       初期処理
    ======================================== */

    loadSettings();

});
