import {
  auth, db,
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  updateProfile, doc, setDoc
} from "./firebase-init.js";

// 단일 지점 운영이므로 지점 정보를 고정값으로 사용합니다.
const BRANCH_ID = "byeollae";
const BRANCH_NAME = "별내점";

// 이미 로그인되어 있으면 대시보드로 이동
onAuthStateChanged(auth, (user) => {
  if (user) window.location.href = "dashboard.html";
});

// 탭 전환
const tabLogin = document.getElementById("tabLogin");
const tabSignup = document.getElementById("tabSignup");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

tabLogin.onclick = () => {
  tabLogin.classList.add("active");
  tabSignup.classList.remove("active");
  loginForm.style.display = "block";
  signupForm.style.display = "none";
};
tabSignup.onclick = () => {
  tabSignup.classList.add("active");
  tabLogin.classList.remove("active");
  signupForm.style.display = "block";
  loginForm.style.display = "none";
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
