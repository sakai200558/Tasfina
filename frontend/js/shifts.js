document.addEventListener('DOMContentLoaded', () => {
    const roleSelector = document.getElementById('roleSelector');
    const pageTitle = document.getElementById('pageTitle');
    const generalActionButtons = document.getElementById('generalActionButtons');
    const adminActionButtons = document.getElementById('adminActionButtons');
    const adminBusyPeriodPanel = document.getElementById('adminBusyPeriodPanel');
    const menuShiftMgmt = document.getElementById('menuShiftMgmt');

    // モーダル要素
    const preferredModal = document.getElementById('preferredModal');
    const openPreferredModalBtn = document.getElementById('openPreferredModalBtn');
    const closePreferredModalBtn = document.getElementById('closePreferredModalBtn');
    const cancelPreferredModalBtn = document.getElementById('cancelPreferredModalBtn');

    const busyModal = document.getElementById('busyModal');
    const openBusyModalBtn = document.getElementById('openBusyModalBtn');
    const panelEditBusyBtn = document.getElementById('panelEditBusyBtn');
    const closeBusyModalBtn = document.getElementById('closeBusyModalBtn');
    const cancelBusyModalBtn = document.getElementById('cancelBusyModalBtn');
    const submitBusyModalBtn = document.getElementById('submitBusyModalBtn');

    // 権限切り替え処理 (一般ユーザー / 管理者)
    roleSelector.addEventListener('change', (e) => {
        const role = e.target.value;
        if (role === 'admin') {
            pageTitle.textContent = 'シフト管理（管理者）';
            generalActionButtons.classList.add('hidden');
            adminActionButtons.classList.remove('hidden');
            adminBusyPeriodPanel.classList.remove('hidden');
            menuShiftMgmt.textContent = 'シフト管理（管理者）';
        } else {
            pageTitle.textContent = 'シフト管理';
            adminActionButtons.classList.add('hidden');
            generalActionButtons.classList.remove('hidden');
            adminBusyPeriodPanel.classList.add('hidden');
            menuShiftMgmt.textContent = 'シフト管理';
        }
    });

    // 希望シフト提出モーダルの開閉
    if (openPreferredModalBtn) {
        openPreferredModalBtn.addEventListener('click', () => {
            preferredModal.classList.remove('hidden');
        });
    }
    [closePreferredModalBtn, cancelPreferredModalBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                preferredModal.classList.add('hidden');
            });
        }
    });

    // 繁忙期設定モーダルの開閉
    const openBusyModal = () => {
        busyModal.classList.remove('hidden');
    };
    if (openBusyModalBtn) openBusyModalBtn.addEventListener('click', openBusyModal);
    if (panelEditBusyBtn) panelEditBusyBtn.addEventListener('click', openBusyModal);

    [closeBusyModalBtn, cancelBusyModalBtn, submitBusyModalBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                busyModal.classList.add('hidden');
            });
        }
    });

    // モーダル背景クリックでの閉じる処理
    window.addEventListener('click', (e) => {
        if (e.target === preferredModal) {
            preferredModal.classList.add('hidden');
        }
        if (e.target === busyModal) {
            busyModal.classList.add('hidden');
        }
    })});