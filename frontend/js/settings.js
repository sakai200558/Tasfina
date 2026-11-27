/* ========================================
   Tasfina 設定画面
   settings.js
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    "use strict";


    /* ========================================
       共通設定
    ======================================== */

    const SHIFT_STORAGE_KEY = "tasfina_shift_settings_v1";

    const SCORE_STORAGE_KEY = "tasfina_score_settings_v1";

    const WORK_TYPE_STORAGE_KEY = "tasfina_work_types_v1";

    const get = id => document.getElementById(id);

    const clone = value => JSON.parse(JSON.stringify(value));


    /* ========================================
       初期データ：シフト種別
    ======================================== */

    const defaultShiftTypes = [
        {
            id: 1,
            name: "通常出勤",
            color: "#409eff",
            start: "09:00",
            end: "18:00",
            breakMinutes: 60,
            score: 1.0,
            description: "通常の勤務"
        },
        {
            id: 2,
            name: "在宅勤務",
            color: "#50c99c",
            start: "09:00",
            end: "18:00",
            breakMinutes: 60,
            score: 0.8,
            description: "在宅での勤務"
        },
        {
            id: 3,
            name: "午前休",
            color: "#ffca62",
            start: "13:00",
            end: "18:00",
            breakMinutes: 0,
            score: 0.5,
            description: "午前休暇・午後勤務"
        },
        {
            id: 4,
            name: "午後休",
            color: "#ffd49b",
            start: "09:00",
            end: "13:00",
            breakMinutes: 0,
            score: 0.5,
            description: "午後休暇・午前勤務"
        },
        {
            id: 5,
            name: "有給休暇",
            color: "#ff8394",
            start: "",
            end: "",
            breakMinutes: 0,
            score: 0.0,
            description: "有給休暇取得"
        },
        {
            id: 6,
            name: "休日",
            color: "#cbd2de",
            start: "",
            end: "",
            breakMinutes: 0,
            score: 0.0,
            description: "所定休日"
        }
    ];


    /* ========================================
       初期データ：自動調整ルール
    ======================================== */

    const defaultRules = {
        maxConsecutiveDays: 5,
        maxMonthlyDays: 20,
        requestPriority: "high"
    };


    /* ========================================
       初期データ：負担スコア
    ======================================== */

    const defaultScoreSettings = {

        aggregationPeriod: "4",

        resetTiming: "monthly",

        shiftScores: {
            "1": 1.0,
            "2": 0.8,
            "3": 0.5,
            "4": 0.5,
            "5": 0.0,
            "6": 0.0
        },

        conditions: {
            consecutive: 0.2,
            night: 1.0,
            early: 0.5,
            weeklyOver: 1.0
        }

    };


    /* ========================================
       初期データ：業務タイプ
    ======================================== */

    const defaultWorkTypes = [
        {
            id: 1,
            name: "通常業務",
            multiplier: 1.0,
            enabled: true
        },
        {
            id: 2,
            name: "専門業務",
            multiplier: 1.2,
            enabled: true
        },
        {
            id: 3,
            name: "高負荷業務",
            multiplier: 1.3,
            enabled: true
        },
        {
            id: 4,
            name: "緊急対応",
            multiplier: 1.5,
            enabled: true
        }
    ];


    /* ========================================
       状態管理
    ======================================== */

    let shiftTypes = clone(defaultShiftTypes);

    let rules = clone(defaultRules);

    let scoreSettings = clone(defaultScoreSettings);

    let workTypes = clone(defaultWorkTypes);

    let selectedShiftTypeId = null;

    let workTypeModal = null;


    /* ========================================
       HTML要素の取得
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
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");

    }


    /* ========================================
       共通処理：スコア表示
    ======================================== */

    function formatScore(value) {

        const number = Number(value);

        if (!Number.isFinite(number)) {
            return "0.0";
        }

        return number.toFixed(1);

    }


    /* ========================================
       共通処理：休憩時間表示
    ======================================== */

    function formatBreak(minutes) {

        const value = Number(minutes);

        if (value === 0) {
            return "なし";
        }

        if (value === 60) {
            return "1時間";
        }

        if (value === 90) {
            return "1時間30分";
        }

        return `${value}分`;

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

        if (String(value).trim() === "") {
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
       共通処理：シフト設定メッセージ
    ======================================== */

    function showShiftMessage(message, isError = false) {

        shiftMessage.textContent = message;

        shiftMessage.classList.toggle(
            "error",
            isError
        );

    }


    /* ========================================
       共通処理：負担スコアメッセージ
    ======================================== */

    function showScoreMessage(message, isError = false) {

        scoreMessage.textContent = message;

        scoreMessage.classList.toggle(
            "error",
            isError
        );

    }


    /* ========================================
       共通処理：業務タイプエラー
    ======================================== */

    function showWorkTypeError(message = "") {

        workTypeError.textContent = message;

        workTypeError.hidden = !message;

    }


    /* ========================================
       localStorage：読み込み
    ======================================== */

    function readStorage(key) {

        try {

            const saved = localStorage.getItem(key);

            if (!saved) {
                return null;
            }

            return JSON.parse(saved);

        } catch (error) {

            console.error(
                "設定の読み込みに失敗しました。",
                key,
                error
            );

            return null;

        }

    }


    /* ========================================
       localStorage：保存
    ======================================== */

    function writeStorage(key, data) {

        try {

            localStorage.setItem(
                key,
                JSON.stringify(data)
            );

            return true;

        } catch (error) {

            console.error(
                "設定の保存に失敗しました。",
                key,
                error
            );

            return false;

        }

    }


    /* ========================================
       シフト設定：保存データの読み込み
    ======================================== */

    function loadShiftSettings() {

        const saved = readStorage(
            SHIFT_STORAGE_KEY
        );

        if (!saved) {
            return;
        }

        if (Array.isArray(saved.shiftTypes)) {

            shiftTypes = saved.shiftTypes.map(item => ({
                ...item,
                id: Number(item.id)
            }));

        }

        if (
            saved.rules &&
            typeof saved.rules === "object"
        ) {

            rules = {
                ...defaultRules,
                ...saved.rules
            };

        }

    }


    /* ========================================
       負担スコア：保存データの読み込み
    ======================================== */

    function loadScoreSettings() {

        const saved = readStorage(
            SCORE_STORAGE_KEY
        );

        if (saved && typeof saved === "object") {

            scoreSettings = {

                ...clone(defaultScoreSettings),

                ...saved,

                conditions: {
                    ...defaultScoreSettings.conditions,
                    ...saved.conditions
                },

                shiftScores: {
                    ...defaultScoreSettings.shiftScores,
                    ...saved.shiftScores
                }

            };

        }

        synchronizeShiftScores();

    }


    /* ========================================
       業務タイプ：保存データの読み込み
    ======================================== */

    function loadWorkTypes() {

        const saved = readStorage(
            WORK_TYPE_STORAGE_KEY
        );

        const items = Array.isArray(saved)

            ? saved

            : saved?.workTypes;

        if (!Array.isArray(items)) {
            return;
        }

        workTypes = items.map((item, index) => ({

            id: Number(item.id) || index + 1,

            name: String(item.name ?? ""),

            multiplier: Number(
                item.multiplier ?? item.rate ?? 1
            ),

            enabled: item.enabled !== false

        }));

    }


    /* ========================================
       シフト種別と負担スコアの同期
    ======================================== */

    function synchronizeShiftScores() {

        scoreSettings.shiftScores =
            Object.fromEntries(

                shiftTypes.map(item => [

                    String(item.id),

                    Number(item.score) || 0

                ])

            );

    }


    /* ========================================
       シフト設定：保存
    ======================================== */

    function saveShiftSettings() {

        /*
         * 既存の保存データを取得する。
         *
         * シフト種別と自動調整ルール以外の
         * データを消さないようにする。
         */

        let previousData;

        try {

            const raw = localStorage.getItem(
                SHIFT_STORAGE_KEY
            );

            previousData = raw === null

                ? {}

                : JSON.parse(raw);

            if (
                !previousData ||
                typeof previousData !== "object" ||
                Array.isArray(previousData)
            ) {

                throw new Error(
                    "保存済みデータの形式が正しくありません。"
                );

            }

        } catch (error) {

            console.error(error);

            showShiftMessage(
                "既存の設定を読み込めないため、保存を中止しました。",
                true
            );

            return false;

        }


        /* 既存データを維持したまま更新 */

        const success = writeStorage(

            SHIFT_STORAGE_KEY,

            {
                ...previousData,

                shiftTypes,

                rules
            }

        );

        if (!success) {

            showShiftMessage(
                "シフト設定を保存できませんでした。",
                true
            );

            return false;

        }


        /* 負担スコアとの同期 */

        synchronizeShiftScores();

        const savedScores = readStorage(
            SCORE_STORAGE_KEY
        );

        if (
            savedScores &&
            typeof savedScores === "object" &&
            !Array.isArray(savedScores)
        ) {

            const synced = writeStorage(

                SCORE_STORAGE_KEY,

                {
                    ...savedScores,

                    shiftScores: {
                        ...scoreSettings.shiftScores
                    }
                }

            );

            if (!synced) {

                console.warn(
                    "負担スコア設定との同期に失敗しました。"
                );

            }

        }


        /* 計算例を更新 */

        updateCalculationExample();


        /* 更新イベント */

        document.dispatchEvent(

            new Event(
                "tasfina:shift-settings-updated"
            )

        );

        return true;

    }


    /* ========================================
       シフト種別：一覧表示
    ======================================== */

    function renderShiftTypes() {

        if (shiftTypes.length === 0) {

            shiftTable.innerHTML = `

                <tr>

                    <td colspan="7" class="text-center py-4">

                        シフト種別が登録されていません。

                    </td>

                </tr>

            `;

            return;

        }

        shiftTable.innerHTML = shiftTypes.map(item => {

            const selected =
                item.id === selectedShiftTypeId;

            const workingHours =
                item.start && item.end

                    ? `${item.start} ～ ${item.end}`

                    : "-";

            return `

                <tr
                    data-shift-id="${escapeHtml(item.id)}"
                    class="${selected ? "selected-row" : ""}"
                >

                    <td>

                        ${escapeHtml(item.name)}

                    </td>

                    <td>

                        <span
                            class="shift-color-dot"
                            data-dot-color="${escapeHtml(item.color)}"
                        ></span>

                    </td>

                    <td>

                        ${escapeHtml(workingHours)}

                    </td>

                    <td>

                        ${escapeHtml(formatBreak(item.breakMinutes))}

                    </td>

                    <td>

                        ${formatScore(item.score)}

                    </td>

                    <td>

                        ${escapeHtml(item.description)}

                    </td>

                    <td>

                        <div class="shift-table-actions">

                            <button
                                type="button"
                                class="shift-action-button edit-shift"
                                data-id="${escapeHtml(item.id)}"
                                aria-label="${escapeHtml(item.name)}を編集"
                                title="編集"
                            >

                                <i class="bi bi-pencil-fill"></i>

                            </button>

                            <button
                                type="button"
                                class="shift-action-button delete delete-shift"
                                data-id="${escapeHtml(item.id)}"
                                aria-label="${escapeHtml(item.name)}を削除"
                                title="削除"
                            >

                                <i class="bi bi-trash3"></i>

                            </button>

                        </div>

                    </td>

                </tr>

            `;

        }).join("");


        /* ========================================
           シフト種別の表示色を設定
        ======================================== */

        shiftTable
            .querySelectorAll("[data-dot-color]")
            .forEach(dot => {

                const color = dot.dataset.dotColor;

                if (/^#[0-9a-fA-F]{6}$/.test(color)) {

                    dot.style.setProperty(
                        "--shift-dot-color",
                        color
                    );

                }

            });

    }


    /* ========================================
       シフト種別：新規追加
    ======================================== */

    function addShiftType(focus = true) {

        selectedShiftTypeId = null;

        shiftForm.reset();

        get("shiftTypeColor").value = "#409eff";

        get("shiftTypeScore").value = "1.0";

        get("shiftBreakMinutes").value = "0";

        editorHeading.textContent =
            "シフト種別の新規追加";

        renderShiftTypes();

        showShiftMessage("");

        if (focus) {

            get("shiftTypeName").focus();

        }

    }


    /* ========================================
       シフト種別：編集
    ======================================== */

    function editShiftType(id) {

        const item = shiftTypes.find(
            shift => shift.id === id
        );

        if (!item) {
            return;
        }

        selectedShiftTypeId = id;

        editorHeading.textContent =
            "シフト種別の詳細設定";

        get("shiftTypeName").value =
            item.name;

        get("shiftTypeColor").value =
            item.color || "#409eff";

        get("shiftStartTime").value =
            item.start ?? "";

        get("shiftEndTime").value =
            item.end ?? "";

        get("shiftBreakMinutes").value =
            item.breakMinutes ?? 0;

        get("shiftTypeScore").value =
            item.score;

        get("shiftTypeDescription").value =
            item.description ?? "";

        renderShiftTypes();

        showShiftMessage("");

    }


    /* ========================================
       シフト種別：削除
    ======================================== */

    function deleteShiftType(id) {

        const item = shiftTypes.find(
            shift => shift.id === id
        );

        if (!item) {
            return;
        }

        const confirmed = confirm(
            `「${item.name}」を削除しますか？`
        );

        if (!confirmed) {
            return;
        }

        const previous = clone(shiftTypes);

        shiftTypes = shiftTypes.filter(
            shift => shift.id !== id
        );

        if (!saveShiftSettings()) {

            shiftTypes = previous;

            return;

        }


        /* 削除したシフトが編集中だった場合 */

        if (selectedShiftTypeId === id) {

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

        showShiftMessage(
            "シフト種別を削除しました。"
        );

    }


    /* ========================================
       勤務時間：分単位への変換
    ======================================== */

    function timeToMinutes(time) {

        const [hours, minutes] =
            time.split(":").map(Number);

        return hours * 60 + minutes;

    }


    /* ========================================
       勤務時間の計算
    ======================================== */

    function calculateWorkingMinutes(start, end) {

        if (!start || !end) {
            return 0;
        }

        const startMinutes =
            timeToMinutes(start);

        let endMinutes =
            timeToMinutes(end);


        /* 日付をまたぐ勤務に対応 */

        if (endMinutes < startMinutes) {

            endMinutes += 24 * 60;

        }

        return endMinutes - startMinutes;

    }


    /* ========================================
       シフト種別：保存処理
    ======================================== */

    shiftForm.addEventListener("submit", event => {

        event.preventDefault();

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

        const rawScore =
            get("shiftTypeScore").value;

        const description =
            get("shiftTypeDescription").value.trim();


        /* 必須項目チェック */

        if (!name) {

            showShiftMessage(
                "シフト種別名を入力してください。",
                true
            );

            return;

        }


        /* 文字数チェック */

        if (
            name.length > 50 ||
            description.length > 300
        ) {

            showShiftMessage(
                "入力可能な文字数を超えています。",
                true
            );

            return;

        }


        /* 勤務時間チェック */

        if (
            (start && !end) ||
            (!start && end)
        ) {

            showShiftMessage(
                "勤務時間は開始時刻と終了時刻の両方を入力してください。",
                true
            );

            return;

        }


        /* 同一時刻チェック */

        if (start && end && start === end) {

            showShiftMessage(
                "開始時刻と終了時刻を同じにすることはできません。",
                true
            );

            return;

        }


        /* 休憩時間チェック */

        if (
            ![0, 30, 45, 60, 90].includes(breakMinutes)
        ) {

            showShiftMessage(
                "休憩時間が正しくありません。",
                true
            );

            return;

        }

        const workingMinutes =
            calculateWorkingMinutes(start, end);

        if (
            (!start && breakMinutes > 0) ||
            (start && breakMinutes >= workingMinutes)
        ) {

            showShiftMessage(
                "休憩時間は勤務時間より短くしてください。",
                true
            );

            return;

        }


        /* 負担スコアチェック */

        if (!isValidNumber(rawScore, 0, 10)) {

            showShiftMessage(
                "負担スコアは0～10で入力してください。",
                true
            );

            return;

        }


        /* 表示色チェック */

        if (!/^#[0-9a-fA-F]{6}$/.test(color)) {

            showShiftMessage(
                "表示色が正しくありません。",
                true
            );

            return;

        }


        /* シフト種別名の重複チェック */

        const duplicate = shiftTypes.some(item =>

            String(item.name).trim() === name &&

            item.id !== selectedShiftTypeId

        );

        if (duplicate) {

            showShiftMessage(
                "同じ名前のシフト種別が存在します。",
                true
            );

            return;

        }


        /* 保存するデータ */

        const id =
            selectedShiftTypeId ?? nextId(shiftTypes);

        const item = {

            id,

            name,

            color,

            start,

            end,

            breakMinutes,

            score: Number(rawScore),

            description

        };

        const previous = clone(shiftTypes);

        const index = shiftTypes.findIndex(
            shift => shift.id === id
        );


        /* 新規追加または更新 */

        if (index >= 0) {

            shiftTypes[index] = item;

        } else {

            shiftTypes.push(item);

        }


        /* 保存 */

        if (!saveShiftSettings()) {

            shiftTypes = previous;

            return;

        }

        selectedShiftTypeId = id;

        editorHeading.textContent =
            "シフト種別の詳細設定";

        renderShiftTypes();

        showShiftMessage(
            "シフト種別の設定を保存しました。"
        );

    });


    /* ========================================
       シフト種別：一覧のクリック処理
    ======================================== */

    shiftTable.addEventListener("click", event => {

        const deleteButton =
            event.target.closest(".delete-shift");

        if (deleteButton) {

            deleteShiftType(
                Number(deleteButton.dataset.id)
            );

            return;

        }

        const editButton =
            event.target.closest(".edit-shift");

        if (editButton) {

            editShiftType(
                Number(editButton.dataset.id)
            );

            return;

        }

        const row =
            event.target.closest("[data-shift-id]");

        if (row) {

            editShiftType(
                Number(row.dataset.shiftId)
            );

        }

    });


    /* ========================================
       シフト種別：追加ボタン
    ======================================== */

    get("addShiftTypeButton")
        .addEventListener("click", () => {

            addShiftType();

        });


    /* ========================================
       シフト種別：キャンセルボタン
    ======================================== */

    get("cancelShiftTypeButton")
        .addEventListener("click", () => {

            if (selectedShiftTypeId !== null) {

                editShiftType(selectedShiftTypeId);

            } else {

                addShiftType(false);

            }

            showShiftMessage(
                "編集内容を元に戻しました。"
            );

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

    rulesForm.addEventListener("submit", event => {

        event.preventDefault();

        const maxConsecutiveDays = Number(
            get("maxConsecutiveDays").value
        );

        const maxMonthlyDays = Number(
            get("maxMonthlyDays").value
        );

        const requestPriority =
            get("requestPriority").value;


        /* 連続勤務日数チェック */

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


        /* 月間勤務日数チェック */

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


        /* 上限日数の整合性チェック */

        if (maxConsecutiveDays > maxMonthlyDays) {

            showShiftMessage(
                "連続勤務の上限は月の最大勤務日数以下にしてください。",
                true
            );

            return;

        }


        /* 希望シフトの優先度チェック */

        if (
            !["high", "medium", "low"]
                .includes(requestPriority)
        ) {

            showShiftMessage(
                "希望シフトの優先度が正しくありません。",
                true
            );

            return;

        }


        /* 保存 */

        const previous = clone(rules);

        rules = {
            maxConsecutiveDays,
            maxMonthlyDays,
            requestPriority
        };

        if (!saveShiftSettings()) {

            rules = previous;

            return;

        }

        showShiftMessage(
            "自動調整ルールを保存しました。"
        );

    });


    /* ========================================
       負担スコア設定：画面反映
    ======================================== */

    function applyScoreSettings() {

        get("aggregationPeriod").value =
            scoreSettings.aggregationPeriod;

        get("resetTiming").value =
            scoreSettings.resetTiming;

        get("consecutiveScore").value =
            scoreSettings.conditions.consecutive;

        get("nightScore").value =
            scoreSettings.conditions.night;

        get("earlyScore").value =
            scoreSettings.conditions.early;

        get("weeklyOverScore").value =
            scoreSettings.conditions.weeklyOver;

        updateCalculationExample();

    }


    /* ========================================
       負担スコア設定：フォーム取得
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


        /* 集計期間チェック */

        if (
            !["1", "2", "4", "8"]
                .includes(aggregationPeriod)
        ) {

            return {

                success: false,

                message:
                    "集計期間を選択してください。"

            };

        }


        /* リセットタイミングチェック */

        if (
            ![
                "monthly",
                "weekly",
                "quarterly",
                "none"
            ].includes(resetTiming)
        ) {

            return {

                success: false,

                message:
                    "リセットタイミングを選択してください。"

            };

        }


        /* 追加スコアチェック */

        const values = [

            consecutive,

            night,

            early,

            weeklyOver

        ];

        if (
            values.some(
                value => !isValidNumber(value, 0, 100)
            )
        ) {

            return {

                success: false,

                message:
                    "追加スコアは0～100で入力してください。"

            };

        }


        /* フォームの設定内容 */

        return {

            success: true,

            data: {

                aggregationPeriod,

                resetTiming,

                shiftScores: Object.fromEntries(

                    shiftTypes.map(item => [

                        String(item.id),

                        Number(item.score) || 0

                    ])

                ),

                conditions: {

                    consecutive: Number(consecutive),

                    night: Number(night),

                    early: Number(early),

                    weeklyOver: Number(weeklyOver)

                }

            }

        };

    }


    /* ========================================
       負担スコア：計算処理
    ======================================== */

    function calculateScore(data, config) {

        const baseScore = Number(

            config.shiftScores[
                String(data.shiftTypeId)
            ] ?? 0

        );

        const consecutiveDays = Math.max(

            0,

            Number(data.consecutiveDays) || 0

        );

        const consecutiveScore =

            Math.max(0, consecutiveDays - 1) *

            Number(config.conditions.consecutive);

        const nightScore =

            Math.max(0, Number(data.nightCount) || 0) *

            Number(config.conditions.night);

        const earlyScore =

            Math.max(0, Number(data.earlyCount) || 0) *

            Number(config.conditions.early);

        const weeklyOverScore =

            Math.max(0, Number(data.weeklyOverDays) || 0) *

            Number(config.conditions.weeklyOver);

        const totalScore =

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

            totalScore

        };

    }


    /* ========================================
       負担スコア：計算例の更新
    ======================================== */

    function updateCalculationExample() {

        const result = readScoreForm();

        if (!result.success) {

            return;

        }

        const config = result.data;


        /* 計算式の表示 */

        get("formulaConsecutive").textContent =
            formatScore(
                config.conditions.consecutive
            );

        get("formulaNight").textContent =
            formatScore(
                config.conditions.night
            );

        get("formulaEarly").textContent =
            formatScore(
                config.conditions.early
            );

        get("formulaWeekly").textContent =
            formatScore(
                config.conditions.weeklyOver
            );


        /* 計算例に使用するシフト種別 */

        const normalShift = shiftTypes.find(
            item => item.name === "通常出勤"
        );

        const exampleShift =

            normalShift ??

            shiftTypes[0] ??

            null;


        /* 計算例のデータ */

        const exampleData = {

            shiftTypeId:
                exampleShift?.id ?? null,

            consecutiveDays: 3,

            nightCount: 1,

            earlyCount: 0,

            weeklyOverDays: 0

        };


        /* 負担スコアを計算 */

        const calculated = calculateScore(

            exampleData,

            config

        );


        /* 基本スコア */

        get("exampleBase").textContent =
            formatScore(
                calculated.baseScore
            );


        /* 連続勤務 */

        get("exampleConsecutive").textContent =
            formatScore(
                calculated.consecutiveScore
            );


        /* 夜間勤務 */

        get("exampleNight").textContent =
            formatScore(
                calculated.nightScore
            );


        /* 合計スコア */

        get("exampleTotal").textContent =
            formatScore(
                calculated.totalScore
            );


        /* 計算例のシフト種別名を更新 */

        const exampleBaseCell =
            get("exampleBase");

        if (exampleBaseCell.previousElementSibling) {

            exampleBaseCell
                .previousElementSibling
                .textContent =

                exampleShift?.name ??

                "シフト種別なし";

        }

    }


    /* ========================================
       負担スコア設定：保存
    ======================================== */

    function saveScoreSettings() {

        const result = readScoreForm();

        if (!result.success) {

            showScoreMessage(

                result.message,

                true

            );

            return;

        }

        const success = writeStorage(

            SCORE_STORAGE_KEY,

            result.data

        );

        if (!success) {

            showScoreMessage(
                "負担スコア設定を保存できませんでした。",
                true
            );

            return;

        }

        scoreSettings = result.data;

        updateCalculationExample();

        showScoreMessage(
            "負担スコア設定を保存しました。"
        );


        /* 更新イベント */

        document.dispatchEvent(

            new Event(
                "tasfina:score-settings-updated"
            )

        );

    }


    /* ========================================
       負担スコア設定：リセット
    ======================================== */

    function resetScoreSettings() {

        const confirmed = confirm(

            "負担スコア設定を初期値に戻しますか？\n" +

            "シフト種別の基本スコアと業務タイプは変更されません。"

        );

        if (!confirmed) {
            return;
        }

        const resetData =
            clone(defaultScoreSettings);


        /* シフト種別の基本スコアは維持 */

        resetData.shiftScores =
            Object.fromEntries(

                shiftTypes.map(item => [

                    String(item.id),

                    Number(item.score) || 0

                ])

            );


        /* 保存 */

        if (
            !writeStorage(
                SCORE_STORAGE_KEY,
                resetData
            )
        ) {

            showScoreMessage(
                "設定をリセットできませんでした。",
                true
            );

            return;

        }

        scoreSettings = resetData;

        applyScoreSettings();

        showScoreMessage(
            "負担スコア設定を初期値に戻しました。"
        );


        /* 更新イベント */

        document.dispatchEvent(

            new Event(
                "tasfina:score-settings-updated"
            )

        );

    }


    /* ========================================
       負担スコア：入力イベント
    ======================================== */

    const scoreInputIds = [

        "aggregationPeriod",

        "resetTiming",

        "consecutiveScore",

        "nightScore",

        "earlyScore",

        "weeklyOverScore"

    ];

    scoreInputIds.forEach(id => {

        const element = get(id);

        const update = () => {

            showScoreMessage("");

            updateCalculationExample();

        };

        element.addEventListener(

            "input",

            update

        );

        element.addEventListener(

            "change",

            update

        );

    });


    /* ========================================
       負担スコア：保存ボタン
    ======================================== */

    get("saveScoresButton")
        .addEventListener(

            "click",

            saveScoreSettings

        );


    /* ========================================
       負担スコア：リセットボタン
    ======================================== */

    get("resetScoresButton")
        .addEventListener(

            "click",

            resetScoreSettings

        );


    /* ========================================
       業務タイプ：テーブル行作成
    ======================================== */

    function createWorkTypeRow(item) {

        const row =
            document.createElement("tr");

        row.dataset.workTypeId =
            String(item.id);

        row.innerHTML = `

            <td>

                <input
                    type="text"
                    class="form-control work-type-name"
                    maxlength="50"
                    aria-label="業務タイプ名"
                    placeholder="業務タイプ名"
                    required
                >

            </td>

            <td>

                <div class="input-group">

                    <input
                        type="number"
                        class="form-control work-type-rate"
                        min="0.1"
                        max="10"
                        step="0.1"
                        aria-label="業務倍率"
                        required
                    >

                    <span class="input-group-text">

                        倍

                    </span>

                </div>

            </td>

            <td>

                <div class="form-check form-switch">

                    <input
                        type="checkbox"
                        class="form-check-input work-type-enabled"
                        aria-label="業務タイプを有効にする"
                    >

                </div>

            </td>

            <td>

                <button
                    type="button"
                    class="btn btn-outline-danger btn-sm work-type-remove"
                    aria-label="業務タイプを削除"
                    title="削除"
                >

                    <i class="bi bi-trash3"></i>

                </button>

            </td>

        `;


        /* 業務タイプ名 */

        row.querySelector(
            ".work-type-name"
        ).value = item.name ?? "";


        /* 業務倍率 */

        row.querySelector(
            ".work-type-rate"
        ).value = item.multiplier ?? 1.0;


        /* 有効・無効 */

        row.querySelector(
            ".work-type-enabled"
        ).checked = item.enabled !== false;


        return row;

    }


    /* ========================================
       業務タイプ：一覧表示
    ======================================== */

    function renderWorkTypes() {

        workTypeRows.replaceChildren();

        workTypes.forEach(item => {

            workTypeRows.appendChild(

                createWorkTypeRow(item)

            );

        });

        showWorkTypeError("");

    }


    /* ========================================
       業務タイプ：新規追加
    ======================================== */

    function addWorkType() {

        const existingIds = [

            ...workTypes.map(item =>
                Number(item.id) || 0
            ),

            ...Array.from(

                workTypeRows.querySelectorAll(
                    "[data-work-type-id]"
                )

            ).map(row =>
                Number(row.dataset.workTypeId) || 0
            )

        ];

        const id = Math.max(

            0,

            ...existingIds

        ) + 1;

        const item = {

            id,

            name: "",

            multiplier: 1.0,

            enabled: true

        };

        const row = createWorkTypeRow(item);

        workTypeRows.appendChild(row);

        showWorkTypeError("");

        row.querySelector(
            ".work-type-name"
        ).focus();

    }


    /* ========================================
       業務タイプ：削除
    ======================================== */

    workTypeRows.addEventListener("click", event => {

        const button = event.target.closest(
            ".work-type-remove"
        );

        if (!button) {
            return;
        }

        const row = button.closest("tr");

        if (!row) {
            return;
        }

        const name = row.querySelector(
            ".work-type-name"
        ).value.trim();

        if (
            name &&
            !confirm(`「${name}」を削除しますか？`)
        ) {

            return;

        }

        row.remove();

        showWorkTypeError("");

    });


    /* ========================================
       業務タイプ：フォーム取得
    ======================================== */

    function collectWorkTypes() {

        const rows = Array.from(

            workTypeRows.querySelectorAll("tr")

        );

        const items = [];

        const names = new Set();

        for (const row of rows) {

            const id = Number(
                row.dataset.workTypeId
            );

            const name = row.querySelector(
                ".work-type-name"
            ).value.trim();

            const rawMultiplier = row.querySelector(
                ".work-type-rate"
            ).value;

            const enabled = row.querySelector(
                ".work-type-enabled"
            ).checked;


            /* 業務タイプ名チェック */

            if (!name || name.length > 50) {

                return {

                    success: false,

                    message:
                        "業務タイプ名を1～50文字で入力してください。"

                };

            }


            /* 倍率チェック */

            if (
                !isValidNumber(
                    rawMultiplier,
                    0.1,
                    10
                )
            ) {

                return {

                    success: false,

                    message:
                        `「${name}」の倍率は0.1～10で入力してください。`

                };

            }


            /* 業務タイプ名の重複チェック */

            const normalizedName =
                name.toLowerCase();

            if (names.has(normalizedName)) {

                return {

                    success: false,

                    message:
                        `「${name}」が重複しています。`

                };

            }

            names.add(normalizedName);


            /* データ追加 */

            items.push({

                id,

                name,

                multiplier: Number(rawMultiplier),

                enabled

            });

        }


        /* 最低1件の業務タイプを維持 */

        if (items.length === 0) {

            return {

                success: false,

                message:
                    "業務タイプを1件以上登録してください。"

            };

        }


        /* 最低1件を有効にする */

        if (!items.some(item => item.enabled)) {

            return {

                success: false,

                message:
                    "業務タイプを1件以上有効にしてください。"

            };

        }

        return {

            success: true,

            data: items

        };

    }


    /* ========================================
       業務タイプ：保存処理
    ======================================== */

    workTypeForm.addEventListener("submit", event => {

        event.preventDefault();

        const result = collectWorkTypes();

        if (!result.success) {

            showWorkTypeError(
                result.message
            );

            return;

        }

        const success = writeStorage(

            WORK_TYPE_STORAGE_KEY,

            result.data

        );

        if (!success) {

            showWorkTypeError(
                "業務タイプを保存できませんでした。"
            );

            return;

        }

        workTypes = result.data;

        showWorkTypeError("");

        if (workTypeModal) {

            workTypeModal.hide();

        }

        showScoreMessage(
            "業務タイプ・倍率設定を保存しました。"
        );


        /* 更新イベント */

        document.dispatchEvent(

            new Event(
                "tasfina:work-types-updated"
            )

        );

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

        if (
            typeof window.bootstrap === "undefined" ||
            !window.bootstrap.Modal
        ) {

            showScoreMessage(
                "モーダルを表示できませんでした。",
                true
            );

            return;

        }

        renderWorkTypes();

        workTypeModal =
            bootstrap.Modal.getOrCreateInstance(

                workTypeModalElement

            );

        workTypeModal.show();

    }


    /* ========================================
       業務タイプ：モーダルを開くボタン
    ======================================== */

    get("openWorkTypeEditButton")
        .addEventListener(

            "click",

            openWorkTypeModal

        );


    /* ========================================
       業務タイプ：モーダル終了処理
    ======================================== */

    workTypeModalElement.addEventListener(

        "hidden.bs.modal",

        () => {

            workTypeRows.replaceChildren();

            showWorkTypeError("");

        }

    );


    /* ========================================
       業務タイプ：外部参照用
    ======================================== */

    window.TasfinaWorkTypes = {

        get() {

            return clone(workTypes);

        }

    };


    /* ========================================
       Bootstrap：ツールチップ初期化
    ======================================== */

    function initializeTooltips() {

        if (
            typeof window.bootstrap === "undefined" ||
            !window.bootstrap.Tooltip
        ) {

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
       初期化処理
    ======================================== */

    function initialize() {

        /* 保存済みデータの読み込み */

        loadShiftSettings();

        loadScoreSettings();

        loadWorkTypes();


        /* シフト種別の一覧表示 */

        renderShiftTypes();


        /* 自動調整ルールの反映 */

        applyRules();


        /* 負担スコア設定の反映 */

        applyScoreSettings();


        /* 初期編集フォーム */

        if (shiftTypes.length > 0) {

            editShiftType(
                shiftTypes[0].id
            );

        } else {

            addShiftType(false);

        }


        /* ツールチップ初期化 */

        initializeTooltips();


        /* メッセージ初期化 */

        showShiftMessage("");

        showScoreMessage("");

        showWorkTypeError("");


        /* 初期化完了 */

        console.log(
            "Tasfina：設定画面の初期化が完了しました。"
        );

    }


    /* ========================================
       初期化実行
    ======================================== */

    initialize();

});