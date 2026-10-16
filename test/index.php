<?php
$pageTitle = 'タスク管理';
$activePage = 'tasks';
require_once __DIR__ . '/components/header.php';
?>
<div class="app-shell">
  <?php require __DIR__ . '/components/sidebar.php'; ?>
  <main class="main-content">
    <header class="topbar">
      <button class="icon-button mobile-menu" id="mobileMenu" aria-label="メニュー">☰</button>
      <div class="breadcrumb">ホーム <span>/</span> <strong>タスク管理</strong></div>
      <div class="topbar-actions">
        <button class="icon-button" id="notificationBtn" aria-label="通知">♧<span class="notification-dot"></span></button>
        <button class="user-chip" id="userMenu"><span class="avatar">田</span><span>田中 龍之介</span><span class="chevron">⌄</span></button>
      </div>
    </header>

    <section class="page-heading">
      <div><p class="eyebrow">WORKSPACE / TASKS</p><h1>タスク管理</h1><p class="subheading">タスクの進捗や担当者、期限をまとめて管理できます。</p></div>
      <button class="btn btn-primary" id="openCreate"><span class="plus">＋</span> 新規タスク作成</button>
    </section>

    <!-- 統計カード ＋ 次回シフトカード -->
    <section class="stats-grid" aria-label="タスク概要">
      <article class="stat-card">
        <div class="stat-icon green">📅</div>
        <div>
          <p>次回シフト</p>
          <strong id="nextShiftDisplay" style="font-size: 1rem; font-weight: 600;">読み込み中...</strong>
          <small>直近の勤務予定</small>
        </div>
      </article>
      <article class="stat-card"><div class="stat-icon indigo">▤</div><div><p>全タスク</p><strong id="totalCount">12</strong><small>登録されているタスク</small></div></article>
      <article class="stat-card"><div class="stat-icon blue">◷</div><div><p>進行中</p><strong id="progressCount">5</strong><small>対応中のタスク</small></div></article>
      <article class="stat-card"><div class="stat-icon orange">⚑</div><div><p>期限間近</p><strong id="dueCount">3</strong><small>3日以内が期限</small></div></article>
      <article class="stat-card"><div class="stat-icon green">✓</div><div><p>完了</p><strong id="doneCount">4</strong><small>完了したタスク</small></div></article>
    </section>

    <section class="panel task-panel">
      <div class="panel-heading"><div><h2>タスク一覧</h2><p>タスクを検索・絞り込みできます。</p></div><button class="btn btn-outline" id="exportBtn">↓ <span>CSV出力</span></button></div>
      <div class="filters">
        <label class="search-box"><span>⌕</span><input id="searchInput" type="search" placeholder="タスク名・担当者で検索"></label>
        <select id="statusFilter" aria-label="ステータス"><option value="">すべてのステータス</option><option>未着手</option><option>進行中</option><option>確認待ち</option><option>完了</option></select>
        <select id="priorityFilter" aria-label="優先度"><option value="">すべての優先度</option><option>高</option><option>中</option><option>低</option></select>
        <button class="btn btn-ghost" id="resetFilters">リセット</button>
      </div>
      <div class="table-wrap">
        <table class="task-table">
          <thead><tr><th class="check-col"><input type="checkbox" id="selectAll" aria-label="すべて選択"></th><th>タスク名</th><th>担当者</th><th>優先度</th><th>ステータス</th><th>期限</th><th>進捗</th><th></th></tr></thead>
          <tbody id="taskRows"></tbody>
        </table>
        <div class="empty-state" id="emptyState" hidden><div>⌕</div><strong>タスクが見つかりません</strong><p>検索条件を変更してください。</p></div>
      </div>
      <div class="table-footer"><span id="resultCount">12件中 12件を表示</span><div class="pagination"><button disabled>‹</button><button class="current">1</button><button disabled>›</button></div></div>
    </section>
    <footer class="page-footer">© 2026 Tasfina <span>Task management made simple.</span></footer>
  </main>
</div>

<div class="modal-backdrop" id="taskModal" hidden>
  <section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
    <div class="modal-head"><div><p class="eyebrow">TASK</p><h2 id="modalTitle">新規タスク作成</h2></div><button class="icon-button" id="closeModal" aria-label="閉じる">×</button></div>
    <form id="taskForm">
      <label class="form-field full">タスク名 <span class="required">必須</span><input name="title" required maxlength="100" placeholder="例：画面デザインの確認"></label>
      <label class="form-field">担当者<select name="owner"><option>田中 龍之介</option><option>佐藤 花子</option><option>鈴木 太郎</option><option>山田 美咲</option></select></label>
      <label class="form-field">優先度<select name="priority"><option>中</option><option>高</option><option>低</option></select></label>
      <label class="form-field">ステータス<select name="status"><option>未着手</option><option>進行中</option><option>確認待ち</option><option>完了</option></select></label>
      <label class="form-field">期限<input name="due" type="date" required></label>
      <label class="form-field full">説明<textarea name="description" rows="3" placeholder="タスクの詳細を入力（任意）"></textarea></label>
      <div class="modal-actions"><button type="button" class="btn btn-outline" id="cancelCreate">キャンセル</button><button type="submit" class="btn btn-primary">タスクを作成</button></div>
    </form>
  </section>
</div>

<script src="assets/js/tasks.js"></script>
<script>
// バックエンドの api_next_shift.php から次回シフトを取得してカードに表示する処理
window.addEventListener('DOMContentLoaded', () => {
    fetch('api_next_shift.php')
        .then(response => response.json())
        .then(data => {
            const display = document.getElementById('nextShiftDisplay');
            if (display) {
                if (data.status === 'success') {
                    display.textContent = data.text; // 例: "次回予定: 10月25日 09:00〜"
                } else {
                    display.textContent = '取得失敗';
                }
            }
        })
        .catch(error => {
            console.error('通信エラー:', error);
            const display = document.getElementById('nextShiftDisplay');
            if (display) display.textContent = '接続エラー';
        });
});
</script>
<?php require_once __DIR__ . '/components/footer.php'; ?>