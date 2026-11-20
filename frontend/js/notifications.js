
/* ========================================
   Tasfina 通知一覧専用JavaScript
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================
       HTML要素取得
    ===================================== */

    const notificationsList =
        document.getElementById("notificationsList");

    if (!notificationsList) {
        return;
    }

    const notificationsEmpty =
        document.getElementById("notificationsEmpty");

    const notificationSearch =
        document.getElementById("notificationSearch");

    const notificationTypeFilter =
        document.getElementById("notificationTypeFilter");

    const notificationTabs =
        document.querySelectorAll(".notification-tab");

    const markAllReadButton =
        document.getElementById("markAllReadButton");

    const deleteReadButton =
        document.getElementById("deleteReadButton");

    const detailModalElement =
        document.getElementById("notificationDetailModal");

    /* =====================================
       ローカル保存キー
    ===================================== */

    const STORAGE_KEY =
        "tasfina_notifications_demo_v1";

    /* =====================================
       通知種類の設定
    ===================================== */

    const notificationTypes = {

        shift: {
            label: "シフト関連",
            icon: "bi-calendar-event"
        },

        leave: {
            label: "有給申請",
            icon: "bi-clock-history"
        },

        score: {
            label: "負担スコア",
            icon: "bi-bar-chart-fill"
        },

        chat: {
            label: "チャット",
            icon: "bi-chat-dots-fill"
        },

        announcement: {
            label: "お知らせ",
            icon: "bi-megaphone-fill"
        },

        system: {
            label: "システム",
            icon: "bi-gear-fill"
        }

    };

    /* =====================================
       サンプル通知データ
       ※ フロントエンド確認用
    ===================================== */

    const sampleNotifications = [

        {
            id: 1,
            type: "shift",
            title: "来月のシフトが確定しました",
            message:
                "2026年12月のシフトが確定しました。\n" +
                "シフト管理画面から勤務予定を確認してください。",
            date: "2026-11-20T09:30:00",
            isRead: false
        },

        {
            id: 2,
            type: "leave",
            title: "有給申請が承認されました",
            message:
                "提出した有給休暇の申請が承認されました。\n" +
                "申請内容はシフト管理画面から確認できます。",
            date: "2026-11-19T15:20:00",
            isRead: false
        },

        {
            id: 3,
            type: "chat",
            title: "新しいチャットメッセージがあります",
            message:
                "所属部門のチャットに新しいメッセージが届きました。\n" +
                "チャット画面から内容を確認してください。",
            date: "2026-11-19T13:10:00",
            isRead: false
        },

        {
            id: 4,
            type: "score",
            title: "負担スコアが更新されました",
            message:
                "今月の負担スコアが更新されました。\n" +
                "ランキング画面から現在のスコアを確認できます。",
            date: "2026-11-18T18:20:00",
            isRead: false
        },

        {
            id: 5,
            type: "announcement",
            title: "システムメンテナンスのお知らせ",
            message:
                "Tasfinaのシステムメンテナンスを予定しています。\n" +
                "作業中は一部機能が利用できない場合があります。\n" +
                "詳細については管理者からの案内をご確認ください。",
            date: "2026-11-18T10:00:00",
            isRead: true
        },

        {
            id: 6,
            type: "shift",
            title: "シフト希望の提出期限が近づいています",
            message:
                "来月の希望シフトの提出期限が近づいています。\n" +
                "まだ提出していない場合は、シフト管理画面から提出してください。",
            date: "2026-11-17T09:00:00",
            isRead: true
        },

        {
            id: 7,
            type: "leave",
            title: "有給申請にコメントが追加されました",
            message:
                "提出した有給申請に管理者からコメントが追加されました。\n" +
                "申請内容を確認してください。",
            date: "2026-11-16T14:30:00",
            isRead: true
        },

        {
            id: 8,
            type: "system",
            title: "システムのお知らせ",
            message:
                "Tasfinaの機能が更新されました。\n" +
                "引き続きTasfinaをご利用ください。",
            date: "2026-11-15T11:00:00",
            isRead: true
        },

        {
            id: 9,
            type: "chat",
            title: "チャットでメンションされました",
            message:
                "所属部門のチャットであなた宛てのメンションがありました。\n" +
                "チャット画面から確認してください。",
            date: "2026-11-14T16:40:00",
            isRead: true
        },

        {
            id: 10,
            type: "score",
            title: "ランキングが更新されました",
            message:
                "所属部門の負担スコアランキングが更新されました。\n" +
                "ランキング画面から確認できます。",
            date: "2026-11-13T17:00:00",
            isRead: true
        }

    ];

    /* =====================================
       ローカルストレージ読み込み
    ===================================== */

    function loadNotifications() {

        try {

            const savedData =
                localStorage.getItem(STORAGE_KEY);

            if (savedData !== null) {

                const parsedData =
                    JSON.parse(savedData);

                if (Array.isArray(parsedData)) {
                    return parsedData;
                }

            }

        } catch (error) {

            console.error(
                "通知データ読み込みエラー:",
                error
            );

        }

        return sampleNotifications.map(notification => ({
            ...notification
        }));

    }

    /* =====================================
       通知データ
    ===================================== */

    let notifications =
        loadNotifications();

    let currentFilter = "all";

    /* =====================================
       ローカルストレージ保存
    ===================================== */

    function saveNotifications() {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(notifications)
            );

        } catch (error) {

            console.error(
                "通知データ保存エラー:",
                error
            );

        }

    }

    /* =====================================
       日時表示
    ===================================== */

    function formatDate(dateString) {

        const date = new Date(dateString);

        if (Number.isNaN(date.getTime())) {
            return dateString;
        }

        return new Intl.DateTimeFormat("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }).format(date);

    }

    /* =====================================
       HTMLエスケープ
    ===================================== */

    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");

    }

    /* =====================================
       件数取得
    ===================================== */

    function getNotificationCounts() {

        const total =
            notifications.length;

        const unread =
            notifications.filter(
                notification => !notification.isRead
            ).length;

        const read =
            total - unread;

        return {
            total,
            unread,
            read
        };

    }

    /* =====================================
       件数表示更新
    ===================================== */

    function updateNotificationCounts() {

        const counts =
            getNotificationCounts();

        const countElements = {

            totalNotificationCount: counts.total,
            unreadNotificationCount: counts.unread,
            readNotificationCount: counts.read,

            allTabCount: counts.total,
            unreadTabCount: counts.unread,
            readTabCount: counts.read

        };

        Object.entries(countElements)
            .forEach(([id, value]) => {

                const element =
                    document.getElementById(id);

                if (element) {
                    element.textContent = value;
                }

            });

        if (markAllReadButton) {

            markAllReadButton.disabled =
                counts.unread === 0;

        }

        if (deleteReadButton) {

            deleteReadButton.disabled =
                counts.read === 0;

        }

    }

    /* =====================================
       絞り込み
    ===================================== */

    function getFilteredNotifications() {

        const keyword =
            notificationSearch.value
                .trim()
                .toLocaleLowerCase("ja");

        const selectedType =
            notificationTypeFilter.value;

        return notifications

            .filter(notification => {

                if (
                    currentFilter === "unread" &&
                    notification.isRead
                ) {
                    return false;
                }

                if (
                    currentFilter === "read" &&
                    !notification.isRead
                ) {
                    return false;
                }

                if (
                    selectedType !== "all" &&
                    notification.type !== selectedType
                ) {
                    return false;
                }

                const searchableText =
                    `${notification.title} ` +
                    `${notification.message} ` +
                    `${notificationTypes[notification.type]?.label || ""}`;

                return searchableText
                    .toLocaleLowerCase("ja")
                    .includes(keyword);

            })

            .sort((a, b) => {
                return new Date(b.date) - new Date(a.date);
            });

    }

    /* =====================================
       通知アイテム生成
    ===================================== */

    function createNotificationItem(notification) {

        const type =
            notificationTypes[notification.type] ||
            notificationTypes.system;

        const item =
            document.createElement("article");

        item.className =
            "notification-item" +
            (notification.isRead ? "" : " unread");

        item.dataset.id =
            String(notification.id);

        const unreadDot =
            notification.isRead
                ? ""
                : '<span class="notification-unread-dot" aria-label="未読"></span>';

        const readButton =
            notification.isRead
                ? ""
                : `
                    <button
                        type="button"
                        class="notification-action-button"
                        data-action="read"
                        data-id="${escapeHTML(notification.id)}"
                        title="既読にする"
                        aria-label="既読にする"
                    >
                        <i class="bi bi-check2"></i>
                    </button>
                `;

        item.innerHTML = `

            <div class="notification-icon ${escapeHTML(notification.type)}">
                <i class="bi ${type.icon}"></i>
            </div>

            <div class="notification-content">

                <button
                    type="button"
                    class="notification-content-button"
                    data-action="detail"
                    data-id="${escapeHTML(notification.id)}"
                >

                    <div class="notification-title-row">

                        <h3 class="notification-title">
                            ${escapeHTML(notification.title)}
                        </h3>

                        ${unreadDot}

                    </div>

                    <p class="notification-description">
                        ${escapeHTML(notification.message)
                            .replace(/\n/g, " ")}
                    </p>

                    <div class="notification-meta">

                        <span class="notification-category">
                            ${type.label}
                        </span>

                        <time class="notification-date">
                            ${escapeHTML(formatDate(notification.date))}
                        </time>

                    </div>

                </button>

            </div>

            <div class="notification-actions">

                ${readButton}

                <button
                    type="button"
                    class="notification-action-button delete"
                    data-action="delete"
                    data-id="${escapeHTML(notification.id)}"
                    title="通知を削除"
                    aria-label="通知を削除"
                >
                    <i class="bi bi-trash"></i>
                </button>

            </div>

        `;

        return item;

    }

    /* =====================================
       通知一覧描画
    ===================================== */

    function renderNotifications() {

        const filteredNotifications =
            getFilteredNotifications();

        notificationsList.innerHTML = "";

        filteredNotifications.forEach(notification => {

            const item =
                createNotificationItem(notification);

            notificationsList.appendChild(item);

        });

        notificationsEmpty.hidden =
            filteredNotifications.length > 0;

        document.getElementById(
            "notificationResultCount"
        ).textContent =
            `${filteredNotifications.length}件の通知`;

        updateNotificationCounts();

    }

    /* =====================================
       通知を既読にする
    ===================================== */

    function markNotificationAsRead(id) {

        const notification =
            notifications.find(
                item => String(item.id) === String(id)
            );

        if (!notification || notification.isRead) {
            return;
        }

        notification.isRead = true;

        saveNotifications();
        renderNotifications();

    }

    /* =====================================
       通知を削除する
    ===================================== */

    function deleteNotification(id) {

        const notification =
            notifications.find(
                item => String(item.id) === String(id)
            );

        if (!notification) {
            return;
        }

        if (!window.confirm(
            "この通知を削除しますか？"
        )) {
            return;
        }

        notifications =
            notifications.filter(
                item => String(item.id) !== String(id)
            );

        saveNotifications();
        renderNotifications();

    }

    /* =====================================
       通知詳細を表示
    ===================================== */

    function showNotificationDetail(id) {

        const notification =
            notifications.find(
                item => String(item.id) === String(id)
            );

        if (!notification) {
            return;
        }

        const type =
            notificationTypes[notification.type] ||
            notificationTypes.system;

        document.getElementById(
            "notificationDetailCategory"
        ).textContent =
            type.label;

        document.getElementById(
            "notificationDetailHeading"
        ).textContent =
            notification.title;

        document.getElementById(
            "notificationDetailDate"
        ).textContent =
            formatDate(notification.date);

        document.getElementById(
            "notificationDetailMessage"
        ).textContent =
            notification.message;

        const detailIcon =
            document.getElementById(
                "notificationDetailIcon"
            );

        detailIcon.className =
            `notification-detail-icon ${notification.type}`;

        detailIcon.innerHTML =
            `<i class="bi ${type.icon}"></i>`;

        // 通知を既読にする
        markNotificationAsRead(id);

        // Bootstrapモーダル表示
        if (window.bootstrap?.Modal) {

            const modal =
                bootstrap.Modal.getOrCreateInstance(
                    detailModalElement
                );

            modal.show();

        } else {

            console.error(
                "BootstrapのJavaScriptが読み込まれていません。"
            );

        }

    }

    /* =====================================
       通知一覧クリック
    ===================================== */

    notificationsList.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "button[data-action]"
                );

            if (!button) {
                return;
            }

            const id =
                button.dataset.id;

            const action =
                button.dataset.action;

            switch (action) {

                case "detail":
                    showNotificationDetail(id);
                    break;

                case "read":
                    markNotificationAsRead(id);
                    break;

                case "delete":
                    deleteNotification(id);
                    break;

            }

        }
    );

    /* =====================================
       表示タブ切り替え
    ===================================== */

    notificationTabs.forEach(tab => {

        tab.addEventListener("click", () => {

            currentFilter =
                tab.dataset.filter;

            notificationTabs.forEach(item => {

                const isActive =
                    item === tab;

                item.classList.toggle(
                    "active",
                    isActive
                );

                item.setAttribute(
                    "aria-pressed",
                    String(isActive)
                );

            });

            renderNotifications();

        });

    });

    /* =====================================
       検索イベント
    ===================================== */

    notificationSearch.addEventListener(
        "input",
        renderNotifications
    );

    /* =====================================
       種類絞り込みイベント
    ===================================== */

    notificationTypeFilter.addEventListener(
        "change",
        renderNotifications
    );

    /* =====================================
       すべて既読
    ===================================== */

    markAllReadButton.addEventListener(
        "click",
        () => {

            const unreadCount =
                getNotificationCounts().unread;

            if (unreadCount === 0) {
                return;
            }

            notifications.forEach(notification => {
                notification.isRead = true;
            });

            saveNotifications();
            renderNotifications();

        }
    );

    /* =====================================
       既読通知を削除
    ===================================== */

    deleteReadButton.addEventListener(
        "click",
        () => {

            const readCount =
                getNotificationCounts().read;

            if (readCount === 0) {
                return;
            }

            if (!window.confirm(
                `既読の通知${readCount}件を削除しますか？`
            )) {
                return;
            }

            notifications =
                notifications.filter(
                    notification => !notification.isRead
                );

            saveNotifications();
            renderNotifications();

        }
    );

    /* =====================================
       初期表示
    ===================================== */

    renderNotifications();

});
