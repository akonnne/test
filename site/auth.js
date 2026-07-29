/* ============================================================
   数道 · 万象 — 登录 / 注册 逻辑
   纯前端实现（无后端）：用户与会话存于 localStorage
   说明：静态站点无法做真正安全的鉴权，密码以单向哈希存储，
        仅用于演示「注册 → 登录 → 会话保持 → 退出」完整流程。
   ============================================================ */
(function () {
    'use strict';

    var USERS_KEY = 'sdwx_users';
    var SESSION_KEY = 'sdwx_session';

    /* ---------- 工具 ---------- */
    function $(sel, root) { return (root || document).querySelector(sel); }
    function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

    // 简单单向哈希（djb2），避免明文存储密码
    function hashPwd(s) {
        var h = 5381;
        for (var i = 0; i < s.length; i++) {
            h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
        }
        return h.toString(16);
    }

    function loadUsers() {
        try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
        catch (e) { return []; }
    }
    function saveUsers(list) {
        localStorage.setItem(USERS_KEY, JSON.stringify(list));
    }
    function getSession() {
        try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
        catch (e) { return null; }
    }
    function setSession(s) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    }
    function clearSession() {
        localStorage.removeItem(SESSION_KEY);
    }

    /* ---------- DOM ---------- */
    var modal = $('#authModal');
    var navBtn = $('#navAuthBtn');
    var navWrap = $('#navAuthWrap');
    var navMenu = $('#navAuthMenu');
    var navMenuName = $('#navAuthMenuName');
    var navLogout = $('#navAuthLogout');
    var form = $('#authForm');
    var tabs = $all('.auth-tab', modal);
    var submitBtn = $('#authSubmit');
    var switchText = $('#authSwitchText');
    var switchLink = $('#authSwitchLink');
    var errEl = $('#authError');
    var fNick = $('#authNick');
    var fAccount = $('#authAccount');
    var fPwd = $('#authPwd');
    var fPwd2 = $('#authPwd2');
    var pwdToggle = $('[data-toggle-pwd]', modal);

    var mode = 'login'; // 'login' | 'register'

    /* ---------- 弹层开关 ---------- */
    function openModal(toMode) {
        mode = toMode || 'login';
        applyMode();
        clearError();
        modal.classList.add('open');
        document.body.classList.add('auth-open');
        // 聚焦首输入框
        setTimeout(function () {
            if (mode === 'register') fNick.focus(); else fAccount.focus();
        }, 320);
    }
    function closeModal() {
        modal.classList.remove('open');
        document.body.classList.remove('auth-open');
        closeMenu();
    }
    function clearError() { errEl.textContent = ''; }
    function showError(msg) { errEl.textContent = msg; }

    /* ---------- 模式切换 ---------- */
    function applyMode() {
        modal.classList.toggle('mode-register', mode === 'register');
        tabs.forEach(function (t) {
            t.classList.toggle('active', t.getAttribute('data-tab') === mode);
        });
        if (mode === 'register') {
            submitBtn.textContent = '注 册';
            switchText.textContent = '已有账号？';
            switchLink.textContent = '去登录';
        } else {
            submitBtn.textContent = '登 录';
            switchText.textContent = '还没有账号？';
            switchLink.textContent = '立即注册';
        }
    }

    function setMode(m) {
        mode = m;
        applyMode();
        clearError();
        form.reset();
    }

    /* ---------- 校验 ---------- */
    function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

    function validate() {
        var account = fAccount.value.trim();
        var pwd = fPwd.value;

        if (!account) { showError('请输入用户名或邮箱'); return false; }
        if (pwd.length < 6) { showError('密码至少 6 位'); return false; }

        if (mode === 'register') {
            var nick = fNick.value.trim();
            var pwd2 = fPwd2.value;
            if (!nick) { showError('请填写昵称'); return false; }
            if (pwd !== pwd2) { showError('两次输入的密码不一致'); return false; }
            var users = loadUsers();
            var taken = users.some(function (u) {
                return u.account === account ||
                    (isEmail(account) && u.email && u.email.toLowerCase() === account.toLowerCase());
            });
            if (taken) { showError('该用户名 / 邮箱已被注册'); return false; }
        }
        return true;
    }

    /* ---------- 提交 ---------- */
    function onSubmit(e) {
        e.preventDefault();
        clearError();
        if (!validate()) return;

        var account = fAccount.value.trim();
        var pwd = fPwd.value;
        var users = loadUsers();

        if (mode === 'register') {
            var nick = fNick.value.trim();
            var user = {
                account: account,
                email: isEmail(account) ? account : '',
                nick: nick,
                pwd: hashPwd(pwd),
                created: Date.now()
            };
            users.push(user);
            saveUsers(users);
            // 自动登录
            setSession({ account: account, nick: nick, ts: Date.now() });
            refreshNav();
            closeModal();
            return;
        }

        // 登录
        var found = users.filter(function (u) {
            return u.account === account ||
                (u.email && u.email.toLowerCase() === account.toLowerCase());
        })[0];
        if (!found || found.pwd !== hashPwd(pwd)) {
            showError('用户名 / 邮箱或密码错误');
            return;
        }
        setSession({ account: found.account, nick: found.nick, ts: Date.now() });
        refreshNav();
        closeModal();
    }

    /* ---------- 导航栏状态 ---------- */
    function refreshNav() {
        var s = getSession();
        if (s) {
            navBtn.classList.add('logged-in');
            navBtn.innerHTML = '👤 ' + (s.nick || s.account);
            navMenuName.textContent = s.nick || s.account;
        } else {
            navBtn.classList.remove('logged-in');
            navBtn.textContent = '登录 / 注册';
            closeMenu();
        }
    }

    function closeMenu() {
        if (navMenu) navMenu.classList.remove('open');
    }
    function toggleMenu() {
        if (!getSession()) { openModal('login'); return; }
        navMenu.classList.toggle('open');
    }

    /* ---------- 事件绑定 ---------- */
    function bind() {
        navBtn.addEventListener('click', function () {
            if (getSession()) { toggleMenu(); }
            else { openModal('login'); }
        });
        if (navLogout) navLogout.addEventListener('click', function () {
            clearSession();
            refreshNav();
        });

        // 点击弹层外部 / 关闭按钮
        $all('[data-auth-close]', modal).forEach(function (el) {
            el.addEventListener('click', closeModal);
        });

        tabs.forEach(function (t) {
            t.addEventListener('click', function () { setMode(t.getAttribute('data-tab')); });
        });

        switchLink.addEventListener('click', function (e) {
            e.preventDefault();
            setMode(mode === 'login' ? 'register' : 'login');
        });

        form.addEventListener('submit', onSubmit);

        // 密码可见切换
        if (pwdToggle) {
            pwdToggle.addEventListener('click', function () {
                var show = fPwd.type === 'password';
                fPwd.type = show ? 'text' : 'password';
                pwdToggle.textContent = show ? '🙈' : '👁';
            });
        }

        // Esc 关闭
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { closeModal(); closeMenu(); }
        });

        // 点击别处关闭下拉
        document.addEventListener('click', function (e) {
            if (navWrap && navMenu && navMenu.classList.contains('open')) {
                if (!navWrap.contains(e.target)) closeMenu();
            }
        });
    }

    /* ---------- 初始化 ---------- */
    function init() {
        if (!modal || !navBtn) return;
        bind();
        refreshNav();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
