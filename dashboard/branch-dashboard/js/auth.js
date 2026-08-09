const tabLogin = document.getElementById('tabLogin');
const tabSignup = document.getElementById('tabSignup');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const authError = document.getElementById('authError');
const stamp = document.getElementById('stampToday');

const today = new Date();
stamp.innerHTML = `${today.getMonth()+1}.${today.getDate()}<br>${['일','월','화','수','목','금','토'][today.getDay()]}요일`;

function showError(msg){
  authError.textContent = msg;
  authError.classList.add('show');
}
function clearError(){
  authError.classList.remove('show');
  authError.textContent = '';
}

tabLogin.addEventListener('click', () => {
  tabLogin.classList.add('active');
  tabSignup.classList.remove('active');
  loginForm.classList.remove('hide');
  signupForm.classList.add('hide');
  clearError();
});
tabSignup.addEventListener('click', () => {
  tabSignup.classList.add('active');
  tabLogin.classList.remove('active');
  signupForm.classList.remove('hide');
  loginForm.classList.add('hide');
  clearError();
});

// 이미 로그인된 상태면 바로 대시보드로
auth.onAuthStateChanged(user => {
  if (user) window.location.href = 'dashboard.html';
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  const email = document.getElementById('loginEmail').value.trim();
  const pw = document.getElementById('loginPw').value;
  try {
    await auth.signInWithEmailAndPassword(email, pw);
    window.location.href = 'dashboard.html';
  } catch (err) {
    showError('이메일 또는 비밀번호가 올바르지 않아요.');
  }
});

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  const name = document.getElementById('suName').value.trim();
  const position = document.getElementById('suPosition').value.trim();
  const email = document.getElementById('suEmail').value.trim();
  const pw = document.getElementById('suPw').value;
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, pw);
    await db.collection('users').doc(cred.user.uid).set({
      name, position, email, phone: '',
      role: 'staff', // 최초 관리자는 Firebase 콘솔에서 'admin'으로 수동 변경 (README 3단계)
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    window.location.href = 'dashboard.html';
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') showError('이미 가입된 이메일이에요.');
    else if (err.code === 'auth/weak-password') showError('비밀번호는 6자 이상이어야 해요.');
    else showError('가입 중 오류가 발생했어요: ' + err.message);
  }
});
