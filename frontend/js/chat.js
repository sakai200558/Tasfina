/* ========================================
   Tasfina チャット管理
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ========================================
       API設定
    ======================================== */

    const API_URL = "../../backend/chat_api.php";
    const DOWNLOAD_URL = "../../backend/chat_download.php";

    const POLLING_INTERVAL = 3000;
    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    const ALLOWED_EXTENSIONS = [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "webp",
        "pdf",
        "txt",
        "csv",
        "docx",
        "xlsx",
        "pptx",
        "zip"
    ];

    const IMAGE_TYPES = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp"
    ];

    /* ========================================
       HTML要素取得
    ======================================== */

    const get = (id) => document.getElementById(id);

    const chatList = get("chatList");
    const chatSearch = get("chatSearch");
    const newChatButton = get("newChatButton");

    const conversationIcon = get("conversationIcon");
    const conversationName = get("conversationName");
    const conversationMembers = get("conversationMembers");

    const messageList = get("messageList");
    const messageForm = get("messageForm");
    const messageInput = get("messageInput");
    const sendMessageButton = get("sendMessageButton");

    const messageSearchButton = get("messageSearchButton");
    const messageSearchArea = get("messageSearchArea");
    const messageSearchInput = get("messageSearchInput");
    const closeMessageSearchButton = get("closeMessageSearchButton");

    const chatMenuButton = get("chatMenuButton");
    const chatError = get("chatError");

    /* 添付ファイル */

    const attachButton = get("attachButton");
    const imageButton = get("imageButton");
    const emojiButton = get("emojiButton");

    const chatFileInput = get("chatFileInput");
    const chatImageInput = get("chatImageInput");

    const attachmentPreview = get("attachmentPreview");
    const attachmentFileName = get("attachmentFileName");
    const attachmentFileSize = get("attachmentFileSize");
    const removeAttachmentButton = get("removeAttachmentButton");

    /* チャット情報 */

    const infoChatIcon = get("infoChatIcon");
    const infoChatName = get("infoChatName");
    const infoMemberCount = get("infoMemberCount");
    const chatDescription = get("chatDescription");

    const chatMembers = get("chatMembers");
    const memberSectionTitle = get("memberSectionTitle");

    const addMemberButton = get("addMemberButton");
    const editChatButton = get("editChatButton");

    const showAllMembers = get("showAllMembers");
    const showAllFiles = get("showAllFiles");
    const sharedFiles = get("sharedFiles");

    /* 新規チャット */

    const newChatModal = get("newChatModal");
    const newChatForm = get("newChatForm");

    const directChatType = get("directChatType");
    const groupChatType = get("groupChatType");
    const groupChatFields = get("groupChatFields");

    const newChatName = get("newChatName");
    const newChatDescription = get("newChatDescription");

    const newChatUserSearch = get("newChatUserSearch");
    const newChatUserList = get("newChatUserList");

    const selectedMemberCount = get("selectedMemberCount");
    const createChatButton = get("createChatButton");
    const newChatError = get("newChatError");

    /* チャット情報編集 */
    const editChatModal = get("editChatModal");
    const editChatForm = get("editChatForm");
    const editChatName = get("editChatName");
    const editChatDescription = get("editChatDescription");
    const editChatError = get("editChatError");
    const saveChatInfoButton = get("saveChatInfoButton");

    /* メンバー追加 */

    const addMemberModal = get("addMemberModal");
    const addMemberForm = get("addMemberForm");

    const addMemberSearch = get("addMemberSearch");
    const addMemberUserList = get("addMemberUserList");

    const confirmAddMemberButton = get("confirmAddMemberButton");
    const addMemberError = get("addMemberError");

    /* 画像プレビュー */

    const imagePreviewModal = get("imagePreviewModal");
    const previewImage = get("previewImage");

    /* ========================================
       状態管理
    ======================================== */

    let currentUserId = null;
    let currentUserName = "";
    let csrfToken = "";

    let canSend = false;

    let rooms = [];
    let users = [];
    let messages = [];
    let members = [];

    let currentRoomId = null;
    let lastMessageId = 0;

    let selectedFile = null;

    let selectedUsers = new Set();
    let additionalUsers = new Set();

    let addMemberRoomId = null;
    let editRoomId = null;
    let isEditingRoom = false;

    let showAllMemberState = false;
    let showAllFileState = false;

    let isSending = false;
    let isCreating = false;
    let isAddingMembers = false;
    let isPolling = false;
    let isLoadingRoom = false;
    let isLoadingRooms = false;

    let pollingTimer = null;

    let roomRequestId = 0;
    let roomsRequestId = 0;

    let messageRequest = null;
    let sessionExpired = false;

    /* ========================================
       共通関数
    ======================================== */

    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function sameId(a, b) {

        return String(a) === String(b);
    }

    function normalizeText(value) {

        return String(value ?? "")
            .normalize("NFKC")
            .toLowerCase()
            .trim();
    }

    function getCurrentRoom() {

        return rooms.find(room =>
            sameId(room.id, currentRoomId)
        ) ?? null;
    }

    function getRoomIcon(room) {

        return room?.type === "group"
            ? "bi-people-fill"
            : "bi-person-fill";
    }

    function getRoleName(roleCode) {

        const roles = {
            "1000": "全社管理者",
            "2000": "部門管理者",
            "3000": "一般メンバー",
            "4000": "閲覧専用"
        };

        return roles[String(roleCode)] ?? "メンバー";
    }

    function showError(message, element = chatError) {

        element.textContent = message;
        element.hidden = false;
    }

    function clearError(element = chatError) {

        element.textContent = "";
        element.hidden = true;
    }

    function emptyState(message, icon = "bi-chat-dots") {

        return `
            <div class="chat-empty-state">
                <i class="bi ${escapeHtml(icon)}"></i>
                <p>${escapeHtml(message)}</p>
            </div>
        `;
    }

    /* ========================================
       日時表示
    ======================================== */

    function parseDate(value) {

        if (!value) {
            return null;
        }

        const date = new Date(
            String(value).replace(" ", "T")
        );

        return Number.isNaN(date.getTime())
            ? null
            : date;
    }

    function formatTime(value) {

        const date = parseDate(value);

        if (!date) {
            return "";
        }

        return date.toLocaleTimeString("ja-JP", {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function formatRoomDate(value) {

        const date = parseDate(value);

        if (!date) {
            return "";
        }

        const today = new Date();

        if (date.toDateString() === today.toDateString()) {
            return formatTime(value);
        }

        return `${date.getMonth() + 1}/${date.getDate()}`;
    }

    function formatDateLabel(value) {

        const date = parseDate(value);

        if (!date) {
            return "";
        }

        const today = new Date();

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return "今日";
        }

        if (date.toDateString() === yesterday.toDateString()) {
            return "昨日";
        }

        return date.toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "short"
        });
    }

    /* ========================================
       ファイル関連共通処理
    ======================================== */

    function formatFileSize(size) {

        const bytes = Number(size) || 0;

        if (bytes < 1024) {
            return `${bytes} B`;
        }

        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }

        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    function getFileExtension(name) {

        return String(name ?? "")
            .split(".")
            .pop()
            .toLowerCase();
    }

    function getFileIcon(name) {

        const extension = getFileExtension(name);

        const icons = {

            pdf: "bi-file-earmark-pdf",

            docx: "bi-file-earmark-word",

            xlsx: "bi-file-earmark-excel",
            csv: "bi-file-earmark-spreadsheet",

            pptx: "bi-file-earmark-ppt",

            zip: "bi-file-earmark-zip",

            txt: "bi-file-earmark-text",

            jpg: "bi-file-earmark-image",
            jpeg: "bi-file-earmark-image",
            png: "bi-file-earmark-image",
            gif: "bi-file-earmark-image",
            webp: "bi-file-earmark-image"
        };

        return icons[extension] ?? "bi-file-earmark";
    }

    function getDownloadUrl(id, inline = false) {

        const params = new URLSearchParams({
            id: String(id)
        });

        if (inline) {
            params.set("inline", "1");
        }

        return `${DOWNLOAD_URL}?${params.toString()}`;
    }

    /* ========================================
       API通信
    ======================================== */

    async function requestApi(action, options = {}) {

        if (sessionExpired) {
            throw new Error("ログインし直してください。");
        }

        const method = options.method ?? "GET";

        let url = API_URL;

        const fetchOptions = {

            method: method,

            credentials: "same-origin",

            cache: "no-store",

            headers: {
                "Accept": "application/json"
            }
        };

        /* GET通信 */

        if (method === "GET") {

            const params = new URLSearchParams({
                action: action
            });

            Object.entries(options.params ?? {})
                .forEach(([key, value]) => {

                    if (value !== null && value !== undefined) {
                        params.set(key, String(value));
                    }
                });

            url += `?${params.toString()}`;

        } else {

            /* POST通信 */

            fetchOptions.headers["X-CSRF-Token"] = csrfToken;

            if (options.formData) {

                options.formData.set("action", action);

                fetchOptions.body = options.formData;

            } else {

                fetchOptions.headers["Content-Type"] =
                    "application/json";

                fetchOptions.body = JSON.stringify({

                    action: action,

                    ...(options.data ?? {})
                });
            }
        }

        let response;

        try {

            response = await fetch(url, fetchOptions);

        } catch (error) {

            throw new Error(
                "サーバーに接続できませんでした。"
            );
        }

        /* ログイン切れ */

        if (response.status === 401) {

            sessionExpired = true;

            stopPolling();

            canSend = false;

            updateControls();

            window.location.href = "login.html";

            throw new Error("ログインしてください。");
        }

        let data;

        try {

            data = await response.json();

        } catch (error) {

            throw new Error(
                "サーバーから正しい応答を取得できませんでした。"
            );
        }

        if (!response.ok || data.success !== true) {

            throw new Error(
                data.message ?? "チャット処理に失敗しました。"
            );
        }

        return data;
    }

    /* ========================================
       ログイン情報更新
    ======================================== */

    function updateSession(data) {

        if (data.current_user_id !== undefined) {
            currentUserId = Number(data.current_user_id);
        }

        if (data.current_user_name !== undefined) {
            currentUserName = data.current_user_name ?? "";
        }

        if (data.csrf_token) {
            csrfToken = data.csrf_token;
        }

        if (typeof data.can_send === "boolean") {
            canSend = data.can_send;
        }

        updateControls();
    }

    /* ========================================
       ユーザー一覧取得
    ======================================== */

    async function loadUsers() {

        const data = await requestApi("users");

        updateSession(data);

        users = Array.isArray(data.users)
            ? data.users
            : [];

        return users;
    }

    /* ========================================
       チャット一覧取得
    ======================================== */

    async function loadRooms() {

        const requestId = ++roomsRequestId;

        isLoadingRooms = true;

        try {

            const data = await requestApi("rooms");

            if (requestId !== roomsRequestId) {
                return;
            }

            updateSession(data);

            rooms = Array.isArray(data.rooms)
                ? data.rooms
                : [];

            if (
                currentRoomId !== null &&
                !getCurrentRoom()
            ) {
                resetConversation();
            }

            renderRooms();

            updateConversationHeader();

            updateControls();

        } finally {

            if (requestId === roomsRequestId) {
                isLoadingRooms = false;
            }
        }
    }

    /* ========================================
       チャット一覧表示
    ======================================== */

    function renderRooms() {

        const keyword = normalizeText(chatSearch.value);

        const filteredRooms = rooms.filter(room => {

            const name = normalizeText(room.name);

            const description =
                normalizeText(room.description);

            return name.includes(keyword) ||
                description.includes(keyword);
        });

        if (filteredRooms.length === 0) {

            chatList.innerHTML = emptyState(

                keyword
                    ? "該当するチャットがありません。"
                    : "チャットがありません。",

                "bi-chat-left-text"
            );

            return;
        }

        chatList.innerHTML = filteredRooms.map(room => {

            const active = sameId(room.id, currentRoomId);

            const unreadCount =
                Number(room.unread_count) || 0;

            let lastMessage = room.last_message;

            if (!lastMessage) {

                lastMessage = room.last_message_id

                    ? "ファイルが送信されました。"

                    : "まだメッセージがありません。";
            }

            if (
                room.type === "group" &&
                room.last_sender_name &&
                room.last_message_id
            ) {

                lastMessage =
                    `${room.last_sender_name}: ${lastMessage}`;
            }

            return `
                <button
                    type="button"
                    class="chat-list-item chat-item
                        ${active ? "active selected" : ""}"
                    data-room-id="${escapeHtml(room.id)}"
                    aria-pressed="${active}"
                >

                    <div class="chat-avatar">

                        <i class="bi ${getRoomIcon(room)}"></i>

                    </div>

                    <div class="chat-item-content chat-item-info">

                        <div class="chat-item-top">

                            <span class="chat-item-name chat-name">
                                ${escapeHtml(room.name)}
                            </span>

                            <span class="chat-item-time chat-time">
                                ${escapeHtml(
                                    formatRoomDate(
                                        room.last_message_at
                                    )
                                )}
                            </span>

                        </div>

                        <div class="chat-item-bottom">

                            <span class="chat-last-message chat-preview">
                                ${escapeHtml(lastMessage)}
                            </span>

                            ${
                                unreadCount > 0
                                    ? `
                                        <span class="unread-badge">
                                            ${
                                                unreadCount > 99
                                                    ? "99+"
                                                    : unreadCount
                                            }
                                        </span>
                                    `
                                    : ""
                            }

                        </div>

                    </div>

                </button>
            `;

        }).join("");
    }

    /* ========================================
       チャット選択
    ======================================== */

    async function selectRoom(roomId) {

        if (isSending) {
            return;
        }

        const room = rooms.find(item =>
            sameId(item.id, roomId)
        );

        if (!room) {
            return;
        }

        if (
            sameId(currentRoomId, room.id) &&
            !isLoadingRoom
        ) {
            return;
        }

        const requestId = ++roomRequestId;

        currentRoomId = String(room.id);

        isLoadingRoom = true;

        messageRequest = null;

        messages = [];
        members = [];

        lastMessageId = 0;

        showAllMemberState = false;
        showAllFileState = false;

        messageInput.value = "";

        clearAttachment();

        clearError();

        closeMessageSearch();

        renderRooms();

        updateConversationHeader();

        updateControls();

        renderMembers();

        renderSharedFiles();

        messageList.innerHTML = emptyState(
            "メッセージを読み込んでいます..."
        );

        try {

            await Promise.all([

                loadMessages(true),

                loadMembers()
            ]);

            if (requestId !== roomRequestId) {
                return;
            }

            await loadRooms();

        } catch (error) {

            if (requestId === roomRequestId) {
                showError(error.message);
            }

        } finally {

            if (requestId === roomRequestId) {

                isLoadingRoom = false;

                updateControls();
            }
        }
    }

    /* ========================================
       チャット未選択状態
    ======================================== */

    function resetConversation() {

        roomRequestId++;

        currentRoomId = null;

        messageRequest = null;

        messages = [];
        members = [];

        lastMessageId = 0;

        isLoadingRoom = false;

        showAllMemberState = false;
        showAllFileState = false;

        messageInput.value = "";

        clearAttachment();

        closeMessageSearch();

        messageList.innerHTML = emptyState(
            "チャットを選択するか、新しいチャットを作成してください。"
        );

        updateConversationHeader();

        renderMembers();

        renderSharedFiles();

        updateControls();
    }

    /* ========================================
       チャット情報更新
    ======================================== */

    function updateConversationHeader() {

        const room = getCurrentRoom();

        if (!room) {

            conversationIcon.className =
                "bi bi-person-fill";

            conversationName.textContent =
                "チャットを選択してください";

            conversationMembers.textContent =
                "メッセージを送信する相手を選択";

            infoChatIcon.className =
                "bi bi-person-fill";

            infoChatName.textContent = "未選択";

            infoMemberCount.textContent =
                "メンバー 0名";

            chatDescription.textContent =
                "チャットを選択してください。";

            return;
        }

        const count = Number(room.member_count) || 0;

        conversationIcon.className =
            `bi ${getRoomIcon(room)}`;

        infoChatIcon.className =
            `bi ${getRoomIcon(room)}`;

        conversationName.textContent = room.name;

        conversationMembers.textContent =
            room.type === "group"

                ? `グループチャット・${count}名`

                : "個人チャット";

        infoChatName.textContent = room.name;

        infoMemberCount.textContent =
            `メンバー ${count}名`;

        chatDescription.textContent =
            room.description || "説明はありません。";
    }

    /* ========================================
       操作ボタン制御
    ======================================== */

    function updateControls() {

        const room = getCurrentRoom();

        const hasRoom = room !== null;

        const writable =

            hasRoom &&
            canSend &&
            !isSending &&
            !isLoadingRoom &&
            !sessionExpired;

        newChatButton.disabled =
            !canSend ||
            isCreating ||
            sessionExpired;

        messageInput.disabled = !writable;

        attachButton.disabled = !writable;

        imageButton.disabled = !writable;

        emojiButton.disabled = !writable;

        removeAttachmentButton.disabled = !writable;

        sendMessageButton.disabled =

            !writable ||

            (
                messageInput.value.trim() === "" &&
                selectedFile === null
            );

        messageSearchButton.disabled = !hasRoom;

        chatMenuButton.disabled = !hasRoom;

        const canManage = writable &&
            room.type === "group" &&
            sameId(room.created_by, currentUserId);

        addMemberButton.disabled = !canManage || isAddingMembers || isEditingRoom;
        editChatButton.disabled = !canManage || isEditingRoom || isAddingMembers;
        addMemberButton.title = canManage ? "メンバーを追加" : "グループ作成者のみ追加できます。";
        editChatButton.title = canManage ? "チャット情報を編集" : "グループ作成者のみ編集できます。";

        if (!hasRoom) {

            messageInput.placeholder =
                "チャットを選択してください...";

        } else if (!canSend) {

            messageInput.placeholder =
                "閲覧専用ユーザーは送信できません。";

        } else {

            messageInput.placeholder =
                "メッセージを入力してください...";
        }
    }

    /* ========================================
       メッセージ取得
    ======================================== */

    async function loadMessages(initial = false) {

        if (currentRoomId === null) {
            return;
        }

        if (messageRequest) {
            return messageRequest;
        }

        const roomId = currentRoomId;

        const requestId = roomRequestId;

        const afterId = initial ? 0 : lastMessageId;

        const task = (async () => {

            const data = await requestApi("messages", {

                params: {

                    room_id: roomId,

                    after_id: afterId
                }
            });

            /* 別のチャットに切り替えた場合 */

            if (
                requestId !== roomRequestId ||
                !sameId(roomId, currentRoomId)
            ) {
                return;
            }

            const receivedMessages =
                Array.isArray(data.messages)

                    ? data.messages

                    : [];

            const nearBottom =

                messageList.scrollHeight -

                messageList.scrollTop -

                messageList.clientHeight < 100;

            if (initial) {

                messages = [];

                lastMessageId = 0;
            }

            const existingIds = new Set(

                messages.map(message => String(message.id))
            );

            let hasNewMessages = false;

            receivedMessages.forEach(message => {

                const id = String(message.id);

                if (!existingIds.has(id)) {

                    messages.push(message);

                    existingIds.add(id);

                    hasNewMessages = true;
                }

                lastMessageId = Math.max(

                    lastMessageId,

                    Number(message.id) || 0
                );
            });

            messages.sort(
                (a, b) => Number(a.id) - Number(b.id)
            );

            if (initial || hasNewMessages) {

                renderMessages(initial || nearBottom);

                renderSharedFiles();
            }

        })();

        messageRequest = task;

        try {

            await task;

        } finally {

            if (messageRequest === task) {
                messageRequest = null;
            }
        }
    }

    /* ========================================
       メッセージ一覧表示
    ======================================== */

    function renderMessages(scrollBottom = false) {

        const keyword =
            normalizeText(messageSearchInput.value);

        const previousScrollTop = messageList.scrollTop;

        const filteredMessages = messages.filter(message => {

            if (!keyword) {
                return true;
            }

            const text = normalizeText(message.message);

            const sender =
                normalizeText(message.sender_name);

            const attachments = Array.isArray(message.attachments)
                ? message.attachments
                : [];

            const attachmentMatch = attachments.some(file =>

                normalizeText(file.original_name)
                    .includes(keyword)
            );

            return text.includes(keyword) ||

                sender.includes(keyword) ||

                attachmentMatch;
        });

        if (filteredMessages.length === 0) {

            messageList.innerHTML = emptyState(

                keyword

                    ? "該当するメッセージがありません。"

                    : "まだメッセージがありません。"
            );

            return;
        }

        let html = "";

        let previousDate = "";

        filteredMessages.forEach(message => {

            const date = parseDate(message.created_at);

            const dateKey = date

                ? date.toDateString()

                : "";

            if (dateKey && dateKey !== previousDate) {

                html += `
                    <div class="message-date date-divider">
                        <span>
                            ${escapeHtml(
                                formatDateLabel(message.created_at)
                            )}
                        </span>
                    </div>
                `;

                previousDate = dateKey;
            }

            html += createMessageHtml(message);
        });

        messageList.innerHTML = html;

        if (scrollBottom && !keyword) {

            scrollToBottom();

        } else {

            messageList.scrollTop = previousScrollTop;
        }
    }

    /* ========================================
       メッセージHTML作成
    ======================================== */

    function createMessageHtml(message) {

        const mine =

            message.mine === true ||

            sameId(message.sender_id, currentUserId);

        const senderName =

            message.sender_name ||

            (mine ? currentUserName : "") ||

            "ユーザー";

        const text = escapeHtml(message.message)
            .replace(/\r?\n/g, "<br>");

        const attachments = Array.isArray(message.attachments)

            ? message.attachments

            : [];

        return `
            <div
                class="message-row message-item
                    ${mine ? "mine own-message" : "other received-message"}"
                data-message-id="${escapeHtml(message.id)}"
            >

                ${
                    !mine

                        ? `
                            <div class="chat-avatar message-avatar">
                                <i class="bi bi-person-fill"></i>
                            </div>
                        `

                        : ""
                }

                <div class="message-content">

                    ${
                        !mine

                            ? `
                                <div class="message-sender message-name">
                                    ${escapeHtml(senderName)}
                                </div>
                            `

                            : ""
                    }

                    <div class="message-body">

                        ${
                            text

                                ? `
                                    <div class="message-bubble">
                                        ${text}
                                    </div>
                                `

                                : ""
                        }

                        ${attachments.map(createAttachmentHtml).join("")}

                        <span class="message-time">

                            ${escapeHtml(
                                formatTime(message.created_at)
                            )}

                        </span>

                    </div>

                </div>

            </div>
        `;
    }

    /* ========================================
       添付ファイルHTML作成
    ======================================== */

    function createAttachmentHtml(file) {

        const downloadUrl = getDownloadUrl(file.id);

        const isImage = IMAGE_TYPES.includes(file.mime_type);

        if (isImage) {

            const imageUrl = getDownloadUrl(file.id, true);

            return `
                <div class="message-attachment image-attachment">

                    <button
                        type="button"
                        class="chat-image-button btn p-0 border-0"
                        data-preview-id="${escapeHtml(file.id)}"
                        data-preview-name="${escapeHtml(file.original_name)}"
                        aria-label="画像を拡大表示"
                    >

                        <img
                            src="${escapeHtml(imageUrl)}"
                            alt="${escapeHtml(file.original_name)}"
                            class="message-image chat-image img-fluid"
                            loading="lazy"
                        >

                    </button>

                    <a
                        href="${escapeHtml(downloadUrl)}"
                        class="attachment-download"
                        download
                    >

                        <i class="bi bi-download"></i>

                        ${escapeHtml(file.original_name)}

                    </a>

                </div>
            `;
        }

        return `
            <a
                href="${escapeHtml(downloadUrl)}"
                class="message-attachment file-attachment"
                download
            >

                <div class="attachment-icon file-icon">

                    <i class="bi ${getFileIcon(file.original_name)}"></i>

                </div>

                <div class="attachment-info file-info">

                    <span class="attachment-name file-name">

                        ${escapeHtml(file.original_name)}

                    </span>

                    <small class="attachment-size file-size">

                        ${formatFileSize(file.file_size)}

                    </small>

                </div>

                <i class="bi bi-download"></i>

            </a>
        `;
    }

    /* ========================================
       最新メッセージへ移動
    ======================================== */

    function scrollToBottom() {

        messageList.scrollTop =
            messageList.scrollHeight;
    }

    /* ========================================
       メッセージ送信
    ======================================== */

    async function sendMessage(event) {

        event.preventDefault();

        if (
            !canSend ||
            !currentRoomId ||
            isSending ||
            isLoadingRoom
        ) {
            return;
        }

        clearError();

        const message = messageInput.value.trim();

        if (!message && !selectedFile) {
            return;
        }

        if (Array.from(message).length > 5000) {

            showError(
                "メッセージは5000文字以内で入力してください。"
            );

            return;
        }

        const roomId = currentRoomId;

        const formData = new FormData();

        formData.append("room_id", roomId);

        formData.append("message", message);

        if (selectedFile) {

            formData.append(
                "file",
                selectedFile,
                selectedFile.name
            );
        }

        isSending = true;

        updateControls();

        let sent = false;

        try {

            await requestApi("send", {

                method: "POST",

                formData: formData
            });

            sent = true;

            if (sameId(roomId, currentRoomId)) {

                messageInput.value = "";

                clearAttachment();

                closeMessageSearch();

                /* 取得中の通信があれば完了を待つ */

                if (messageRequest) {

                    try {
                        await messageRequest;
                    } catch (error) {
                        console.warn(error);
                    }
                }

                await loadMessages();

                scrollToBottom();
            }

            await loadRooms();

        } catch (error) {

            showError(

                sent

                    ? "送信は完了しましたが、画面の更新に失敗しました。"

                    : error.message
            );

        } finally {

            isSending = false;

            updateControls();

            if (!messageInput.disabled) {
                messageInput.focus();
            }
        }
    }

    /* ========================================
       添付ファイル選択
    ======================================== */

    function selectAttachment(file) {

        if (
            !file ||
            !canSend ||
            !currentRoomId ||
            isSending ||
            isLoadingRoom
        ) {
            return;
        }

        clearError();

        if (file.size <= 0) {

            showError(
                "空のファイルは添付できません。"
            );

            return;
        }

        if (file.size > MAX_FILE_SIZE) {

            showError(
                "ファイルは10MB以内にしてください。"
            );

            return;
        }

        const extension = getFileExtension(file.name);

        if (!ALLOWED_EXTENSIONS.includes(extension)) {

            showError(
                "このファイル形式には対応していません。"
            );

            return;
        }

        if (Array.from(file.name).length > 255) {

            showError(
                "ファイル名は255文字以内にしてください。"
            );

            return;
        }

        selectedFile = file;

        attachmentFileName.textContent = file.name;

        attachmentFileSize.textContent =
            formatFileSize(file.size);

        attachmentPreview.hidden = false;

        updateControls();
    }

    /* ========================================
       添付ファイル解除
    ======================================== */

    function clearAttachment() {

        selectedFile = null;

        chatFileInput.value = "";

        chatImageInput.value = "";

        attachmentFileName.textContent = "";

        attachmentFileSize.textContent = "";

        attachmentPreview.hidden = true;

        updateControls();
    }

    /* ========================================
       メッセージ検索
    ======================================== */

    function openMessageSearch() {

        if (!currentRoomId) {
            return;
        }

        messageSearchArea.hidden = false;

        messageSearchInput.focus();
    }

    function closeMessageSearch() {

        const hadKeyword =
            messageSearchInput.value !== "";

        messageSearchInput.value = "";

        messageSearchArea.hidden = true;

        if (hadKeyword && currentRoomId) {

            renderMessages(true);
        }
    }

    /* ========================================
       新規チャット作成
    ======================================== */

    async function prepareNewChat() {

        newChatForm.reset();

        directChatType.checked = true;

        selectedUsers.clear();

        clearError(newChatError);

        newChatUserList.innerHTML =
            '<p class="text-muted">ユーザーを読み込んでいます...</p>';

        updateChatType();

        createChatButton.disabled = true;

        try {

            await loadUsers();

            renderNewChatUsers();

        } catch (error) {

            showError(error.message, newChatError);

            newChatUserList.innerHTML = "";

            createChatButton.disabled = true;
        }
    }

    /* ========================================
       チャット種別変更
    ======================================== */

    function updateChatType() {

        const isGroup = groupChatType.checked;

        groupChatFields.hidden = !isGroup;

        newChatName.disabled = !isGroup;

        newChatName.required = isGroup;

        newChatDescription.disabled = !isGroup;

        if (!isGroup && selectedUsers.size > 1) {

            const firstUser = selectedUsers.values().next().value;

            selectedUsers = new Set([firstUser]);
        }

        renderNewChatUsers();

        updateCreateChatButton();
    }

    /* ========================================
       ユーザー選択欄表示
    ======================================== */

    function renderNewChatUsers() {

        const keyword =
            normalizeText(newChatUserSearch.value);

        const isGroup = groupChatType.checked;

        const filteredUsers = users.filter(user => {

            return normalizeText(user.name).includes(keyword);
        });

        if (filteredUsers.length === 0) {

            newChatUserList.innerHTML = `
                <p class="text-muted">
                    該当するユーザーがいません。
                </p>
            `;

            updateCreateChatButton();

            return;
        }

        newChatUserList.innerHTML = filteredUsers.map(user => {

            const id = String(user.id);

            const checked = selectedUsers.has(id);

            return `
                <label class="chat-user-item user-select-item">

                    <div class="chat-avatar">

                        <i class="bi bi-person-fill"></i>

                    </div>

                    <div class="chat-user-info user-info">

                        <div class="chat-user-name user-name">

                            ${escapeHtml(user.name)}

                        </div>

                        <small class="chat-user-role user-role">

                            ${escapeHtml(
                                user.job_title ||
                                getRoleName(user.role_code)
                            )}

                        </small>

                    </div>

                    <input
                        type="${isGroup ? "checkbox" : "radio"}"
                        class="form-check-input"
                        name="newChatSelectedUser"
                        value="${escapeHtml(id)}"
                        ${checked ? "checked" : ""}
                        ${isCreating ? "disabled" : ""}
                    >

                </label>
            `;

        }).join("");

        updateCreateChatButton();
    }

    /* ========================================
       選択人数・作成ボタン更新
    ======================================== */

    function updateCreateChatButton() {

        selectedMemberCount.textContent =
            `選択中：${selectedUsers.size}名`;

        const isGroup = groupChatType.checked;

        const validName =

            !isGroup ||

            newChatName.value.trim() !== "";

        const validMembers = isGroup

            ? selectedUsers.size >= 1 &&
              selectedUsers.size <= 100

            : selectedUsers.size === 1;

        createChatButton.disabled =

            !canSend ||

            isCreating ||

            !validName ||

            !validMembers;
    }

    /* ========================================
       チャット作成API
    ======================================== */

    async function createChat(event) {

        event.preventDefault();

        if (!canSend || isCreating) {
            return;
        }

        clearError(newChatError);

        const type = groupChatType.checked

            ? "group"

            : "direct";

        const name = newChatName.value.trim();

        const description =
            newChatDescription.value.trim();

        const userIds = Array.from(selectedUsers)
            .map(Number);

        if (userIds.length === 0) {

            showError(
                "ユーザーを選択してください。",
                newChatError
            );

            return;
        }

        if (userIds.length > 100) {

            showError(
                "一度に選択できるユーザーは100人までです。",
                newChatError
            );

            return;
        }

        if (type === "direct" && userIds.length !== 1) {

            showError(
                "個人チャットは相手を1人選択してください。",
                newChatError
            );

            return;
        }

        if (
            type === "group" &&
            (
                !name ||
                Array.from(name).length > 50
            )
        ) {

            showError(
                "グループ名は1～50文字で入力してください。",
                newChatError
            );

            return;
        }

        if (Array.from(description).length > 500) {

            showError(
                "説明は500文字以内で入力してください。",
                newChatError
            );

            return;
        }

        isCreating = true;

        updateCreateChatButton();

        updateControls();

        let created = false;

        try {

            const data = await requestApi("create", {

                method: "POST",

                data: {

                    type: type,

                    name: type === "group" ? name : "",

                    description: type === "group"
                        ? description
                        : "",

                    user_ids: userIds
                }
            });

            created = true;

            bootstrap.Modal
                .getOrCreateInstance(newChatModal)
                .hide();

            await loadRooms();

            await selectRoom(data.room_id);

        } catch (error) {

            if (created) {

                showError(
                    "チャットは作成されましたが、一覧の更新に失敗しました。"
                );

            } else {

                showError(error.message, newChatError);
            }

        } finally {

            isCreating = false;

            updateCreateChatButton();

            updateControls();
        }
    }

    /* ========================================
       メンバー取得
    ======================================== */

    async function loadMembers() {

        if (!currentRoomId) {
            return;
        }

        const roomId = currentRoomId;

        const requestId = roomRequestId;

        const data = await requestApi("members", {

            params: {

                room_id: roomId
            }
        });

        if (
            requestId !== roomRequestId ||
            !sameId(roomId, currentRoomId)
        ) {
            return;
        }

        members = Array.isArray(data.members)

            ? data.members

            : [];

        renderMembers();
    }

    /* ========================================
       メンバー一覧表示
    ======================================== */

    function renderMembers() {

        memberSectionTitle.textContent =
            `メンバー（${members.length}名）`;

        showAllMembers.hidden = members.length <= 5;

        showAllMembers.innerHTML = showAllMemberState

            ? `
                一部のみ表示
                <i class="bi bi-chevron-up"></i>
            `

            : `
                全メンバーを表示
                <i class="bi bi-chevron-down"></i>
            `;

        if (members.length === 0) {

            chatMembers.innerHTML = `
                <p class="text-muted">
                    メンバー情報はありません。
                </p>
            `;

            return;
        }

        const displayMembers = showAllMemberState

            ? members

            : members.slice(0, 5);

        const room = getCurrentRoom();

        chatMembers.innerHTML = displayMembers.map(member => {

            const isMe =
                sameId(member.id, currentUserId);

            const isCreator = room &&

                room.type === "group" &&

                sameId(member.id, room.created_by);

            return `
                <div class="member-item chat-member-item">

                    <div class="chat-avatar member-avatar">

                        <i class="bi bi-person-fill"></i>

                    </div>

                    <div class="member-info">

                        <div class="member-name">

                            ${escapeHtml(member.name || "ユーザー")}

                            ${
                                isMe

                                    ? '<span class="text-muted">（自分）</span>'

                                    : ""
                            }

                        </div>

                        <small class="member-role">

                            ${
                                isCreator

                                    ? "チャット作成者"

                                    : escapeHtml(
                                        member.job_title ||
                                        getRoleName(member.role_code)
                                    )
                            }

                        </small>

                    </div>

                </div>
            `;

        }).join("");
    }

    /* ========================================
       メンバー追加準備
    ======================================== */

    function prepareEditChat() {
        const room = getCurrentRoom();
        if (!room || editChatButton.disabled) return;
        editRoomId = String(room.id);
        editChatName.value = room.name ?? "";
        editChatDescription.value = room.description ?? "";
        clearError(editChatError);
        saveChatInfoButton.disabled = false;
        bootstrap.Modal.getOrCreateInstance(editChatModal).show();
    }

    async function saveChatInfo(event) {
        event.preventDefault();
        const room = getCurrentRoom();
        if (!room || !canSend || isEditingRoom || sessionExpired ||
            room.type !== "group" || !sameId(room.created_by, currentUserId) ||
            !sameId(editRoomId, currentRoomId)) return;
        const name = editChatName.value.trim();
        const description = editChatDescription.value.trim();
        clearError(editChatError);
        if (!name || Array.from(name).length > 50 || Array.from(description).length > 500) {
            showError("グループ名は1～50文字、説明は500文字以内にしてください。", editChatError);
            return;
        }
        const roomId = editRoomId;
        isEditingRoom = true;
        saveChatInfoButton.disabled = true;
        updateControls();
        let saved = false;
        try {
            const data = await requestApi("update_room", {
                method: "POST",
                data: { room_id: roomId, name, description }
            });
            saved = true;
            const updatedRoom = rooms.find(item => sameId(item.id, roomId));
            if (updatedRoom) {
                updatedRoom.name = data.name;
                updatedRoom.description = data.description;
            }
            bootstrap.Modal.getOrCreateInstance(editChatModal).hide();
            renderRooms();
            updateConversationHeader();
            await loadRooms();
        } catch (error) {
            if (saved) showError("保存しましたが、画面の再取得に失敗しました。");
            else showError(error.message, editChatError);
        } finally {
            isEditingRoom = false;
            saveChatInfoButton.disabled = false;
            updateControls();
        }
    }

    async function prepareAddMembers() {

        const room = getCurrentRoom();

        if (
            !room ||
            !canSend ||
            room.type !== "group" ||
            !sameId(room.created_by, currentUserId)
        ) {
            return;
        }

        addMemberRoomId = String(room.id);

        const targetRoomId = addMemberRoomId;

        additionalUsers.clear();

        addMemberSearch.value = "";

        clearError(addMemberError);

        confirmAddMemberButton.disabled = true;

        addMemberUserList.innerHTML = `
            <p class="text-muted">
                ユーザーを読み込んでいます...
            </p>
        `;

        bootstrap.Modal
            .getOrCreateInstance(addMemberModal)
            .show();

        try {

            await Promise.all([

                loadUsers(),

                loadMembers()
            ]);

            if (
                !sameId(targetRoomId, currentRoomId) ||
                !sameId(targetRoomId, addMemberRoomId)
            ) {

                throw new Error(
                    "チャットが切り替わりました。"
                );
            }

            renderAdditionalUsers();

        } catch (error) {

            showError(error.message, addMemberError);

            addMemberUserList.innerHTML = "";

            confirmAddMemberButton.disabled = true;
        }
    }

    /* ========================================
       追加候補ユーザー表示
    ======================================== */

    function renderAdditionalUsers() {

        const keyword =
            normalizeText(addMemberSearch.value);

        const memberIds = new Set(

            members.map(member => String(member.id))
        );

        const candidates = users.filter(user => {

            return !memberIds.has(String(user.id)) &&

                normalizeText(user.name).includes(keyword);
        });

        if (candidates.length === 0) {

            addMemberUserList.innerHTML = `
                <p class="text-muted">
                    追加できるユーザーがいません。
                </p>
            `;

        } else {

            addMemberUserList.innerHTML = candidates.map(user => {

                const id = String(user.id);

                return `
                    <label class="chat-user-item user-select-item">

                        <div class="chat-avatar">

                            <i class="bi bi-person-fill"></i>

                        </div>

                        <div class="chat-user-info user-info">

                            <div class="chat-user-name user-name">

                                ${escapeHtml(user.name)}

                            </div>

                            <small class="chat-user-role user-role">

                                ${escapeHtml(
                                    user.job_title ||
                                    getRoleName(user.role_code)
                                )}

                            </small>

                        </div>

                        <input
                            type="checkbox"
                            class="form-check-input"
                            name="additionalUser"
                            value="${escapeHtml(id)}"
                            ${additionalUsers.has(id) ? "checked" : ""}
                            ${isAddingMembers ? "disabled" : ""}
                        >

                    </label>
                `;

            }).join("");
        }

        updateAddMemberButton();
    }

    function updateAddMemberButton() {

        confirmAddMemberButton.disabled =

            !canSend ||

            isAddingMembers ||

            !sameId(addMemberRoomId, currentRoomId) ||

            additionalUsers.size === 0 ||

            additionalUsers.size > 100;
    }

    /* ========================================
       メンバー追加API
    ======================================== */

    async function addMembers(event) {

        event.preventDefault();

        const room = getCurrentRoom();

        if (
            !room ||
            !canSend ||
            isAddingMembers ||
            room.type !== "group" ||
            !sameId(room.created_by, currentUserId) ||
            !sameId(addMemberRoomId, currentRoomId)
        ) {
            return;
        }

        clearError(addMemberError);

        const userIds = Array.from(additionalUsers)
            .map(Number);

        if (
            userIds.length === 0 ||
            userIds.length > 100
        ) {

            showError(
                "追加するユーザーを1～100人選択してください。",
                addMemberError
            );

            return;
        }

        const roomId = addMemberRoomId;

        isAddingMembers = true;

        updateAddMemberButton();

        let added = false;

        try {

            await requestApi("add_members", {

                method: "POST",

                data: {

                    room_id: roomId,

                    user_ids: userIds
                }
            });

            added = true;

            additionalUsers.clear();

            bootstrap.Modal
                .getOrCreateInstance(addMemberModal)
                .hide();

            await loadRooms();

            if (sameId(roomId, currentRoomId)) {

                await loadMembers();
            }

        } catch (error) {

            if (added) {

                showError(
                    "メンバーは追加されましたが、画面の更新に失敗しました。"
                );

            } else {

                showError(error.message, addMemberError);
            }

        } finally {

            isAddingMembers = false;

            updateAddMemberButton();
        }
    }

    /* ========================================
       共有ファイル一覧
    ======================================== */

    function renderSharedFiles() {

        const files = [];

        messages.forEach(message => {

            const attachments = Array.isArray(message.attachments)

                ? message.attachments

                : [];

            attachments.forEach(file => {

                files.push({

                    ...file,

                    created_at: message.created_at
                });
            });
        });

        files.reverse();

        showAllFiles.hidden = files.length <= 3;

        showAllFiles.innerHTML = showAllFileState

            ? `
                閉じる
                <i class="bi bi-chevron-up"></i>
            `

            : `
                すべて見る
                <i class="bi bi-arrow-right"></i>
            `;

        if (files.length === 0) {

            sharedFiles.innerHTML = `
                <p class="text-muted">
                    共有ファイルはありません。
                </p>
            `;

            return;
        }

        const displayFiles = showAllFileState

            ? files

            : files.slice(0, 3);

        sharedFiles.innerHTML = displayFiles.map(file => {

            return `
                <a
                    href="${escapeHtml(getDownloadUrl(file.id))}"
                    class="shared-file-item"
                    download
                >

                    <div class="shared-file-icon file-icon">

                        <i class="bi ${getFileIcon(file.original_name)}"></i>

                    </div>

                    <div class="shared-file-info file-info">

                        <div class="shared-file-name file-name">

                            ${escapeHtml(file.original_name)}

                        </div>

                        <small class="shared-file-size file-size">

                            ${formatFileSize(file.file_size)}

                            ・

                            ${escapeHtml(
                                formatRoomDate(file.created_at)
                            )}

                        </small>

                    </div>

                    <i class="bi bi-download"></i>

                </a>
            `;

        }).join("");
    }

    /* ========================================
       画像拡大表示
    ======================================== */

    function openImagePreview(id, name) {

        previewImage.src = getDownloadUrl(id, true);

        previewImage.alt = name || "添付画像";

        bootstrap.Modal
            .getOrCreateInstance(imagePreviewModal)
            .show();
    }

    /* ========================================
       絵文字入力
    ======================================== */

    const emojis = [

        "😀", "😊", "😂", "🤣", "😅",

        "😎", "🤔", "😢", "😭", "😴",

        "👍", "👎", "👏", "🙌", "🙏",

        "💪", "👀", "❤️", "✨", "🔥",

        "🎉", "🎊", "💯", "⭐", "💡",

        "✅", "❌", "⚠️", "📌", "🚀"
    ];

    const emojiPicker = document.createElement("div");

    emojiPicker.id = "emojiPicker";

    emojiPicker.className =
        "emoji-picker border rounded bg-body shadow p-2";

    emojiPicker.hidden = true;

    emojiPicker.setAttribute(
        "aria-label",
        "絵文字一覧"
    );

    emojiPicker.innerHTML = emojis.map(emoji => {

        return `
            <button
                type="button"
                class="emoji-item btn btn-light btn-sm m-1"
                data-emoji="${escapeHtml(emoji)}"
            >
                ${emoji}
            </button>
        `;

    }).join("");

    messageForm.before(emojiPicker);

    function toggleEmojiPicker() {

        if (emojiButton.disabled) {
            return;
        }

        emojiPicker.hidden = !emojiPicker.hidden;
    }

    function insertEmoji(emoji) {

        if (messageInput.disabled) {
            return;
        }

        const start = messageInput.selectionStart ??

            messageInput.value.length;

        const end = messageInput.selectionEnd ??

            messageInput.value.length;

        const nextValue =

            messageInput.value.slice(0, start) +

            emoji +

            messageInput.value.slice(end);

        if (nextValue.length > messageInput.maxLength) {
            return;
        }

        messageInput.value = nextValue;

        messageInput.focus();

        messageInput.setSelectionRange(

            start + emoji.length,

            start + emoji.length
        );

        emojiPicker.hidden = true;

        updateControls();
    }

    /* ========================================
       チャット情報パネル表示切替
    ======================================== */

    const infoPanel = document.querySelector(
        ".chat-info-panel"
    );

    function toggleChatInfo() {

        if (!infoPanel || !currentRoomId) {
            return;
        }

        const visible =
            infoPanel.classList.toggle("show");

        infoPanel.classList.toggle(
            "is-open",
            visible
        );

        infoPanel.classList.toggle(
            "d-block",
            visible
        );

        chatMenuButton.setAttribute(
            "aria-expanded",
            String(visible)
        );

        if (visible) {

            infoPanel.scrollIntoView({

                behavior: "smooth",

                block: "nearest"
            });
        }
    }

    /* ========================================
       自動更新
    ======================================== */

    async function pollChat() {

        if (
            isPolling ||
            isSending ||
            isCreating ||
            isAddingMembers ||
            isEditingRoom ||
            isLoadingRoom ||
            isLoadingRooms ||
            sessionExpired ||
            document.hidden
        ) {
            return;
        }

        isPolling = true;

        try {

            if (currentRoomId) {

                await loadMessages();
            }

            await loadRooms();

            if (currentRoomId) {

                await loadMembers();
            }

        } catch (error) {

            console.warn(
                "チャット自動更新エラー:",
                error.message
            );

        } finally {

            isPolling = false;
        }
    }

    function startPolling() {

        stopPolling();

        if (sessionExpired) {
            return;
        }

        pollingTimer = window.setInterval(

            pollChat,

            POLLING_INTERVAL
        );
    }

    function stopPolling() {

        if (pollingTimer !== null) {

            window.clearInterval(pollingTimer);

            pollingTimer = null;
        }
    }

    /* ========================================
       イベント設定
    ======================================== */

    /* チャット一覧検索 */

    chatSearch.addEventListener("input", renderRooms);

    /* チャット選択 */

    chatList.addEventListener("click", event => {

        const button = event.target.closest(
            "[data-room-id]"
        );

        if (!button) {
            return;
        }

        selectRoom(button.dataset.roomId);
    });

    /* メッセージ入力・送信 */

    messageInput.addEventListener(
        "input",
        updateControls
    );

    messageInput.addEventListener("keydown", event => {

        if (
            event.key === "Enter" &&
            (
                event.isComposing ||
                event.keyCode === 229
            )
        ) {

            event.preventDefault();
        }
    });

    messageForm.addEventListener(
        "submit",
        sendMessage
    );

    /* ファイル選択 */

    chatFileInput.accept = ALLOWED_EXTENSIONS

        .map(extension => `.${extension}`)

        .join(",");

    attachButton.addEventListener("click", () => {

        chatFileInput.click();
    });

    imageButton.addEventListener("click", () => {

        chatImageInput.click();
    });

    chatFileInput.addEventListener("change", () => {

        selectAttachment(chatFileInput.files[0]);

        chatFileInput.value = "";
    });

    chatImageInput.addEventListener("change", () => {

        selectAttachment(chatImageInput.files[0]);

        chatImageInput.value = "";
    });

    removeAttachmentButton.addEventListener(
        "click",
        clearAttachment
    );

    /* メッセージ検索 */

    messageSearchButton.addEventListener("click", () => {

        if (messageSearchArea.hidden) {

            openMessageSearch();

        } else {

            closeMessageSearch();
        }
    });

    closeMessageSearchButton.addEventListener(
        "click",
        closeMessageSearch
    );

    messageSearchInput.addEventListener("input", () => {

        renderMessages(false);
    });

    /* 新規チャットモーダル */

    newChatModal.addEventListener(
        "show.bs.modal",
        prepareNewChat
    );

    directChatType.addEventListener(
        "change",
        updateChatType
    );

    groupChatType.addEventListener(
        "change",
        updateChatType
    );

    newChatName.addEventListener(
        "input",
        updateCreateChatButton
    );

    newChatUserSearch.addEventListener(
        "input",
        renderNewChatUsers
    );

    newChatUserList.addEventListener("change", event => {

        const input = event.target;

        if (
            !input.matches("input[name='newChatSelectedUser']") ||
            isCreating
        ) {
            return;
        }

        const id = String(input.value);

        if (groupChatType.checked) {

            if (input.checked) {

                if (selectedUsers.size >= 100) {

                    input.checked = false;

                    showError(
                        "一度に選択できるユーザーは100人までです。",
                        newChatError
                    );

                    return;
                }

                selectedUsers.add(id);

            } else {

                selectedUsers.delete(id);
            }

        } else {

            selectedUsers.clear();

            selectedUsers.add(id);
        }

        clearError(newChatError);

        updateCreateChatButton();
    });

    newChatForm.addEventListener(
        "submit",
        createChat
    );

    /* メンバー追加 */

    editChatButton.addEventListener("click", prepareEditChat);
    editChatForm.addEventListener("submit", saveChatInfo);

    addMemberButton.addEventListener(
        "click",
        prepareAddMembers
    );

    addMemberSearch.addEventListener(
        "input",
        renderAdditionalUsers
    );

    addMemberUserList.addEventListener("change", event => {

        const input = event.target;

        if (
            !input.matches("input[name='additionalUser']") ||
            isAddingMembers
        ) {
            return;
        }

        const id = String(input.value);

        if (input.checked) {

            if (additionalUsers.size >= 100) {

                input.checked = false;

                showError(
                    "一度に追加できるユーザーは100人までです。",
                    addMemberError
                );

                return;
            }

            additionalUsers.add(id);

        } else {

            additionalUsers.delete(id);
        }

        clearError(addMemberError);

        updateAddMemberButton();
    });

    addMemberForm.addEventListener(
        "submit",
        addMembers
    );

    /* メンバー全件表示 */

    showAllMembers.addEventListener("click", () => {

        showAllMemberState = !showAllMemberState;

        renderMembers();
    });

    /* 共有ファイル全件表示 */

    showAllFiles.addEventListener("click", () => {

        showAllFileState = !showAllFileState;

        renderSharedFiles();
    });

    /* 画像プレビュー */

    messageList.addEventListener("click", event => {

        const button = event.target.closest(
            "[data-preview-id]"
        );

        if (!button) {
            return;
        }

        openImagePreview(

            button.dataset.previewId,

            button.dataset.previewName
        );
    });

    imagePreviewModal.addEventListener(
        "hidden.bs.modal",
        () => {

            previewImage.removeAttribute("src");
        }
    );

    /* 画像読み込み後のスクロール調整 */

    messageList.addEventListener("load", event => {

        if (
            event.target.tagName === "IMG" &&
            !messageSearchInput.value
        ) {

            const distance =

                messageList.scrollHeight -

                messageList.scrollTop -

                messageList.clientHeight;

            if (distance < 200) {
                scrollToBottom();
            }
        }

    }, true);

    /* 絵文字 */

    emojiButton.addEventListener(
        "click",
        toggleEmojiPicker
    );

    emojiPicker.addEventListener("click", event => {

        const button = event.target.closest(
            "[data-emoji]"
        );

        if (!button) {
            return;
        }

        insertEmoji(button.dataset.emoji);
    });

    document.addEventListener("click", event => {

        if (
            !emojiPicker.contains(event.target) &&
            !emojiButton.contains(event.target)
        ) {

            emojiPicker.hidden = true;
        }
    });

    /* チャット情報パネル */

    chatMenuButton.addEventListener(
        "click",
        toggleChatInfo
    );

    /* タブ切り替え時 */

    document.addEventListener(
        "visibilitychange",
        () => {

            if (!document.hidden) {

                pollChat();
            }
        }
    );

    /* ページ終了時 */

    window.addEventListener(
        "pagehide",
        stopPolling
    );

    window.addEventListener("pageshow", event => {

        if (event.persisted) {

            startPolling();

            pollChat();
        }
    });

    /* ========================================
       初期化
    ======================================== */

    async function initialize() {

        updateControls();

        try {

            await loadRooms();

            await loadUsers();

            clearError();

            if (rooms.length > 0) {

                await selectRoom(rooms[0].id);

            } else {

                resetConversation();

                renderRooms();
            }

        } catch (error) {

            showError(error.message);

            chatList.innerHTML = emptyState(

                "チャット情報の取得に失敗しました。",

                "bi-exclamation-circle"
            );

        } finally {

            startPolling();
        }
    }

    initialize();

});