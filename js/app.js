 /* ===== TaskHub User App ===== */
 var S = { user: null, myCompany: null, view: 'list', filter: 'all', qf: 'all', selDate: null, calMon: new Date(), tagId: null };
 
 /* --- Data Layer --- */
 function g() {
   try { var d = localStorage.getItem('th3_global'); return d ? JSON.parse(d) : { tasks: [], companies: ['杭州创业兄弟', '杭州幸福千万家', '杭州租哥辆', '杭州讯途同创'], approvals: [], adminCoopers: [], users: {} }; }
   catch (e) { return { tasks: [], companies: ['杭州创业兄弟', '杭州幸福千万家', '杭州租哥辆', '杭州讯途同创'], approvals: [], adminCoopers: [], users: {} }; }
 }
 function gs(d) { localStorage.setItem('th3_global', JSON.stringify(d)); }
 function u() {
   if (!S.user) return { coopers: [], taskNotes: {} };
   try { var d = localStorage.getItem('th3_users'); var users = d ? JSON.parse(d) : {}; return users[S.user] || { coopers: [], taskNotes: {} }; }
   catch (e) { return { coopers: [], taskNotes: {} }; }
 }
 function us(data) {
   if (!S.user) return;
   try { var d = localStorage.getItem('th3_users'); var users = d ? JSON.parse(d) : {}; users[S.user] = data; localStorage.setItem('th3_users', JSON.stringify(users)); }
   catch (e) { }
 }
 function td() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
 function today() { return td(); }
 function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
 
 /* --- Login --- */
 function showLogin() {
   var savedUser = localStorage.getItem('th3_current_user');
   if (savedUser) {
     S.user = savedUser;
     var ud = u();
     if (ud && ud.company) {
       S.myCompany = ud.company;
       loginComplete();
       return;
     }
   }
   document.getElementById('login-page').style.display = 'flex';
   document.getElementById('main-app').style.display = 'none';
   document.getElementById('login-step-1').style.display = 'block';
   document.getElementById('login-step-2').style.display = 'none';
   if (savedUser) document.getElementById('login-name').value = savedUser;
 }
 
 function goStep2() {
   var name = document.getElementById('login-name').value.trim();
   if (!name) { alert('请输入您的名字'); return; }
   S.user = name;
   localStorage.setItem('th3_current_user', name);
   var ud = u();
   if (ud && ud.company) {
     S.myCompany = ud.company;
     loginComplete();
     return;
   }
   // New user - show company selection
   var gd = g();
   var comps = gd.companies || ['杭州创业兄弟', '杭州幸福千万家', '杭州租哥辆', '杭州讯途同创'];
   document.getElementById('login-step-1').style.display = 'none';
   document.getElementById('login-step-2').style.display = 'block';
   var grid = document.getElementById('login-company-grid');
   var h = '';
   comps.forEach(function (c) {
     h += '<div class="company-option" data-company="' + c + '" onclick="selLoginC(this)"><div class="co-name">' + c + '</div></div>';
   });
   grid.innerHTML = h;
 }
 
 function backToStep1() {
   document.getElementById('login-step-1').style.display = 'block';
   document.getElementById('login-step-2').style.display = 'none';
 }
 
 var _lc = null;
 function selLoginC(el) {
   document.querySelectorAll('#login-company-grid .company-option').forEach(function (e) { e.classList.remove('selected'); });
   el.classList.add('selected');
   _lc = el.dataset.company;
 }
 
 function confirmLoginCompany() {
   if (!_lc) { alert('请选择公司'); return; }
   S.myCompany = _lc;
   var ud = u(); ud.company = _lc; us(ud);
   // Also register in global users
   var gd = g(); if (!gd.users) gd.users = {}; gd.users[S.user] = _lc; gs(gd);
   loginComplete();
 }
 
 function loginComplete() {
   document.getElementById('login-page').style.display = 'none';
   document.getElementById('main-app').style.display = 'flex';
   document.getElementById('sidebar-user').textContent = S.user;
   document.getElementById('sidebar-company').textContent = S.myCompany;
   document.getElementById('header-company-tag').textContent = S.myCompany;
   document.getElementById('today-tag').textContent = today();
   start();
 }
 
 function logoutUser() {
   if (!confirm('确认退出登录？')) return;
   localStorage.removeItem('th3_current_user');
   S.user = null; S.myCompany = null;
   showLogin();
 }
 
 /* --- Task Logic --- */
 function getMyTasks() {
   var gd = g();
   var tasks = gd.tasks ? gd.tasks.filter(function (t) { return t.company === S.myCompany; }) : [];
   var sq = (document.getElementById('search-input') || {}).value || '';
   if (sq) tasks = tasks.filter(function (t) { return t.name.indexOf(sq) >= 0 || (t.partner || '').indexOf(sq) >= 0; });
   if (S.filter === 'pending') tasks = tasks.filter(function (t) { return t.status === 'pending'; });
   else if (S.filter === 'done') tasks = tasks.filter(function (t) { return t.status === 'done'; });
   if (S.selDate) tasks = tasks.filter(function (t) { return t.date === S.selDate; });
   else if (S.qf === 'today') tasks = tasks.filter(function (t) { return t.date === today(); });
   // Sort: feedback first, then by date desc, then priority
   tasks.sort(function (a, b) {
     var af = a.needFeedback && a.date === today() && a.status !== 'done' ? 0 : 1;
     var bf = b.needFeedback && b.date === today() && b.status !== 'done' ? 0 : 1;
     if (af !== bf) return af - bf;
     if (a.date !== b.date) return b.date.localeCompare(a.date);
     return { high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority];
   });
   return tasks;
 }
 
 function setView(v) {
   S.view = v; S.selDate = null;
   document.querySelectorAll('.nav-item[data-view]').forEach(function (n) { n.classList.toggle('active', n.dataset.view === v); });
   document.getElementById('view-title').textContent = v === 'list' ? '任务列表' : '常用Cooper';
   document.getElementById('calendar-section').style.display = v === 'list' ? 'block' : 'none';
   if (v === 'coopers') renderCooper(); else renderTasks();
 }
 
 function setFilter(f) {
   S.filter = f; S.selDate = null;
   document.querySelectorAll('.nav-item[data-filter]').forEach(function (n) { n.classList.toggle('active', n.dataset.filter === f); });
   renderTasks();
 }
 
 /* --- Calendar --- */
 function changeMonth(d) { S.calMon = new Date(S.calMon.getFullYear(), S.calMon.getMonth() + d, 1); renderCal(); }
 
 function renderCal() {
   var m = S.calMon;
   document.getElementById('calendar-title').textContent = m.getFullYear() + '年' + (m.getMonth() + 1) + '月';
   var g = document.getElementById('calendar-grid');
   var h = ['日', '一', '二', '三', '四', '五', '六'].map(function (x) { return '<div class="cw">' + x + '</div>'; }).join('');
   var fd = new Date(m.getFullYear(), m.getMonth(), 1).getDay();
   var dim = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
   var pd = new Date(m.getFullYear(), m.getMonth(), 0).getDate();
   var ts = today();
   var gd = g_data();
   var myTasks = gd.tasks ? gd.tasks.filter(function (t) { return t.company === S.myCompany; }) : [];
   var tds = new Set(myTasks.map(function (x) { return x.date; }));
   for (var i = fd - 1; i >= 0; i--) { h += '<div class="cal-day om">' + (pd - i) + '</div>'; }
   for (var d = 1; d <= dim; d++) {
     var ds = m.getFullYear() + '-' + String(m.getMonth() + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
     var cls = ['cal-day'];
     if (ds === ts) cls.push('today');
     if (S.selDate === ds) cls.push('sel');
     if (tds.has(ds)) cls.push('has-task');
     h += '<div class="' + cls.join(' ') + '" onclick="selDate(\'' + ds + '\')">' + d + '</div>';
   }
   var r = 7 - ((fd + dim) % 7); if (r < 7) for (var d = 1; d <= r; d++) { h += '<div class="cal-day om">' + d + '</div>'; }
   document.getElementById('calendar-grid').innerHTML = h;
 }
 
 function g_data() { return g(); }
 
 function selDate(ds) {
   S.selDate = ds === S.selDate ? null : ds;
   S.qf = 'all';
   renderCal(); renderTasks();
 }
 
 /* --- Render --- */
 function renderTasks() {
   if (S.view === 'coopers') { renderCooper(); return; }
   var tasks = getMyTasks();
   var area = document.getElementById('task-area');
   var h = '';
   var gd = g();
   var fb = gd.tasks ? gd.tasks.filter(function (x) { return x.company === S.myCompany && x.needFeedback && x.date === today() && x.status !== 'done'; }) : [];
   // Feedback zone
   if (fb.length) {
     h += '<div class="fb-zone"><div class="fb-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg><h3>今日需反馈任务</h3><span class="fbc">' + fb.length + '项待反馈</span></div>';
     fb.forEach(function (x) { h += card(x, true); });
     h += '</div>';
   }
   // Regular tasks
   var reg = tasks.filter(function (x) { return !(x.needFeedback && x.date === today() && x.status !== 'done'); });
   if (!reg.length && !fb.length) {
     area.innerHTML = '<div class="es"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><h3>暂无任务</h3><p>等待管理员下发任务</p></div>';
     updStats(); return;
   }
   var grp = {};
   reg.forEach(function (x) { if (!grp[x.date]) grp[x.date] = []; grp[x.date].push(x); });
   for (var d in grp) {
     var items = grp[d];
     var isT = d === today();
     h += '<div class="task-group"><div class="tg-head"><div class="dl">' + (isT ? '今天 (' + d + ')' : d) + '</div><div class="dc">' + items.length + '项</div></div>';
     items.forEach(function (x) { h += card(x, false); });
     h += '</div>';
   }
   area.innerHTML = h;
   updStats(); renderCal();
 }
 
 function card(t, inFB) {
   var SL = { pending: '待处理', done: '已完成' };
   var PL = { high: '高', medium: '中', low: '低' };
   var cc = t.status === 'done' ? 'done' : '';
   var pc = t.priority;
   var kc = t.status === 'done' ? 'ch' : '';
   var tn = t.tableName || '打开表格';
   var ud = u();
   var userNote = ud.taskNotes ? ud.taskNotes[t.id] || '' : '';
   var fd = '';
   if (t.needFeedback && t.feedbackDeadline) {
     var deadline = parseDeadline(t.feedbackDeadline);
     var now = new Date();
     var diffMs = deadline.getTime() - now.getTime();
     var diffMin = Math.floor(diffMs / 60000);
     var urg = diffMin > 0 && diffMin <= 120 ? 'ur' : '';
     var lb = diffMin <= 0 ? '已超时' : '剩余' + Math.floor(diffMin / 60) + '时' + (diffMin % 60) + '分';
     var timeStr = formatDeadline(t.feedbackDeadline);
     fd = '<span class="fd ' + urg + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>截止 ' + timeStr + ' (' + lb + ')</span>';
   }
   var fr = t.needFeedback && t.feedbackReq ? '<span class="tag tag-f">' + t.feedbackReq + '</span>' : '';
   var nt = userNote ? '<span class="tag tag-nt">📌 ' + userNote + '</span>' : '';
   return '<div class="tc ' + cc + ' ' + pc + '">' +
     '<div class="ck ' + kc + '" onclick="tog(\'' + t.id + '\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>' +
     '<div class="tb"><div class="tt">' + t.name + '</div>' +
     (t.desc ? '<div class="td">' + t.desc + '</div>' : '') +
     (t.link ? '<a class="tl" href="' + t.link + '" target="_blank"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' + tn + '</a>' : '') +
     '<div class="tm"><span class="tag tag-' + t.priority + '">' + PL[t.priority] + '</span><span class="tag tag-' + (t.status === 'done' ? 'd' : 'p') + '">' + SL[t.status] + '</span>' + fd + fr + nt + '</div></div>' +
     '<div class="ta"><button onclick="showTag(\'' + t.id + '\')" title="打标备注"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg></button></div></div>';
 }
 
 function parseDeadline(dl) {
   if (dl.indexOf('T') >= 0) return new Date(dl);
   // Format: "HH:MM" for today
   var p = dl.split(':');
   var d = new Date(); d.setHours(parseInt(p[0]), parseInt(p[1]), 0, 0); return d;
 }
 
 function formatDeadline(dl) {
   if (dl.indexOf('T') >= 0) {
     var d = new Date(dl);
     return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
   }
   return dl;
 }
 
 function tog(id) {
   var gd = g();
   var t = gd.tasks ? gd.tasks.find(function (x) { return x.id === id; }) : null;
   if (!t) return;
   t.status = t.status === 'done' ? 'pending' : 'done';
   gs(gd); renderTasks();
 }
 
 /* --- Tag/Note --- */
 function showTag(id) {
   S.tagId = id;
   var gd = g();
   var t = gd.tasks ? gd.tasks.find(function (x) { return x.id === id; }) : null;
   if (!t) return;
   var ud = u();
   document.getElementById('tag-priority').value = '';
   document.getElementById('tag-note').value = ud.taskNotes ? ud.taskNotes[id] || '' : '';
   document.getElementById('tag-modal').classList.add('show');
 }
 function hideTagModal() { document.getElementById('tag-modal').classList.remove('show'); S.tagId = null; }
 function saveTag() {
   var gd = g();
   var t = gd.tasks ? gd.tasks.find(function (x) { return x.id === S.tagId; }) : null;
   if (!t) { hideTagModal(); return; }
   var p = document.getElementById('tag-priority').value;
   if (p) t.priority = p;
   gs(gd);
   var ud = u(); if (!ud.taskNotes) ud.taskNotes = {};
   ud.taskNotes[t.id] = document.getElementById('tag-note').value.trim();
   us(ud);
   hideTagModal(); renderTasks();
 }
 
 /* --- Cooper --- */
 function renderCooper() {
   var area = document.getElementById('task-area');
   var gd = g();
   var adminCoopers = gd.adminCoopers || [];
   var ud = u(); var userCoopers = ud.coopers || [];
   var allCoopers = adminCoopers.concat(userCoopers);
   var h = '<div class="cp"><div class="cph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg><h3>常用Cooper链接</h3><button class="cpa" onclick="showCooperModal()">+ 添加</button></div>';
   if (!allCoopers.length) {
     h += '<div class="es" style="padding:16px"><p>暂无链接</p></div>';
   } else {
     allCoopers.forEach(function (c) {
       var tag = c.byAdmin ? '<span class="cia">管理员</span>' : '';
       var del = !c.byAdmin ? '<button class="cid" onclick="delUserC(\'' + c.id + '\')">✕</button>' : '';
       h += '<a class="ci" href="' + c.link + '" target="_blank"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span class="cin">' + c.name + '</span>' + tag + del + '</a>';
     });
   }
   h += '</div>';
   area.innerHTML = h;
 }
 function showCooperModal() { document.getElementById('cooper-name').value = ''; document.getElementById('cooper-link').value = ''; document.getElementById('cooper-modal').classList.add('show'); }
 function hideCooperModal() { document.getElementById('cooper-modal').classList.remove('show'); }
 function saveCooper() {
   var n = document.getElementById('cooper-name').value.trim();
   var l = document.getElementById('cooper-link').value.trim();
   if (!n || !l) { alert('请填写名称和链接'); return; }
   var ud = u(); if (!ud.coopers) ud.coopers = [];
   ud.coopers.push({ id: uid(), name: n, link: l });
   us(ud); hideCooperModal();
   if (S.view === 'coopers') renderCooper();
 }
 function delUserC(id) {
   var ud = u(); if (!ud.coopers) return;
   ud.coopers = ud.coopers.filter(function (x) { return x.id !== id; });
   us(ud); if (S.view === 'coopers') renderCooper();
 }
 
 /* --- Stats --- */
 function updStats() {
   var gd = g();
   var myTasks = gd.tasks ? gd.tasks.filter(function (t) { return t.company === S.myCompany; }) : [];
   var fb = gd.tasks ? gd.tasks.filter(function (x) { return x.company === S.myCompany && x.needFeedback && x.date === today() && x.status !== 'done'; }) : [];
   document.getElementById('stat-total').textContent = myTasks.length;
   document.getElementById('stat-done').textContent = myTasks.filter(function (t) { return t.status === 'done'; }).length;
   document.getElementById('stat-fb').textContent = fb.length;
   document.getElementById('pending-badge').textContent = myTasks.filter(function (t) { return t.status === 'pending'; }).length;
 }
 
 function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }
 
 /* --- Reminders --- */
 var _rts = [];
 function schedR() {
   _rts.forEach(function (t) { clearTimeout(t); }); _rts = [];
   var gd = g();
   var mt = gd.tasks ? gd.tasks.filter(function (t) { return t.company === S.myCompany && t.needFeedback && t.date === today() && t.feedbackDeadline && t.status !== 'done'; }) : [];
   var now = new Date();
   mt.forEach(function (t) {
     var dl = parseDeadline(t.feedbackDeadline);
     var rm = new Date(dl.getTime() - 2 * 3600000);
     var diff = rm.getTime() - now.getTime();
     if (diff > 0 && diff < 12 * 3600000) { _rts.push(setTimeout(function () { showT(t); }, diff)); }
     if (now >= rm && now < dl) { showT(t); }
   });
 }
 function showT(t) {
   var c = document.getElementById('reminder-container');
   var id = 'toast-' + t.id;
   if (document.getElementById(id)) return;
   var h = '<div class="rt" id="' + id + '"><button class="rtx" onclick="this.parentElement.remove()">✕</button><div class="rth"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg><h4>⏰ 任务反馈提醒</h4></div><div class="rtb"><strong>' + t.name + '</strong> 反馈截止 ' + formatDeadline(t.feedbackDeadline) + '<br>距离截止不足2小时，请尽快完成！</div></div>';
   c.insertAdjacentHTML('beforeend', h);
   try { navigator.vibrate && navigator.vibrate([200, 100, 200, 100, 200]); } catch (e) { }
   setTimeout(function () { var el = document.getElementById(id); if (el) el.remove(); }, 60000);
 }
 
 function start() { renderTasks(); renderCal(); schedR(); }
 function init() { showLogin(); }
 init();




