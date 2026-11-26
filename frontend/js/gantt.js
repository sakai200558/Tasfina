/* ========================================
   Tasfina ガントチャート
   週間表示・PHP連携・タスク詳細
   担当者別3色色分け対応版
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================
       API設定
    ===================================== */

    const API_URL = "../../backend/natume_api.php";
    const USERS_API_URL = "../../backend/api_users.php";
    const MODAL_URL = "../modals/gantt-task-detail.html";

    /* =====================================
       状態管理
    ===================================== */

    let currentDate = new Date();

    let tasks = [];
    let users = [];

    // ログイン中のユーザーID
    let currentUserId = null;

    let requestId = 0;
    let isLoading = false;
    let errorMessage = "";

    /* =====================================
       HTML要素取得
    ===================================== */

    const chart =
        document.getElementById("ganttChart");

    const periodLabel =
        document.getElementById("currentPeriod");

    const taskCount =
        document.getElementById("ganttTaskCount");

    const loadingLabel =
        document.getElementById("ganttLoading");

    const errorArea =
        document.getElementById("ganttError");

    const prevButton =
        document.getElementById("prevPeriod");

    const nextButton =
        document.getElementById("nextPeriod");

    const todayButton =
        document.getElementById("todayButton");

    const modalContainer =
        document.getElementById("ganttTaskDetailContainer");

    if (!chart || !periodLabel) {

        console.error(
            "ガントチャートの要素が見つかりません。"
        );

        return;
    }


    /* =====================================
       日付解析
    ===================================== */

    function parseDate(value) {

        if (value === null || value === undefined) {
            return null;
        }

        if (value instanceof Date) {

            if (Number.isNaN(value.getTime())) {
                return null;
            }

            return new Date(
                value.getFullYear(),
                value.getMonth(),
                value.getDate()
            );
        }

        const text = String(value).trim();

        const match = text.match(
            /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/
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

        return date;
    }


    /* =====================================
       日付操作
    ===================================== */

    function addDays(date, amount) {

        const result = new Date(date);

        result.setDate(
            result.getDate() + amount
        );

        return result;
    }

    function dayDiff(first, second) {

        const a = Date.UTC(
            first.getFullYear(),
            first.getMonth(),
            first.getDate()
        );

        const b = Date.UTC(
            second.getFullYear(),
            second.getMonth(),
            second.getDate()
        );

        return Math.round(
            (b - a) / 86400000
        );
    }

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

    function formatDateForAPI(date) {

        return [
            date.getFullYear(),

            String(
                date.getMonth() + 1
            ).padStart(2, "0"),

            String(
                date.getDate()
            ).padStart(2, "0")

        ].join("-");
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

        // 時刻を00:00:00に統一
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
       タスクデータ変換
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
                task.assigned_user_id ?? null,

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
       完了判定
    ===================================== */

    function isCompletedTask(task) {

        const status =
            String(task.status ?? "")
                .trim()
                .toLowerCase();

        return [
            "completed",
            "done",
            "closed",
            "完了"
        ].includes(status);
    }


    /* =====================================
       自分のタスクかどうか判定
    ===================================== */

    function isMyTask(task) {

        if (
            currentUserId === null ||
            currentUserId === undefined ||
            task.assignedUserId === null ||
            task.assignedUserId === undefined ||
            task.assignedUserId === ""
        ) {
            return false;
        }

        return (
            String(task.assignedUserId) ===
            String(currentUserId)
        );
    }


    /* =====================================
       タスクの色分け判定
    ===================================== */

    function getTaskColorClass(task) {

        // 最優先：完了済み
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
       色分けの説明取得
    ===================================== */

    function getTaskColorLabel(task) {

        if (isCompletedTask(task)) {

            return "完了済み";

        }

        if (isMyTask(task)) {

            return "自分の未完了タスク";

        }

        if (
            task.assignedUserId === null ||
            task.assignedUserId === undefined ||
            task.assignedUserId === ""
        ) {

            return "担当者未設定の未完了タスク";

        }

        return "他の人の未完了タスク";
    }


    /* =====================================
       表示期間との重複判定
    ===================================== */

    function isTaskInRange(task, range) {

        if (!task.start || !task.end) {
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
       担当者一覧取得
    ===================================== */

    async function loadUsers() {

        try {

            const response = await fetch(
                USERS_API_URL,
                {
                    credentials: "same-origin",
                    cache: "no-store"
                }
            );

            if (!response.ok) {

                throw new Error(
                    "担当者一覧の取得に失敗しました"
                );
            }

            const result =
                await response.json();

            users = Array.isArray(result)
                ? result
                : Array.isArray(result.users)
                    ? result.users
                    : [];

        } catch (error) {

            console.error(
                "担当者取得エラー:",
                error
            );

            users = [];
        }
    }


    /* =====================================
       担当者名取得
    ===================================== */

    function getAssigneeName(userId) {

        if (
            userId === null ||
            userId === undefined ||
            userId === ""
        ) {
            return "未設定";
        }

        const user = users.find(
            item =>
                String(item.id ?? item.user_id) ===
                String(userId)
        );

        return (
            user?.name ??
            user?.display_name ??
            "担当者情報を取得できません"
        );
    }


    /* =====================================
       難易度・不快度の表示
    ===================================== */

    function formatLevel(value) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return "未設定";
        }

        const number = Number(value);

        if (!Number.isFinite(number)) {
            return String(value);
        }

        const labels = {
            1: "低",
            2: "やや低",
            3: "中",
            4: "やや高",
            5: "高"
        };

        const label = labels[number];

        return label
            ? `${number}（${label}）`
            : String(value);
    }


    /* =====================================
       ステータス表示
    ===================================== */

    function formatStatus(status) {

        const statuses = {

            assigned: "未着手",

            not_started: "未着手",

            in_progress: "進行中",

            pending: "承認待ち",

            completed: "完了",

            done: "完了",

            closed: "完了",

            rejected: "差し戻し"

        };

        const normalized =
            String(status ?? "")
                .trim()
                .toLowerCase();

        return (
            statuses[normalized] ||
            status ||
            "未設定"
        );
    }


    /* =====================================
       モーダルHTML読み込み
    ===================================== */

    async function loadDetailModal() {

        if (!modalContainer) {

            throw new Error(
                "モーダルの配置先がありません"
            );
        }

        const response = await fetch(
            MODAL_URL,
            {
                credentials: "same-origin"
            }
        );

        if (!response.ok) {

            throw new Error(
                `モーダルの読み込みに失敗しました: ${response.status}`
            );
        }

        modalContainer.innerHTML =
            await response.text();

        if (
            !document.getElementById(
                "ganttTaskDetailModal"
            )
        ) {

            throw new Error(
                "モーダルのHTMLが正しくありません"
            );
        }
    }


    /* =====================================
       モーダル内の値を設定
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
            value === ""
                ? "未設定"
                : String(value);
    }


    /* =====================================
       タスク詳細モーダル表示
    ===================================== */

    function openTaskDetail(task) {

        const modalElement =
            document.getElementById(
                "ganttTaskDetailModal"
            );

        if (
            !modalElement ||
            !window.bootstrap?.Modal
        ) {

            console.error(
                "タスク詳細モーダルが利用できません"
            );

            return;
        }

        setDetailText(
            "detailTaskTitle",
            task.name
        );

        setDetailText(
            "detailTaskDescription",
            task.description ||
            "説明は登録されていません"
        );

        setDetailText(
            "detailTaskAssignee",
            getAssigneeName(task.assignedUserId)
        );

        setDetailText(
            "detailTaskPriority",
            task.priority ?? "未設定"
        );

        setDetailText(
            "detailTaskStatus",
            formatStatus(task.status)
        );

        setDetailText(
            "detailTaskDifficulty",
            formatLevel(task.difficultyLevel)
        );

        setDetailText(
            "detailTaskDiscomfort",
            formatLevel(task.discomfortLevel)
        );

        setDetailText(
            "detailTaskStartDate",
            formatDate(task.start)
        );

        setDetailText(
            "detailTaskDueDate",
            formatDate(task.end)
        );

        const modal =
            bootstrap.Modal.getOrCreateInstance(
                modalElement
            );

        modal.show();
    }


    /* =====================================
       タスクバークリック
    ===================================== */

    chart.addEventListener("click", event => {

        const bar =
            event.target.closest(".gantt-task-bar");

        if (!bar || !chart.contains(bar)) {
            return;
        }

        const taskId = bar.dataset.taskId;

        const task = tasks.find(
            item =>
                String(item.id) === String(taskId)
        );

        if (!task) {

            console.error(
                "対象タスクが見つかりません:",
                taskId
            );

            return;
        }

        openTaskDetail(task);
    });


    /* =====================================
       キーボード操作
    ===================================== */

    chart.addEventListener("keydown", event => {

        if (
            event.key !== "Enter" &&
            event.key !== " "
        ) {
            return;
        }

        const bar =
            event.target.closest(".gantt-task-bar");

        if (!bar) {
            return;
        }

        event.preventDefault();

        bar.click();
    });


    /* =====================================
       PHPからタスク取得
    ===================================== */

    async function fetchTasks() {

        const currentRequestId = ++requestId;

        const range = getWeekRange();

        const before =
            formatDateForAPI(range.start);

        const after =
            formatDateForAPI(range.end);

        const requestData =
            new URLSearchParams({
                before,
                after
            });

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

            if (currentRequestId !== requestId) {
                return;
            }

            /* 未ログイン */

            if (response.status === 401) {

                window.location.href = "login.html";

                return;
            }

            const responseText =
                await response.text();

            let result;

            try {

                result = JSON.parse(responseText);

            } catch (error) {

                console.error(
                    "PHPレスポンス:",
                    responseText
                );

                throw new Error(
                    "PHPから正しいJSON形式の応答がありません"
                );
            }

            if (
                !response.ok ||
                result.success !== true
            ) {

                throw new Error(
                    result.comment ||
                    result.message ||
                    `タスク取得エラー: ${response.status}`
                );
            }

            if (!Array.isArray(result.tasks)) {

                throw new Error(
                    "タスクデータが配列ではありません"
                );
            }

            if (currentRequestId !== requestId) {
                return;
            }


            /* =================================
               ログイン中のユーザーID取得
            ================================= */

            const userId =
                Number(result.current_user_id);

            if (
                !Number.isSafeInteger(userId) ||
                userId <= 0
            ) {

                throw new Error(
                    "ログイン中のユーザーIDを取得できませんでした"
                );
            }

            currentUserId = userId;


            /* =================================
               タスクデータ取得
            ================================= */

            tasks = result.tasks.map(normalizeTask);

            console.log(
                "ガントチャート取得成功:",
                {
                    currentUserId: currentUserId,
                    totalTasks: tasks.length,
                    completedTasks:
                        tasks.filter(isCompletedTask).length,
                    myActiveTasks:
                        tasks.filter(task =>
                            !isCompletedTask(task) &&
                            isMyTask(task)
                        ).length,
                    otherActiveTasks:
                        tasks.filter(task =>
                            !isCompletedTask(task) &&
                            !isMyTask(task)
                        ).length
                }
            );

            isLoading = false;

            renderChart();

        } catch (error) {

            if (currentRequestId !== requestId) {
                return;
            }

            console.error(
                "ガントチャート取得エラー:",
                error
            );

            tasks = [];

            currentUserId = null;

            isLoading = false;

            errorMessage =
                error.message ||
                "タスク取得に失敗しました";

            renderChart();
        }
    }


    /* =====================================
       ガントチャート描画
    ===================================== */

    function renderChart() {

        const range = getWeekRange();

        const totalWidth =
            range.count * range.width;

        chart.style.setProperty(
            "--timeline-width",
            `${totalWidth}px`
        );

        chart.style.setProperty(
            "--column-width",
            `${range.width}px`
        );

        periodLabel.textContent =
            `${formatDate(range.start)} ～ ${formatDate(range.end)}`;

        if (errorArea) {

            errorArea.hidden = !errorMessage;

            errorArea.textContent = errorMessage;
        }

        if (loadingLabel) {

            loadingLabel.textContent =
                isLoading ? "読み込み中..." : "";
        }

        const visibleTasks = tasks.filter(
            task => isTaskInRange(task, range)
        );

        if (taskCount) {

            taskCount.textContent = isLoading

                ? "タスクを読み込み中..."

                : errorMessage

                    ? "タスク取得失敗"

                    : `表示中のタスク：${visibleTasks.length}件`;
        }

        const weekdays = [
            "日", "月", "火", "水",
            "木", "金", "土"
        ];

        let html = `
            <div class="gantt-row gantt-header">

                <div class="gantt-cell">
                    タスク名
                </div>

                <div class="gantt-dates">
        `;


        /* =================================
           日付ヘッダー
        ================================= */

        for (let i = 0; i < range.count; i++) {

            const date =
                addDays(range.start, i);

            const day = date.getDay();

            const dayClass =
                day === 0 ? "sunday" :
                day === 6 ? "saturday" : "";

            const isToday =
                dayDiff(date, new Date()) === 0;

            html += `
                <div class="gantt-date ${dayClass} ${isToday ? "today" : ""}">

                    ${date.getMonth() + 1}/${date.getDate()}

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
           タスク行
        ================================= */

        visibleTasks.forEach(task => {

            const start = task.start;

            const end = task.end;

            if (!start || !end) {
                return;
            }

            const visibleStartDate =
                start > range.start
                    ? start
                    : range.start;

            const visibleEndDate =
                end < range.end
                    ? end
                    : range.end;

            const startOffset =
                dayDiff(
                    range.start,
                    visibleStartDate
                );

            const visibleDays =
                dayDiff(
                    visibleStartDate,
                    visibleEndDate
                ) + 1;

            const left =
                startOffset * range.width + 6;

            const width = Math.max(
                12,
                visibleDays * range.width - 12
            );


            /* =================================
               完了判定
            ================================= */

            const isCompleted =
                isCompletedTask(task);


            /* =================================
               3色の色分け判定
            ================================= */

            const statusClass =
                getTaskColorClass(task);

            const colorLabel =
                getTaskColorLabel(task);


            /* =================================
               ツールチップ
            ================================= */

            const tooltip =

                `${task.name}\n` +

                `開始日：${formatDate(start)}\n` +

                `終了日：${formatDate(end)}\n` +

                `ステータス：${formatStatus(task.status)}\n` +

                `分類：${colorLabel}`;


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
                        title="${escapeHTML(task.name)}"
                    >

                        <i class="bi bi-list-task"></i>

                        <span>
                            ${escapeHTML(task.name)}
                        </span>

                    </div>

                    <div class="gantt-timeline">

                        ${barHTML}

                    </div>

                </div>

            `;
        });


        /* =================================
           タスクなし
        ================================= */

        if (
            visibleTasks.length === 0 &&
            !isLoading &&
            !errorMessage
        ) {

            html += `

                <div class="gantt-empty">

                    <i class="bi bi-calendar-x"></i>

                    <p>
                        この期間にタスクはありません。
                    </p>

                </div>

            `;
        }


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

        chart.innerHTML = html;
    }


    /* =====================================
       画面更新
    ===================================== */

    function updateGantt() {

        fetchTasks();
    }


    /* =====================================
       前週
    ===================================== */

    prevButton?.addEventListener("click", () => {

        currentDate = addDays(
            currentDate,
            -7
        );

        updateGantt();
    });


    /* =====================================
       翌週
    ===================================== */

    nextButton?.addEventListener("click", () => {

        currentDate = addDays(
            currentDate,
            7
        );

        updateGantt();
    });


    /* =====================================
       今週
    ===================================== */

    todayButton?.addEventListener("click", () => {

        currentDate = new Date();

        updateGantt();
    });


    /* =====================================
       初期処理
    ===================================== */

    async function initialize() {

        try {

            await loadDetailModal();

        } catch (error) {

            console.error(
                "モーダル読み込みエラー:",
                error
            );
        }

        await Promise.all([
            loadUsers(),
            fetchTasks()
        ]);
    }

    initialize();

});