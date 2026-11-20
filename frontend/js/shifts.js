document.addEventListener('DOMContentLoaded', () => {
    const roleSelector = document.getElementById('roleSelector');
    const pageTitle = document.getElementById('pageTitle');
    const generalActionButtons = document.getElementById('generalActionButtons');
    const adminActionButtons = document.getElementById('adminActionButtons');
    const SHIFT_API_URL = '../../backend/shifts.php';
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

    // 希望シフト提出モーダル用（月間一括入力）
    const prevShiftReqMonthBtn = document.getElementById('prevShiftReqMonthBtn');
    const nextShiftReqMonthBtn = document.getElementById('nextShiftReqMonthBtn');
    const shiftReqMonthLabel = document.getElementById('shiftReqMonthLabel');
    const shiftRequestComment = document.getElementById('shiftRequestComment');
    const shiftCommentCount = document.getElementById('shiftCommentCount');
    const SHIFT_OPTIONS = ['通常出勤', '在宅勤務', '午前休', '休日', '有給休暇', '特に希望なし'];
    let shiftReqYM = '2024-10';

    const paidLeaveModal = document.getElementById('paidLeaveModal');
    const openPaidLeaveBtn = document.getElementById('openPaidLeaveBtn');
    const closePaidLeaveModalBtn = document.getElementById('closePaidLeaveModalBtn');
    const cancelPaidLeaveModalBtn = document.getElementById('cancelPaidLeaveModalBtn');
    const submitPaidLeaveModalBtn = document.getElementById('submitPaidLeaveModalBtn');
    
    const leaveReasonTextarea = document.getElementById('leaveReason');
    const charCountEl = document.getElementById('charCount');

    if (leaveReasonTextarea && charCountEl) {
        leaveReasonTextarea.addEventListener('input', (e) => {
            const currentLen = e.target.value.length;
            charCountEl.textContent = `${currentLen} / 300`;
        });
    }

    if (shiftRequestComment && shiftCommentCount) {
        shiftRequestComment.addEventListener('input', (e) => {
            const currentLen = e.target.value.length;
            shiftCommentCount.textContent = `${currentLen} / 300`;
        });
    }

    // 有休申請の取得日数自動計算
    function updateLeaveDaysCount() {
        const startVal = document.getElementById('leaveStartDate')?.value;
        const endVal = document.getElementById('leaveEndDate')?.value;
        const leaveType = document.querySelector('input[name="leaveType"]:checked')?.value || 'full';
        const countEl = document.getElementById('leaveDaysCount');
        if (!startVal || !endVal || !countEl) return;

        const start = new Date(startVal);
        const end = new Date(endVal);
        if (end < start) {
            countEl.textContent = '0 日';
            return;
        }

        const diffDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
        const days = leaveType === 'half' ? diffDays * 0.5 : diffDays;
        countEl.textContent = `${days} 日`;
    }

    document.getElementById('leaveStartDate')?.addEventListener('change', updateLeaveDaysCount);
    document.getElementById('leaveEndDate')?.addEventListener('change', updateLeaveDaysCount);
    document.querySelectorAll('input[name="leaveType"]').forEach(r => {
        r.addEventListener('change', updateLeaveDaysCount);
    });

    const busyModal = document.getElementById('busyModal');
    const openBusyModalBtn = document.getElementById('openBusyModalBtn');
    const closeBusyModalBtn = document.getElementById('closeBusyModalBtn');
    const cancelBusyModalBtn = document.getElementById('cancelBusyModalBtn');
    const submitBusyModalBtn = document.getElementById('submitBusyModalBtn');

    const rouletteModal = document.getElementById('rouletteModal');
    const openRouletteModalBtn = document.getElementById('openRouletteModalBtn');
    const closeRouletteModalBtn = document.getElementById('closeRouletteModalBtn');
    const cancelRouletteModalBtn = document.getElementById('cancelRouletteModalBtn');
    const executeRouletteBtn = document.getElementById('executeRouletteBtn');

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

    // 希望シフト提出モーダル用カレンダー描画
    function renderShiftRequestGrid(ymStr) {
        const grid = document.getElementById('shiftRequestCalendarGrid');
        if (!grid) return;
        grid.innerHTML = '';

        const [year, month] = ymStr.split('-').map(Number);
        if (shiftReqMonthLabel) {
            shiftReqMonthLabel.textContent = `${year}年${month}月`;
        }

        const firstDay = new Date(year, month - 1, 1).getDay();
        const lastDate = new Date(year, month, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            grid.appendChild(document.createElement('div'));
        }

        for (let d = 1; d <= lastDate; d++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const cell = document.createElement('div');
            cell.className = 'border border-gray-200 rounded p-1.5 bg-white flex flex-col gap-1';

            const dayLabel = document.createElement('div');
            dayLabel.className = 'font-bold text-[11px] text-gray-700';
            dayLabel.textContent = d;

            const select = document.createElement('select');
            select.className = 'shift-req-select w-full border border-gray-200 rounded p-1 text-[11px] bg-gray-50 text-gray-700';
            select.dataset.date = dateStr;

            SHIFT_OPTIONS.forEach(opt => {
                const optionEl = document.createElement('option');
                optionEl.value = opt;
                optionEl.textContent = opt;
                if (opt === '特に希望なし') optionEl.selected = true;
                select.appendChild(optionEl);
            });

            select.addEventListener('change', (e) => {
                const val = e.target.value;
                select.className = 'shift-req-select w-full border rounded p-1 text-[11px] font-medium';
                if (val === '通常出勤') select.classList.add('bg-blue-50', 'text-blue-700', 'border-blue-200');
                else if (val === '在宅勤務') select.classList.add('bg-green-50', 'text-green-700', 'border-green-200');
                else if (val === '午前休') select.classList.add('bg-orange-50', 'text-orange-700', 'border-orange-200');
                else if (val === '休日' || val === '有給休暇') select.classList.add('bg-red-50', 'text-red-700', 'border-red-200');
                else select.classList.add('bg-gray-50', 'text-gray-700', 'border-gray-200');
            });

            cell.appendChild(dayLabel);
            cell.appendChild(select);
            grid.appendChild(cell);
        }
    }

    function changeShiftReqMonth(offset) {
        let [year, month] = shiftReqYM.split('-').map(Number);
        month += offset;
        if (month > 12) { month = 1; year++; }
        else if (month < 1) { month = 12; year--; }
        shiftReqYM = `${year}-${String(month).padStart(2, '0')}`;
        renderShiftRequestGrid(shiftReqYM);
    }

    if (prevShiftReqMonthBtn) prevShiftReqMonthBtn.addEventListener('click', () => changeShiftReqMonth(-1));
    if (nextShiftReqMonthBtn) nextShiftReqMonthBtn.addEventListener('click', () => changeShiftReqMonth(1));

    // モーダル開閉のイベントリスナー設定
    if (openPaidLeaveBtn) openPaidLeaveBtn.addEventListener('click', () => paidLeaveModal.classList.remove('hidden'));
    [closePaidLeaveModalBtn, cancelPaidLeaveModalBtn].forEach(btn => {
        if (btn) btn.addEventListener('click', () => paidLeaveModal.classList.add('hidden'));
    });

    if (openPreferredModalBtn) {
        openPreferredModalBtn.addEventListener('click', () => {
            shiftReqYM = currentYM;
            renderShiftRequestGrid(shiftReqYM);
            preferredModal.classList.remove('hidden');
        });
    }
    [closePreferredModalBtn, cancelPreferredModalBtn].forEach(btn => {
        if (btn) btn.addEventListener('click', () => preferredModal.classList.add('hidden'));
    });

    if (openBusyModalBtn) openBusyModalBtn.addEventListener('click', () => busyModal.classList.remove('hidden'));
    [closeBusyModalBtn, cancelBusyModalBtn].forEach(btn => {
        if (btn) btn.addEventListener('click', () => busyModal.classList.add('hidden'));
    });

    if (openRouletteModalBtn) openRouletteModalBtn.addEventListener('click', () => rouletteModal.classList.remove('hidden'));
    [closeRouletteModalBtn, cancelRouletteModalBtn].forEach(btn => {
        if (btn) btn.addEventListener('click', () => rouletteModal.classList.add('hidden'));
    });

// 権限に応じた画面表示切り替え関数
    function applyRoleView(roleCode) {
        const isAdmin = roleCode === ('3000'||'4000') || roleCode === ('1000'||'2000');

        if (roleSelector) {
            roleSelector.value = isAdmin ? 'admin' : 'general';
        }

        if (isAdmin) {
            pageTitle.textContent = 'シフト管理（管理者）';
            generalActionButtons.classList.add('hidden');
            adminActionButtons.classList.remove('hidden');
            if (adminBusyPeriodPanel) adminBusyPeriodPanel.classList.remove('hidden');
            if (menuShiftMgmt) menuShiftMgmt.textContent = 'シフト管理（管理者）';
        } else {
            pageTitle.textContent = 'シフト管理';
            adminActionButtons.classList.add('hidden');
            generalActionButtons.classList.remove('hidden');
            if (adminBusyPeriodPanel) adminBusyPeriodPanel.classList.add('hidden');
            if (menuShiftMgmt) menuShiftMgmt.textContent = 'シフト管理';
        }
    }

    // --- データ取得 & レンダリング ---
    async function loadShiftData() {
        try {
            const res = await fetch(`${SHIFT_API_URL}?action=get_month_data&ym=${currentYM}&user_id=${userId}`);
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

            const res = await fetch(`${SHIFT_API_URL}?action=get_dashboard_info&today=${todayStr}&user_id=${userId}`);
            const data = await res.json();

            if (data.success) {
                // DBの権限に合わせて表示を反映
                if (data.user && data.user.role_code) {
                    applyRoleView(data.user.role_code);
                }

                const card = document.getElementById('todaysShiftCard');
                if (data.todays_shift) {
                    const s = data.todays_shift;
                    card.innerHTML = `
                        <div class="text-sm font-bold text-green-700">${s.status}</div>
                        <div class="text-xs text-green-600 mt-0.5">${s.start_time ? s.start_time.slice(0,5) : '09:00'} ～ ${s.end_time ? s.end_time.slice(0,5) : '18:00'}</div>
                    `;
                } else {
                    card.innerHTML = `<div class="text-sm font-bold text-gray-700">シフト情報なし</div>`;
                }
            }
        } catch (err) {
            console.error('ダッシュボード情報取得エラー:', err);
        }
    }
    

    function renderCalendar(ym, shifts, busyDays) {
        const grid = document.getElementById('calendarGrid');
        if (!grid) return;
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
            else if (typeName === '休日' || typeName === '有給休暇') badgeClass = "bg-red-50 text-red-700 border-red-100 text-center";

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
        if (!list) return;
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

    if (roleSelector) {
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
    }

    // --- 希望シフト提出処理（複数日一括送信対応） ---
    if (submitPreferredModalBtn) {
        submitPreferredModalBtn.addEventListener('click', async () => {
            const selects = document.querySelectorAll('.shift-req-select');
            const items = [];

            selects.forEach(sel => {
                if (sel.value !== '特に希望なし') {
                    items.push({
                        work_date: sel.dataset.date,
                        status: sel.value,
                        start_time: (sel.value === '休日' || sel.value === '有給休暇') ? null : '09:00:00',
                        end_time: sel.value === '午前休' ? '13:00:00' : ((sel.value === '休日' || sel.value === '有給休暇') ? null : '18:00:00')
                    });
                }
            });

            if (items.length === 0) {
                alert('少なくとも1日以上の希望シフトを選択してください。');
                return;
            }

            const comment = shiftRequestComment ? shiftRequestComment.value : '';

            const body = {
                action: 'submit_bulk_shifts',
                user_id: userId,
                comment: comment,
                shifts: items
            };

            try {
                const res = await fetch(`${SHIFT_API_URL}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                const result = await res.json();
                
                if (result.success) {
                    alert(result.message || `${items.length}日分の希望シフトを登録しました。`);
                    preferredModal.classList.add('hidden');
                    loadShiftData();
                    loadDashboardInfo();
                } else {
                    alert('エラー: ' + (result.error || '登録に失敗しました。'));
                }
            } catch (err) {
                console.error('通信エラー:', err);
                alert('通信に失敗しました。');
            }
        });
    }

    // --- 有休申請の送信処理（期間一括送信対応） ---
    if (submitPaidLeaveModalBtn) {
        submitPaidLeaveModalBtn.addEventListener('click', async () => {
            const startDate = document.getElementById('leaveStartDate').value;
            const endDate = document.getElementById('leaveEndDate').value;
            const reason = leaveReasonTextarea ? leaveReasonTextarea.value : '';
            const leaveTypeEl = document.querySelector('input[name="leaveType"]:checked');
            const leaveType = leaveTypeEl ? leaveTypeEl.value : 'full';

            if (!startDate || !endDate) {
                alert('開始日と終了日を選択してください。');
                return;
            }
            if (new Date(endDate) < new Date(startDate)) {
                alert('終了日は開始日以降を選択してください。');
                return;
            }
            if (!reason.trim()) {
                alert('取得理由を入力してください。');
                return;
            }

            const body = {
                action: 'submit_paid_leave',
                user_id: userId,
                leave_type: leaveType,
                start_date: startDate,
                end_date: endDate,
                reason: reason
            };

            try {
                const res = await fetch(`${SHIFT_API_URL}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                const result = await res.json();
                
                if (result.success) {
                    alert(result.message || '有休申請を送信しました。');
                    paidLeaveModal.classList.add('hidden');
                    loadShiftData();
                    loadDashboardInfo();
                } else {
                    alert('エラー: ' + (result.error || '申請に失敗しました。'));
                }
            } catch (err) {
                console.error('有休申請通信エラー:', err);
                alert('通信に失敗しました。');
            }
        });
    }

    // --- 繁忙期設定保存処理（期間一括送信対応） ---
    if (submitBusyModalBtn) {
        submitBusyModalBtn.addEventListener('click', async () => {
            const name = document.getElementById('busyPeriodName').value;
            const startDate = document.getElementById('busyStartDate').value;
            const endDate = document.getElementById('busyEndDate').value;
            const bonusPt = document.getElementById('busyBonusPt').value;
            const note = document.getElementById('busyNote').value;

            if (!name.trim()) {
                alert('名称を入力してください。');
                return;
            }
            if (!startDate || !endDate) {
                alert('期間（開始日・終了日）を選択してください。');
                return;
            }
            if (new Date(endDate) < new Date(startDate)) {
                alert('終了日は開始日以降を選択してください。');
                return;
            }

            const body = {
                action: 'save_busy_period',
                name: name,
                start_date: startDate,
                end_date: endDate,
                bonus_pt: bonusPt,
                note: note
            };

            try {
                const res = await fetch(`${SHIFT_API_URL}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                const result = await res.json();
                if (result.success) {
                    alert(result.message || '繁忙期設定を保存しました。');
                    busyModal.classList.add('hidden');
                    loadShiftData();
                } else {
                    alert('エラー: ' + (result.error || '保存に失敗しました。'));
                }
            } catch (err) {
                console.error('繁忙期設定エラー:', err);
                alert('通信に失敗しました。');
            }
        });
    }

    // --- ルーレット実行処理 ---
    if (executeRouletteBtn) {
        executeRouletteBtn.addEventListener('click', async () => {
            const targetDate = document.getElementById('rouletteDate').value;
            const shiftType = document.getElementById('rouletteShiftType').value;

            const body = {
                action: 'execute_roulette',
                user_id: userId,
                target_date: targetDate,
                shift_type: shiftType
            };

            try {
                const res = await fetch(`${SHIFT_API_URL}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                const result = await res.json();

                if (result.success) {
                    alert(result.message || 'シフトルーレットによる割り当てが完了しました。');
                    rouletteModal.classList.add('hidden');
                    loadShiftData();
                } else {
                    alert('エラー: ' + (result.error || '処理に失敗しました。'));
                }
            } catch (err) {
                console.error('ルーレット実行エラー:', err);
                alert('通信に失敗しました。');
            }
        });
    }

    loadShiftData();
    loadDashboardInfo();
});