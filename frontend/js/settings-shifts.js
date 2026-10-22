
/* ========================================
   Tasfina シフト設定
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ========================================
       初期データ
    ======================================== */

    const storageKey = "tasfina_shift_settings_v1";

    const defaultBusyPeriods = [
        {
            id: 1,
            name: "年末年始",
            start: "2024-12-20",
            end: "2025-01-05",
            level: "very-high",
            score: 2.0,
            description: "年末年始対応のため"
        },
        {
            id: 2,
            name: "夏季繁忙期",
            start: "2024-08-01",
            end: "2024-08-20",
            level: "high",
            score: 1.5,
            description: "夏休み期間の対応"
        },
        {
            id: 3,
            name: "年度末",
            start: "2024-03-01",
            end: "2024-03-15",
            level: "medium-high",
            score: 1.0,
            description: "決算対応のため"
        },
        {
            id: 4,
            name: "新年度",
            start: "2024-04-01",
            end: "2024-04-10",
            level: "medium-high",
            score: 1.0,
            description: "新メンバー対応のため"
        }
    ];

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
            start: "09:00",
            end: "13:00",
            breakMinutes: 0,
            score: 0.5,
            description: "午前のみの勤務"
        },
        {
            id: 4,
            name: "午後休",
            color: "#ffd49b",
            start: "13:00",
            end: "18:00",
            breakMinutes: 0,
            score: 0.5,
            description: "午後のみの勤務"
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

    const defaultRules = {
        maxConsecutiveDays: 5,
        maxMonthlyDays: 20,
        requestPriority: "high"
    };

    const clone = value => JSON.parse(JSON.stringify(value));

    let busyPeriods = clone(defaultBusyPeriods);
    let shiftTypes = clone(defaultShiftTypes);
    let rules = clone(defaultRules);

    let selectedBusyId = 1;
    let selectedShiftTypeId = null;
    let editorMode = "busy";

    /* ========================================
       要素取得
    ======================================== */

    const busyTable = document.getElementById(
        "busyPeriodTableBody"
    );

    const shiftTable = document.getElementById(
        "shiftTypeTableBody"
    );

    const busyForm = document.getElementById(
        "busyPeriodForm"
    );

    const shiftForm = document.getElementById(
        "shiftTypeForm"
    );

    const editorHeading = document.getElementById(
        "editorHeading"
    );

    const messageElement = document.getElementById(
        "shiftSettingsMessage"
    );

    const get = id => document.getElementById(id);

    /* ========================================
       共通処理
    ======================================== */

    function showMessage(text, error = false) {
        messageElement.textContent = text;
        messageElement.classList.toggle("error", error);
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }

    function formatDate(date) {
        return date ? date.replaceAll("-", "/") : "-";
    }

    function formatScore(score) {
        return Number(score).toFixed(1);
    }

    function formatBreak(minutes) {
        const value = Number(minutes);

        if (value === 0) return "なし";
        if (value === 60) return "1時間";
        if (value === 90) return "1時間30分";

        return `${value}分`;
    }

    function nextId(items) {
        return Math.max(0, ...items.map(item => Number(item.id))) + 1;
    }

    function saveData() {
        try {
            localStorage.setItem(
                storageKey,
                JSON.stringify({
                    busyPeriods,
                    shiftTypes,
                    rules
                })
            );

            return true;

        } catch (error) {
            console.error("保存エラー:", error);
            showMessage(
                "データを保存できませんでした。",
                true
            );
            return false;
        }
    }

    function loadData() {
        try {
            const saved = localStorage.getItem(storageKey);

            if (!saved) return;

            const data = JSON.parse(saved);

            if (Array.isArray(data.busyPeriods)) {
                busyPeriods = data.busyPeriods;
            }

            if (Array.isArray(data.shiftTypes)) {
                shiftTypes = data.shiftTypes;
            }

            if (data.rules && typeof data.rules === "object") {
                rules = {
                    ...defaultRules,
                    ...data.rules
                };
            }

        } catch (error) {
            console.error("読み込みエラー:", error);
        }
    }

    /* ========================================
       繁忙期の表示
    ======================================== */

    const levelLabels = {
        "very-high": "非常に高い",
        "high": "高い",
        "medium-high": "やや高い",
        "normal": "通常"
    };

    function renderBusyPeriods() {

        if (busyPeriods.length === 0) {
            busyTable.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        繁忙期が登録されていません。
                    </td>
                </tr>
            `;
            return;
        }

        busyTable.innerHTML = busyPeriods.map(item => {

            const selected = item.id === selectedBusyId;

            return `
                <tr
                    data-busy-id="${item.id}"
                    class="${selected ? "selected-row" : ""}"
                >
                    <td>
                        ${escapeHtml(formatDate(item.start))}
                        ～
                        ${escapeHtml(formatDate(item.end))}
                    </td>

                    <td>${escapeHtml(item.name)}</td>

                    <td>
                        <span class="busy-level ${escapeHtml(item.level)}">
                            ${escapeHtml(levelLabels[item.level] || "通常")}
                        </span>
                    </td>

                    <td>
                        <span class="busy-score">
                            +${formatScore(item.score)}
                        </span>
                    </td>

                    <td>${escapeHtml(item.description)}</td>

                    <td>
                        <div class="shift-table-actions">

                            <button
                                type="button"
                                class="shift-action-button edit-busy"
                                data-id="${item.id}"
                                aria-label="${escapeHtml(item.name)}を編集"
                            >
                                <i class="bi bi-pencil-fill"></i>
                            </button>

                            <button
                                type="button"
                                class="shift-action-button delete delete-busy"
                                data-id="${item.id}"
                                aria-label="${escapeHtml(item.name)}を削除"
                            >
                                <i class="bi bi-trash3"></i>
                            </button>

                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }

    /* ========================================
       シフト種別の表示
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

            const selected = item.id === selectedShiftTypeId;

            const workingHours = item.start && item.end
                ? `${item.start} ～ ${item.end}`
                : "-";

            return `
                <tr
                    data-shift-id="${item.id}"
                    class="${selected ? "selected-row" : ""}"
                >
                    <td>${escapeHtml(item.name)}</td>

                    <td>
                        <span
                            class="shift-color-dot"
                            data-dot-color="${escapeHtml(item.color)}"
                        ></span>
                    </td>

                    <td>${escapeHtml(workingHours)}</td>

                    <td>${escapeHtml(formatBreak(item.breakMinutes))}</td>

                    <td>${formatScore(item.score)}</td>

                    <td>${escapeHtml(item.description)}</td>

                    <td>
                        <div class="shift-table-actions">

                            <button
                                type="button"
                                class="shift-action-button edit-shift"
                                data-id="${item.id}"
                                aria-label="${escapeHtml(item.name)}を編集"
                            >
                                <i class="bi bi-pencil-fill"></i>
                            </button>

                            <button
                                type="button"
                                class="shift-action-button delete delete-shift"
                                data-id="${item.id}"
                                aria-label="${escapeHtml(item.name)}を削除"
                            >
                                <i class="bi bi-trash3"></i>
                            </button>

                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        // 動的な表示色をCSSカスタムプロパティに設定
        shiftTable.querySelectorAll("[data-dot-color]").forEach(dot => {
            const color = dot.dataset.dotColor;

            if (/^#[0-9a-fA-F]{6}$/.test(color)) {
                dot.style.setProperty("--shift-dot-color", color);
            }
        });
    }

    /* ========================================
       編集フォーム切り替え
    ======================================== */

    function switchEditor(mode) {

        editorMode = mode;

        const busyMode = mode === "busy";

        busyForm.hidden = !busyMode;
        shiftForm.hidden = busyMode;

        editorHeading.textContent = busyMode
            ? "繁忙期の詳細設定"
            : "シフト種別の詳細設定";
    }

    /* ========================================
       繁忙期の編集
    ======================================== */

    function updateBusyCounts() {
        get("busyNameCount").textContent =
            `${get("busyName").value.length} / 50`;

        get("busyDescriptionCount").textContent =
            `${get("busyDescription").value.length} / 300`;
    }

    function editBusyPeriod(id) {

        const item = busyPeriods.find(
            period => period.id === id
        );

        if (!item) return;

        selectedBusyId = id;
        selectedShiftTypeId = null;

        switchEditor("busy");

        get("busyName").value = item.name;
        get("busyStartDate").value = item.start;
        get("busyEndDate").value = item.end;
        get("busyLevel").value = item.level;
        get("busyScore").value = item.score;
        get("busyDescription").value = item.description;

        updateBusyCounts();

        renderBusyPeriods();
        renderShiftTypes();
    }

    function addBusyPeriod() {

        selectedBusyId = null;
        selectedShiftTypeId = null;

        switchEditor("busy");
        busyForm.reset();

        get("busyLevel").value = "normal";
        get("busyScore").value = "0";

        updateBusyCounts();

        renderBusyPeriods();
        renderShiftTypes();

        get("busyName").focus();
    }

    function deleteBusyPeriod(id) {

        const item = busyPeriods.find(
            period => period.id === id
        );

        if (!item) return;

        if (!confirm(`「${item.name}」を削除しますか？`)) {
            return;
        }

        busyPeriods = busyPeriods.filter(
            period => period.id !== id
        );

        if (selectedBusyId === id) {
            selectedBusyId = null;
            busyForm.reset();
            updateBusyCounts();
        }

        renderBusyPeriods();

        if (saveData()) {
            showMessage("繁忙期を削除しました。");
        }
    }

    busyForm.addEventListener("submit", event => {

        event.preventDefault();

        const name = get("busyName").value.trim();
        const start = get("busyStartDate").value;
        const end = get("busyEndDate").value;
        const level = get("busyLevel").value;
        const score = Number(get("busyScore").value);
        const description = get("busyDescription").value.trim();

        if (!name || !start || !end || get("busyScore").value === "") {
            showMessage("必須項目を入力してください。", true);
            return;
        }

        if (start > end) {
            showMessage(
                "終了日は開始日以降にしてください。",
                true
            );
            return;
        }

        if (!Number.isFinite(score) || score < 0 || score > 10) {
            showMessage(
                "負担スコア補正は0～10で入力してください。",
                true
            );
            return;
        }

        const id = selectedBusyId ?? nextId(busyPeriods);

        const item = {
            id,
            name,
            start,
            end,
            level,
            score,
            description
        };

        const index = busyPeriods.findIndex(
            period => period.id === id
        );

        if (index >= 0) {
            busyPeriods[index] = item;
        } else {
            busyPeriods.push(item);
        }

        selectedBusyId = id;

        renderBusyPeriods();

        if (saveData()) {
            showMessage("繁忙期の設定を保存しました。");
        }
    });

    /* ========================================
       シフト種別の編集
    ======================================== */

    function editShiftType(id) {

        const item = shiftTypes.find(
            shift => shift.id === id
        );

        if (!item) return;

        selectedShiftTypeId = id;
        selectedBusyId = null;

        switchEditor("shift");

        get("shiftTypeName").value = item.name;
        get("shiftTypeColor").value = item.color;
        get("shiftStartTime").value = item.start;
        get("shiftEndTime").value = item.end;
        get("shiftBreakMinutes").value = item.breakMinutes;
        get("shiftTypeScore").value = item.score;
        get("shiftTypeDescription").value = item.description;

        renderBusyPeriods();
        renderShiftTypes();
    }

    function addShiftType() {

        selectedShiftTypeId = null;
        selectedBusyId = null;

        switchEditor("shift");
        shiftForm.reset();

        get("shiftTypeColor").value = "#409eff";
        get("shiftTypeScore").value = "1.0";

        renderBusyPeriods();
        renderShiftTypes();

        get("shiftTypeName").focus();
    }

    function deleteShiftType(id) {

        const item = shiftTypes.find(
            shift => shift.id === id
        );

        if (!item) return;

        if (!confirm(`「${item.name}」を削除しますか？`)) {
            return;
        }

        shiftTypes = shiftTypes.filter(
            shift => shift.id !== id
        );

        if (selectedShiftTypeId === id) {
            selectedShiftTypeId = null;
            shiftForm.reset();
        }

        renderShiftTypes();

        if (saveData()) {
            showMessage("シフト種別を削除しました。");
        }
    }

    shiftForm.addEventListener("submit", event => {

        event.preventDefault();

        const name = get("shiftTypeName").value.trim();
        const color = get("shiftTypeColor").value;
        const start = get("shiftStartTime").value;
        const end = get("shiftEndTime").value;
        const breakMinutes = Number(
            get("shiftBreakMinutes").value
        );
        const score = Number(get("shiftTypeScore").value);
        const description = get("shiftTypeDescription").value.trim();

        if (!name || get("shiftTypeScore").value === "") {
            showMessage("必須項目を入力してください。", true);
            return;
        }

        if ((start && !end) || (!start && end)) {
            showMessage(
                "勤務時間は開始・終了を両方入力してください。",
                true
            );
            return;
        }

        if (start && end && start >= end) {
            showMessage(
                "終了時間は開始時間より後にしてください。",
                true
            );
            return;
        }

        if (!Number.isFinite(score) || score < 0 || score > 10) {
            showMessage(
                "負担スコアは0～10で入力してください。",
                true
            );
            return;
        }

        const id = selectedShiftTypeId ?? nextId(shiftTypes);

        const item = {
            id,
            name,
            color,
            start,
            end,
            breakMinutes,
            score,
            description
        };

        const index = shiftTypes.findIndex(
            shift => shift.id === id
        );

        if (index >= 0) {
            shiftTypes[index] = item;
        } else {
            shiftTypes.push(item);
        }

        selectedShiftTypeId = id;

        renderShiftTypes();

        if (saveData()) {
            showMessage("シフト種別の設定を保存しました。");
        }
    });

    /* ========================================
       一覧のクリックイベント
    ======================================== */

    busyTable.addEventListener("click", event => {

        const deleteButton = event.target.closest(
            ".delete-busy"
        );

        if (deleteButton) {
            deleteBusyPeriod(Number(deleteButton.dataset.id));
            return;
        }

        const row = event.target.closest("[data-busy-id]");

        if (row) {
            editBusyPeriod(Number(row.dataset.busyId));
        }
    });

    shiftTable.addEventListener("click", event => {

        const deleteButton = event.target.closest(
            ".delete-shift"
        );

        if (deleteButton) {
            deleteShiftType(Number(deleteButton.dataset.id));
            return;
        }

        const row = event.target.closest("[data-shift-id]");

        if (row) {
            editShiftType(Number(row.dataset.shiftId));
        }
    });

    /* ========================================
       追加・キャンセルボタン
    ======================================== */

    get("addBusyPeriodButton").addEventListener(
        "click",
        addBusyPeriod
    );

    get("addShiftTypeButton").addEventListener(
        "click",
        addShiftType
    );

    get("cancelBusyPeriodButton").addEventListener(
        "click",
        () => {
            if (busyPeriods.length > 0) {
                editBusyPeriod(busyPeriods[0].id);
            } else {
                addBusyPeriod();
            }
        }
    );

    get("cancelShiftTypeButton").addEventListener(
        "click",
        () => {
            if (shiftTypes.length > 0) {
                editShiftType(shiftTypes[0].id);
            } else {
                addShiftType();
            }
        }
    );

    get("busyName").addEventListener(
        "input",
        updateBusyCounts
    );

    get("busyDescription").addEventListener(
        "input",
        updateBusyCounts
    );

    /* ========================================
       自動調整ルール
    ======================================== */

    function applyRules() {
        get("maxConsecutiveDays").value =
            rules.maxConsecutiveDays;

        get("maxMonthlyDays").value =
            rules.maxMonthlyDays;

        get("requestPriority").value =
            rules.requestPriority;
    }

    get("shiftRulesForm").addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const consecutive = Number(
                get("maxConsecutiveDays").value
            );

            const monthly = Number(
                get("maxMonthlyDays").value
            );

            if (
                !Number.isInteger(consecutive) ||
                !Number.isInteger(monthly) ||
                consecutive < 1 ||
                consecutive > 31 ||
                monthly < 1 ||
                monthly > 31
            ) {
                showMessage(
                    "勤務日数は1～31の整数で入力してください。",
                    true
                );
                return;
            }

            rules = {
                maxConsecutiveDays: consecutive,
                maxMonthlyDays: monthly,
                requestPriority: get("requestPriority").value
            };

            if (saveData()) {
                showMessage("自動調整ルールを保存しました。");
            }
        }
    );

    /* ========================================
       初期表示
    ======================================== */

    loadData();

    renderBusyPeriods();
    renderShiftTypes();
    applyRules();

    if (busyPeriods.length > 0) {
        editBusyPeriod(busyPeriods[0].id);
    } else {
        addBusyPeriod();
    }

});
