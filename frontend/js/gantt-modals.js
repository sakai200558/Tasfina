
/* ========================================
   Tasfina ガントチャート申請モーダル
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    const modalContainer =
        document.getElementById("ganttModals");

    if (!modalContainer) return;

    // モーダルのHTMLが読み込まれた後に初期化
    const observer = new MutationObserver(() => {

        if (!document.getElementById("workHoursForm") ||
            !document.getElementById("taskCompleteForm")) {
            return;
        }

        observer.disconnect();
        initializeGanttModals();
    });

    observer.observe(modalContainer, {
        childList: true
    });

    if (document.getElementById("workHoursForm")) {
        observer.disconnect();
        initializeGanttModals();
    }
});


function initializeGanttModals() {

    const hoursModalElement =
        document.getElementById("workHoursModal");

    const completeModalElement =
        document.getElementById("taskCompleteModal");

    const hoursModal =
        bootstrap.Modal.getOrCreateInstance(hoursModalElement);

    const completeModal =
        bootstrap.Modal.getOrCreateInstance(completeModalElement);

    const hoursForm =
        document.getElementById("workHoursForm");

    const completeForm =
        document.getElementById("taskCompleteForm");

    const hoursReason =
        document.getElementById("hoursReason");

    const completeReport =
        document.getElementById("completeReport");

    let currentTask = null;

    /* =====================================
       タスク情報の取得
    ===================================== */

    function getSelectedTask() {

        // gantt.js 側から選択タスクを取得
        if (typeof window.getGanttSelectedTask === "function") {
            return window.getGanttSelectedTask();
        }

        return null;
    }

    function normalizeTask(task) {

        if (!task) return null;

        const hours = Number(task.hours);

        if (!Number.isFinite(hours) || hours <= 0) {
            return null;
        }

        return {
            id: task.id,
            name: task.name,
            assignee: task.assignee || "未設定",
            department: task.department || "未設定",
            hours: hours
        };
    }

    /* =====================================
       工数変更申請を開く
    ===================================== */

    function openHoursModal() {

        currentTask = normalizeTask(getSelectedTask());

        if (!currentTask) {
            alert("タスクを選択してください。");
            return;
        }

        hoursForm.reset();
        clearError("hoursError");

        document.getElementById("hoursTaskName")
            .textContent = currentTask.name;

        document.getElementById("hoursTaskMeta")
            .textContent =
                `担当者：${currentTask.assignee} ／ ${currentTask.department}`;

        document.getElementById("currentHours")
            .value = currentTask.hours;

        document.getElementById("requestedHours")
            .value = currentTask.hours;

        document.getElementById("hoursReasonCount")
            .textContent = "0";

        hoursModal.show();
    }

    /* =====================================
       完了申請を開く
    ===================================== */

    function openCompleteModal() {

        currentTask = normalizeTask(getSelectedTask());

        if (!currentTask) {
            alert("タスクを選択してください。");
            return;
        }

        completeForm.reset();
        clearError("completeError");

        document.getElementById("completeTaskName")
            .textContent = currentTask.name;

        document.getElementById("completeTaskMeta")
            .textContent =
                `担当者：${currentTask.assignee} ／ ${currentTask.department}`;

        document.getElementById("plannedHours")
            .value = currentTask.hours;

        document.getElementById("actualHours")
            .value = currentTask.hours;

        document.getElementById("completeReportCount")
            .textContent = "0";

        completeModal.show();
    }

    /* =====================================
       ボタンのイベント
    ===================================== */

    document.addEventListener("click", (event) => {

        const hoursButton =
            event.target.closest("#requestHoursButton");

        const completeButton =
            event.target.closest("#requestCompleteButton");

        if (hoursButton) {
            event.preventDefault();
            openHoursModal();
        }

        if (completeButton) {
            event.preventDefault();
            openCompleteModal();
        }
    });

    /* =====================================
       文字数カウント
    ===================================== */

    hoursReason.addEventListener("input", () => {
        document.getElementById("hoursReasonCount")
            .textContent = hoursReason.value.length;
    });

    completeReport.addEventListener("input", () => {
        document.getElementById("completeReportCount")
            .textContent = completeReport.value.length;
    });

    /* =====================================
       エラー処理
    ===================================== */

    function showError(id, message) {
        const element = document.getElementById(id);
        element.textContent = message;
        element.hidden = false;
    }

    function clearError(id) {
        const element = document.getElementById(id);
        element.textContent = "";
        element.hidden = true;
    }

    /* =====================================
       工数変更申請
    ===================================== */

    hoursForm.addEventListener("submit", (event) => {

        event.preventDefault();
        clearError("hoursError");

        const requestedHours = Number(
            document.getElementById("requestedHours").value
        );

        const reason = hoursReason.value.trim();

        if (!Number.isFinite(requestedHours) ||
            requestedHours <= 0 ||
            requestedHours > 9999) {

            showError(
                "hoursError",
                "変更後の予定工数を正しく入力してください。"
            );
            return;
        }

        if (requestedHours === currentTask.hours) {
            showError(
                "hoursError",
                "現在の予定工数と異なる値を入力してください。"
            );
            return;
        }

        if (!reason) {
            showError(
                "hoursError",
                "変更理由を入力してください。"
            );
            return;
        }

        if (!hoursForm.checkValidity()) {
            showError(
                "hoursError",
                "入力内容を確認してください。"
            );
            return;
        }

        const requestData = {
            task_id: currentTask.id,
            current_hours: currentTask.hours,
            requested_hours: requestedHours,
            reason: reason
        };

        if (!confirm(
            "以下の内容で工数変更を申請しますか？\n\n" +
            `タスク：${currentTask.name}\n` +
            `変更前：${currentTask.hours}時間\n` +
            `変更後：${requestedHours}時間\n` +
            `理由：${reason}`
        )) {
            return;
        }

        console.log("工数変更申請（仮）", requestData);

        hoursModal.hide();

        alert(
            "工数変更申請の入力を確認しました。\n" +
            "現在は開発用の仮処理のため、申請は保存されていません。"
        );
    });

    /* =====================================
       完了申請
    ===================================== */

    completeForm.addEventListener("submit", (event) => {

        event.preventDefault();
        clearError("completeError");

        const actualHours = Number(
            document.getElementById("actualHours").value
        );

        const report = completeReport.value.trim();

        const evidence =
            document.getElementById("completeEvidence").files[0];

        if (!Number.isFinite(actualHours) ||
            actualHours <= 0 ||
            actualHours > 9999) {

            showError(
                "completeError",
                "実績工数を正しく入力してください。"
            );
            return;
        }

        if (!report) {
            showError(
                "completeError",
                "完了報告を入力してください。"
            );
            return;
        }

        if (evidence && evidence.size > 10 * 1024 * 1024) {
            showError(
                "completeError",
                "添付ファイルは10MB以下にしてください。"
            );
            return;
        }

        if (evidence) {
            const allowedExtensions =
                /\.(pdf|png|jpe?g|docx|xlsx)$/i;

            if (!allowedExtensions.test(evidence.name)) {
                showError(
                    "completeError",
                    "対応していないファイル形式です。"
                );
                return;
            }
        }

        if (!completeForm.checkValidity()) {
            showError(
                "completeError",
                "入力内容を確認してください。"
            );
            return;
        }

        const requestData = {
            task_id: currentTask.id,
            planned_hours: currentTask.hours,
            actual_hours: actualHours,
            report: report,
            evidence_name: evidence ? evidence.name : null
        };

        if (!confirm(
            "以下の内容で完了申請しますか？\n\n" +
            `タスク：${currentTask.name}\n` +
            `実績工数：${actualHours}時間\n` +
            `完了報告：${report}`
        )) {
            return;
        }

        console.log("完了申請（仮）", requestData);

        completeModal.hide();

        alert(
            "完了申請の入力を確認しました。\n" +
            "現在は開発用の仮処理のため、申請は保存されていません。"
        );
    });

    // 必要に応じて他のJSから呼び出せるようにする
    window.openGanttHoursModal = openHoursModal;
    window.openGanttCompleteModal = openCompleteModal;
}
