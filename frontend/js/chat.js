
/* ========================================
   Tasfina チャット専用JavaScript
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================
       仮データ
    ===================================== */

    const chats = [
        {
            id: 1,
            name: "営業部",
            description: "営業部の業務連絡・シフト調整用のチャットです。",
            memberCount: 12,
            preview: "田中：来週のシフトについて...",
            time: "10:24",
            unread: 2,
            members: [
                { name: "田中 美咲", role: "部門管理者" },
                { name: "山田 太郎", role: "営業担当" },
                { name: "佐藤 花子", role: "営業担当" },
                { name: "伊藤 翔", role: "営業担当" },
                { name: "高橋 健", role: "営業担当" }
            ],
            files: [
                {
                    name: "営業資料_202410.pdf",
                    type: "pdf",
                    sender: "田中 美咲",
                    date: "10/16 14:20"
                },
                {
                    name: "シフト表_202410.xlsx",
                    type: "excel",
                    sender: "山田 太郎",
                    date: "10/15 09:10"
                },
                {
                    name: "議事録_営業会議.docx",
                    type: "word",
                    sender: "佐藤 花子",
                    date: "10/10 16:45"
                }
            ],
            messages: [
                {
                    sender: "田中 美咲",
                    time: "10:05",
                    text: "おはようございます。\n来週のシフトについて確認したいのですが、\n15日（水）は人員足りていますか？",
                    mine: false
                },
                {
                    sender: "山田 太郎",
                    time: "10:08",
                    text: "おはようございます。\n現在のところ2名不足しています。\nシフトルーレットで調整する予定です。",
                    mine: true
                },
                {
                    sender: "佐藤 花子",
                    time: "10:12",
                    text: "私、15日は対応可能です！\n他に追加が必要であれば教えてください。",
                    mine: false
                },
                {
                    sender: "田中 美咲",
                    time: "10:15",
                    text: "ありがとうございます！\nあと1名は伊藤さんに確認してみます。",
                    mine: false
                },
                {
                    sender: "伊藤 翔",
                    time: "10:20",
                    text: "15日は対応できます。\nよろしくお願いします！",
                    mine: false
                },
                {
                    sender: "山田 太郎",
                    time: "10:24",
                    text: "ありがとうございます！\n15日は田中さん・佐藤さん・伊藤さんでお願いします。\n詳細はシフト管理画面にも反映しておきます。",
                    mine: true
                }
            ]
        },
        {
            id: 2,
            name: "開発部",
            description: "開発部の連絡用チャットです。",
            memberCount: 10,
            preview: "佐藤：ありがとうございます！",
            time: "09:15",
            unread: 1,
            members: [
                { name: "佐藤 花子", role: "部門管理者" },
                { name: "伊藤 翔", role: "開発担当" }
            ],
            files: [],
            messages: [
                {
                    sender: "佐藤 花子",
                    time: "09:15",
                    text: "ありがとうございます！",
                    mine: false
                }
            ]
        },
        {
            id: 3,
            name: "サポート部",
            description: "サポート部の情報共有チャットです。",
            memberCount: 8,
            preview: "渡辺：承知しました。",
            time: "昨日",
            unread: 0,
            members: [
                { name: "渡辺 直樹", role: "部門管理者" }
            ],
            files: [],
            messages: [
                {
                    sender: "渡辺 直樹",
                    time: "昨日",
                    text: "承知しました。",
                    mine: false
                }
            ]
        },
        {
            id: 4,
            name: "田中 美咲",
            description: "個人チャット",
            memberCount: 2,
            preview: "資料を共有しました。",
            time: "10/16",
            unread: 0,
            members: [
                { name: "田中 美咲", role: "部門管理者" },
                { name: "山田 太郎", role: "営業担当" }
            ],
            files: [],
            messages: []
        },
        {
            id: 5,
            name: "佐藤 花子",
            description: "個人チャット",
            memberCount: 2,
            preview: "次回の打ち合わせは...",
            time: "10/15",
            unread: 0,
            members: [
                { name: "佐藤 花子", role: "営業担当" },
                { name: "山田 太郎", role: "営業担当" }
            ],
            files: [],
            messages: []
        },
        {
            id: 6,
            name: "シフト管理グループ",
            description: "シフト調整用のグループです。",
            memberCount: 6,
            preview: "10月のシフト確定...",
            time: "10/14",
            unread: 0,
            members: [],
            files: [],
            messages: []
        },
        {
            id: 7,
            name: "伊藤 翔",
            description: "個人チャット",
            memberCount: 2,
            preview: "了解です！",
            time: "10/14",
            unread: 0,
            members: [],
            files: [],
            messages: []
        },
        {
            id: 8,
            name: "お知らせ",
            description: "システムからのお知らせ",
            memberCount: 0,
            preview: "システムメンテナンスのお知らせ",
            time: "10/10",
            unread: 0,
            members: [],
            files: [],
            messages: []
        }
    ];

    let selectedChatId = 1;
    let showAllMembers = false;

    /* =====================================
       HTML要素
    ===================================== */

    const chatList = document.getElementById("chatList");
    const chatSearch = document.getElementById("chatSearch");
    const messageList = document.getElementById("messageList");
    const messageForm = document.getElementById("messageForm");
    const messageInput = document.getElementById("messageInput");

    /* =====================================
       共通関数
    ===================================== */

    function getSelectedChat() {
        return chats.find(chat => chat.id === selectedChatId);
    }

    function createElement(tag, className, text) {
        const element = document.createElement(tag);

        if (className) {
            element.className = className;
        }

        if (text !== undefined) {
            element.textContent = text;
        }

        return element;
    }

    /* =====================================
       チャット一覧
    ===================================== */

    function renderChatList(keyword = "") {

        chatList.replaceChildren();

        const filteredChats = chats.filter(chat =>
            chat.name.toLowerCase().includes(
                keyword.toLowerCase()
            )
        );

        filteredChats.forEach(chat => {

            const item = createElement(
                "button",
                "chat-list-item"
            );

            item.type = "button";

            if (chat.id === selectedChatId) {
                item.classList.add("active");
            }

            const avatar = createElement(
                "div",
                "chat-avatar"
            );

            const avatarIcon = createElement(
                "i",
                chat.memberCount > 2
                    ? "bi bi-people-fill"
                    : "bi bi-person-fill"
            );

            avatar.appendChild(avatarIcon);

            const body = createElement(
                "div",
                "chat-list-body"
            );

            const top = createElement(
                "div",
                "chat-list-top"
            );

            top.append(
                createElement(
                    "span",
                    "chat-list-name",
                    chat.name
                ),
                createElement(
                    "span",
                    "chat-list-time",
                    chat.time
                )
            );

            const bottom = createElement(
                "div",
                "chat-list-bottom"
            );

            bottom.appendChild(
                createElement(
                    "span",
                    "chat-list-preview",
                    chat.preview
                )
            );

            if (chat.unread > 0) {
                bottom.appendChild(
                    createElement(
                        "span",
                        "unread-count",
                        String(chat.unread)
                    )
                );
            }

            body.append(top, bottom);
            item.append(avatar, body);

            item.addEventListener("click", () => {
                selectedChatId = chat.id;
                chat.unread = 0;
                showAllMembers = false;
                renderAll();
            });

            chatList.appendChild(item);

        });

    }

    /* =====================================
       メッセージ一覧
    ===================================== */

    function renderMessages() {

        const chat = getSelectedChat();

        messageList.replaceChildren();

        chat.messages.forEach(message => {

            const row = createElement(
                "div",
                "message-row"
            );

            if (message.mine) {
                row.classList.add("mine");
            } else {

                const avatar = createElement(
                    "div",
                    "message-avatar"
                );

                avatar.appendChild(
                    createElement(
                        "i",
                        "bi bi-person-fill"
                    )
                );

                row.appendChild(avatar);
            }

            const content = createElement(
                "div",
                "message-content"
            );

            const meta = createElement(
                "div",
                "message-meta"
            );

            meta.append(
                createElement(
                    "span",
                    "message-sender",
                    message.sender
                ),
                createElement(
                    "span",
                    "message-time",
                    message.time
                )
            );

            const bubble = createElement(
                "div",
                "message-bubble",
                message.text
            );

            content.append(meta, bubble);
            row.appendChild(content);

            messageList.appendChild(row);

        });

        messageList.scrollTop = messageList.scrollHeight;

    }

    /* =====================================
       チャット情報
    ===================================== */

    function renderChatInfo() {

        const chat = getSelectedChat();

        document.getElementById("conversationName")
            .textContent = chat.name;

        document.getElementById("conversationMembers")
            .textContent = `メンバー ${chat.memberCount}名`;

        document.getElementById("infoChatName")
            .textContent = chat.name;

        document.getElementById("infoMemberCount")
            .textContent = `メンバー ${chat.memberCount}名`;

        document.getElementById("chatDescription")
            .textContent = chat.description;

        document.getElementById("memberSectionTitle")
            .textContent = `メンバー（${chat.memberCount}名）`;

        const membersContainer =
            document.getElementById("chatMembers");

        membersContainer.replaceChildren();

        const visibleMembers = showAllMembers
            ? chat.members
            : chat.members.slice(0, 5);

        visibleMembers.forEach(member => {

            const item = createElement(
                "div",
                "member-item"
            );

            const avatar = createElement(
                "div",
                "member-avatar"
            );

            avatar.appendChild(
                createElement("i", "bi bi-person-fill")
            );

            const info = createElement("div");

            info.append(
                createElement(
                    "div",
                    "member-name",
                    member.name
                ),
                createElement(
                    "div",
                    "member-role",
                    member.role
                )
            );

            item.append(avatar, info);
            membersContainer.appendChild(item);

        });

        const showMembersButton =
            document.getElementById("showAllMembers");

        showMembersButton.hidden = chat.members.length <= 5;

        showMembersButton.textContent = showAllMembers
            ? "表示を減らす ▲"
            : "全メンバーを表示 ▼";

        const filesContainer =
            document.getElementById("sharedFiles");

        filesContainer.replaceChildren();

        chat.files.forEach(file => {

            const item = createElement(
                "div",
                "shared-file"
            );

            const icon = createElement(
                "i",
                "file-icon"
            );

            if (file.type === "pdf") {
                icon.className = "bi bi-file-earmark-pdf-fill file-icon pdf";
            } else if (file.type === "excel") {
                icon.className = "bi bi-file-earmark-excel-fill file-icon excel";
            } else {
                icon.className = "bi bi-file-earmark-word-fill file-icon word";
            }

            const info = createElement("div");

            info.append(
                createElement(
                    "div",
                    "file-name",
                    file.name
                ),
                createElement(
                    "div",
                    "file-meta",
                    `${file.sender}・${file.date}`
                )
            );

            item.append(icon, info);
            filesContainer.appendChild(item);

        });

    }

    /* =====================================
       画面全体の更新
    ===================================== */

    function renderAll() {
        renderChatList(chatSearch.value);
        renderMessages();
        renderChatInfo();
    }

    /* =====================================
       チャット検索
    ===================================== */

    chatSearch.addEventListener("input", () => {
        renderChatList(chatSearch.value);
    });

    /* =====================================
       メッセージ送信
    ===================================== */

    messageForm.addEventListener("submit", event => {

        event.preventDefault();

        const text = messageInput.value.trim();

        if (!text) return;

        const chat = getSelectedChat();

        const now = new Date();

        const time = now.toLocaleTimeString(
            "ja-JP",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

        chat.messages.push({
            sender: "山田 太郎",
            time: time,
            text: text,
            mine: true
        });

        chat.preview = `山田：${text}`;
        chat.time = time;

        messageInput.value = "";

        renderAll();

    });

    /* =====================================
       メンバー表示切り替え
    ===================================== */

    document.getElementById("showAllMembers")
        .addEventListener("click", () => {

            showAllMembers = !showAllMembers;
            renderChatInfo();

        });

    /* =====================================
       新しいチャット作成
    ===================================== */

    document.getElementById("newChatForm")
        .addEventListener("submit", event => {

            event.preventDefault();

            const name = document
                .getElementById("newChatName")
                .value.trim();

            const description = document
                .getElementById("newChatDescription")
                .value.trim();

            if (!name) return;

            const newId = Math.max(
                ...chats.map(chat => chat.id)
            ) + 1;

            chats.unshift({
                id: newId,
                name: name,
                description: description,
                memberCount: 1,
                preview: "新しいチャットを作成しました",
                time: "今",
                unread: 0,
                members: [
                    {
                        name: "山田 太郎",
                        role: "作成者"
                    }
                ],
                files: [],
                messages: []
            });

            selectedChatId = newId;

            event.target.reset();

            const modalElement =
                document.getElementById("newChatModal");

            bootstrap.Modal
                .getInstance(modalElement)
                ?.hide();

            renderAll();

        });

    /* =====================================
       チャット情報編集（仮実装）
    ===================================== */

    document.getElementById("editChatButton")
        .addEventListener("click", () => {

            const chat = getSelectedChat();

            const name = prompt(
                "チャット名を入力してください",
                chat.name
            );

            if (name === null || !name.trim()) return;

            const description = prompt(
                "説明を入力してください",
                chat.description
            );

            if (description === null) return;

            chat.name = name.trim();
            chat.description = description.trim();

            renderAll();

        });

    /* =====================================
       未実装の機能
    ===================================== */

    const pendingActions = {
        messageSearchButton: "メッセージ検索",
        callButton: "通話",
        chatMenuButton: "チャットメニュー",
        addMemberButton: "メンバー追加",
        showAllFiles: "共有ファイル一覧",
        attachButton: "ファイル添付",
        imageButton: "画像添付",
        emojiButton: "絵文字入力"
    };

    Object.entries(pendingActions).forEach(
        ([id, name]) => {

            document.getElementById(id)
                .addEventListener("click", () => {

                    alert(
                        `${name}機能は現在開発中です。`
                    );

                });

        }
    );

    /* =====================================
       初期表示
    ===================================== */

    renderAll();

});

