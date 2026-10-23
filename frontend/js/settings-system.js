
/* ========================================
   Tasfina システム設定
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    const STORAGE_KEY = "tasfina_system_settings_v1";

    const $ = id => document.getElementById(id);

    const form = $("systemSettingsForm");
    const message = $("systemSettingsMessage");

    const defaults = {
        systemName: "Tasfina",
        companyName: "株式会社Tasfina",
        timezone: "Asia/Tokyo",
        weekStart: "monday",
        dateFormat: "yyyy/mm/dd",
        timeFormat: "24",
        minimumPasswordLength: "8",
        passwordExpiry: "90",
        loginLockEnabled: true,
        twoFactorEnabled: false,
        sessionExpiry: "8",
        singleSessionEnabled: true,
        ipRestrictionEnabled: false,
        themeMode: "light",
        themeColor: "#0065d8",
        sidebarAlwaysVisible: false,
        sidebarCollapsible: true,
        displayCount: "20",
        automaticBackup: true,
        backupFrequency: "daily",
        backupTime: "02:00",
        retentionPeriod: "30",
        maintenanceMode: false,
        maintenanceStartDate: "2024-10-20",
        maintenanceStartTime: "01:00",
        maintenanceEndDate: "2024-10-20",
        maintenanceEndTime: "05:00",
        maintenanceMessage:
            "ただいまメンテナンスを実施しております。ご迷惑をおかけいたしますが、しばらくお待ちください。"
    };

    let selectedThemeColor = defaults.themeColor;

    /* ========================================
       設定値の取得
    ======================================== */

    function collectSettings() {
        const settings = {};

        Object.keys(defaults).forEach(key => {
            if (key === "themeColor" || key === "themeMode") {
                return;
            }

            const element = $(key);

            if (!element) return;

            settings[key] = element.type === "checkbox"
                ? element.checked
                : element.value;
        });

        settings.themeMode =
            document.querySelector('input[name="themeMode"]:checked')?.value
            || "light";

        settings.themeColor = selectedThemeColor;

        return settings;
    }

    /* ========================================
       設定値の反映
    ======================================== */

    function applySettings(settings) {
        Object.keys(defaults).forEach(key => {
            if (key === "themeColor" || key === "themeMode") {
                return;
            }

            const element = $(key);
            if (!element) return;

            if (element.type === "checkbox") {
                element.checked = Boolean(settings[key]);
            } else {
                element.value = settings[key] ?? defaults[key];
            }
        });

        const themeRadio = document.querySelector(
            `input[name="themeMode"][value="${settings.themeMode}"]`
        );

        if (themeRadio) themeRadio.checked = true;

        selectedThemeColor = settings.themeColor || defaults.themeColor;

        updateThemeColors();
        updateSwitchStates();
        updateCharacterCounts();
    }

    /* ========================================
       テーマカラー
    ======================================== */

    function updateThemeColors() {
        document.querySelectorAll(".system-theme-color")
            .forEach(button => {
                const selected =
                    button.dataset.color === selectedThemeColor;

                button.classList.toggle("selected", selected);
                button.setAttribute("aria-pressed", String(selected));
            });
    }

    $("themeColors").addEventListener("click", event => {
        const button = event.target.closest(".system-theme-color");

        if (!button) return;

        selectedThemeColor = button.dataset.color;
        updateThemeColors();
    });

    /* ========================================
       スイッチ表示
    ======================================== */

    function updateSwitchStates() {
        document.querySelectorAll(".system-switch-state[data-for]")
            .forEach(state => {
                const input = $(state.dataset.for);
                if (!input) return;

                const enabled = input.checked;

                state.textContent = enabled ? "ON" : "OFF";
                state.classList.toggle("is-on", enabled);
            });
    }

    document.querySelectorAll(".system-switch input")
        .forEach(input => {
            input.addEventListener("change", updateSwitchStates);
        });

    /* ========================================
       文字数カウント
    ======================================== */

    function updateCharacterCounts() {
        $("systemNameCount").textContent =
            $("systemName").value.length;

        $("companyNameCount").textContent =
            $("companyName").value.length;

        $("maintenanceMessageCount").textContent =
            $("maintenanceMessage").value.length;
    }

    ["systemName", "companyName", "maintenanceMessage"]
        .forEach(id => {
            $(id).addEventListener("input", updateCharacterCounts);
        });

    /* ========================================
       メッセージ
    ======================================== */

    function showMessage(text, error = false) {
        message.textContent = text;
        message.classList.toggle("error", error);
    }

    /* ========================================
       保存
    ======================================== */

    form.addEventListener("submit", event => {
        event.preventDefault();

        if (!form.reportValidity()) return;

        const settings = collectSettings();

        if (
            Number(settings.minimumPasswordLength) < 8 ||
            Number(settings.minimumPasswordLength) > 128
        ) {
            showMessage(
                "パスワードの最小文字数は8～128文字で設定してください。",
                true
            );
            return;
        }

        if (settings.maintenanceMode) {
            const start = new Date(
                `${settings.maintenanceStartDate}T${settings.maintenanceStartTime}`
            );

            const end = new Date(
                `${settings.maintenanceEndDate}T${settings.maintenanceEndTime}`
            );

            if (
                !Number.isFinite(start.getTime()) ||
                !Number.isFinite(end.getTime()) ||
                start >= end
            ) {
                showMessage(
                    "メンテナンスの終了時刻は開始時刻より後にしてください。",
                    true
                );
                return;
            }
        }

        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(settings)
            );

            showMessage("システム設定を保存しました。");

        } catch (error) {
            console.error(error);
            showMessage(
                "設定を保存できませんでした。",
                true
            );
        }
    });

    /* ========================================
       リセット
    ======================================== */

    $("resetSettingsButton").addEventListener("click", () => {
        if (!confirm("設定を初期値に戻しますか？")) return;

        try {
            localStorage.removeItem(STORAGE_KEY);
            applySettings(defaults);
            showMessage("設定を初期値に戻しました。");
        } catch (error) {
            console.error(error);
            showMessage("リセットに失敗しました。", true);
        }
    });

    /* ========================================
       バックアップ
       ※ PHP接続前のデモ
    ======================================== */

    $("backupNowButton").addEventListener("click", () => {
        alert(
            "バックアップ処理はPHP・データベース連携後に実装します。\n" +
            "現在は画面動作確認用です。"
        );
    });

    /* ========================================
       CSVエクスポート
       ※ 現在は設定値のみ実データとして出力
    ======================================== */

    $("exportButton").addEventListener("click", () => {
        const type = $("exportDataType").value;

        if (type !== "users") {
            alert(
                "このデータのエクスポートはバックエンド連携後に実装します。"
            );
            return;
        }

        // アカウント管理画面のデモデータを利用
        const raw = localStorage.getItem("tasfina_accounts_demo_v1");

        if (!raw) {
            alert(
                "ユーザーデータが保存されていません。\n" +
                "アカウント管理画面でデータを保存してから実行してください。"
            );
            return;
        }

        let users;

        try {
            users = JSON.parse(raw);
            if (!Array.isArray(users)) throw new Error("Invalid data");
        } catch {
            alert("ユーザーデータを読み込めませんでした。");
            return;
        }

        const escapeCSV = value => {
            const text = String(value ?? "");
            return `"${text.replace(/"/g, '""')}"`;
        };

        const rows = [
            ["ID", "ユーザー名", "メールアドレス", "部門", "権限コード", "状態", "有効期限"],
            ...users.map(user => [
                user.id,
                user.name,
                user.email,
                user.department,
                user.role,
                user.active ? "有効" : "無効",
                user.expiry
            ])
        ];

        const csv = "\uFEFF" + rows
            .map(row => row.map(escapeCSV).join(","))
            .join("\r\n");

        const blob = new Blob([csv], {
            type: "text/csv;charset=utf-8;"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "tasfina_users.csv";

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    });

    /* ========================================
       システム時刻（ブラウザ時刻）
    ======================================== */

    function updateServerTime() {
        const now = new Date();

        $("serverTime").textContent =
            new Intl.DateTimeFormat("ja-JP", {
                timeZone: "Asia/Tokyo",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false
            }).format(now);
    }

    updateServerTime();
    setInterval(updateServerTime, 1000);

    /* ========================================
       初期化
    ======================================== */

    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
            const parsed = JSON.parse(saved);

            applySettings({
                ...defaults,
                ...parsed
            });
        } else {
            applySettings(defaults);
        }
    } catch (error) {
        console.error("設定読み込みエラー:", error);
        applySettings(defaults);
    }

});
