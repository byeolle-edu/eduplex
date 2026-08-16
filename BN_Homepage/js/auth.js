import {
  auth, db,
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  updateProfile, doc, setDoc, updatePassword
} from "./firebase-init.js";

// 단일 지점 운영이므로 지점 정보를 고정값으로 사용합니다.
const BRANCH_ID = "byeollae";
const BRANCH_NAME = "별내점";

// 비밀번호 변경 화면으로 전환할 때는 로그인 성공해도 자동으로 대시보드로 넘어가지 않게 막습니다.
let skipAutoRedirect = false;

// 이미 로그인되어 있으면 대시보드로 이동
onAuthStateChanged(auth, (user) => {
  if (user && !skipAutoRedirect) window.location.href = "dashboard.html";
});

// 탭 전환
const tabLogin = document.getElementById("tabLogin");
const tabSignup = document.getElementById("tabSignup");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const forgotPwLink = document.getElementById("forgotPwLink");
const pwChangeForm = document.getElementById("pwChangeForm");
const backToLoginLink = document.getElementById("backToLoginLink");

function showOnly(formToShow) {
  [loginForm, signupForm, pwChangeForm].forEach(f => { f.style.display = f === formToShow ? "block" : "none"; });
}

forgotPwLink.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("pwChangeEmail").value = document.getElementById("loginEmail").value.trim();
  showOnly(pwChangeForm);
  tabLogin.classList.remove("active");
  tabSignup.classList.remove("active");
});

backToLoginLink.addEventListener("click", (e) => {
  e.preventDefault();
  showOnly(loginForm);
  tabLogin.classList.add("active");
});

pwChangeForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("pwChangeEmail").value.trim();
  const currentPassword = document.getElementById("pwChangeCurrent").value;
  const newPassword = document.getElementById("pwChangeNew").value;
  const errEl = document.getElementById("pwChangeError");
  errEl.textContent = "";
  skipAutoRedirect = true;
  try {
    const cred = await signInWithEmailAndPassword(auth, email, currentPassword);
    await updatePassword(cred.user, newPassword);
    alert("비밀번호가 변경되었어요. 이제 대시보드로 이동할게요.");
    skipAutoRedirect = false;
    window.location.href = "dashboard.html";
  } catch (err) {
    skipAutoRedirect = false;
    if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
      errEl.textContent = "이메일 또는 현재 비밀번호가 올바르지 않습니다.";
    } else if (err.code === "auth/user-not-found") {
      errEl.textContent = "가입된 이메일을 찾을 수 없어요.";
    } else if (err.code === "auth/weak-password") {
      errEl.textContent = "새 비밀번호는 6자 이상이어야 합니다.";
    } else {
      errEl.textContent = "변경 중 오류가 발생했어요: " + err.message;
    }
  }
});

tabLogin.onclick = () => {
  tabLogin.classList.add("active");
  tabSignup.classList.remove("active");
  showOnly(loginForm);
};
tabSignup.onclick = () => {
  tabSignup.classList.add("active");
  tabLogin.classList.remove("active");
  showOnly(signupForm);
};

// 로그인
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const errEl = document.getElementById("loginError");
  errEl.textContent = "";
  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "dashboard.html";
  } catch (err) {
    errEl.textContent = "이메일 또는 비밀번호가 올바르지 않습니다.";
  }
});

// 회원가입
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("suName").value.trim();
  const email = document.getElementById("suEmail").value.trim();
  const password = document.getElementById("suPassword").value;
  const errEl = document.getElementById("signupError");
  errEl.textContent = "";

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    // 기본 role은 'member'. 팀장(관리자) 계정은 Firebase 콘솔에서 role 값을 'leader'로 수동 변경합니다.
    await setDoc(doc(db, "users", cred.user.uid), {
      name, email,
      branchId: BRANCH_ID,
      branchName: BRANCH_NAME,
      role: "member",
      createdAt: new Date().toISOString()
    });
    window.location.href = "dashboard.html";
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      errEl.textContent = "이미 가입된 이메일입니다.";
    } else if (err.code === "auth/weak-password") {
      errEl.textContent = "비밀번호는 6자 이상이어야 합니다.";
    } else {
      errEl.textContent = "회원가입 중 오류가 발생했습니다: " + err.message;
    }
  }
});
