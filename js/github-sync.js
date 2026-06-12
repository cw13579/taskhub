/* ===== GitHub Sync Module - TaskHub 数据同步 ===== */
var GH = {
  OWNER: 'cw13579',
  REPO: 'taskhub',
  BRANCH: 'master',
  FILE: 'tasks.json'
};

GH._rawUrl = 'https://raw.githubusercontent.com/' + GH.OWNER + '/' + GH.REPO + '/' + GH.BRANCH + '/' + GH.FILE;
GH._apiUrl = 'https://api.github.com/repos/' + GH.OWNER + '/' + GH.REPO + '/contents/' + GH.FILE;

/* --- Token (only admin) --- */
GH.getToken = function() {
  var t = localStorage.getItem('gh_token');
  return t || '';
};
GH.setToken = function(t) {
  localStorage.setItem('gh_token', t);
};

/* --- fetch from GitHub --- */
GH.pull = function() {
  return fetch(GH._rawUrl + '?_=' + Date.now())
    .then(function(r) {
      if (!r.ok) throw new Error('fetch failed HTTP ' + r.status);
      return r.json();
    });
};

/* --- push to GitHub (admin only) --- */
GH.push = function(data) {
  var token = GH.getToken();
  if (!token) return Promise.reject(new Error('please set GitHub Token first'));

  return fetch(GH._apiUrl, {
    headers: { 'Authorization': 'token ' + token }
  }).then(function(r) {
    if (r.status === 404) return null;
    if (!r.ok) throw new Error('get file info failed HTTP ' + r.status);
    return r.json();
  }).then(function(info) {
    var sha = info ? info.sha : null;
    var jsonStr = JSON.stringify(data, null, 2);
    var content = btoa(unescape(encodeURIComponent(jsonStr)));
    var body = {
      message: 'TaskHub data sync ' + new Date().toLocaleString('zh-CN'),
      content: content,
      branch: GH.BRANCH
    };
    if (sha) body.sha = sha;

    return fetch(GH._apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': 'token ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  }).then(function(r) {
    if (!r.ok) throw new Error('push failed HTTP ' + r.status);
    return r.json();
  });
};

/* --- sync GitHub -> localStorage --- */
GH.syncToLocal = function() {
  return GH.pull().then(function(data) {
    localStorage.setItem('th3_global', JSON.stringify({
      tasks: data.tasks || [],
      companies: data.companies || [],
      approvals: data.approvals || [],
      adminCoopers: data.adminCoopers || [],
      users: data.users || {}
    }));
    return data;
  });
};

/* --- sync localStorage -> GitHub --- */
GH.syncToGitHub = function() {
  var local = JSON.parse(localStorage.getItem('th3_global') || '{}');
  return GH.push(local);
};

/* --- auto init for partner pages --- */
GH.initPartner = function() {
  return GH.pull().then(function(data) {
    localStorage.setItem('th3_global', JSON.stringify(data));
    return data;
  }).catch(function(err) {
    console.warn('GitHub sync failed, using local data:', err.message);
    return null;
  });
};

/* --- render sync panel for admin --- */
GH.renderSyncPanel = function() {
  var token = GH.getToken();
  return '<div class="gh-sync-panel">'
    + '<div class="gh-header"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/></svg><span>GitHub Data Sync</span></div>'
    + '<div class="gh-row"><label>Token</label><input type="password" id="gh-token-input" value="' + token + '" placeholder="GitHub Token"></div>'
    + '<div class="gh-actions">'
    + '<button class="btn btn-primary" onclick="saveTokenAndPull()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg> Pull from GitHub</button>'
    + '<button class="btn btn-primary" onclick="saveTokenAndPush()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg> Push to GitHub</button>'
    + '</div><div id="gh-status" class="gh-status"></div></div>';
};

GH.showStatus = function(msg, ok) {
  var el = document.getElementById('gh-status');
  if (el) {
    el.textContent = msg;
    el.className = 'gh-status ' + (ok ? 'ok' : 'err');
    el.style.display = 'block';
    setTimeout(function() { el.style.display = 'none'; }, 6000);
  }
};

function saveTokenAndPull() {
  var token = (document.getElementById('gh-token-input') || {}).value || '';
  GH.setToken(token);
  document.getElementById('gh-status').textContent = 'Pulling...';
  GH.syncToLocal().then(function() {
    GH.showStatus('Successfully pulled from GitHub!', true);
    if (typeof render === 'function') render();
  }).catch(function(err) {
    GH.showStatus('Pull failed: ' + err.message, false);
  });
}

function saveTokenAndPush() {
  var token = (document.getElementById('gh-token-input') || {}).value || '';
  GH.setToken(token);
  document.getElementById('gh-status').textContent = 'Pushing...';
  GH.syncToGitHub().then(function() {
    GH.showStatus('Successfully pushed to GitHub!', true);
  }).catch(function(err) {
    GH.showStatus('Push failed: ' + err.message, false);
  });
}
