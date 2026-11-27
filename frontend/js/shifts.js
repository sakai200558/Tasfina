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
    const openRouletteModalBtns = document.querySelectorAll('#openRouletteModalBtn, .openRouletteModalBtn');
    const closeRouletteModalBtn = document.getElementById('closeRouletteModalBtn');
    const cancelRouletteModalBtn = document.getElementById('cancelRouletteModalBtn');
    const executeRouletteBtn = document.getElementById('executeRouletteBtn');
    const rouletteProbTableBody = document.getElementById('rouletteProbTableBody');
    const rouletteTopProbText = document.getElementById('rouletteTopProbText');
    const rouletteLegendList = document.getElementById('rouletteLegendList');
    const rouletteWheelGauge = document.getElementById('rouletteWheelGauge');

    // 申請状況・申請履歴モーダル関連
    const applicationHistoryModal = document.getElementById('applicationHistoryModal');
    const openApplicationHistoryBtn = document.getElementById('openApplicationHistoryBtn');
    const closeApplicationHistoryBtn = document.getElementById('closeApplicationHistoryBtn');
    const closeApplicationHistoryFooterBtn = document.getElementById('closeApplicationHistoryFooterBtn');
    const recentApplicationsList = document.getElementById('recentApplicationsList');
    const applicationHistoryList = document.getElementById('applicationHistoryList');

    let currentYM = '2024-10';
    const userId = 1;
    let currentIsAdmin = false;

    function changeMonth(offset) {
        let [year, month] = currentYM.split('-').map(Number);
        month += offset;
        if (month > 12) { month = 1; year++; }
        else if (month < 1) { month = 12; year--; }
        currentYM = `${year}-${String(month).padStart(2, '0')}`;
        if (currentYMEl) currentYMEl.textContent = currentYM;
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
    if (openPaidLeaveBtn) openPaidLeaveBtn.addEventListener('click', () => paidLeaveModal?.classList.remove('hidden'));
    [closePaidLeaveModalBtn, cancelPaidLeaveModalBtn].forEach(btn => {
        if (btn) btn.addEventListener('click', () => paidLeaveModal?.classList.add('hidden'));
    });

    if (openPreferredModalBtn) {
        openPreferredModalBtn.addEventListener('click', () => {
            shiftReqYM = currentYM;
            renderShiftRequestGrid(shiftReqYM);
            preferredModal?.classList.remove('hidden');
        });
    }
    [closePreferredModalBtn, cancelPreferredModalBtn].forEach(btn => {
        if (btn) btn.addEventListener('click', () => preferredModal?.classList.add('hidden'));
    });

    if (openBusyModalBtn) openBusyModalBtn.addEventListener('click', () => busyModal?.classList.remove('hidden'));
    [closeBusyModalBtn, cancelBusyModalBtn].forEach(btn => {
        if (btn) btn.addEventListener('click', () => busyModal?.classList.add('hidden'));
    });

    openRouletteModalBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            if (rouletteModal) rouletteModal.classList.remove('hidden');
            await loadRouletteOptions();
        });
    });
    [closeRouletteModalBtn, cancelRouletteModalBtn].forEach(btn => {
        if (btn) btn.addEventListener('click', () => {
            if (rouletteModal) rouletteModal.classList.add('hidden');
        });
    });

    if (openApplicationHistoryBtn) {
        openApplicationHistoryBtn.addEventListener('click', async () => {
            if (applicationHistoryModal) applicationHistoryModal.classList.remove('hidden');
            await loadApplications();
        });
    }
    [closeApplicationHistoryBtn, closeApplicationHistoryFooterBtn].forEach(btn => {
        if (btn) btn.addEventListener('click', () => {
            if (applicationHistoryModal) applicationHistoryModal.classList.add('hidden');
        });
    });

    // 権限に応じた画面表示切り替え関数
    function applyRoleView(roleCode) {
        const isAdmin = roleCode === '3000' || roleCode === '4000' || roleCode === '1000' || roleCode === '2000' || roleCode === 'admin';
        currentIsAdmin = isAdmin;

        if (roleSelector) {
            roleSelector.value = isAdmin ? 'admin' : 'general';
        }

        if (isAdmin) {
            if (pageTitle) pageTitle.textContent = 'シフト管理（管理者）';
            if (generalActionButtons) generalActionButtons.classList.add('hidden');
            if (adminActionButtons) adminActionButtons.classList.remove('hidden');
        } else {
            if (pageTitle) pageTitle.textContent = 'シフト管理';
            if (adminActionButtons) adminActionButtons.classList.add('hidden');
            if (generalActionButtons) generalActionButtons.classList.remove('hidden');
        }

        loadApplications();
    }

    // --- データ取得 & レンダリング ---
       async function loadShiftData() {
        try {
            const res = await fetch(`${SHIFT_API_URL}?action=get_month_data&ym=${currentYM}`);
            const data = await res.json();
            if (data.success) {
                renderCalendar(currentYM, data.shifts, data.busy_days);
                renderSummary(data.shifts);
            }
        } catch (err) {
            console.error('シフトデータ取得エラー:', err);
        }
    }


    async function loadDashboardInfo() {
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const todayLabel = document.getElementById('todayDateLabel');
            if (todayLabel) todayLabel.textContent = todayStr;

            const res = await fetch(`${SHIFT_API_URL}?action=get_dashboard_info&today=${todayStr}`);
            const data = await res.json();

            if (data.success) {
                if (data.user && data.user.role_code) {
                    applyRoleView(data.user.role_code);
                }

                const card = document.getElementById('todaysShiftCard');
                if (card) {
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
            }
        } catch (err) {
            console.error('ダッシュボード情報取得エラー:', err);
        }
    }

    async function loadRouletteOptions() {
        try {
            const res = await fetch(`${SHIFT_API_URL}?action=get_roulette_options`);
            const data = await res.json();
            if (!data.success) return;

            const users = data.users || [];
            const departments = data.departments || [];

            const userSel = document.getElementById('rouletteTargetUserId');
            if (userSel) {
                userSel.innerHTML = users.length
                    ? users.map(u => `<option value="${u.user_id}">${u.display_name}（ID:${u.user_id}）</option>`).join('')
                    : `<option value="">登録メンバーなし</option>`;
            }

            const deptSel = document.getElementById('rouletteTargetDeptId');
            if (deptSel) {
                deptSel.innerHTML = departments.length
                    ? departments.map(d => `<option value="${d.dept_id}">${d.dept_name}（ID:${d.dept_id}）</option>`).join('')
                    : `<option value="">登録部署なし</option>`;
            }

            if (rouletteProbTableBody && users.length) {
                const weights = users.map(u => Math.max(1, 500 - parseFloat(u.burden_score || 0)));
                const totalW = weights.reduce((a, b) => a + b, 0);

                const rowsWithProb = users.map((u, idx) => ({
                    ...u,
                    score: parseFloat(u.burden_score || 0).toFixed(1),
                    prob: totalW > 0 ? Math.round((weights[idx] / totalW) * 100) : 0
                }));

                rouletteProbTableBody.innerHTML = rowsWithProb.map(r => `
                    <tr>
                        <td class="py-1.5">${r.display_name}</td>
                        <td class="py-1.5">${r.score}</td>
                        <td class="py-1.5 text-right font-semibold">${r.prob}%</td>
                    </tr>
                `).join('');

                if (rouletteTopProbText) {
                    rouletteTopProbText.textContent = `${rowsWithProb[0].prob}%`;
                }

                if (rouletteWheelGauge) {
                    const hexColors = ['#3b82f6', '#818cf8', '#93c5fd', '#d1d5db'];
                    const topThree = rowsWithProb.slice(0, 3);
                    const restProb = Math.max(0, 100 - topThree.reduce((sum, r) => sum + r.prob, 0));
                    const segments = topThree.map((r, i) => ({ prob: r.prob, color: hexColors[i] }));
                    if (rowsWithProb.length > 3) {
                        segments.push({ prob: restProb, color: hexColors[3] });
                    }
                    let currentDeg = 0;
                    const stops = segments.map(seg => {
                        const startDeg = currentDeg;
                        const endDeg = currentDeg + (seg.prob / 100) * 360;
                        currentDeg = endDeg;
                        return `${seg.color} ${startDeg.toFixed(1)}deg ${endDeg.toFixed(1)}deg`;
                    });
                    rouletteWheelGauge.style.background = `conic-gradient(${stops.join(', ')})`;
                }

                if (rouletteLegendList) {
                    const colors = ['bg-blue-500', 'bg-indigo-400', 'bg-blue-300', 'bg-gray-300'];
                    const topThree = rowsWithProb.slice(0, 3);
                    const rest = rowsWithProb.slice(3);
                    const restProb = rest.reduce((sum, r) => sum + r.prob, 0);

                    let legendHtml = topThree.map((r, i) => `
                        <div class="flex items-center gap-1.5">
                            <span class="w-2.5 h-2.5 ${colors[i]} rounded-full"></span>
                            ${r.display_name} (${r.prob}%)
                        </div>
                    `).join('');

                    if (rest.length > 0) {
                        legendHtml += `
                            <div class="flex items-center gap-1.5">
                                <span class="w-2.5 h-2.5 ${colors[3]} rounded-full"></span>
                                その他 (${rest.length}名) (${restProb}%)
                            </div>
                        `;
                    }
                    rouletteLegendList.innerHTML = legendHtml;
                }
            }
        } catch (err) {
            console.error('ルーレット選択肢取得エラー:', err);
        }
    }

    function getStatusBadgeClass(status) {
        if (status === '承認待ち') return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
        return 'bg-green-50 text-green-700 border border-green-200';
    }

    function formatShortDate(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : dateStr;
    }

    async function loadApplications() {
        try {
            const res = await fetch(`${SHIFT_API_URL}?action=get_applications&is_admin=${currentIsAdmin ? '1' : '0'}`);
            const data = await res.json();
            if (!data.success) return;

            const applications = data.applications || [];
            renderRecentApplications(applications.slice(0, 3));
            renderApplicationHistoryModal(applications);
        } catch (err) {
            console.error('申請履歴取得エラー:', err);
        }
    }

    function renderRecentApplications(list) {
        if (!recentApplicationsList) return;
        if (!list.length) {
            recentApplicationsList.innerHTML = `<div class="text-gray-400 text-center py-2">申請履歴はありません</div>`;
            return;
        }

        recentApplicationsList.innerHTML = list.map(app => `
            <div class="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-b-0">
                <span class="font-medium text-gray-800">${app.app_type}</span>
                <span class="text-gray-500">${formatShortDate(app.applied_at ? app.applied_at.slice(0, 10) : app.start_date)}</span>
                <span class="px-2 py-0.5 rounded text-[11px] font-medium ${getStatusBadgeClass(app.approval_status)}">${app.approval_status}</span>
            </div>
        `).join('');
    }

    function renderApplicationHistoryModal(list) {
        if (!applicationHistoryList) return;
        if (!list.length) {
            applicationHistoryList.innerHTML = `<div class="text-gray-400 text-center py-6">申請履歴はありません</div>`;
            return;
        }

        applicationHistoryList.innerHTML = list.map(app => {
            const periodText = (!app.start_date || !app.end_date || app.start_date === app.end_date)
                ? (app.start_date || '')
                : `${app.start_date} ～ ${app.end_date}`;
            const canAct = currentIsAdmin && app.approval_status === '承認待ち';

            return `
                <div class="border border-gray-200 rounded-lg p-3 bg-white space-y-2">
                    <div class="flex items-center justify-between ${canAct ? 'cursor-pointer' : ''}" data-app-row="${app.application_id}">
                        <div class="space-y-0.5">
                            <div class="font-bold text-gray-800">
                                ${app.app_type}（${app.status_type || app.status || ''}）
                                <span class="text-gray-500 font-normal ml-2">${periodText}</span>
                            </div>
                            <div class="text-[11px] text-gray-500">
                                申請日: ${app.applied_at ? app.applied_at.slice(0, 10) : ''}
                                ${app.reason ? ` / 理由・備考: ${app.reason}` : ''}
                            </div>
                        </div>
                        <span class="px-2.5 py-1 rounded text-[11px] font-semibold ${getStatusBadgeClass(app.approval_status)}">
                            ${app.approval_status}
                        </span>
                    </div>

                    ${canAct ? `
                        <div id="appActions_${app.application_id}" class="hidden pt-2 border-t border-gray-100 flex justify-end gap-2">
                            <button type="button" data-reject-id="${app.application_id}" class="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700">
                                承認を拒否
                            </button>
                            <button type="button" data-approve-id="${app.application_id}" class="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700">
                                承認
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        applicationHistoryList.querySelectorAll('[data-app-row]').forEach(rowEl => {
            rowEl.addEventListener('click', () => {
                const id = rowEl.getAttribute('data-app-row');
                const actionBox = document.getElementById(`appActions_${id}`);
                if (actionBox) {
                    actionBox.classList.toggle('hidden');
                }
            });
        });

        applicationHistoryList.querySelectorAll('[data-approve-id]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const appId = btn.getAttribute('data-approve-id');
                try {
                    const res = await fetch(`${SHIFT_API_URL}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'approve_application', application_id: appId })
                    });
                    const result = await res.json();
                    if (result.success) {
                        alert(result.message || '承認しました。');
                        await loadApplications();
                        await loadShiftData();
                        await loadDashboardInfo();
                    } else {
                        alert('エラー: ' + (result.error || '承認に失敗しました。'));
                    }
                } catch (err) {
                    console.error('承認処理エラー:', err);
                    alert('通信に失敗しました。');
                }
            });
        });

        applicationHistoryList.querySelectorAll('[data-reject-id]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const appId = btn.getAttribute('data-reject-id');
                try {
                    const res = await fetch(`${SHIFT_API_URL}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'reject_application', application_id: appId })
                    });
                    const result = await res.json();
                    if (result.success) {
                        alert(result.message || '申請を拒否し、履歴から削除しました。');
                        await loadApplications();
                    } else {
                        alert('エラー: ' + (result.error || '拒否処理に失敗しました。'));
                    }
                } catch (err) {
                    console.error('拒否処理エラー:', err);
                    alert('通信に失敗しました。');
                }
            });
        });
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
            const isPending = shift && shift.approval_status === '承認待ち';

            let badgeClass = "bg-blue-50 text-blue-700 border-blue-200";
            let typeName = shift ? shift.status : '';
            if (typeName === '在宅勤務') badgeClass = "bg-green-50 text-green-700 border-green-200";
            else if (typeName === '午前休') badgeClass = "bg-orange-50 text-orange-700 border-orange-200";
            else if (typeName === '休日' || typeName === '有給休暇') badgeClass = "bg-red-50 text-red-700 border-red-200 text-center";

            if (isPending) {
                badgeClass += " opacity-75 border-dashed border-2";
            }

            const cell = document.createElement('div');
            cell.className = `min-h-[90px] p-1.5 bg-white relative border cursor-pointer hover:bg-blue-50/20 ${isBusy ? 'bg-pink-50/40' : ''}`;
            cell.innerHTML = `
                <span class="font-semibold text-gray-700 text-xs">${i}</span>
                ${isBusy ? '<span class="text-[10px] text-pink-600 font-bold block">繁忙日</span>' : ''}
                ${shift ? `
                    <div class="mt-1 ${badgeClass} rounded p-1 text-xs font-medium border">
                        <div>${isPending ? `(申請中) ${typeName}` : typeName}</div>
                        ${shift.start_time ? `<div class="text-[10px] opacity-75">${shift.start_time.slice(0,5)}～${shift.end_time.slice(0,5)}</div>` : ''}
                    </div>` : ''}
            `;

            cell.addEventListener('click', () => {
                document.getElementById('selectedDateText').textContent = `${year}年${month}月${i}日`;
                document.getElementById('detailShiftType').textContent = typeName ? (isPending ? `${typeName}（承認待ち）` : typeName) : 'ー';
                document.getElementById('detailTime').textContent = shift && shift.start_time ? `${shift.start_time.slice(0,5)} ～ ${shift.end_time.slice(0,5)}` : 'ー';
            });

            grid.appendChild(cell);
        }
    }

    function renderSummary(shifts) {
        const list = document.getElementById('shiftSummaryList');
        if (!list) return;
        list.innerHTML = '';

        const approvedShifts = (shifts || []).filter(s => s.approval_status === '承認済み');
        const types = ['通常出勤', '在宅勤務', '午前休', '有給休暇', '休日'];
        types.forEach(type => {
            const count = approvedShifts.filter(s => s.status === type).length;
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
            const isAdmin = e.target.value === 'admin';
            currentIsAdmin = isAdmin;
            if (isAdmin) {
                pageTitle.textContent = 'シフト管理（管理者）';
                generalActionButtons.classList.add('hidden');
                adminActionButtons.classList.remove('hidden');
            } else {
                pageTitle.textContent = 'シフト管理';
                adminActionButtons.classList.add('hidden');
                generalActionButtons.classList.remove('hidden');
            }
            loadApplications();
        });
    }

    // --- 希望シフト提出処理（複数日一括送信・承認待ち登録） ---
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
                    alert(result.message || `${items.length}日分の希望シフトを申請しました。`);
                    preferredModal.classList.add('hidden');
                    await loadApplications();
                    await loadShiftData();
                } else {
                    alert('エラー: ' + (result.error || '申請に失敗しました。'));
                }
            } catch (err) {
                console.error('通信エラー:', err);
                alert('通信に失敗しました。');
            }
        });
    }

    // --- 有休申請の送信処理（期間一括送信・承認待ち登録） ---
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
                    await loadApplications();
                    await loadShiftData();
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
            const startDateInput = document.getElementById('busyStartDate');
            const endDateInput = document.getElementById('busyEndDate');
            const dateInput = document.getElementById('busyDate');
            const reqPeopleInput = document.getElementById('busyRequiredPeople');
            const bonusPtInput = document.getElementById('busyBonusPt');

            const startDate = startDateInput ? startDateInput.value : (dateInput ? dateInput.value : '');
            const endDate = endDateInput ? endDateInput.value : startDate;
            const requiredPeople = reqPeopleInput ? reqPeopleInput.value : 5;
            const bonusPt = bonusPtInput ? bonusPtInput.value : 2.0;

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
                start_date: startDate,
                end_date: endDate,
                required_people: requiredPeople,
                bonus_pt: bonusPt
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

    // 対象メンバー種別に応じたセレクト表示切替
    document.querySelectorAll('input[name="targetMember"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const val = document.querySelector('input[name="targetMember"]:checked')?.value || 'all';
            const userSel = document.getElementById('rouletteTargetUserId');
            const deptSel = document.getElementById('rouletteTargetDeptId');
            if (userSel) userSel.classList.toggle('hidden', val !== 'member');
            if (deptSel) deptSel.classList.toggle('hidden', val !== 'dept');
        });
    });

    // --- ルーレット実行処理 ---
    if (executeRouletteBtn) {
        executeRouletteBtn.addEventListener('click', async () => {
            const targetDate = document.getElementById('rouletteDate')?.value || '';
            const shiftType = document.getElementById('rouletteShiftType')?.value || '在宅勤務';
            const targetMemberType = document.querySelector('input[name="targetMember"]:checked')?.value || 'all';
            const targetUserId = document.getElementById('rouletteTargetUserId')?.value || null;
            const targetDeptId = document.getElementById('rouletteTargetDeptId')?.value || null;
            const winnerCount = parseInt(document.getElementById('rouletteWinnerCount')?.value || '1', 10);

            if (!targetDate) {
                alert('対象日を選択してください。');
                return;
            }

            const conditions = {
                prefer_shift: Boolean(document.getElementById('condPreferShift')?.checked),
                exclude_leave: Boolean(document.getElementById('condExcludeLeave')?.checked),
                consider_busy: Boolean(document.getElementById('condConsiderBusy')?.checked),
                max_consecutive: Boolean(document.getElementById('condMaxConsecutive')?.checked),
                use_burden_score: Boolean(document.getElementById('condUseBurdenScore')?.checked)
            };

            const body = {
                action: 'execute_roulette',
                user_id: userId,
                target_date: targetDate,
                shift_type: shiftType,
                target_member_type: targetMemberType,
                target_user_id: targetUserId,
                target_dept_id: targetDeptId,
                winner_count: winnerCount,
                conditions: conditions
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
                    rouletteModal?.classList.add('hidden');
                    await loadShiftData();
                    await loadDashboardInfo();
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
    loadApplications();

        // ★ 「一覧を見る →」ボタンで申請履歴一覧モーダルを確実に開く
    const openHistoryBtn = document.getElementById('openApplicationHistoryBtn');
    const historyModalEl = document.getElementById('applicationHistoryModal');
    const closeHistoryTopBtn = document.getElementById('closeApplicationHistoryBtn');
    const closeHistoryBottomBtn = document.getElementById('closeApplicationHistoryFooterBtn');

    if (openHistoryBtn && historyModalEl) {
        openHistoryBtn.addEventListener('click', (e) => {
            e.preventDefault();
            historyModalEl.classList.remove('hidden');
                       if (typeof renderApplicationHistoryModal === 'function') {
                renderApplicationHistoryModal(typeof allApplications !== 'undefined' ? allApplications : []);
            }

        });
    }
    if (closeHistoryTopBtn && historyModalEl) {
        closeHistoryTopBtn.addEventListener('click', () => historyModalEl.classList.add('hidden'));
    }
    if (closeHistoryBottomBtn && historyModalEl) {
        closeHistoryBottomBtn.addEventListener('click', () => historyModalEl.classList.add('hidden'));
    }

});