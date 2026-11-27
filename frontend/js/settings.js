/* ========================================
   Tasfina 設定画面
   settings.js
   MySQL・PHP連携対応版
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    "use strict";


    /* ========================================
       共通設定
    ======================================== */

    const API_URL = "../../backend/setting_api.php";

    const get = id => document.getElementById(id);

    const clone = value =>
        JSON.parse(JSON.stringify(value));


    /* ========================================
       状態管理
    ======================================== */

    let shiftTypes = [];

    let rules = {};

    let scoreSettings = {};

    let workTypes = [];

    let editingWorkTypes = [];

    let selectedShiftId = null;

    let csrfToken = "";

    let canEdit = false;

    let initialized = false;

    let isSaving = false;

    let workTypeModal = null;


    /* ========================================
       HTML要素取得
    ======================================== */

    const shiftTable = get("shiftTypeTableBody");

    const shiftForm = get("shiftTypeForm");

    const rulesForm = get("shiftRulesForm");

    const editorHeading = get("editorHeading");

    const shiftMessage = get("shiftSettingsMessage");

    const scoreMessage = get("scoreMessage");

    const workTypeRows = get("workTypeRows");

    const workTypeForm = get("workTypeEditForm");

    const workTypeError = get("workTypeError");

    const workTypeModalElement = get("workTypeEditModal");


    /* ========================================
       共通処理：HTMLエスケープ
    ======================================== */

    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /* ========================================
       共通処理：スコア表示
    ======================================== */

    function formatScore(value) {

        const number = Number(value);

        return Number.isFinite(number)
            ? number.toFixed(1)
            : "0.0";

    }


    /* ========================================
       共通処理：休憩時間表示
    ======================================== */

    function formatBreak(minutes) {

        const value = Number(minutes);

        if (!value) {
            return "なし";
        }

        const hours = Math.floor(value / 60);

        const remaining = value % 60;

        if (hours === 0) {
            return `${remaining}分`;
        }

        if (remaining === 0) {
            return `${hours}時間`;
        }

        return `${hours}時間${remaining}分`;

    }


    /* ========================================
       共通処理：ID生成
    ======================================== */

    function nextId(items) {

        return Math.max(
            0,
            ...items.map(item => Number(item.id) || 0)
        ) + 1;

    }


    /* ========================================
       共通処理：数値チェック
    ======================================== */

    function isValidNumber(value, min, max) {

        if (
            value === null ||
            value === undefined ||
            String(value).trim() === ""
        ) {
            return false;
        }

        const number = Number(value);

        return (
            Number.isFinite(number) &&
            number >= min &&
            number <= max
        );

    }


    /* ========================================
       共通処理：メッセージ表示
    ======================================== */

    function showShiftMessage(message, isError = false) {

        shiftMessage.textContent = message;

        shiftMessage.classList.toggle(
            "error",
            isError
        );

    }


    function showScoreMessage(message, isError = false) {

        scoreMessage.textContent = message;

        scoreMessage.classList.toggle(
            "error",
            isError
        );

    }


    function showWorkTypeError(message = "") {

        workTypeError.textContent = message;

        workTypeError.hidden = message === "";

    }


    /* ========================================
       API通信
    ======================================== */

    async function requestApi(method = "GET", body = null) {

        const options = {

            method: method,

            credentials: "same-origin",

            cache: "no-store",

            headers: {
                "Accept": "application/json"
            }

        };

        if (method === "POST") {

            options.headers["Content-Type"] =
                "application/json";

            options.headers["X-CSRF-Token"] =
                csrfToken;

            options.body = JSON.stringify(body);

        }

        const response = await fetch(
            API_URL,
            options
        );

        let result;

        try {

            result = await response.json();

        } catch (error) {

            throw new Error(
                "サーバーから正常なJSONが返されませんでした。"
            );

        }

        if (response.status === 401) {

            window.location.href = "login.html";

            throw new Error(
                "ログインが必要です。"
            );

        }

        if (!response.ok || result.success !== true) {

            throw new Error(
                result.message ||
                result.comment ||
                "設定の取得または保存に失敗しました。"
            );

        }

        return result;

    }


    /* ========================================
       APIレスポンス確認
    ======================================== */

    function validateResponseSettings(settings) {

        if (
            !settings ||
            !Array.isArray(settings.shiftTypes) ||
            !settings.rules ||
            !settings.scoreSettings ||
            !settings.scoreSettings.conditions ||
            !Array.isArray(settings.workTypes)
        ) {

            throw new Error(
                "設定データの形式が不正です。"
            );

        }

    }


    /* ========================================
       初期設定データ取得
    ======================================== */

    async function loadSettings() {

        const result = await requestApi("GET");

        validateResponseSettings(result.settings);

        csrfToken = result.csrf_token || "";

        canEdit = result.can_edit === true;

        if (canEdit && !csrfToken) {

            throw new Error(
                "セキュリティトークンを取得できませんでした。"
            );

        }

        shiftTypes = clone(
            result.settings.shiftTypes
        );

        rules = clone(
            result.settings.rules
        );

        scoreSettings = clone(
            result.settings.scoreSettings
        );

        workTypes = clone(
            result.settings.workTypes
        );

    }


    /* ========================================
       編集可能状態の確認
    ======================================== */

    function isEditable() {

        return (
            initialized &&
            canEdit &&
            !isSaving
        );

    }


    /* ========================================
       編集権限・保存中の操作制御
    ======================================== */

    function applyPermissions() {

        const disabled = !isEditable();

        const controls = document.querySelectorAll(
            "#panel-shifts input, " +
            "#panel-shifts select, " +
            "#panel-shifts textarea, " +
            "#panel-shifts button, " +
            "#panel-scores input, " +
            "#panel-scores select, " +
            "#panel-scores textarea, " +
            "#panel-scores button, " +
            "#workTypeEditForm input, " +
            "#workTypeEditForm button, " +
            "#saveWorkTypesButton"
        );

        controls.forEach(element => {

            element.disabled = disabled;

        });

        // ヘルプボタンは閲覧時も利用可能

        document.querySelectorAll(
            ".score-help-button"
        ).forEach(button => {

            button.disabled = false;

        });

        // 業務タイプの内容確認は閲覧者も可能

        get("openWorkTypeEditButton").disabled =
            !initialized || isSaving;

        // シフト詳細の閲覧は許可

        shiftTable.querySelectorAll(
            '[data-action="edit"]'
        ).forEach(button => {

            button.disabled =
                !initialized || isSaving;

        });

    }


    /* ========================================
       保存処理
    ======================================== */

    async function saveSettings(action, data) {

        if (!isEditable()) {

            throw new Error(
                "設定を変更できない状態です。"
            );

        }

        isSaving = true;

        applyPermissions();

        try {

            const result = await requestApi(
                "POST",
                {
                    action: action,
                    data: data
                }
            );

            validateResponseSettings(
                result.settings
            );

            canEdit = result.can_edit === true;

            /*
               保存した項目のみ更新する。

               他の設定欄に入力途中の内容が
               ある場合に上書きしないため。
            */

            switch (action) {

                case "save_shift_types":

                    shiftTypes = clone(
                        result.settings.shiftTypes
                    );

                    break;

                case "save_rules":

                    rules = clone(
                        result.settings.rules
                    );

                    break;

                case "save_scores":
                case "reset_scores":

                    scoreSettings = clone(
                        result.settings.scoreSettings
                    );

                    break;

                case "save_work_types":

                    workTypes = clone(
                        result.settings.workTypes
                    );

                    break;

            }

            return result;

        } finally {

            isSaving = false;

            applyPermissions();

        }

    }


    /* ========================================
       シフト種別一覧表示
    ======================================== */

    function renderShiftTypes() {

        if (shiftTypes.length === 0) {

            shiftTable.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        シフト種別が登録されていません。
                    </td>
                </tr>
            `;

            return;

        }

        shiftTable.innerHTML = shiftTypes.map(item => {

            const id = Number(item.id);

            const selectedClass =
                id === selectedShiftId
                    ? "selected-row"
                    : "";

            const workingTime =
                item.start && item.end
                    ? `${escapeHtml(item.start)} ～ ${escapeHtml(item.end)}`
                    : "-";

            return `
                <tr
                    class="${selectedClass}"
                    data-id="${id}"
                >

                    <td>
                        ${escapeHtml(item.name)}
                    </td>

                    <td>
                        <span
                            class="shift-color-dot"
                            data-shift-color="${escapeHtml(item.color)}"
                        ></span>
                    </td>

                    <td>
                        ${workingTime}
                    </td>

                    <td>
                        ${formatBreak(item.breakMinutes)}
                    </td>

                    <td>
                        ${formatScore(item.score)}
                    </td>

                    <td>
                        ${escapeHtml(item.description || "-")}
                    </td>

                    <td>

                        <div class="shift-table-actions">

                            <button
                                type="button"
                                class="shift-action-button"
                                data-action="edit"
                                data-id="${id}"
                                title="詳細・編集"
                                aria-label="詳細・編集"
                            >
                                <i class="bi bi-pencil-fill"></i>
                            </button>

                            <button
                                type="button"
                                class="shift-action-button delete"
                                data-action="delete"
                                data-id="${id}"
                                title="削除"
                                aria-label="削除"
                            >
                                <i class="bi bi-trash"></i>
                            </button>

                        </div>

                    </td>

                </tr>
            `;

        }).join("");


        /* ========================================
           表示色の反映
        ======================================== */

        shiftTable.querySelectorAll(
            "[data-shift-color]"
        ).forEach(element => {

            const color =
                element.dataset.shiftColor;

            const validColor =
                /^#[0-9a-fA-F]{6}$/.test(color)
                    ? color
                    : "#cccccc";

            element.style.setProperty(
                "--shift-dot-color",
                validColor
            );

            element.style.backgroundColor =
                validColor;

        });

        applyPermissions();

    }


    /* ========================================
       シフト種別：新規追加
    ======================================== */

    function addShiftType(focus = true) {

        selectedShiftId = null;

        shiftForm.reset();

        editorHeading.textContent =
            "シフト種別の新規追加";

        get("shiftTypeName").value = "";

        get("shiftTypeColor").value = "#409eff";

        get("shiftStartTime").value = "";

        get("shiftEndTime").value = "";

        get("shiftBreakMinutes").value = "0";

        get("shiftTypeScore").value = "1.0";

        get("shiftTypeDescription").value = "";

        renderShiftTypes();

        if (focus && isEditable()) {

            get("shiftTypeName").focus();

        }

    }


    /* ========================================
       シフト種別：詳細・編集
    ======================================== */

    function editShiftType(id) {

        const item = shiftTypes.find(
            shift => Number(shift.id) === Number(id)
        );

        if (!item) {
            return;
        }

        selectedShiftId = Number(item.id);

        editorHeading.textContent =
            "シフト種別の詳細設定";

        get("shiftTypeName").value =
            item.name;

        get("shiftTypeColor").value =
            item.color;

        get("shiftStartTime").value =
            item.start || "";

        get("shiftEndTime").value =
            item.end || "";

        get("shiftBreakMinutes").value =
            String(item.breakMinutes);

        get("shiftTypeScore").value =
            item.score;

        get("shiftTypeDescription").value =
            item.description || "";

        renderShiftTypes();

    }


    /* ========================================
       シフト種別：削除
    ======================================== */

    async function deleteShiftType(id) {

        if (!isEditable()) {
            return;
        }

        const item = shiftTypes.find(
            shift => Number(shift.id) === Number(id)
        );

        if (!item) {
            return;
        }

        const confirmed = window.confirm(
            `「${item.name}」を削除しますか？`
        );

        if (!confirmed) {
            return;
        }

        const updated = shiftTypes.filter(
            shift => Number(shift.id) !== Number(id)
        );

        try {

            const result = await saveSettings(
                "save_shift_types",
                updated
            );

            if (selectedShiftId === Number(id)) {

                if (shiftTypes.length > 0) {

                    editShiftType(
                        shiftTypes[0].id
                    );

                } else {

                    addShiftType(false);

                }

            } else {

                renderShiftTypes();

            }

            updateCalculationExample();

            showShiftMessage(
                result.message
            );

        } catch (error) {

            showShiftMessage(
                error.message,
                true
            );

        }

    }


    /* ========================================
       勤務時間計算
    ======================================== */

    function timeToMinutes(time) {

        const parts = time.split(":").map(Number);

        return parts[0] * 60 + parts[1];

    }


    function calculateWorkingMinutes(start, end) {

        const startMinutes =
            timeToMinutes(start);

        const endMinutes =
            timeToMinutes(end);

        return (
            endMinutes - startMinutes + 1440
        ) % 1440;

    }


    /* ========================================
       シフト種別：保存
    ======================================== */

    shiftForm.addEventListener("submit", async event => {

        event.preventDefault();

        if (!isEditable()) {
            return;
        }

        const name =
            get("shiftTypeName").value.trim();

        const color =
            get("shiftTypeColor").value;

        const start =
            get("shiftStartTime").value;

        const end =
            get("shiftEndTime").value;

        const breakMinutes = Number(
            get("shiftBreakMinutes").value
        );

        const scoreValue =
            get("shiftTypeScore").value;

        const description =
            get("shiftTypeDescription").value.trim();


        /* ========================================
           入力チェック
        ======================================== */

        if (!name || name.length > 50) {

            showShiftMessage(
                "シフト種別名は1～50文字で入力してください。",
                true
            );

            return;

        }

        const duplicate = shiftTypes.some(item => {

            return (
                item.name.trim() === name &&
                Number(item.id) !== selectedShiftId
            );

        });

        if (duplicate) {

            showShiftMessage(
                "同じ名前のシフト種別が存在します。",
                true
            );

            return;

        }

        if (!/^#[0-9a-fA-F]{6}$/.test(color)) {

            showShiftMessage(
                "表示色が不正です。",
                true
            );

            return;

        }

        if (
            (start && !end) ||
            (!start && end)
        ) {

            showShiftMessage(
                "開始時刻と終了時刻を両方入力してください。",
                true
            );

            return;

        }

        if (
            start &&
            end &&
            start === end
        ) {

            showShiftMessage(
                "開始時刻と終了時刻を同じ時刻にはできません。",
                true
            );

            return;

        }

        if (
            ![0, 30, 45, 60, 90].includes(breakMinutes)
        ) {

            showShiftMessage(
                "休憩時間が不正です。",
                true
            );

            return;

        }

        if (!start && !end && breakMinutes !== 0) {

            showShiftMessage(
                "勤務時間がない場合は休憩時間を設定できません。",
                true
            );

            return;

        }

        if (start && end) {

            const workingMinutes =
                calculateWorkingMinutes(
                    start,
                    end
                );

            if (breakMinutes >= workingMinutes) {

                showShiftMessage(
                    "休憩時間は勤務時間より短くしてください。",
                    true
                );

                return;

            }

        }

        if (!isValidNumber(scoreValue, 0, 10)) {

            showShiftMessage(
                "負担スコアは0～10で入力してください。",
                true
            );

            return;

        }

        if (description.length > 300) {

            showShiftMessage(
                "説明は300文字以内で入力してください。",
                true
            );

            return;

        }

        if (
            selectedShiftId === null &&
            shiftTypes.length >= 100
        ) {

            showShiftMessage(
                "シフト種別は100件まで登録できます。",
                true
            );

            return;

        }


        /* ========================================
           保存データ作成
        ======================================== */

        const id =
            selectedShiftId === null
                ? nextId(shiftTypes)
                : selectedShiftId;

        const item = {

            id: id,

            name: name,

            color: color,

            start: start,

            end: end,

            breakMinutes: breakMinutes,

            score: Number(scoreValue),

            description: description

        };

        const updated = clone(shiftTypes);

        const index = updated.findIndex(
            shift => Number(shift.id) === id
        );

        if (index === -1) {

            updated.push(item);

        } else {

            updated[index] = item;

        }


        /* ========================================
           PHPへ送信
        ======================================== */

        try {

            const result = await saveSettings(
                "save_shift_types",
                updated
            );

            editShiftType(id);

            updateCalculationExample();

            showShiftMessage(
                result.message
            );

        } catch (error) {

            showShiftMessage(
                error.message,
                true
            );

        }

    });


    /* ========================================
       シフト種別：一覧操作
    ======================================== */

    shiftTable.addEventListener("click", event => {

        if (!initialized || isSaving) {
            return;
        }

        const button = event.target.closest(
            "button[data-action]"
        );

        if (button) {

            const id = Number(button.dataset.id);

            if (button.dataset.action === "edit") {

                editShiftType(id);

            }

            if (button.dataset.action === "delete") {

                deleteShiftType(id);

            }

            return;

        }

        const row = event.target.closest(
            "tr[data-id]"
        );

        if (row) {

            editShiftType(
                Number(row.dataset.id)
            );

        }

    });


    /* ========================================
       シフト種別：追加ボタン
    ======================================== */

    get("addShiftTypeButton")
        .addEventListener("click", () => {

            if (!isEditable()) {
                return;
            }

            showShiftMessage("");

            addShiftType();

        });


    /* ========================================
       シフト種別：キャンセルボタン
    ======================================== */

    get("cancelShiftTypeButton")
        .addEventListener("click", () => {

            if (!isEditable()) {
                return;
            }

            showShiftMessage("");

            if (selectedShiftId !== null) {

                editShiftType(
                    selectedShiftId
                );

            } else if (shiftTypes.length > 0) {

                editShiftType(
                    shiftTypes[0].id
                );

            } else {

                addShiftType(false);

            }

        });


    /* ========================================
       自動調整ルール：画面反映
    ======================================== */

    function applyRules() {

        get("maxConsecutiveDays").value =
            rules.maxConsecutiveDays;

        get("maxMonthlyDays").value =
            rules.maxMonthlyDays;

        get("requestPriority").value =
            rules.requestPriority;

    }


    /* ========================================
       自動調整ルール：保存
    ======================================== */

    rulesForm.addEventListener("submit", async event => {

        event.preventDefault();

        if (!isEditable()) {
            return;
        }

        const maxConsecutiveDays = Number(
            get("maxConsecutiveDays").value
        );

        const maxMonthlyDays = Number(
            get("maxMonthlyDays").value
        );

        const requestPriority =
            get("requestPriority").value;


        /* ========================================
           入力チェック
        ======================================== */

        if (
            !Number.isInteger(maxConsecutiveDays) ||
            maxConsecutiveDays < 1 ||
            maxConsecutiveDays > 31
        ) {

            showShiftMessage(
                "連続勤務の上限日数は1～31日で入力してください。",
                true
            );

            return;

        }

        if (
            !Number.isInteger(maxMonthlyDays) ||
            maxMonthlyDays < 1 ||
            maxMonthlyDays > 31
        ) {

            showShiftMessage(
                "月の最大勤務日数は1～31日で入力してください。",
                true
            );

            return;

        }

        if (maxConsecutiveDays > maxMonthlyDays) {

            showShiftMessage(
                "連続勤務の上限日数は月の最大勤務日数以下にしてください。",
                true
            );

            return;

        }

        if (
            !["high", "medium", "low"]
                .includes(requestPriority)
        ) {

            showShiftMessage(
                "希望シフトの優先度が不正です。",
                true
            );

            return;

        }


        /* ========================================
           保存データ作成
        ======================================== */

        const data = {

            maxConsecutiveDays: maxConsecutiveDays,

            maxMonthlyDays: maxMonthlyDays,

            requestPriority: requestPriority

        };


        /* ========================================
           PHPへ送信
        ======================================== */

        try {

            const result = await saveSettings(
                "save_rules",
                data
            );

            applyRules();

            updateCalculationExample();

            showShiftMessage(
                result.message
            );

        } catch (error) {

            showShiftMessage(
                error.message,
                true
            );

        }

    });


    /* ========================================
       負担スコア設定：画面反映
    ======================================== */

    function applyScoreSettings() {

        const conditions =
            scoreSettings.conditions;

        get("aggregationPeriod").value =
            String(scoreSettings.aggregationPeriod);

        get("resetTiming").value =
            scoreSettings.resetTiming;

        get("consecutiveScore").value =
            conditions.consecutive;

        get("nightScore").value =
            conditions.night;

        get("earlyScore").value =
            conditions.early;

        get("weeklyOverScore").value =
            conditions.weeklyOver;

        updateCalculationExample();

    }


    /* ========================================
       負担スコア設定：入力値取得
    ======================================== */

    function readScoreForm() {

        const aggregationPeriod =
            get("aggregationPeriod").value;

        const resetTiming =
            get("resetTiming").value;

        const consecutive =
            get("consecutiveScore").value;

        const night =
            get("nightScore").value;

        const early =
            get("earlyScore").value;

        const weeklyOver =
            get("weeklyOverScore").value;


        /* ========================================
           入力チェック
        ======================================== */

        if (
            !["1", "2", "4", "8"]
                .includes(aggregationPeriod)
        ) {

            throw new Error(
                "集計期間が不正です。"
            );

        }

        if (
            !["weekly", "monthly", "quarterly", "none"]
                .includes(resetTiming)
        ) {

            throw new Error(
                "リセットタイミングが不正です。"
            );

        }

        const values = [

            {
                name: "連続勤務",
                value: consecutive
            },

            {
                name: "夜間シフト",
                value: night
            },

            {
                name: "早朝シフト",
                value: early
            },

            {
                name: "週の上限超過",
                value: weeklyOver
            }

        ];

        for (const item of values) {

            if (!isValidNumber(item.value, 0, 100)) {

                throw new Error(
                    `${item.name}のスコアは0～100で入力してください。`
                );

            }

        }


        /* ========================================
           設定データ返却
        ======================================== */

        return {

            aggregationPeriod: aggregationPeriod,

            resetTiming: resetTiming,

            conditions: {

                consecutive: Number(consecutive),

                night: Number(night),

                early: Number(early),

                weeklyOver: Number(weeklyOver)

            }

        };

    }


    /* ========================================
       負担スコア計算
    ======================================== */

    function calculateScore(data, config) {

        const conditions =
            config.conditions;

        const baseScore =
            Number(data.baseScore || 0) *
            Number(data.multiplier ?? 1);

        const consecutiveScore =
            Math.max(
                0,
                Number(data.consecutiveDays || 0) - 1
            ) *
            Number(conditions.consecutive);

        const nightScore =
            data.isNight
                ? Number(conditions.night)
                : 0;

        const earlyScore =
            data.isEarly
                ? Number(conditions.early)
                : 0;

        const weeklyOverScore =
            Math.max(
                0,
                Number(data.weeklyOverDays || 0)
            ) *
            Number(conditions.weeklyOver);

        const total =
            baseScore +
            consecutiveScore +
            nightScore +
            earlyScore +
            weeklyOverScore;

        return {

            baseScore,

            consecutiveScore,

            nightScore,

            earlyScore,

            weeklyOverScore,

            total

        };

    }


    /* ========================================
       負担スコア：計算例更新
    ======================================== */

    function updateCalculationExample() {

        if (!scoreSettings.conditions) {
            return;
        }

        let config;

        try {

            config = readScoreForm();

        } catch (error) {

            // 入力途中で不正な値の場合は更新しない

            return;

        }

        const conditions =
            config.conditions;


        /* ========================================
           計算式の表示更新
        ======================================== */

        get("formulaConsecutive").textContent =
            formatScore(conditions.consecutive);

        get("formulaNight").textContent =
            formatScore(conditions.night);

        get("formulaEarly").textContent =
            formatScore(conditions.early);

        get("formulaWeekly").textContent =
            formatScore(conditions.weeklyOver);


        /* ========================================
           基本スコア取得
        ======================================== */

        const normalShift =
            shiftTypes.find(
                item => item.name === "通常出勤"
            ) ||
            shiftTypes.find(
                item => Number(item.id) === 1
            ) ||
            shiftTypes[0];

        const baseScore =
            normalShift
                ? Number(normalShift.score)
                : 0;


        /* ========================================
           計算例の条件

           連続勤務：3日目
           夜間勤務：あり
           早朝勤務：なし
           週の上限超過：なし
           業務倍率：1.0
        ======================================== */

        const result = calculateScore(
            {

                baseScore: baseScore,

                multiplier: 1,

                consecutiveDays: 3,

                isNight: true,

                isEarly: false,

                weeklyOverDays: 0

            },
            config
        );


        /* ========================================
           計算結果表示
        ======================================== */

        get("exampleBase").textContent =
            formatScore(result.baseScore);

        get("exampleConsecutive").textContent =
            formatScore(result.consecutiveScore);

        get("exampleNight").textContent =
            formatScore(result.nightScore);

        get("exampleTotal").textContent =
            formatScore(result.total);


        /* ========================================
           計算例のシフト種別名更新
        ======================================== */

        const baseCell = get("exampleBase");

        if (baseCell.previousElementSibling) {

            baseCell.previousElementSibling.textContent =
                normalShift
                    ? normalShift.name
                    : "未登録";

        }

    }


    /* ========================================
       負担スコア設定：保存
    ======================================== */

    async function saveScoreSettings() {

        if (!isEditable()) {
            return;
        }

        try {

            const data = readScoreForm();

            const result = await saveSettings(
                "save_scores",
                data
            );

            applyScoreSettings();

            showScoreMessage(
                result.message
            );

        } catch (error) {

            showScoreMessage(
                error.message,
                true
            );

        }

    }


    /* ========================================
       負担スコア設定：リセット
    ======================================== */

    async function resetScoreSettings() {

        if (!isEditable()) {
            return;
        }

        const confirmed = window.confirm(
            "負担スコア設定を初期値に戻しますか？\n" +
            "シフト種別と業務タイプの設定は変更されません。"
        );

        if (!confirmed) {
            return;
        }

        try {

            const result = await saveSettings(
                "reset_scores",
                {}
            );

            applyScoreSettings();

            showScoreMessage(
                result.message
            );

        } catch (error) {

            showScoreMessage(
                error.message,
                true
            );

        }

    }


    /* ========================================
       負担スコア設定：リアルタイム計算
    ======================================== */

    [

        "aggregationPeriod",

        "resetTiming",

        "consecutiveScore",

        "nightScore",

        "earlyScore",

        "weeklyOverScore"

    ].forEach(id => {

        const element = get(id);

        element.addEventListener(
            "input",
            () => {

                showScoreMessage("");

                updateCalculationExample();

            }
        );

        element.addEventListener(
            "change",
            updateCalculationExample
        );

    });


    /* ========================================
       負担スコア設定：ボタン操作
    ======================================== */

    get("saveScoresButton")
        .addEventListener(
            "click",
            saveScoreSettings
        );

    get("resetScoresButton")
        .addEventListener(
            "click",
            resetScoreSettings
        );


    /* ========================================
       業務タイプ：行作成
    ======================================== */

    function createWorkTypeRow(item) {

        const row = document.createElement("tr");

        row.dataset.id = Number(item.id);

        row.innerHTML = `

            <td>

                <input
                    type="text"
                    class="form-control work-type-name"
                    maxlength="50"
                    value="${escapeHtml(item.name)}"
                    aria-label="業務タイプ名"
                    required
                >

            </td>

            <td>

                <input
                    type="number"
                    class="form-control work-type-rate"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value="${escapeHtml(item.multiplier)}"
                    aria-label="業務倍率"
                    required
                >

            </td>

            <td>

                <input
                    type="checkbox"
                    class="form-check-input work-type-enabled"
                    aria-label="有効"
                    ${item.enabled ? "checked" : ""}
                >

            </td>

            <td>

                <button
                    type="button"
                    class="btn btn-outline-danger btn-sm work-type-remove"
                    data-action="delete"
                    aria-label="業務タイプを削除"
                >

                    <i class="bi bi-trash"></i>

                    削除

                </button>

            </td>

        `;

        return row;

    }


    /* ========================================
       業務タイプ：一覧表示
    ======================================== */

    function renderWorkTypes() {

        workTypeRows.innerHTML = "";

        editingWorkTypes.forEach(item => {

            workTypeRows.appendChild(
                createWorkTypeRow(item)
            );

        });

        applyPermissions();

    }


    /* ========================================
       業務タイプ：現在の入力値取得
    ======================================== */

    function readWorkTypeRows() {

        const rows = workTypeRows.querySelectorAll(
            "tr[data-id]"
        );

        return Array.from(rows).map(row => {

            return {

                id: Number(row.dataset.id),

                name: row.querySelector(
                    ".work-type-name"
                ).value.trim(),

                multiplier: row.querySelector(
                    ".work-type-rate"
                ).value,

                enabled: row.querySelector(
                    ".work-type-enabled"
                ).checked

            };

        });

    }


    /* ========================================
       業務タイプ：追加
    ======================================== */

    function addWorkType() {

        if (!isEditable()) {
            return;
        }

        editingWorkTypes =
            readWorkTypeRows();

        if (editingWorkTypes.length >= 100) {

            showWorkTypeError(
                "業務タイプは100件まで登録できます。"
            );

            return;

        }

        editingWorkTypes.push({

            id: nextId(editingWorkTypes),

            name: "",

            multiplier: 1.0,

            enabled: true

        });

        renderWorkTypes();

        showWorkTypeError("");

        const lastRow =
            workTypeRows.lastElementChild;

        if (lastRow) {

            lastRow.querySelector(
                ".work-type-name"
            ).focus();

        }

    }


    /* ========================================
       業務タイプ：削除
    ======================================== */

    workTypeRows.addEventListener("click", event => {

        if (!isEditable()) {
            return;
        }

        const button = event.target.closest(
            'button[data-action="delete"]'
        );

        if (!button) {
            return;
        }

        const row = button.closest(
            "tr[data-id]"
        );

        if (!row) {
            return;
        }

        editingWorkTypes =
            readWorkTypeRows();

        if (editingWorkTypes.length <= 1) {

            showWorkTypeError(
                "業務タイプは1件以上必要です。"
            );

            return;

        }

        const id = Number(row.dataset.id);

        editingWorkTypes =
            editingWorkTypes.filter(
                item => item.id !== id
            );

        renderWorkTypes();

        showWorkTypeError("");

    });


    /* ========================================
       業務タイプ：入力チェック
    ======================================== */

    function collectWorkTypes() {

        const items =
            readWorkTypeRows();

        if (
            items.length < 1 ||
            items.length > 100
        ) {

            throw new Error(
                "業務タイプは1～100件登録してください。"
            );

        }

        const names = new Set();

        const ids = new Set();

        const result = [];

        for (const item of items) {

            if (
                !Number.isInteger(item.id) ||
                item.id <= 0 ||
                ids.has(item.id)
            ) {

                throw new Error(
                    "業務タイプIDが不正です。"
                );

            }

            if (
                !item.name ||
                item.name.length > 50
            ) {

                throw new Error(
                    "業務タイプ名は1～50文字で入力してください。"
                );

            }

            const normalizedName =
                item.name.toLowerCase();

            if (names.has(normalizedName)) {

                throw new Error(
                    "業務タイプ名が重複しています。"
                );

            }

            if (
                !isValidNumber(
                    item.multiplier,
                    0.1,
                    10
                )
            ) {

                throw new Error(
                    "業務倍率は0.1～10で入力してください。"
                );

            }

            names.add(normalizedName);

            ids.add(item.id);

            result.push({

                id: item.id,

                name: item.name,

                multiplier: Number(item.multiplier),

                enabled: item.enabled

            });

        }

        const hasEnabled = result.some(
            item => item.enabled
        );

        if (!hasEnabled) {

            throw new Error(
                "業務タイプを1件以上有効にしてください。"
            );

        }

        return result;

    }


    /* ========================================
       業務タイプ：保存
    ======================================== */

    workTypeForm.addEventListener("submit", async event => {

        event.preventDefault();

        if (!isEditable()) {
            return;
        }

        showWorkTypeError("");

        try {

            const data =
                collectWorkTypes();

            const result = await saveSettings(
                "save_work_types",
                data
            );

            editingWorkTypes =
                clone(workTypes);

            renderWorkTypes();

            if (workTypeModal) {

                workTypeModal.hide();

            }

            showScoreMessage(
                result.message
            );

            updateCalculationExample();

        } catch (error) {

            showWorkTypeError(
                error.message
            );

        }

    });


    /* ========================================
       業務タイプ：追加ボタン
    ======================================== */

    get("addWorkTypeButton")
        .addEventListener(
            "click",
            addWorkType
        );


    /* ========================================
       業務タイプ：入力時のエラー解除
    ======================================== */

    workTypeRows.addEventListener("input", () => {

        showWorkTypeError("");

    });


    /* ========================================
       業務タイプ：モーダル表示
    ======================================== */

    function openWorkTypeModal() {

        if (!initialized || isSaving) {
            return;
        }

        if (!window.bootstrap) {

            showScoreMessage(
                "モーダルの読み込みに失敗しました。",
                true
            );

            return;

        }

        editingWorkTypes =
            clone(workTypes);

        renderWorkTypes();

        showWorkTypeError("");

        workTypeModal =
            bootstrap.Modal.getOrCreateInstance(
                workTypeModalElement
            );

        workTypeModal.show();

    }


    /* ========================================
       業務タイプ：モーダル操作
    ======================================== */

    get("openWorkTypeEditButton")
        .addEventListener(
            "click",
            openWorkTypeModal
        );


    /* 保存中はモーダルを閉じない */

    workTypeModalElement.addEventListener(
        "hide.bs.modal",
        event => {

            if (isSaving) {

                event.preventDefault();

            }

        }
    );


    /* モーダル終了時に未保存データを破棄 */

    workTypeModalElement.addEventListener(
        "hidden.bs.modal",
        () => {

            editingWorkTypes = [];

            showWorkTypeError("");

        }
    );


    /* ========================================
       Bootstrapツールチップ初期化
    ======================================== */

    function initializeTooltips() {

        if (!window.bootstrap) {
            return;
        }

        document.querySelectorAll(
            '[data-bs-toggle="tooltip"]'
        ).forEach(element => {

            bootstrap.Tooltip.getOrCreateInstance(
                element
            );

        });

    }


    /* ========================================
       注意書き更新
    ======================================== */

    function updateSettingsNote() {

        const note = document.querySelector(
            ".settings-demo-note"
        );

        if (!note) {
            return;
        }

        if (canEdit) {

            note.textContent =
                "設定は所属グループごとにデータベースへ保存されます。" +
                "実際のシフト・ランキングの計算への反映は別途連携が必要です。";

        } else {

            note.textContent =
                "現在のアカウントは設定の閲覧のみ可能です。";

        }

    }


    /* ========================================
       初期化
    ======================================== */

    async function initialize() {

        applyPermissions();

        showShiftMessage(
            "設定データを読み込み中..."
        );

        showScoreMessage(
            "設定データを読み込み中..."
        );

        try {

            /* PHPから設定取得 */

            await loadSettings();


            /* 初期化完了 */

            initialized = true;


            /* シフト種別表示 */

            if (shiftTypes.length > 0) {

                editShiftType(
                    shiftTypes[0].id
                );

            } else {

                addShiftType(false);

            }


            /* 自動調整ルール表示 */

            applyRules();


            /* 負担スコア設定表示 */

            applyScoreSettings();


            /* 編集権限反映 */

            applyPermissions();


            /* 注意書き更新 */

            updateSettingsNote();


            /* ツールチップ初期化 */

            initializeTooltips();


            /* メッセージ初期化 */

            showShiftMessage("");

            showScoreMessage("");

            if (!canEdit) {

                showShiftMessage(
                    "設定の閲覧のみ可能です。"
                );

                showScoreMessage(
                    "設定の閲覧のみ可能です。"
                );

            }

        } catch (error) {

            initialized = false;

            canEdit = false;

            applyPermissions();

            showShiftMessage(
                error.message,
                true
            );

            showScoreMessage(
                error.message,
                true
            );

            console.error(
                "設定画面の初期化エラー:",
                error
            );

        }

    }


    /* ========================================
       初期化実行
    ======================================== */

    initialize();

});