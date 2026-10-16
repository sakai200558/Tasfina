document.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('taskSearch');
  const status = document.getElementById('statusFilter');
  const priority = document.getElementById('priorityFilter');
  const body = document.getElementById('taskTableBody');
  const resultCount = document.getElementById('resultCount');
  if (!body) return;
  const rows = [...body.querySelectorAll('tr')];
  const filterRows = () => {
    const term = search.value.trim().toLocaleLowerCase('ja');
    let visible = 0;
    rows.forEach(row => {
      const matchesText = row.textContent.toLocaleLowerCase('ja').includes(term);
      const matchesStatus = !status.value || row.dataset.status === status.value;
      const matchesPriority = !priority.value || row.dataset.priority === priority.value;
      const show = matchesText && matchesStatus && matchesPriority;
      row.hidden = !show;
      if (show) visible++;
    });
    resultCount.textContent = `${visible}件を表示中`;
    let empty = document.getElementById('emptyTasks');
    if (!visible && !empty) {
      empty = document.createElement('tr'); empty.id = 'emptyTasks';
      empty.innerHTML = '<td colspan="7" class="empty-state">条件に一致するタスクがありません。</td>';
      body.appendChild(empty);
    } else if (visible && empty) empty.remove();
  };
  [search,status,priority].forEach(el => el.addEventListener(el === search ? 'input' : 'change', filterRows));
  document.querySelectorAll('.edit-task').forEach(button => button.addEventListener('click', () => {
    const name = button.closest('tr').querySelector('.task-name').textContent;
    showToast(`「${name}」の詳細編集はバックエンド接続後に利用できます。`);
  }));
  document.querySelectorAll('.task-name').forEach(link => link.addEventListener('click', e => {
    e.preventDefault();
    showToast(`「${link.textContent}」の詳細画面はバックエンド接続後に利用できます。`);
  }));
});
