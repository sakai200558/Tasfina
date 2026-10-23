
/* ========================================
   Tasfina 負担スコア設定
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ========================================
       保存キー
    ======================================== */

    const SCORE_STORAGE_KEY = "tasfina_score_settings_v1";

    // 前回作成したシフト設定と同じキー
    const SHIFT_STORAGE_KEY = "tasfina_shift_settings_v1";

    /* ========================================
       初期データ
    ======================================== */

    const defaultSettings = {
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

    const defaultShiftTypes = [
        {
            id: 1,
            name: "通常出勤",
            color: "#409eff",
            score: 1.0,
            description: "通常の勤務（基準値）"
        },
        {
            id: 2,
            name: "在宅勤務",
            color: "#50c99c",
            score: 0.8,
            description: "在宅での勤務（負担を軽減）"
        },
        {
            id: 3,
            name: "午前休",
            color: "#ffca62",
            score: 0.5,
            description: "午前のみの勤務"
        },
        {
            id: 4,
            name: "午後休",
            color: "#ffd49b",
            score: 0.5,
            description: "午後のみの勤務"
        },
        {
            id: 5,
            name: "有給休暇",
            color: "#ff8394",
            score: 0.0,
            description: "有給休暇（負担なし）"
        },
        {
            id: 6,
            name: "休日",
            color: "#cbd2de",
            score: 0.0,
            description: "法定休日・所定休日（負担なし）"
        }
    ];

    const clone = value => JSON.parse(JSON.stringify(value));

    let settings = clone(defaultSettings);
    let shiftTypes = clone(defaultShiftTypes);
    let shiftRules = {
        maxConsecutiveDays: 5
    };

    /* ========================================
       HTML要素の取得
    ======================================== */

    const get = id => document.getElementById(id);

    const shiftScoreTableBody = get("shiftScoreTableBody");
    const previewTableBody = get("scorePreviewTableBody");
    const previewResult = get("scorePreviewResult");
    const scoreMessage = get("scoreMessage");

    /* ========================================
       共通処理
    ======================================== */

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }

    function formatScore(value) {
        return Number(value).toFixed(1);
    }

    function showMessage(message, isError = false) {
        scoreMessage.textContent = message;
        scoreMessage.classList.toggle("error", isError);
    }

    function clearMessage() {
        showMessage("");
    }

    function readStorage(key) {
        try {
            const text = localStorage.getItem(key);

            return text ? JSON.parse(text) : null;

        } catch (error) {
            console.error("データ読み込みエラー:", error);
            return null;
        }
    }

    /* ========================================
       シフト設定から種別を読み込む
    ======================================== */

    function loadShiftTypes() {

        const saved = readStorage(SHIFT_STORAGE_KEY);

        if (!saved) {
            return;
        }

        if (Array.isArray(saved.shiftTypes)) {
            shiftTypes = saved.shiftTypes;
        }

        if (saved.rules) {
            shiftRules = {
                ...shiftRules,
                ...saved.rules
            };
        }
    }

    /* ========================================
       保存済みスコア設定を読み込む
    ======================================== */

    function loadScoreSettings() {

        const saved = readStorage(SCORE_STORAGE_KEY);

        if (!saved || typeof saved !== "object") {
            return;
        }

        settings = {
            ...clone(defaultSettings),
            ...saved,

            shiftScores: {
                ...defaultSettings.shiftScores,
                ...(saved.shiftScores || {})
            },

            conditions: {
                ...defaultSettings.conditions,
                ...(saved.conditions || {})
            }
        };
    }

    /* ========================================
       シフト種別テーブルの作成
    ======================================== */

    function renderShiftScoreTable() {

        if (shiftTypes.length === 0) {
            shiftScoreTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-4">
                        シフト種別が登録されていません。
                    </td>
                </tr>
            `;
            return;
        }

        shiftScoreTableBody.innerHTML = shiftTypes.map(shift => {

            const score = settings.shiftScores[String(shift.id)]
                ?? shift.score
                ?? 0;

            return `
                <tr>
                    <td>${escapeHtml(shift.name)}</td>

                    <td>
                        <span
                            class="score-color-dot"
                            data-color="${escapeHtml(shift.color)}"
                        ></span>
                    </td>

                    <td>
                        <input
                            type="number"
                            class="form-control score-number-input shift-score-input"
                            data-shift-id="${escapeHtml(shift.id)}"
                            min="0"
                            max="100"
                            step="0.1"
                            value="${escapeHtml(score)}"
                            aria-label="${escapeHtml(shift.name)}の基本スコア"
                            required
                        >
                    </td>

                    <td>${escapeHtml(shift.description)}</td>
                </tr>
            `;
        }).join("");

        // シフトの表示色を設定
        shiftScoreTableBody.querySelectorAll(
            ".score-color-dot"
        ).forEach(dot => {

            const color = dot.dataset.color;

            if (/^#[0-9a-fA-F]{6}$/.test(color)) {
                dot.style.setProperty("--score-dot-color", color);
            }
        });
    }

    /* ========================================
       設定値をフォームに反映
    ======================================== */

    function applySettings() {

        get("aggregationPeriod").value =
            settings.aggregationPeriod;

        get("resetTiming").value =
            settings.resetTiming;

        get("consecutiveScore").value =
            settings.conditions.consecutive;

        get("nightScore").value =
            settings.conditions.night;

        get("earlyScore").value =
            settings.conditions.early;

        get("weeklyOverScore").value =
            settings.conditions.weeklyOver;

        renderShiftScoreTable();
        updateCalculationExample();
    }

    /* ========================================
       現在の入力値を取得
    ======================================== */

    function readFormSettings() {

        const shiftScores = {};

        const inputs = document.querySelectorAll(
            ".shift-score-input"
        );

        for (const input of inputs) {

            if (
                input.value.trim() === "" ||
                !input.checkValidity()
            ) {
                throw new Error(
                    "シフト種別の基本スコアを0～100で入力してください。"
                );
            }

            shiftScores[input.dataset.shiftId] =
                Number(input.value);
        }

        const conditionIds = [
            "consecutiveScore",
            "nightScore",
            "earlyScore",
            "weeklyOverScore"
        ];

        for (const id of conditionIds) {

            const input = get(id);

            if (
                input.value.trim() === "" ||
                !input.checkValidity()
            ) {
                throw new Error(
                    "追加条件のスコアを0～100で入力してください。"
                );
            }
        }

        return {
            aggregationPeriod: get("aggregationPeriod").value,

            resetTiming: get("resetTiming").value,

            shiftScores,

            conditions: {
                consecutive: Number(
                    get("consecutiveScore").value
                ),

                night: Number(
                    get("nightScore").value
                ),

                early: Number(
                    get("earlyScore").value
                ),

                weeklyOver: Number(
                    get("weeklyOverScore").value
                )
            }
        };
    }

    /* ========================================
       計算用関数
    ======================================== */

    function calculateScore(data, config) {

        const base = Number(
            config.shiftScores[String(data.shiftId)] ?? 0
        );

        const consecutiveDays = Math.max(
            1,
            Number(data.consecutiveDays) || 1
        );

        const nightCount = Math.max(
            0,
            Number(data.nightCount) || 0
        );

        const earlyCount = Math.max(
            0,
            Number(data.earlyCount) || 0
        );

        const weeklyOverDays = Math.max(
            0,
            Number(data.weeklyOverDays) || 0
        );

        const consecutiveBonus =
            Math.max(0, consecutiveDays - 1) *
            config.conditions.consecutive;

        const nightBonus =
            nightCount * config.conditions.night;

        const earlyBonus =
            earlyCount * config.conditions.early;

        const weeklyBonus =
            weeklyOverDays * config.conditions.weeklyOver;

        return {
            base,
            consecutiveBonus,
            nightBonus,
            earlyBonus,
            weeklyBonus,

            total:
                base +
                consecutiveBonus +
                nightBonus +
                earlyBonus +
                weeklyBonus
        };
    }

    /* ========================================
       計算例を更新
    ======================================== */

    function updateCalculationExample() {

        let currentSettings;

        try {
            currentSettings = readFormSettings();

        } catch (error) {
            return;
        }

        const normalShift = shiftTypes.find(
            shift => shift.name === "通常出勤"
        ) || shiftTypes[0];

        if (!normalShift) {
            return;
        }

        const example = calculateScore(
            {
                shiftId: normalShift.id,
                consecutiveDays: 3,
                nightCount: 1,
                earlyCount: 0,
                weeklyOverDays: 0
            },
            currentSettings
        );

        get("formulaConsecutive").textContent =
            formatScore(currentSettings.conditions.consecutive);

        get("formulaNight").textContent =
            formatScore(currentSettings.conditions.night);

        get("formulaEarly").textContent =
            formatScore(currentSettings.conditions.early);

        get("formulaWeekly").textContent =
            formatScore(currentSettings.conditions.weeklyOver);

        get("exampleBase").textContent =
            formatScore(example.base);

        get("exampleConsecutive").textContent =
            formatScore(example.consecutiveBonus);

        get("exampleNight").textContent =
            formatScore(example.nightBonus);

        get("exampleTotal").textContent =
            formatScore(example.total);
    }

    /* ========================================
       プレビュー用サンプルデータ
    ======================================== */

    function getSampleMembers() {

        const normalShift = shiftTypes.find(
            shift => shift.name === "通常出勤"
        ) || shiftTypes[0];

        const remoteShift = shiftTypes.find(
            shift => shift.name === "在宅勤務"
        ) || normalShift;

        if (!normalShift) {
            return [];
        }

        return [
            {
                name: "山田 太郎",
                shiftId: normalShift.id,
                consecutiveDays: 3,
                nightCount: 1,
                earlyCount: 0,
                weeklyOverDays: 0
            },
            {
                name: "佐藤 花子",
                shiftId: remoteShift.id,
                consecutiveDays: 2,
                nightCount: 0,
                earlyCount: 1,
                weeklyOverDays: 0
            },
            {
                name: "鈴木 一郎",
                shiftId: normalShift.id,
                consecutiveDays: 6,
                nightCount: 1,
                earlyCount: 0,
                weeklyOverDays: 1
            }
        ];
    }

    /* ========================================
       プレビュー実行
    ======================================== */

    function executePreview() {

        let currentSettings;

        try {
            currentSettings = readFormSettings();

        } catch (error) {
            showMessage(error.message, true);
            return;
        }

        const members = getSampleMembers();

        if (members.length === 0) {
            showMessage(
                "プレビュー対象のシフト種別がありません。",
                true
            );
            return;
        }

        const results = members.map(member => {

            const calculation = calculateScore(
                member,
                currentSettings
            );

            return {
                name: member.name,
                score: calculation.total
            };
        });

        results.sort((a, b) => b.score - a.score);

        previewTableBody.innerHTML = results.map(member => `
            <tr>
                <td>${escapeHtml(member.name)}</td>
                <td>${formatScore(member.score)} pt</td>
            </tr>
        `).join("");

        previewResult.hidden = false;

        showMessage(
            "サンプル勤務データでプレビューを実行しました。"
        );
    }

    /* ========================================
       設定の保存
    ======================================== */

    function saveSettings() {

        try {

            const newSettings = readFormSettings();

            localStorage.setItem(
                SCORE_STORAGE_KEY,
                JSON.stringify(newSettings)
            );

            settings = newSettings;

            /*
               シフト設定画面との整合性を保つため、
               シフト種別の基本スコアも同期します。
            */

            const shiftData = readStorage(SHIFT_STORAGE_KEY);

            if (
                shiftData &&
                Array.isArray(shiftData.shiftTypes)
            ) {

                shiftData.shiftTypes.forEach(shift => {

                    const newScore = newSettings.shiftScores[
                        String(shift.id)
                    ];

                    if (newScore !== undefined) {
                        shift.score = newScore;
                    }
                });

                localStorage.setItem(
                    SHIFT_STORAGE_KEY,
                    JSON.stringify(shiftData)
                );
            }

            clearMessage();

            showMessage("負担スコア設定を保存しました。");

        } catch (error) {

            console.error("保存エラー:", error);

            showMessage(
                error.message || "設定を保存できませんでした。",
                true
            );
        }
    }

    /* ========================================
       設定のリセット
    ======================================== */

    function resetSettings() {

        const confirmed = confirm(
            "負担スコア設定を初期値に戻しますか？"
        );

        if (!confirmed) {
            return;
        }

        settings = clone(defaultSettings);

        // シフト設定に登録されている基本スコアを初期値として使用
        shiftTypes.forEach(shift => {
            settings.shiftScores[String(shift.id)] =
                Number(shift.score) || 0;
        });

        applySettings();

        previewResult.hidden = true;
        previewTableBody.innerHTML = "";

        showMessage(
            "入力内容を初期値に戻しました。保存すると反映されます。"
        );
    }

    /* ========================================
       入力変更時の処理
    ======================================== */

    document.querySelectorAll(
        ".settings-scores-page input, .settings-scores-page select"
    ).forEach(element => {

        element.addEventListener("input", () => {
            clearMessage();
            updateCalculationExample();

            // 入力が変わったら古いプレビューを隠す
            previewResult.hidden = true;
        });

        element.addEventListener("change", () => {
            updateCalculationExample();
            previewResult.hidden = true;
        });
    });

    /* ========================================
       ボタンイベント
    ======================================== */

    get("previewScoreButton").addEventListener(
        "click",
        executePreview
    );

    get("saveScoresButton").addEventListener(
        "click",
        saveSettings
    );

    get("resetScoresButton").addEventListener(
        "click",
        resetSettings
    );

    /* ========================================
       Bootstrap Tooltip
    ======================================== */

    if (typeof bootstrap !== "undefined") {

        document.querySelectorAll(
            '[data-bs-toggle="tooltip"]'
        ).forEach(element => {

            new bootstrap.Tooltip(element);

        });
    }

    /* ========================================
       初期表示
    ======================================== */

    loadShiftTypes();
    loadScoreSettings();

    // 保存されたスコアがないシフト種別は
    // シフト設定画面の基本スコアを利用する
    shiftTypes.forEach(shift => {

        const id = String(shift.id);

        if (settings.shiftScores[id] === undefined) {
            settings.shiftScores[id] = Number(shift.score) || 0;
        }
    });

    applySettings();

});
