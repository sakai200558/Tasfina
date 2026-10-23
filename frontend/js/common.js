
/* ========================================
   Tasfina 共通JavaScript
======================================== */

/* ========================================
   HTMLコンポーネント読み込み
======================================== */

async function loadComponent(id, path) {

    const element = document.getElementById(id);

    // 読み込み先が存在しない画面では処理しない
    if (!element) {
        return;
    }

    try {

        const response = await fetch(path);

        if (!response.ok) {
            throw new Error(
                `${path} の読み込みに失敗しました。`
            );
        }

        const html = await response.text();

        element.innerHTML = html;

    } catch (error) {

        console.error("コンポーネント読み込みエラー:", error);

    }
}

/* ========================================
   現在のページを判定して選択状態にする
======================================== */

function setActiveNavigation(containerId, linkSelector) {

    const container = document.getElementById(containerId);

    if (!container) {
        return;
    }

    const currentPage = window.location.pathname
        .split("/")
        .pop();

    const links = container.querySelectorAll(linkSelector);

    links.forEach(link => {

        const linkPage = new URL(
            link.getAttribute("href"),
            window.location.href
        ).pathname.split("/").pop();

        const isActive = linkPage === currentPage;

        link.classList.toggle("active", isActive);

        if (isActive) {

            link.setAttribute("aria-current", "page");

        } else {

            link.removeAttribute("aria-current");

        }

    });
}

/* ========================================
   共通コンポーネント初期化
======================================== */

document.addEventListener("DOMContentLoaded", async () => {

    // ヘッダー・サイドバー・設定ナビゲーション
    await Promise.all([

        loadComponent(
            "header",
            "../components/header.html"
        ),

        loadComponent(
            "sidebar",
            "../components/sidebar.html"
        ),

        loadComponent(
            "settingsNav",
            "../components/settings-nav.html"
        )

    ]);

    // サイドバーの現在位置
    setActiveNavigation(
        "sidebar",
        ".sidebar-nav a"
    );

    // 設定メニューの現在位置
    setActiveNavigation(
        "settingsNav",
        ".settings-nav-link"
    );

});
