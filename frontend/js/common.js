
/* ========================================
   Tasfina 共通JavaScript
======================================== */

// 共通部品の読み込み
async function loadComponent(id, path) {

    const element = document.getElementById(id);

    if (!element) return;

    const response = await fetch(path);

    if (!response.ok) {
        throw new Error(
            `読み込み失敗: ${path} (${response.status})`
        );
    }

    element.innerHTML = await response.text();
}


// ページ読み込み完了後
document.addEventListener("DOMContentLoaded", async () => {

    try {

        // ヘッダー・サイドメニューを読み込む
        await Promise.all([

            loadComponent(
                "header",
                "../components/header.html"
            ),

            loadComponent(
                "sidebar",
                "../components/sidebar.html"
            )

        ]);

        // 現在のページのメニューを強調
        const currentPath = window.location.pathname;

        document.querySelectorAll(".sidebar-nav a")
            .forEach(link => {

                if (link.pathname === currentPath) {
                    link.classList.add("active");
                }

            });

    } catch (error) {

        console.error(
            "共通レイアウト読み込みエラー:",
            error
        );

    }

});
