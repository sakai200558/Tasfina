document.addEventListener('DOMContentLoaded', () => {
    const roleSelector = document.getElementById('roleSelector');
    const pageTitle = document.getElementById('pageTitle');
    const generalActionButtons = document.getElementById('generalActionButtons');
    const adminActionButtons = document.getElementById('adminActionButtons');
    
    // 月切り替え要素
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const currentYMEl = document.getElementById('currentYM');

    // モーダル：希望シフト
    const preferredModal = document.getElementById('preferredModal');
    const openPreferredModalBtn = document.getElementById('openPreferredModalBtn');
    const closePreferredModalBtn = document.getElementById('closePreferredModalBtn');
    const cancelPreferredModalBtn = document.getElementById('cancelPreferredModalBtn');
    const submitPreferredModalBtn = document.getElementById('submitPreferredModalBtn');

    // モーダル：有休申請
    const paidLeaveModal = document.getElementById('paidLeaveModal');
    const openPaidLeaveBtn = document.getElementById('openPaidLeaveBtn');
    const closePaidLeaveModalBtn = document.getElementById('closePaidLeaveModalBtn');
    const cancelPaidLeaveModalBtn = document.getElementById('cancelPaidLeaveModalBtn');
    const submitPaidLeaveModalBtn = document.getElementById('submitPaidLeaveModalBtn');

    // モーダル：繁忙期設定
    const busyModal = document.getElementById('busyModal');
    const openBusyModalBtn = document.getElementById('openBusyModalBtn');
    const closeBusyModalBtn = document.getElementById('closeBusyModalBtn');
    const cancelBusyModalBtn = document.getElementById('cancelBusyModalBtn');
    const submitBusyModalBtn = document.getElementById('submitBusyModalBtn');

    let currentYM = '2026-10'; // 基準年月
    const userId = 1; // サンプル用ユーザーID

    // --- 月変更ユーティリティ ---
    function changeMonth(offset) {
        let [year, month] = currentYM.split('-').map(Number);
        month += offset;
        if (month > 12) {
            month = 1;
            year++;
        } else if (month < 1) {
            month = 12;
            year--;
        }
        currentYM = `${year}-${String(month).padStart(2, '0')}`;
        currentYMEl.textContent = currentYM;
        loadShiftData();
    }

    if (prevMonthBtn) prevMonthBtn.addEventListener('click', () => changeMonth(-1));
    if (nextMonthBtn) nextMonthBtn.addEventListener('click', () => changeMonth(1));

    // --- APIデータ取得・描画関数 ---
    async function loadShiftData() {
        try {
            const res = await fetch(`shift_api.php?action=get_month_data&ym=${currentYM}&user_id=${userId}`);
            const data = await res.json();
            if (data.success) {
                renderCalendar(data.shifts, data.busy_days);
                renderSummary(data.summary);
            }
        } catch (err) {
            console.error('データ取得エラー:', err);
        }
    }

    async function loadDashboardInfo() {
        try {
            const res = await fetch(`shift_api.php?action=get_dashboard_info&user_id=${userId}`);
            const data = await res.json();
            if (data.success && data.todays_shift) {
                const s = data.todays_shift;
                document.getElementById('todaysShiftCard').innerHTML = `
                    <div class="text-sm font-bold text-green-700">${s.status === 'approved' ? '承認済み出勤' : s.status}</div>
                    <div class="text-xs text-green-600 mt-0.5">${s.start_time} ～ ${s.end_time}</div>
                `;
            }
        } catch (err) {
            console.error('ダッシュボード取得エラー:', err);
        }
    }

    function renderCalendar(shifts, busyDays) {
        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';
        
        for (let i = 1; i <= 31; i++) {
            const dayStr = String(i).padStart(2, '0');
            const fullDate = `${currentYM}-${dayStr}`;
            const shift = shifts.find(s => s.work_date && s.work_date.startsWith(fullDate));
            const isBusy = busyDays.some(b => b.date === fullDate);

            const cell = document.createElement('div');
            cell.className = `min-h-[90px] p-1.5 bg-white relative border ${isBusy ? 'bg-pink-50' : ''}`;
            cell.innerHTML = `
                <span class="font-semibold text-gray-700">${i}</span>
                ${isBusy ? '<span class="text-[10px] text-pink-600 block">繁忙日</span>' : ''}
                ${shift ? `<div class="mt-1 bg-blue-50 text-blue-700 rounded p-1 text-xs">出勤<br>${shift.start_time.slice(0,5)}</div>` : ''}
            `;
            grid.appendChild(cell);
        }
    }

    function renderSummary(summary) {
        const list = document.getElementById('shiftSummaryList');
        list.innerHTML = '';
        summary.forEach(item => {
            list.innerHTML += `
                <div class="flex justify-between items-center">
                    <span>ステータス: ${item.status}</span>
                    <span class="font-semibold text-gray-700">${item.count}件</span>
                </div>
            `;
        });
    }

    // --- 権限切り替え ---
    roleSelector.addEventListener('change', (e) => {
        if (e.target.value === 'admin') {
            pageTitle.textContent = 'シフト管理（管理者）';
            generalActionButtons.classList.add('hidden');
            adminActionButtons.classList.remove('hidden');
        } else {
            pageTitle.textContent = 'シフト管理';
            adminActionButtons.classList.add('hidden');
            generalActionButtons.classList.remove('hidden');
        }
    });

    // --- モーダル開閉制御 ---
    if (openPreferredModalBtn) openPreferredModalBtn.addEventListener('click', () => preferredModal.classList.remove('hidden'));
    [closePreferredModalBtn, cancelPreferredModalBtn].forEach(btn => btn?.addEventListener('click', () => preferredModal.classList.add('hidden')));

    if (openPaidLeaveBtn) openPaidLeaveBtn.addEventListener('click', () => paidLeaveModal.classList.remove('hidden'));
    [closePaidLeaveModalBtn, cancelPaidLeaveModalBtn].forEach(btn => btn?.addEventListener('click', () => paidLeaveModal.classList.add('hidden')));

    if (openBusyModalBtn) openBusyModalBtn.addEventListener('click', () => busyModal.classList.remove('hidden'));
    [closeBusyModalBtn, cancelBusyModalBtn].forEach(btn => btn?.addEventListener('click', () => busyModal.classList.add('hidden')));

    // --- 希望シフト提出処理 (POST) ---
    if (submitPreferredModalBtn) {
        submitPreferredModalBtn.addEventListener('click', async () => {
            const body = {
                action: 'submit_shift_request',
                user_id: userId,
                work_date: document.getElementById('prefDate').value,
                start_time: document.getElementById('prefStartTime').value,
                end_time: document.getElementById('prefEndTime').value
            };
            const res = await fetch('shift_api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const result = await res.json();
            alert(result.message || '送信完了');
            preferredModal.classList.add('hidden');
            loadShiftData();
        });
    }

    // --- 有休申請処理 ---
    if (submitPaidLeaveModalBtn) {
        submitPaidLeaveModalBtn.addEventListener('click', () => {
            alert('有休申請を送信しました。');
            paidLeaveModal.classList.add('hidden');
        });
    }

    // --- 繁忙期設定保存処理 (POST) ---
    if (submitBusyModalBtn) {
        submitBusyModalBtn.addEventListener('click', async () => {
            const body = {
                action: 'save_busy_setting',
                date: document.getElementById('busyDate').value,
                required_people: document.getElementById('busyRequiredPeople').value,
                bonus_pt: document.getElementById('busyBonusPt').value
            };
            const res = await fetch('shift_api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const result = await res.json();
            alert(result.message || '保存完了');
            busyModal.classList.add('hidden');
            loadShiftData();
        });
    }

    // 初期データ読み込み
    loadShiftData();
    loadDashboardInfo();
});