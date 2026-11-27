/* ========================================
   Tasfina ガントチャート
   週間表示・担当者別色分け・絞り込み対応版
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    "use strict";

    /* =====================================
       API・モーダルの設定
    ===================================== */

    const API_URL = "../../backend/natume_api.php";

    const USERS_API_URL = "../../backend/api_users.php";

    const MODAL_URL = "../modals/gantt-task-detail.html";


    /* =====================================
       HTML要素の取得
    ===================================== */

    const chart =
        document.getElementById("ganttChart");

    const periodLabel =
        document.getElementById("currentPeriod");

    const prevButton =
        document.getElementById("prevPeriod");

    const nextButton =
        document.getElementById("nextPeriod");

    const todayButton =
        document.getElementById("todayButton");

    const taskCount =
        document.getElementById("ganttTaskCount");

    const loadingLabel =
        document.getElementById("ganttLoading");

    const errorArea =
        document.getElementById("ganttError");

    const modalContainer =
        document.getElementById("ganttTaskDetailContainer");


    /* =====================================
       絞り込み関連のHTML要素
    ===================================== */

    const assigneeFilter =
        document.getElementById("assigneeFilter");

    const assigneeUserOptions =
        document.getElementById("assigneeUserOptions");

    const statusFilter =
        document.getElementById("statusFilter");

    const resetFiltersButton =
        document.getElementById("resetFiltersButton");

    const filterMessage =
        document.getElementById("ganttFilterMessage");


    /* =====================================
       必須要素の確認
    ===================================== */

    if (
        !chart ||
        !periodLabel ||
        !assigneeFilter ||
        !assigneeUserOptions ||
        !statusFilter ||
        !resetFiltersButton
    ) {

        console.error(
            "ガントチャートに必要なHTML要素がありません。"
        );

        return;

    }


    /* =====================================
       状態管理
    ===================================== */

    let currentDate = new Date();

    let tasks = [];

    let users = [];

    let currentUserId = null;

    let requestId = 0;

    let isLoading = false;

    let errorMessage = "";

    let modalLoadingPromise = null;


    /* =====================================
       絞り込み条件
    ===================================== */

    let selectedAssignee = "all";

    let selectedStatus = "all";


    /* =====================================
       日付変換
    ===================================== */

    function parseDate(value) {

        if (!value) {
            return null;
        }

        if (value instanceof Date) {

            if (Number.isNaN(value.getTime())) {
                return null;
            }

            const date = new Date(value);

            date.setHours(0, 0, 0, 0);

            return date;

        }

        const text = String(value).trim();

        const match = text.match(
            /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:$|[T\s])/
        );

        if (!match) {
            return null;
        }

        const year = Number(match[1]);

        const month = Number(match[2]);

        const day = Number(match[3]);

        const date = new Date(
            year,
            month - 1,
            day
        );

        if (
            date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== day
        ) {

            return null;

        }

        date.setHours(0, 0, 0, 0);

        return date;

    }


    /* =====================================
       日付の加算
    ===================================== */

    function addDays(date, days) {

        const result = new Date(date);

        result.setDate(
            result.getDate() + days
        );

        result.setHours(0, 0, 0, 0);

        return result;

    }


    /* =====================================
       日付の差分
    ===================================== */

    function dayDiff(start, end) {

        const a = Date.UTC(
            start.getFullYear(),
            start.getMonth(),
            start.getDate()
        );

        const b = Date.UTC(
            end.getFullYear(),
            end.getMonth(),
            end.getDate()
        );

        return Math.round(
            (b - a) / 86400000
        );

    }


    /* =====================================
       日付の表示形式
    ===================================== */

    function formatDate(date) {

        if (!date) {
            return "未設定";
        }

        return [

            date.getFullYear(),

            String(
                date.getMonth() + 1
            ).padStart(2, "0"),

            String(
                date.getDate()
            ).padStart(2, "0")

        ].join("/");

    }


    /* =====================================
       API送信用の日付形式
    ===================================== */

    function formatDateForAPI(date) {

        return formatDate(date)
            .replaceAll("/", "-");

    }


    /* =====================================
       HTMLエスケープ
    ===================================== */

    function escapeHTML(value) {

        return String(value ?? "").replace(

            /[&<>"']/g,

            char => ({

                "&": "&amp;",

                "<": "&lt;",

                ">": "&gt;",

                '"': "&quot;",

                "'": "&#39;"

            })[char]

        );

    }


    /* =====================================
       週間表示期間
    ===================================== */

    function getWeekRange() {

        const baseDate = parseDate(currentDate);

        const mondayOffset =
            (baseDate.getDay() + 6) % 7;

        const start = addDays(
            baseDate,
            -mondayOffset
        );

        return {

            start,

            end: addDays(start, 6),

            count: 7,

            width: 120

        };

    }


    /* =====================================
       ユーザーIDの正規化
    ===================================== */

    function normalizeUserId(value) {

        if (
            value === null ||
            value === undefined ||
            String(value).trim() === ""
        ) {

            return null;

        }

        const id = Number(value);

        if (
            !Number.isSafeInteger(id) ||
            id <= 0
        ) {

            return null;

        }

        return String(id);

    }


    /* =====================================
       タスクデータの変換
    ===================================== */

    function normalizeTask(task, index) {

        return {

            id:
                task.id ??
                task.task_id ??
                index + 1,

            name: String(

                task.title ??
                task.task_name ??
                task.name ??
                `タスク ${index + 1}`

            ),

            description:
                task.description ?? "",

            assignedUserId:
                normalizeUserId(
                    task.assigned_user_id
                ),

            priority:
                task.priority ?? null,

            difficultyLevel:
                task.difficulty_level ?? null,

            discomfortLevel:
                task.discomfort_level ?? null,

            estimatedHours:
                task.estimated_hours ?? null,

            burdenPoints:
                task.calculated_burden_pts ?? null,

            start: parseDate(

                task.start_date ??
                task.created_at ??
                task.start

            ),

            end: parseDate(

                task.end_date ??
                task.due_date ??
                task.end

            ),

            status: String(
                task.status ?? ""
            ).trim()

        };

    }


    /* =====================================
       完了済みタスクの判定
    ===================================== */

    function isCompletedTask(task) {

        const status = String(
            task.status ?? ""
        ).trim().toLowerCase();

        return [

            "completed",

            "done",

            "closed",

            "完了",

            "完了済み"

        ].includes(status);

    }


    /* =====================================
       自分のタスクの判定
    ===================================== */

    function isMyTask(task) {

        if (
            currentUserId === null ||
            task.assignedUserId === null
        ) {

            return false;

        }

        return (
            String(task.assignedUserId) ===
            String(currentUserId)
        );

    }


    /* =====================================
       担当者未設定の判定
    ===================================== */

    function isUnassignedTask(task) {

        return task.assignedUserId === null;

    }


    /* =====================================
       他の人のタスクの判定
    ===================================== */

    function isOtherTask(task) {

        return (

            currentUserId !== null &&

            !isUnassignedTask(task) &&

            !isMyTask(task)

        );

    }


    /* =====================================
       タスクの色分け
    ===================================== */

    function getTaskColorClass(task) {

        // 完了済みを最優先

        if (isCompletedTask(task)) {

            return "is-completed";

        }

        // 自分の未完了タスク

        if (isMyTask(task)) {

            return "is-mine";

        }

        // その他の未完了タスク

        return "is-other";

    }


    /* =====================================
       タスク色分けの説明
    ===================================== */

    function getTaskColorLabel(task) {

        if (isCompletedTask(task)) {

            return "完了済み";

        }

        if (isMyTask(task)) {

            return "自分の未完了タスク";

        }

        if (isUnassignedTask(task)) {

            return "担当者未設定の未完了タスク";

        }

        return "他の人の未完了タスク";

    }


    /* =====================================
       ステータスの表示形式
    ===================================== */

    function formatStatus(status) {

        const value = String(
            status ?? ""
        ).trim().toLowerCase();

        const statusMap = {

            assigned: "未着手",

            not_started: "未着手",

            todo: "未着手",

            in_progress: "進行中",

            pending: "承認待ち",

            pending_approval: "承認待ち",

            completed: "完了済み",

            done: "完了済み",

            closed: "完了済み",

            rejected: "差し戻し",

            "完了": "完了済み"

        };

        return Object.hasOwn(
            statusMap,
            value
        )

            ? statusMap[value]

            : (status || "未設定");

    }


    /* =====================================
       優先度の表示形式
    ===================================== */

    function formatPriority(priority) {

        if (
            priority === null ||
            priority === undefined ||
            priority === ""
        ) {

            return "未設定";

        }

        const value = String(
            priority
        ).trim().toLowerCase();

        const priorityMap = {

            high: "高",

            medium: "中",

            normal: "中",

            low: "低"

        };

        return Object.hasOwn(
            priorityMap,
            value
        )

            ? priorityMap[value]

            : String(priority);

    }


    /* =====================================
       担当者名の取得
    ===================================== */

    function getAssigneeName(userId) {

        const id = normalizeUserId(userId);

        if (id === null) {

            return "担当者未設定";

        }

        const user = users.find(
            item => item.id === id
        );

        if (user) {

            return user.name;

        }

        if (
            currentUserId !== null &&
            id === String(currentUserId)
        ) {

            return "自分";

        }

        return `ユーザーID：${id}`;

    }


    /* =====================================
       担当者名の表示
    ===================================== */

    function getAssigneeDisplayName(task) {

        const name = getAssigneeName(
            task.assignedUserId
        );

        if (
            isMyTask(task) &&
            name !== "自分"
        ) {

            return `${name}（自分）`;

        }

        return name;

    }


    /* =====================================
       フィルターメッセージ
    ===================================== */

    function showFilterMessage(message = "") {

        if (!filterMessage) {
            return;
        }

        filterMessage.textContent = message;

        filterMessage.hidden = !message;

    }


    /* =====================================
       担当者フィルターの選択肢生成
    ===================================== */

    function renderAssigneeOptions() {

        const previousValue = selectedAssignee;

        const userMap = new Map();


        /* APIから取得した担当者 */

        users.forEach(user => {

            userMap.set(
                user.id,
                user.name
            );

        });


        /*
         * タスクに担当者IDが存在する場合、
         * ユーザー一覧にない担当者も補完する。
         */

        tasks.forEach(task => {

            const id = task.assignedUserId;

            if (
                id !== null &&
                !userMap.has(id)
            ) {

                userMap.set(
                    id,
                    getAssigneeName(id)
                );

            }

        });


        /*
         * 選択中の担当者が別の週に存在しなくても
         * 絞り込み条件を維持する。
         */

        if (previousValue.startsWith("user:")) {

            const id = normalizeUserId(
                previousValue.slice(5)
            );

            if (
                id !== null &&
                !userMap.has(id)
            ) {

                userMap.set(
                    id,
                    getAssigneeName(id)
                );

            }

        }


        /* 選択肢の初期化 */

        assigneeUserOptions.replaceChildren();


        /* 名前順に並び替え */

        const sortedUsers = Array.from(
            userMap.entries()
        ).sort((a, b) =>

            a[1].localeCompare(
                b[1],
                "ja",
                { numeric: true }
            ) ||

            Number(a[0]) - Number(b[0])

        );


        /* 選択肢の追加 */

        sortedUsers.forEach(([id, name]) => {

            const option =
                document.createElement("option");

            option.value = `user:${id}`;

            const isCurrentUser =
                currentUserId !== null &&
                id === String(currentUserId);

            option.textContent =
                isCurrentUser && name !== "自分"

                    ? `${name}（自分）`

                    : name;

            assigneeUserOptions.appendChild(
                option
            );

        });


        /* 絞り込み条件を復元 */

        assigneeFilter.value = previousValue;

        if (
            assigneeFilter.value !== previousValue
        ) {

            selectedAssignee = "all";

            assigneeFilter.value = "all";

        }

    }


    /* =====================================
       担当者一覧の取得
    ===================================== */

    async function loadUsers() {

        try {

            const response = await fetch(

                USERS_API_URL,

                {

                    method: "GET",

                    credentials: "same-origin",

                    cache: "no-store",

                    headers: {

                        "Accept": "application/json"

                    }

                }

            );

            if (!response.ok) {

                throw new Error(
                    `担当者取得エラー：${response.status}`
                );

            }

            const result = await response.json();

            if (!Array.isArray(result.users)) {

                throw new Error(
                    "担当者データの形式が正しくありません。"
                );

            }


            /* ユーザーデータの変換 */

            users = result.users.map(user => ({

                id: normalizeUserId(
                    user.id ?? user.user_id
                ),

                name: String(

                    user.name ??
                    user.display_name ??
                    "名前未設定"

                )

            })).filter(user =>

                user.id !== null

            );


            /* 担当者選択欄の更新 */

            renderAssigneeOptions();

            showFilterMessage("");

            renderChart();

        } catch (error) {

            console.error(
                "担当者一覧の取得エラー：",
                error
            );

            showFilterMessage(

                "担当者一覧を取得できませんでした。" +

                "取得済みのタスクから担当者IDを表示します。"

            );

            renderAssigneeOptions();

            renderChart();

        }

    }


    /* =====================================
       タスクが表示期間内にあるか判定
    ===================================== */

    function isTaskInRange(task, range) {

        if (
            !task.start ||
            !task.end
        ) {

            return false;

        }

        if (task.start > task.end) {

            return false;

        }

        return (

            task.start <= range.end &&

            task.end >= range.start

        );

    }


    /* =====================================
       担当者フィルターの判定
    ===================================== */

    function matchesAssigneeFilter(task) {

        switch (selectedAssignee) {

            /* すべての担当者 */

            case "all":

                return true;


            /* 自分のタスクのみ */

            case "mine":

                return isMyTask(task);


            /* 他の人のタスクのみ */

            case "others":

                return isOtherTask(task);


            /* 担当者未設定 */

            case "unassigned":

                return isUnassignedTask(task);


            /* 特定の担当者 */

            default:

                if (
                    selectedAssignee.startsWith("user:")
                ) {

                    const userId = normalizeUserId(

                        selectedAssignee.slice(5)

                    );

                    return (

                        userId !== null &&

                        task.assignedUserId === userId

                    );

                }

                return true;

        }

    }


    /* =====================================
       タスク状態フィルターの判定
    ===================================== */

    function matchesStatusFilter(task) {

        switch (selectedStatus) {

            /* すべての状態 */

            case "all":

                return true;


            /* 未完了のみ */

            case "incomplete":

                return !isCompletedTask(task);


            /* 完了済みのみ */

            case "completed":

                return isCompletedTask(task);


            default:

                return true;

        }

    }


    /* =====================================
       絞り込み条件を組み合わせる
    ===================================== */

    function matchesFilters(task) {

        return (

            matchesAssigneeFilter(task) &&

            matchesStatusFilter(task)

        );

    }


    /* =====================================
       絞り込みが有効か判定
    ===================================== */

    function hasActiveFilters() {

        return (

            selectedAssignee !== "all" ||

            selectedStatus !== "all"

        );

    }


    /* =====================================
       絞り込み解除ボタンの状態
    ===================================== */

    function updateFilterControls() {

        resetFiltersButton.disabled =
            !hasActiveFilters();

    }


    /* =====================================
       担当者フィルターの変更
    ===================================== */

    assigneeFilter.addEventListener(

        "change",

        () => {

            selectedAssignee =
                assigneeFilter.value;

            updateFilterControls();

            renderChart();

        }

    );


    /* =====================================
       タスク状態フィルターの変更
    ===================================== */

    statusFilter.addEventListener(

        "change",

        () => {

            selectedStatus =
                statusFilter.value;

            updateFilterControls();

            renderChart();

        }

    );


    /* =====================================
       絞り込み解除
    ===================================== */

    function resetFilters() {

        selectedAssignee = "all";

        selectedStatus = "all";

        assigneeFilter.value = "all";

        statusFilter.value = "all";

        updateFilterControls();

        renderChart();

    }


    /* =====================================
       絞り込み解除ボタン
    ===================================== */

    resetFiltersButton.addEventListener(

        "click",

        resetFilters

    );


    /* =====================================
       タスク情報の取得
    ===================================== */

    async function fetchTasks() {

        const range = getWeekRange();

        const currentRequestId = ++requestId;


        /* APIへ送信する期間 */

        const requestData = new URLSearchParams({

            before: formatDateForAPI(
                range.start
            ),

            after: formatDateForAPI(
                range.end
            )

        });


        /* 読み込み状態 */

        isLoading = true;

        errorMessage = "";

        tasks = [];

        renderChart();

        try {

            const response = await fetch(

                API_URL,

                {

                    method: "POST",

                    credentials: "same-origin",

                    cache: "no-store",

                    headers: {

                        "Content-Type":
                            "application/x-www-form-urlencoded;charset=UTF-8",

                        "Accept":
                            "application/json"

                    },

                    body: requestData.toString()

                }

            );


            /* 古い通信結果を無視する */

            if (currentRequestId !== requestId) {

                return;

            }


            /* 未ログインの場合 */

            if (response.status === 401) {

                window.location.href = "login.html";

                return;

            }


            /* JSONレスポンス取得 */

            const responseText =
                await response.text();

            let result;

            try {

                result = JSON.parse(responseText);

            } catch (error) {

                console.error(
                    "PHPレスポンス：",
                    responseText
                );

                throw new Error(
                    "PHPから正しいJSON形式の応答がありません。"
                );

            }


            /* 古い通信結果を無視する */

            if (currentRequestId !== requestId) {

                return;

            }


            /* APIエラーチェック */

            if (
                !response.ok ||
                result.success !== true
            ) {

                throw new Error(

                    result.comment ||

                    result.message ||

                    `タスク取得エラー：${response.status}`

                );

            }


            /* タスクデータ形式の確認 */

            if (!Array.isArray(result.tasks)) {

                throw new Error(
                    "タスクデータが配列ではありません。"
                );

            }


            /* ログイン中のユーザーID取得 */

            const userId = normalizeUserId(
                result.current_user_id
            );

            if (userId === null) {

                throw new Error(
                    "ログイン中のユーザーIDを取得できませんでした。"
                );

            }

            currentUserId = userId;


            /* タスクデータの取得 */

            tasks = result.tasks.map(
                normalizeTask
            );


            /* 担当者選択欄の更新 */

            renderAssigneeOptions();


            /* 読み込み完了 */

            isLoading = false;

            renderChart();

            console.log(

                "ガントチャート取得成功：",

                {

                    currentUserId,

                    totalTasks: tasks.length,

                    completedTasks:
                        tasks.filter(
                            isCompletedTask
                        ).length,

                    myTasks:
                        tasks.filter(
                            isMyTask
                        ).length,

                    otherTasks:
                        tasks.filter(
                            isOtherTask
                        ).length,

                    unassignedTasks:
                        tasks.filter(
                            isUnassignedTask
                        ).length

                }

            );

        } catch (error) {

            if (currentRequestId !== requestId) {

                return;

            }

            console.error(

                "ガントチャート取得エラー：",

                error

            );

            tasks = [];

            currentUserId = null;

            isLoading = false;

            errorMessage =

                error.message ||

                "タスク取得に失敗しました。";

            renderChart();

        }

    }


    /* =====================================
       ガントチャートの描画
    ===================================== */

    function renderChart() {

        const range = getWeekRange();

        const totalWidth =
            range.count * range.width;


        /* CSS変数の設定 */

        chart.style.setProperty(

            "--timeline-width",

            `${totalWidth}px`

        );

        chart.style.setProperty(

            "--column-width",

            `${range.width}px`

        );


        /* 表示期間 */

        periodLabel.textContent =

            `${formatDate(range.start)} ～ ` +

            `${formatDate(range.end)}`;


        /* エラー表示 */

        if (errorArea) {

            errorArea.hidden = !errorMessage;

            errorArea.textContent = errorMessage;

        }


        /* 読み込み表示 */

        if (loadingLabel) {

            loadingLabel.textContent =

                isLoading

                    ? "読み込み中..."

                    : "";

        }


        /* =================================
           表示期間内の全タスク
        ================================= */

        const rangeTasks = tasks.filter(

            task => isTaskInRange(
                task,
                range
            )

        );


        /* =================================
           絞り込み後のタスク
        ================================= */

        const visibleTasks = rangeTasks.filter(

            matchesFilters

        );


        /* =================================
           表示件数の更新
        ================================= */

        if (taskCount) {

            if (isLoading) {

                taskCount.textContent =
                    "タスクを読み込み中...";

            } else if (errorMessage) {

                taskCount.textContent =
                    "タスク取得失敗";

            } else {

                taskCount.textContent =

                    `表示中のタスク：${visibleTasks.length}件` +

                    ` / 全${rangeTasks.length}件`;

            }

        }


        /* =================================
           曜日
        ================================= */

        const weekdays = [

            "日",

            "月",

            "火",

            "水",

            "木",

            "金",

            "土"

        ];


        /* =================================
           ガントチャートヘッダー
        ================================= */

        let html = `

            <div class="gantt-row gantt-header">

                <div class="gantt-cell">

                    タスク名 / 担当者

                </div>

                <div class="gantt-dates">

        `;


        /* =================================
           日付ヘッダーの生成
        ================================= */

        for (
            let i = 0;
            i < range.count;
            i++
        ) {

            const date = addDays(
                range.start,
                i
            );

            const day = date.getDay();

            const dayClass =

                day === 0

                    ? "sunday"

                    : day === 6

                        ? "saturday"

                        : "";

            const isToday =

                dayDiff(
                    date,
                    new Date()
                ) === 0;

            html += `

                <div
                    class="gantt-date ${dayClass} ${isToday ? "today" : ""}"
                >

                    <div>

                        ${date.getMonth() + 1}/${date.getDate()}

                    </div>

                    <div>

                        (${weekdays[day]})

                    </div>

                </div>

            `;

        }

        html += `

                </div>

            </div>

        `;


        /* =================================
           タスク行の生成
        ================================= */

        visibleTasks.forEach(task => {

            /* 表示期間に合わせて開始日を調整 */

            const displayStart =

                task.start < range.start

                    ? range.start

                    : task.start;


            /* 表示期間に合わせて終了日を調整 */

            const displayEnd =

                task.end > range.end

                    ? range.end

                    : task.end;


            /* バーの開始位置 */

            const startOffset = dayDiff(

                range.start,

                displayStart

            );


            /* バーの表示日数 */

            const duration =

                dayDiff(
                    displayStart,
                    displayEnd
                ) + 1;


            /* バーの位置と横幅 */

            const left =

                startOffset * range.width + 5;

            const width = Math.max(

                1,

                duration * range.width - 10

            );


            /* =================================
               タスクの状態・色分け
            ================================= */

            const isCompleted =
                isCompletedTask(task);

            const statusClass =
                getTaskColorClass(task);

            const colorLabel =
                getTaskColorLabel(task);

            const assigneeName =
                getAssigneeDisplayName(task);


            /* =================================
               ツールチップ
            ================================= */

            const tooltip = [

                `タスク名：${task.name}`,

                `担当者：${assigneeName}`,

                `状態：${formatStatus(task.status)}`,

                `開始日：${formatDate(task.start)}`,

                `終了日：${formatDate(task.end)}`

            ].join("\n");


            /* =================================
               タスク期間バー
            ================================= */

            const barHTML = `

                <div
                    class="gantt-task-bar ${statusClass}"
                    data-task-id="${escapeHTML(task.id)}"
                    role="button"
                    tabindex="0"
                    aria-label="${escapeHTML(task.name)}、${escapeHTML(colorLabel)}の詳細を表示"
                    style="left:${left}px;width:${width}px;"
                    title="${escapeHTML(tooltip)}"
                >

                    <span class="gantt-bar-label">

                        ${escapeHTML(task.name)}

                    </span>

                    ${isCompleted ? `

                        <i
                            class="bi bi-check-circle-fill gantt-complete-icon"
                            aria-hidden="true"
                        ></i>

                    ` : ""}

                </div>

            `;


            /* =================================
               タスク行HTML
            ================================= */

            html += `

                <div class="gantt-row gantt-task-row">

                    <div
                        class="gantt-cell gantt-name"
                        title="${escapeHTML(tooltip)}"
                    >

                        <i
                            class="bi bi-list-task"
                            aria-hidden="true"
                        ></i>

                        <div class="gantt-name-content">

                            <span class="gantt-task-name">

                                ${escapeHTML(task.name)}

                            </span>

                            <span class="gantt-assignee-name">

                                ${escapeHTML(assigneeName)}

                            </span>

                        </div>

                    </div>

                    <div class="gantt-timeline">

                        ${barHTML}

                    </div>

                </div>

            `;

        });


        /* =================================
           読み込み中
        ================================= */

        if (isLoading) {

            html += `

                <div class="gantt-empty">

                    <div
                        class="spinner-border text-primary"
                        role="status"
                    >

                        <span class="visually-hidden">

                            読み込み中

                        </span>

                    </div>

                    <p>

                        タスクを読み込んでいます...

                    </p>

                </div>

            `;

        }


        /* =================================
           タスク取得失敗
        ================================= */

        else if (errorMessage) {

            html += `

                <div class="gantt-empty">

                    <i
                        class="bi bi-exclamation-circle"
                        aria-hidden="true"
                    ></i>

                    <p>

                        タスク情報を取得できませんでした。

                    </p>

                    <span class="gantt-empty-description">

                        ページを再読み込みしてください。

                    </span>

                </div>

            `;

        }


        /* =================================
           この期間にタスクがない場合
        ================================= */

        else if (rangeTasks.length === 0) {

            html += `

                <div class="gantt-empty">

                    <i
                        class="bi bi-calendar-x"
                        aria-hidden="true"
                    ></i>

                    <p>

                        この期間にタスクはありません。

                    </p>

                </div>

            `;

        }


        /* =================================
           絞り込み結果が0件の場合
        ================================= */

        else if (visibleTasks.length === 0) {

            html += `

                <div class="gantt-empty is-filtered">

                    <i
                        class="bi bi-funnel"
                        aria-hidden="true"
                    ></i>

                    <p>

                        絞り込み条件に一致するタスクがありません。

                    </p>

                    <span class="gantt-empty-description">

                        担当者またはタスクの状態を変更してください。

                    </span>

                    <button
                        type="button"
                        class="btn btn-outline-secondary btn-sm"
                        data-action="reset-filters"
                    >

                        <i class="bi bi-arrow-counterclockwise"></i>

                        絞り込み解除

                    </button>

                </div>

            `;

        }


        /* =================================
           HTMLを画面に反映
        ================================= */

        chart.innerHTML = html;

        updateFilterControls();

    }


    /* =====================================
       タスク詳細モーダルの読み込み
    ===================================== */

    async function loadDetailModal() {

        if (!modalContainer) {

            throw new Error(
                "タスク詳細モーダルの読み込み先がありません。"
            );

        }

        const existingModal =
            document.getElementById(
                "ganttTaskDetailModal"
            );

        if (existingModal) {

            return existingModal;

        }


        /* 重複読み込み防止 */

        if (modalLoadingPromise) {

            return modalLoadingPromise;

        }

        modalLoadingPromise = (async () => {

            const response = await fetch(

                MODAL_URL,

                {

                    credentials: "same-origin",

                    cache: "no-store"

                }

            );

            if (!response.ok) {

                throw new Error(

                    `モーダル取得エラー：${response.status}`

                );

            }

            modalContainer.innerHTML =
                await response.text();

            const modalElement =
                document.getElementById(
                    "ganttTaskDetailModal"
                );

            if (!modalElement) {

                throw new Error(
                    "タスク詳細モーダルが見つかりません。"
                );

            }

            return modalElement;

        })();

        try {

            return await modalLoadingPromise;

        } finally {

            modalLoadingPromise = null;

        }

    }


    /* =====================================
       モーダル内のテキスト設定
    ===================================== */

    function setDetailText(id, value) {

        const element =
            document.getElementById(id);

        if (!element) {
            return;
        }

        element.textContent =

            value === null ||

            value === undefined ||

            String(value).trim() === ""

                ? "未設定"

                : String(value);

    }


    /* =====================================
       タスク詳細モーダルを開く
    ===================================== */

    async function openTaskDetail(taskId) {

        const task = tasks.find(

            item => String(item.id) === String(taskId)

        );

        if (!task) {

            alert(
                "タスク情報が見つかりませんでした。"
            );

            return;

        }

        try {

            const modalElement =
                await loadDetailModal();


            /* Bootstrapの確認 */

            if (!window.bootstrap?.Modal) {

                throw new Error(
                    "Bootstrapが読み込まれていません。"
                );

            }


            /* タスク名 */

            setDetailText(

                "detailTaskTitle",

                task.name

            );


            /* タスク説明 */

            setDetailText(

                "detailTaskDescription",

                task.description || "説明なし"

            );


            /* 担当者 */

            setDetailText(

                "detailTaskAssignee",

                getAssigneeDisplayName(task)

            );


            /* 優先度 */

            setDetailText(

                "detailTaskPriority",

                formatPriority(task.priority)

            );


            /* ステータス */

            setDetailText(

                "detailTaskStatus",

                formatStatus(task.status)

            );


            /* 難易度 */

            setDetailText(

                "detailTaskDifficulty",

                task.difficultyLevel

            );


            /* 不快度 */

            setDetailText(

                "detailTaskDiscomfort",

                task.discomfortLevel

            );


            /* 開始日 */

            setDetailText(

                "detailTaskStartDate",

                formatDate(task.start)

            );


            /* 終了日 */

            setDetailText(

                "detailTaskDueDate",

                formatDate(task.end)

            );


            /* 予定工数：対応する要素がある場合 */

            setDetailText(

                "detailTaskEstimatedHours",

                task.estimatedHours === null

                    ? "未設定"

                    : `${task.estimatedHours} 時間`

            );


            /* 負担スコア：対応する要素がある場合 */

            setDetailText(

                "detailTaskBurdenPoints",

                task.burdenPoints === null

                    ? "未設定"

                    : `${task.burdenPoints} pt`

            );


            /* モーダル表示 */

            const modal =
                bootstrap.Modal.getOrCreateInstance(

                    modalElement

                );

            modal.show();

        } catch (error) {

            console.error(

                "タスク詳細表示エラー：",

                error

            );

            alert(

                error.message ||

                "タスク詳細を表示できませんでした。"

            );

        }

    }


    /* =====================================
       ガントチャートのクリック処理
    ===================================== */

    chart.addEventListener(

        "click",

        event => {

            /* 空表示の絞り込み解除ボタン */

            const resetButton = event.target.closest(

                '[data-action="reset-filters"]'

            );

            if (resetButton) {

                resetFilters();

                return;

            }


            /* タスク期間バー */

            const taskBar = event.target.closest(

                ".gantt-task-bar[data-task-id]"

            );

            if (!taskBar) {

                return;

            }

            openTaskDetail(

                taskBar.dataset.taskId

            );

        }

    );


    /* =====================================
       キーボードによるタスク詳細表示
    ===================================== */

    chart.addEventListener(

        "keydown",

        event => {

            if (
                event.key !== "Enter" &&
                event.key !== " "
            ) {

                return;

            }

            const taskBar = event.target.closest(

                ".gantt-task-bar[data-task-id]"

            );

            if (!taskBar) {

                return;

            }

            event.preventDefault();

            openTaskDetail(

                taskBar.dataset.taskId

            );

        }

    );


    /* =====================================
       ガントチャートの更新
    ===================================== */

    function updateGantt() {

        /*
         * 絞り込み条件は変更しない。
         * 表示期間のタスクだけ再取得する。
         */

        fetchTasks();

    }


    /* =====================================
       前週へ移動
    ===================================== */

    prevButton?.addEventListener(

        "click",

        () => {

            currentDate = addDays(

                currentDate,

                -7

            );

            updateGantt();

        }

    );


    /* =====================================
       翌週へ移動
    ===================================== */

    nextButton?.addEventListener(

        "click",

        () => {

            currentDate = addDays(

                currentDate,

                7

            );

            updateGantt();

        }

    );


    /* =====================================
       今週へ移動
    ===================================== */

    todayButton?.addEventListener(

        "click",

        () => {

            currentDate = new Date();

            updateGantt();

        }

    );


    /* =====================================
       初期化処理
    ===================================== */

    async function initialize() {

        /* 初期フィルター設定 */

        selectedAssignee = "all";

        selectedStatus = "all";

        assigneeFilter.value = "all";

        statusFilter.value = "all";


        /* ボタンの状態更新 */

        updateFilterControls();

        showFilterMessage("");


        /* タスク・担当者・モーダルの読み込み */

        await Promise.all([

            fetchTasks(),

            loadUsers(),

            loadDetailModal().catch(error => {

                console.error(

                    "モーダル読み込みエラー：",

                    error

                );

            })

        ]);


        /* 最終描画 */

        renderAssigneeOptions();

        renderChart();

        console.log(

            "Tasfina：ガントチャートの初期化が完了しました。"

        );

    }


    /* =====================================
       初期化実行
    ===================================== */

    initialize();

});