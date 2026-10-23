
/* ========================================
   Tasfina 新規タスク作成モーダル読込
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    const openButton = document.getElementById(
        "openTaskCreateModal"
    );

    const container = document.getElementById(
        "taskCreateModalContainer"
    );

    if (!openButton || !container) {
        return;
    }

    let modalInstance = null;

    /* ========================================
       モーダルHTMLを読み込む
    ======================================== */

    async function loadTaskCreateModal() {

        if (modalInstance) {
            return modalInstance;
        }

        const response = await fetch(
            "../modals/task-create.html"
        );

        if (!response.ok) {
            throw new Error(
                `モーダルの読み込みに失敗しました: ${response.status}`
            );
        }

        const html = await response.text();

        const documentFragment = new DOMParser()
            .parseFromString(html, "text/html");

        // task-create.htmlが完全なHTMLでも、
        // モーダル要素のみを取り出して利用する
        const modalElement =
            documentFragment.querySelector(".modal");

        if (!modalElement) {
            throw new Error(
                "task-create.html に .modal 要素がありません。"
            );
        }

        // 既存のIDを維持して挿入
        container.replaceChildren(
            document.importNode(modalElement, true)
        );

        const insertedModal = container.querySelector(".modal");

        modalInstance = new bootstrap.Modal(insertedModal);

        // 読み込み後の初期化を既存コードへ通知
        document.dispatchEvent(
            new CustomEvent("tasfina:task-create-loaded", {
                detail: {
                    modal: insertedModal
                }
            })
        );

        return modalInstance;
    }

    /* ========================================
       新規タスク作成ボタン
    ======================================== */

    openButton.addEventListener("click", async () => {

        openButton.disabled = true;

        try {
            const modal = await loadTaskCreateModal();

            modal.show();

        } catch (error) {

            console.error(
                "新規タスク作成モーダルエラー:",
                error
            );

            alert(
                "新規タスク作成画面を読み込めませんでした。\n" +
                "task-create.html の配置を確認してください。"
            );

        } finally {
            openButton.disabled = false;
        }

    });

});
