
/* ========================================
   Tasfina 通知設定 JavaScript
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("notificationSettingsForm");

    if (!form) return;

    const message = document.getElementById("notificationMessage");

    const storageKey = "tasfina_notification_settings";

    /* ========================================
       通知プレビューデータ
    ======================================== */

    const previewData = {

        system: [
            {
                icon: "bi-calendar-event",
                color: "green",
                title: "シフトが確定しました",
                description: "2024年10月のシフトが確定しました。",
                time: "10/17 10:00"
            },
            {
                icon: "bi-clock",
                color: "red",
                title: "有給申請が承認されました",
                description: "10月5日の有給申請が承認されました。",
                time: "10/17 09:30"
            },
            {
                icon: "bi-bar-chart-fill",
                color: "orange",
                title: "負担スコアが更新されました",
                description: "あなたの今月の負担スコアは2.4です。",
                time: "10/16 18:20"
            }
        ],

        email: [
            {
                icon: "bi-envelope-fill",
                color: "blue",
                title: "【Tasfina】シフト確定のお知らせ",
                description: "2024年10月のシフトが確定しました。",
                time: "10/17 10:00"
            },
            {
                icon: "bi-envelope-fill",
                color: "blue",
                title: "【Tasfina】有給申請承認のお知らせ",
                description: "申請した有給休暇が承認されました。",
                time: "10/17 09:30"
            }
        ],

        push: [
            {
                icon: "bi-phone-fill",
                color: "blue",
                title: "Tasfina：シフト更新",
                description: "新しいシフトが公開されました。",
                time: "10:00"
            },
            {
                icon: "bi-chat-dots-fill",
                color: "purple",
                title: "新しいチャットメッセージ",
                description: "新しいメッセージが届きました。",
                time: "09:45"
            }
        ]

    };

    /* ========================================
       ON/OFFスイッチ表示更新
    ======================================== */

    function updateSwitchLabel(input) {

        const label = input.closest(".notification-switch");

        if (!label) return;

        const text = label.querySelector(".switch-text");

        if (!text) return;

        text.textContent = input.checked ? "ON" : "OFF";
    }

    document.querySelectorAll(
        ".notification-switch input[type='checkbox']"
    ).forEach(input => {

        updateSwitchLabel(input);

        input.addEventListener("change", () => {
            updateSwitchLabel(input);
        });

    });

    /* ========================================
       通知プレビュー切り替え
    ======================================== */

    const previewTabs = document.querySelectorAll(".preview-tab");
    const previewContainer = document.getElementById("notificationPreview");

    function renderPreview(type) {

        if (!previewContainer || !previewData[type]) return;

        previewContainer.replaceChildren();

        previewData[type].forEach(item => {

            const row = document.createElement("div");
            row.className = "preview-item";

            if (item.color === "green") {
                row.classList.add("green-preview");
            }

            const icon = document.createElement("span");
            icon.className =
                `notification-icon small ${item.color}`;

            const iconElement = document.createElement("i");
            iconElement.className = `bi ${item.icon}`;

            icon.appendChild(iconElement);

            const content = document.createElement("div");
            content.className = "preview-content";

            const title = document.createElement("strong");
            title.textContent = item.title;

            const description = document.createElement("p");
            description.textContent = item.description;

            content.appendChild(title);
            content.appendChild(description);

            const time = document.createElement("time");
            time.textContent = item.time;

            row.appendChild(icon);
            row.appendChild(content);
            row.appendChild(time);

            previewContainer.appendChild(row);
        });

    }

    previewTabs.forEach(tab => {

        tab.addEventListener("click", () => {

            previewTabs.forEach(button => {
                button.classList.remove("active");
                button.setAttribute("aria-selected", "false");
            });

            tab.classList.add("active");
            tab.setAttribute("aria-selected", "true");

            renderPreview(tab.dataset.preview);

        });

    });

    /* ========================================
       サイレントタイム
    ======================================== */

    const silentEnabled = document.getElementById(
        "silentTimeEnabled"
    );

    const silentFields = document.getElementById(
        "silentTimeFields"
    );

    const silentStart = document.getElementById("silentStart");
    const silentEnd = document.getElementById("silentEnd");

    function updateSilentTime() {

        const enabled = silentEnabled.checked;

        silentStart.disabled = !enabled;
        silentEnd.disabled = !enabled;

        silentFields.classList.toggle(
            "is-disabled",
            !enabled
        );

    }

    silentEnabled.addEventListener("change", updateSilentTime);

    /* ========================================
       メールアドレス変更
    ======================================== */

    const emailInput = document.getElementById(
        "notificationEmail"
    );

    const editEmailButton = document.getElementById(
        "editEmailButton"
    );

    const emailError = document.getElementById("emailError");

    editEmailButton.addEventListener("click", () => {

        if (emailInput.readOnly) {

            emailInput.readOnly = false;
            emailInput.focus();

            editEmailButton.innerHTML =
                '<i class="bi bi-check2"></i> 確定';

            return;
        }

        if (!emailInput.checkValidity()) {

            emailError.textContent =
                "正しいメールアドレスを入力してください。";

            emailInput.focus();
            return;
        }

        emailError.textContent = "";

        emailInput.readOnly = true;

        editEmailButton.innerHTML =
            '<i class="bi bi-pencil"></i> 変更';

    });

    /* ========================================
       設定値取得
    ======================================== */

    function getSettings() {

        const targets = {};

        document.querySelectorAll(
            ".notification-table input[type='checkbox']"
        ).forEach(input => {

            const type = input.dataset.type;
            const channel = input.dataset.channel;

            if (!targets[type]) {
                targets[type] = {};
            }

            targets[type][channel] = input.checked;

        });

        return {

            channels: {
                email: document.getElementById(
                    "emailNotification"
                ).checked,

                system: document.getElementById(
                    "systemNotification"
                ).checked,

                push: document.getElementById(
                    "pushNotification"
                ).checked
            },

            targets: targets,

            silentTime: {
                enabled: silentEnabled.checked,
                start: silentStart.value,
                end: silentEnd.value
            },

            emailAddress: emailInput.value.trim()

        };

    }

    /* ========================================
       設定値復元
    ======================================== */

    function restoreSettings() {

        const saved = localStorage.getItem(storageKey);

        if (!saved) return;

        try {

            const settings = JSON.parse(saved);

            if (settings.channels) {

                document.getElementById(
                    "emailNotification"
                ).checked = settings.channels.email ?? true;

                document.getElementById(
                    "systemNotification"
                ).checked = settings.channels.system ?? true;

                document.getElementById(
                    "pushNotification"
                ).checked = settings.channels.push ?? false;

            }

            if (settings.targets) {

                document.querySelectorAll(
                    ".notification-table input[type='checkbox']"
                ).forEach(input => {

                    const type = input.dataset.type;
                    const channel = input.dataset.channel;

                    const value = settings.targets[type]?.[channel];

                    if (typeof value === "boolean") {
                        input.checked = value;
                    }

                });

            }

            if (settings.silentTime) {

                silentEnabled.checked =
                    settings.silentTime.enabled ?? true;

                silentStart.value =
                    settings.silentTime.start ?? "22:00";

                silentEnd.value =
                    settings.silentTime.end ?? "07:00";

            }

            if (settings.emailAddress) {
                emailInput.value = settings.emailAddress;
            }

        } catch (error) {
            console.error("通知設定の読み込みに失敗しました", error);
        }

    }

    /* ========================================
       保存処理
    ======================================== */

    form.addEventListener("submit", event => {

        event.preventDefault();

        message.textContent = "";
        message.classList.remove("error");

        if (!emailInput.checkValidity()) {

            message.textContent =
                "正しいメールアドレスを入力してください。";

            message.classList.add("error");

            emailInput.readOnly = false;
            emailInput.focus();

            return;
        }

        if (
            silentEnabled.checked &&
            (!silentStart.value || !silentEnd.value)
        ) {

            message.textContent =
                "サイレントタイムの開始・終了時刻を入力してください。";

            message.classList.add("error");

            return;
        }

        const settings = getSettings();

        try {

            localStorage.setItem(
                storageKey,
                JSON.stringify(settings)
            );

            message.textContent =
                "通知設定を保存しました。";

            emailInput.readOnly = true;

            editEmailButton.innerHTML =
                '<i class="bi bi-pencil"></i> 変更';

        } catch (error) {

            console.error(error);

            message.textContent =
                "設定を保存できませんでした。";

            message.classList.add("error");

        }

    });

    /* ========================================
       初期化
    ======================================== */

    restoreSettings();

    document.querySelectorAll(
        ".notification-switch input[type='checkbox']"
    ).forEach(updateSwitchLabel);

    updateSilentTime();

});
