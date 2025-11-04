(function () {
    'use strict';

    function escapeHtml(s) {
        return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function buildProfileMarkup(name, user) {
        const svgIcon = `<svg class="profile-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
            <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.2c-3.3 0-9.8 1.7-9.8 5v1.7h19.6V19.2c0-3.3-6.5-5-9.8-5z"/>
        </svg>`;

        // Determine the correct base path for admin panel link
        let adminPath = 'admin.html';
        if (window.location.pathname.includes('/html/')) {
            adminPath = 'admin.html';
        } else {
            adminPath = 'html/admin.html';
        }

        // Determine the correct base path for profile link
        let profilePath = 'profile.html';
        if (window.location.pathname.includes('/html/')) {
            profilePath = 'profile.html';
        } else {
            profilePath = 'html/profile.html';
        }
        return `
            <div class="profile-wrap">
                <button id="profileBtn" class="profile-btn" aria-haspopup="true" aria-expanded="false" type="button">
                    <span class="profile-icon">${svgIcon}</span>
                    <span class="profile-name">${escapeHtml(name)}</span>
                    <span class="profile-caret">▾</span>
                </button>

                <div id="profileDropdown" class="profile-dropdown" role="menu" aria-hidden="true">
                    <a href="${profilePath}" class="profile-item" role="menuitem">👤 Zobraziť profil </a>
                    ${user.role === 'a' || user.role === 's' ? `<a href="${adminPath}" class="profile-item" role="menuitem">🔧 Admin Panel</a>` : ''}
                    <button id="logoutBtn" class="profile-item logout" role="menuitem">🚪 Odhlásiť sa</button>
                </div>
            </div>
        `;
    }

    function initAuthUI() {
        const auth = document.getElementById('authLinkContainer');
        if (!auth) return;

        // keep original login link href if any
        const existingA = auth.querySelector('a');
        let loginHref = 'login.html';
        if (existingA) {
            loginHref = existingA.getAttribute('href');
        } else {
            // Determine correct path based on current location
            if (window.location.pathname.includes('/html/')) {
                loginHref = 'login.html';
            } else {
                loginHref = 'html/login.html';
            }
        }

        const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
        if (!userStr) {
            auth.innerHTML = `<a href="${loginHref}">Prihlásenie</a>`;
            return;
        }

        let user;
        try {
            user = JSON.parse(userStr);
        } catch (e) {
            console.error('Invalid user data in storage', e);
            auth.innerHTML = `<a href="${loginHref}">Prihlásenie</a>`;
            return;
        }

        const name = user.name || ((user.firstname || '') + ' ' + (user.lastname || '')).trim() || user.login || 'Používateľ';
        auth.innerHTML = buildProfileMarkup(name, user);

        const btn = document.getElementById('profileBtn');
        const dd = document.getElementById('profileDropdown');
        const logoutBtn = document.getElementById('logoutBtn');

        function closeDropdown() {
            if (!dd) return;
            dd.style.display = 'none';
            dd.setAttribute('aria-hidden', 'true');
            if (btn) btn.setAttribute('aria-expanded', 'false');
        }
        function openDropdown() {
            if (!dd) return;
            dd.style.display = 'block';
            dd.setAttribute('aria-hidden', 'false');
            if (btn) btn.setAttribute('aria-expanded', 'true');
        }

        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (dd.style.display === 'block') closeDropdown(); else openDropdown();
        });

        // close when clicking outside
        document.addEventListener('click', function () {
            closeDropdown();
        });

        // keyboard accessibility: Esc closes
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeDropdown();
        });

        logoutBtn.addEventListener('click', async function () {
            sessionStorage.removeItem('user');
            localStorage.removeItem('user');

            // Determine correct path for logout PHP
            let logoutPath = '../php/logout_user.php';
            if (!window.location.pathname.includes('/html/')) {
                logoutPath = 'php/logout_user.php';
            }

            await fetch(logoutPath, {
                method: 'POST',
                credentials: 'same-origin'
            });
            // reload to update UI on same page
            window.location.reload();
        });
    }

    // auto init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuthUI);
    } else {
        initAuthUI();
    }
})();