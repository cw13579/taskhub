/* ===== GitHub Sync Module V1.3 - TaskHub 双向数据同步 ===== */
var GH = {
  OWNER: 'cw13579',
  REPO: 'taskhub',
  BRANCH: 'master',
  FILE: 'tasks.json',
  _tokenCache: null
};

GH._rawUrl = 'https://raw.githubusercontent.com/' + GH.OWNER + '/' + GH.REPO + '/' + GH.BRANCH + '/' + GH.FILE;
GH._apiUrl = 'https://api.github.com/repos/' + GH.OWNER + '/' + GH.REPO + '/contents/' + GH.FILE;

/* --- Token (localStorage优先，fallback到任务数据中的_token字段) --- */
GH.getToken = function() {
  if (GH._tokenCache) return GH._tokenCache;
  var t = localStorage.getItem('gh_token');
  if (t) { GH._tokenCache = t; return t; }
  // 从任务数据中读取（管理员推送时自动附带）
  var gd = JSON.parse(localStorage.getItem('th3_global') || '{}');
  if (gd._token) { GH._tokenCache = gd._token; return gd._token; }
  return '';
};
GH.setToken = function(t) {
  GH._tokenCache = t;
  localStorage.setItem('gh_token', t);
};

/* --- 拉取 --- */
GH.pull = function() {
  return fetch(GH._rawUrl + '?_=' + Date.now())
    .then(function(r) {
      if (!r.ok) throw new Error('pull failed HTTP ' + r.status);
      return r.json();
    });
};

/* --- 推送（含 SHA 冲突自动重试，最多3次） --- */
GH.push = function(data, retries) {
  retries = retries || 0;
  if (retries >= 3) return Promise.reject(new Error('push retry exhausted'));
  var token = GH.getToken();

  return fetch(GH._apiUrl, {
    headers: { 'Authorization': 'token ' + token }
  }).then(function(r) {
    if (r.status === 404) return null;
    if (!r.ok) throw new Error('get sha failed HTTP ' + r.status);
    return r.json();
  }).then(function(info) {
    var sha = info ? info.sha : null;
    var jsonStr = JSON.stringify(data, null, 2);
    var content = btoa(unescape(encodeURIComponent(jsonStr)));
    var body = {
      message: 'TaskHub sync ' + new Date().toLocaleString('zh-CN'),
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
    if (!r.ok) {
      // 409 = SHA conflict, retry
      if (r.status === 409) {
        return new Promise(function(resolve) {
          setTimeout(function() {
            resolve(GH.push(data, retries + 1));
          }, 500);
        });
      }
      throw new Error('push failed HTTP ' + r.status);
    }
    return r.json();
  });
};

/* --- localStorage -> GitHub --- */
GH.syncToGitHub = function() {
  var local = JSON.parse(localStorage.getItem('th3_global') || '{}');
  return GH.push(local);
};

/* --- GitHub -> localStorage --- */
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

/* --- 伙伴端自动初始化（拉取+推送默认Token） --- */
GH.initPartner = function() {
  // Ensure token is cached
  GH.getToken();
  return GH.pull().then(function(data) {
    localStorage.setItem('th3_global', JSON.stringify(data));
    return data;
  }).catch(function(err) {
    console.warn('GitHub sync failed, fallback to local:', err.message);
    return null;
  });
};

/* --- 自动推送：操作后静默同步（失败不打断用户） --- */
GH.autoPush = function() {
  GH.syncToGitHub().then(function() {
    console.log('auto-push ok');
  }).catch(function(err) {
    console.warn('auto-push failed:', err.message);
    // 静默失败，下次操作或刷新时重试
  });
};

/* --- 自动拉取：操作后静默刷新本地数据 --- */
GH.autoPull = function(callback) {
  GH.syncToLocal().then(function() {
    if (typeof callback === 'function') callback();
  }).catch(function(err) {
    console.warn('auto-pull failed:', err.message);
  });
};

/* --- 管理端同步面板 --- */
GH.renderSyncPanel = function() {
  var token = GH.getToken();
  return '<div class="gh-sync-panel">'
    + '<div class="gh-header"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/></svg><span>GitHub Data Sync</span></div>'
    + '<div class="gh-row"><label>Token</label><input type="password" id="gh-token-input" value="' + token + '" placeholder="GitHub Token"></div>'
    + '<div class="gh-actions">'
    + '<button class="btn btn-primary" onclick="saveTokenAndPull()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg> Pull</button>'
    + '<button class="btn btn-primary" onclick="saveTokenAndPush()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg> Push</button>'
    + '</div><div class="gh-badge" style="margin-top:6px;font-size:9px;color:var(--success)">双向同步 V1.3</div>'
    + '<div id="gh-status" class="gh-status"></div></div>';
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
  GH.syncToLocal().then(function() {
    GH.showStatus('Pulled from GitHub', true);
    if (typeof render === 'function') render();
  }).catch(function(err) {
    GH.showStatus('Pull failed: ' + err.message, false);
  });
}

function saveTokenAndPush() {
  var token = (document.getElementById('gh-token-input') || {}).value || '';
  GH.setToken(token);
  GH.syncToGitHub().then(function() {
    GH.showStatus('Pushed to GitHub', true);
  }).catch(function(err) {
    GH.showStatus('Push failed: ' + err.message, false);
  });
}

