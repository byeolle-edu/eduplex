let currentUser = null;
let currentProfile = null;

const today = new Date();
const stampEl = document.getElementById('stampToday');
stampEl.innerHTML = `${today.getMonth()+1}.${today.getDate()}<br>${['일','월','화','수','목','금','토'][today.getDay()]}요일`;

const viewTitles = {
  announcements: ['공지사항', '지점 전체에 전달할 소식을 확인하세요'],
  schedule: ['일정 관리', '팀 일정과 미팅을 관리하세요'],
  staff: ['직원 정보', '직원 연락처와 담당 정보를 확인하세요'],
  sales: ['실적 현황', '이번 달 매출과 실적을 확인하세요']
};

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    const view = item.dataset.view;
    document.querySelectorAll('.view').forEach(v => v.classList.add('hide'));
    document.getElementById('view-' + view).classList.remove('hide');
    document.getElementById('viewTitle').textContent = viewTitles[view][0];
    document.getElementById('viewSub').textContent = viewTitles[view][1];
  });
});

document.getElementById('logoutBtn').addEventListener('click', () => auth.signOut());

// ---------- 인증 가드 ----------
auth.onAuthStateChanged(async (user) => {
  if (!user) { window.location.href = 'index.html'; return; }
  currentUser = user;
  const doc = await db.collection('users').doc(user.uid).get();
  currentProfile = doc.exists ? doc.data() : { name: user.email, role: 'staff', position: '', phone: '' };

  document.getElementById('curName').textContent = currentProfile.name || user.email;
  document.getElementById('curPosition').textContent =
    (currentProfile.position || '') + (currentProfile.role === 'admin' ? ' · 관리자' : '');

  document.getElementById('myPosition').value = currentProfile.position || '';
  document.getElementById('myPhone').value = currentProfile.phone || '';

  if (currentProfile.role !== 'admin') {
    document.getElementById('announceFormPanel').classList.add('hide');
  }

  loadAnnouncements();
  loadSchedule();
  loadStaff();
  loadSales();
});

function fmtDate(ts){
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
}
function esc(str){
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

// ---------- 공지사항 ----------
document.getElementById('announceForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('annTitle').value.trim();
  const body = document.getElementById('annBody').value.trim();
  await db.collection('announcements').add({
    title, body,
    authorName: currentProfile.name,
    authorUid: currentUser.uid,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  e.target.reset();
  loadAnnouncements();
});

async function loadAnnouncements(){
  const box = document.getElementById('announceList');
  const snap = await db.collection('announcements').orderBy('createdAt', 'desc').limit(30).get();
  if (snap.empty){ box.innerHTML = '<div class="empty-state">아직 등록된 공지가 없어요.</div>'; return; }
  box.innerHTML = snap.docs.map(d => {
    const a = d.data();
    return `<div class="ledger-row">
      <div style="flex:1;">
        <div class="rtitle">${esc(a.title)}</div>
        <div class="rmeta">${esc(a.authorName)} · ${fmtDate(a.createdAt)}</div>
        <div class="rbody">${esc(a.body)}</div>
      </div>
    </div>`;
  }).join('');
}

// ---------- 일정 관리 ----------
document.getElementById('scheduleForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const date = document.getElementById('schDate').value;
  const title = document.getElementById('schTitle').value.trim();
  const memo = document.getElementById('schMemo').value.trim();
  await db.collection('schedule').add({
    date, title, memo,
    authorName: currentProfile.name,
    authorUid: currentUser.uid,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  e.target.reset();
  loadSchedule();
});

async function loadSchedule(){
  const box = document.getElementById('scheduleList');
  const snap = await db.collection('schedule').orderBy('date', 'desc').limit(30).get();
  if (snap.empty){ box.innerHTML = '<div class="empty-state">등록된 일정이 없어요.</div>'; return; }
  box.innerHTML = snap.docs.map(d => {
    const s = d.data();
    return `<div class="ledger-row">
      <div style="flex:1;">
        <div class="rtitle">${esc(s.title)} <span class="tag mono">${esc(s.date)}</span></div>
        <div class="rmeta">등록: ${esc(s.authorName)}</div>
        ${s.memo ? `<div class="rbody">${esc(s.memo)}</div>` : ''}
      </div>
    </div>`;
  }).join('');
}

// ---------- 직원 정보 ----------
document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const position = document.getElementById('myPosition').value.trim();
  const phone = document.getElementById('myPhone').value.trim();
  await db.collection('users').doc(currentUser.uid).update({ position, phone });
  currentProfile.position = position;
  currentProfile.phone = phone;
  document.getElementById('curPosition').textContent =
    position + (currentProfile.role === 'admin' ? ' · 관리자' : '');
  loadStaff();
});

async function loadStaff(){
  const box = document.getElementById('staffList');
  const snap = await db.collection('users').orderBy('name').get();
  if (snap.empty){ box.innerHTML = '<div class="empty-state">등록된 직원이 없어요.</div>'; return; }
  box.innerHTML = `<table class="data-table">
    <thead><tr><th>이름</th><th>직책</th><th>연락처</th><th>이메일</th><th></th></tr></thead>
    <tbody>` + snap.docs.map(d => {
      const u = d.data();
      return `<tr>
        <td style="font-family:inherit;font-weight:600;">${esc(u.name)}</td>
        <td style="font-family:inherit;">${esc(u.position) || '-'}</td>
        <td>${esc(u.phone) || '-'}</td>
        <td>${esc(u.email)}</td>
        <td>${u.role === 'admin' ? '<span class="tag admin">관리자</span>' : ''}</td>
      </tr>`;
    }).join('') + `</tbody></table>`;
}

// ---------- 실적 현황 ----------
document.getElementById('salesForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const date = document.getElementById('saleDate').value;
  const amount = Number(document.getElementById('saleAmount').value);
  const memo = document.getElementById('saleMemo').value.trim();
  await db.collection('sales').add({
    date, amount, memo,
    authorName: currentProfile.name,
    authorUid: currentUser.uid,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  e.target.reset();
  loadSales();
});

async function loadSales(){
  const box = document.getElementById('salesList');
  const metricsBox = document.getElementById('salesMetrics');
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

  const snap = await db.collection('sales').orderBy('date', 'desc').limit(200).get();
  const all = snap.docs.map(d => d.data());
  const thisMonth = all.filter(s => (s.date || '').startsWith(ym));

  const total = thisMonth.reduce((sum, s) => sum + (s.amount || 0), 0);
  const avg = thisMonth.length ? Math.round(total / thisMonth.length) : 0;
  const count = thisMonth.length;

  metricsBox.innerHTML = `
    <div class="metric-card"><div class="lbl">이번 달 누적 매출</div><div class="val">₩${total.toLocaleString()}</div></div>
    <div class="metric-card"><div class="lbl">등록 건수</div><div class="val">${count}건</div></div>
    <div class="metric-card"><div class="lbl">건당 평균</div><div class="val">₩${avg.toLocaleString()}</div></div>
  `;

  if (thisMonth.length === 0){ box.innerHTML = '<div class="empty-state">이번 달 등록된 실적이 없어요.</div>'; return; }
  box.innerHTML = thisMonth.map(s => `
    <div class="ledger-row">
      <div style="flex:1;">
        <div class="rtitle">₩${(s.amount || 0).toLocaleString()} <span class="tag mono">${esc(s.date)}</span></div>
        <div class="rmeta">등록: ${esc(s.authorName)}</div>
        ${s.memo ? `<div class="rbody">${esc(s.memo)}</div>` : ''}
      </div>
    </div>
  `).join('');
}
