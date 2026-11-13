document.addEventListener('DOMContentLoaded', () => {
    const roleSelector = document.getElementById('roleSelector');
    const pageTitle = document.getElementById('pageTitle');
    const generalActionButtons = document.getElementById('generalActionButtons');
    const adminActionButtons = document.getElementById('adminActionButtons');
    
    // 月切り替え要素
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const currentYMEl = document.getElementById('currentYM');

    // モーダル関連
    const preferredModal = document.getElementById('preferredModal');
    const openPreferredModalBtn = document.getElementById('openPreferredModalBtn');
    const closePreferredModalBtn = document.getElementById('closePreferredModalBtn');
    const cancelPreferredModalBtn = document.getElementById('cancelPreferredModalBtn');
    const submitPreferredModalBtn = document.getElementById('submitPreferredModalBtn');

    const paidLeaveModal = document.getElementById('paidLeaveModal');
    const openPaidLeaveBtn = document.getElementById('openPaidLeaveBtn');
    const closePaidLeaveModalBtn = document.getElementById('closePaidLeaveModalBtn');
    const cancelPaidLeaveModalBtn = document.getElementById('cancelPaidLeaveModalBtn');
    const submitPaidLeaveModalBtn = document.getElementById('submitPaidLeaveModalBtn');

    const busyModal = document.getElementById('busyModal');
    const openBusyModalBtn = document.getElementById('openBusyModalBtn');
    const closeBusyModalBtn = document.getElementById('closeBusyModalBtn');
    const cancelBusyModalBtn = document.getElementById('cancelBusyModalBtn');
    const submitBusyModalBtn = document.getElementById('submitBusyModalBtn');

    let currentYM = '2024-10';
    const userId = 1;

    function changeMonth(offset) {
        let [year, month] = currentYM.split('-').map(Number);
        month += offset;
        if (month > 12) { month = 1; year++; }
        else if (month < 1) { month = 12; year--; }
        currentYM = `${year}-${String(month).padStart(2, '0')}`;
        currentYMEl.textContent = currentYM;
        loadShiftData();
    }

    if (prevMonthBtn) prevMonthBtn.addEventListener('click', () => changeMonth(-1));
    if (nextMonthBtn) nextMonthBtn.addEventListener('click', () => changeMonth(1));

    // --- データ取得 & レンダリング (参照先を shifts.php に変更) ---
    async function loadShiftData() {
        try {
            const res = await fetch(`shifts.php?action=get_month_data&ym=${currentYM}&user_id=${userId}`);
            const data = await res.json();
            if (data.success) {
                renderCalendar(currentYM, data.shifts, data.busy_days);
                renderSummary(data.summary);
            }
        } catch (err) {
            console.error('シフトデータ取得エラー:', err);
        }
    }

    async function loadDashboardInfo() {
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            document.getElementById('todayDateLabel').textContent = todayStr;

            const res = await fetch(`shifts.php?action=get_dashboard_info&today=${todayStr}&user_id=${userId}`);
            const data = await res.json();
            
            const card = document.getElementById('todaysShiftCard');
            if (data.success && data.todays_shift) {
                const s = data.todays_shift;
                card.innerHTML = `
                    <div class="text-sm font-bold text-green-700">${s.status}</div>
                    <div class="text-xs text-green-600 mt-0.5">${s.start_time ? s.start_time.slice(0,5) : '09:00'} ～ ${s.end_time ? s.end_time.slice(0,5) : '18:00'}</div>
                `;
            } else {
                card.innerHTML = `<div class="text-sm font-bold text-gray-700">シフト情報なし</div>`;
            }
        } catch (err) {
            console.error('ダッシュボード情報取得エラー:', err);
        }
    }

    function renderCalendar(ym, shifts, busyDays) {
        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';

        const [year, month] = ym.split('-').map(Number);
        const firstDayIndex = new Date(year, month - 1, 1).getDay();
        const lastDate = new Date(year, month, 0).getDate();
        const prevLastDate = new Date(year, month - 1, 0).getDate();

        for (let i = firstDayIndex - 1; i >= 0; i--) {
            const dayNum = prevLastDate - i;
            const cell = document.createElement('div');
            cell.className = "min-h-[90px] p-1.5 bg-gray-50 text-gray-400";
            cell.innerHTML = `<span class="text-xs">${dayNum}</span>`;
            grid.appendChild(cell);
        }

        for (let i = 1; i <= lastDate; i++) {
            const dayStr = String(i).padStart(2, '0');
            const fullDate = `${ym}-${dayStr}`;
            const shift = shifts.find(s => s.work_date && s.work_date.startsWith(fullDate));
            const isBusy = busyDays.some(b => b.date === fullDate);

            let badgeClass = "bg-blue-50 text-blue-700 border-blue-100";
            let typeName = shift ? shift.status : '';
            if (typeName === '在宅勤務') badgeClass = "bg-green-50 text-green-700 border-green-100";
            else if (typeName === '午前休') badgeClass = "bg-orange-50 text-orange-700 border-orange-100";
            else if (typeName === '休日') badgeClass = "bg-red-50 text-red-700 border-red-100 text-center";

            const cell = document.createElement('div');
            cell.className = `min-h-[90px] p-1.5 bg-white relative border cursor-pointer hover:bg-blue-50/20 ${isBusy ? 'bg-pink-50/40' : ''}`;
            cell.innerHTML = `
                <span class="font-semibold text-gray-700 text-xs">${i}</span>
                ${isBusy ? '<span class="text-[10px] text-pink-600 font-bold block">繁忙日</span>' : ''}
                ${shift ? `
                    <div class="mt-1 ${badgeClass} rounded p-1 text-xs font-medium border">
                        <div>${typeName}</div>
                        ${shift.start_time ? `<div class="text-[10px] opacity-75">${shift.start_time.slice(0,5)}～${shift.end_time.slice(0,5)}</div>` : ''}
                    </div>` : ''}
            `;

            cell.addEventListener('click', () => {
                document.getElementById('selectedDateText').textContent = `${year}年${month}月${i}日`;
                document.getElementById('detailShiftType').textContent = typeName || 'ー';
                document.getElementById('detailTime').textContent = shift && shift.start_time ? `${shift.start_time.slice(0,5)} ～ ${shift.end_time.slice(0,5)}` : 'ー';
            });

            grid.appendChild(cell);
        }
    }

    function renderSummary(summary) {
        const list = document.getElementById('shiftSummaryList');
        list.innerHTML = '';
        
        const types = ['通常出勤', '在宅勤務', '午前休', '有給休暇', '休日'];
        types.forEach(type => {
            const found = summary.find(s => s.status_type === type);
            const count = found ? found.count : 0;
            list.innerHTML += `
                <div class="flex justify-between items-center py-1 border-b border-gray-100">
                    <span class="text-gray-600">${type}</span>
                    <span class="font-semibold text-gray-800">${count}日</span>
                </div>
            `;
        });
    }

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

    if (openPreferredModalBtn) openPreferredModalBtn.addEventListener('click', () => preferredModal.classList.remove('hidden'));
    [closePreferredModalBtn, cancelPreferredModalBtn].forEach(btn => btn?.addEventListener('click', () => preferredModal.classList.add('hidden')));

    if (openPaidLeaveBtn) openPaidLeaveBtn.addEventListener('click', () => paidLeaveModal.classList.remove('hidden'));
    [closePaidLeaveModalBtn, cancelPaidLeaveModalBtn].forEach(btn => btn?.addEventListener('click', () => paidLeaveModal.classList.add('hidden')));

    if (openBusyModalBtn) openBusyModalBtn.addEventListener('click', () => busyModal.classList.remove('hidden'));
    [closeBusyModalBtn, cancelBusyModalBtn].forEach(btn => btn?.addEventListener('click', () => busyModal.classList.add('hidden')));

    // --- 希望シフト提出処理 ---
    if (submitPreferredModalBtn) {
        submitPreferredModalBtn.addEventListener('click', async () => {
            const workDateInput = document.getElementById('prefDate').value;
            const statusInput = document.getElementById('prefStatus').value;
            const startTimeInput = document.getElementById('prefStartTime').value;
            const endTimeInput = document.getElementById('prefEndTime').value;

            // 対象日が未入力の場合は処理を中断
            if (!workDateInput) {
                alert('対象日を選択してください。');
                return;
            }

            const body = {
                action: 'submit_shift_request',
                user_id: userId,
                work_date: workDateInput,
                status: statusInput,
                start_time: startTimeInput,
                end_time: endTimeInput
            };

            try {
                const res = await fetch('shifts.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                const result = await res.json();
                
                if (result.success) {
                    alert(result.message || '希望シフトを登録しました。');
                    preferredModal.classList.add('hidden');
                    loadShiftData();        // カレンダーを再読み込み
                    loadDashboardInfo();    // ダッシュボードを再読み込み
                } else {
                    alert('エラー: ' + (result.error || '登録に失敗しました。'));
                }
            } catch (err) {
                console.error('通信エラー:', err);
                alert('通信に失敗しました。');
            }
        });
    }

    if (submitPaidLeaveModalBtn) {
        submitPaidLeaveModalBtn.addEventListener('click', () => {
            alert('有休申請を受け付けました。');
            paidLeaveModal.classList.add('hidden');
        });
    }

    // --- 繁忙期設定保存処理 (参照先を shifts.php に変更) ---
    if (submitBusyModalBtn) {
        submitBusyModalBtn.addEventListener('click', async () => {
            const body = {
                action: 'save_busy_setting',
                date: document.getElementById('busyDate').value,
                required_people: document.getElementById('busyRequiredPeople').value,
                bonus_pt: document.getElementById('busyBonusPt').value
            };
            const res = await fetch('shifts.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const result = await res.json();
            alert(result.message || '繁忙期設定完了');
            busyModal.classList.add('hidden');
            loadShiftData();
        });
    }

    loadShiftData();
    loadDashboardInfo();
});