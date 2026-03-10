// ==============================
// HEALTH MANAGEMENT SYSTEM 
// ==============================

// ==============================
// HELPERS
// ==============================
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ==============================
// CUSTOM ALERT
// ==============================
function showAlert(msg) {
  const alertBox = document.getElementById("customAlert");
  const alertMsg = document.getElementById("customAlertMessage");
  const closeBtn = document.getElementById("customAlertClose");

  if (!alertBox || !alertMsg) return alert(msg);

  alertMsg.textContent = msg;

  alertBox.style.display = "flex";
  alertBox.style.opacity = "1";
  alertBox.style.transform = "translateX(-50%) scale(1)";
  alertBox.style.pointerEvents = "auto";

  clearTimeout(alertBox._timeout);
  alertBox._timeout = setTimeout(() => {
    closeCustomAlert();
  }, 3000);

  closeBtn?.addEventListener("click", closeCustomAlert);
}

function closeCustomAlert() {
  const alertBox = document.getElementById("customAlert");
  if (!alertBox) return;

  alertBox.style.opacity = "0";
  alertBox.style.transform = "translateX(-50%) scale(0)";
  alertBox.style.pointerEvents = "none";

  setTimeout(() => {
    alertBox.style.display = "none";
  }, 300);
}

function setAppLayout(isInApp) {
  if (isInApp) {
    document.body.style.justifyContent = "flex-start";
    document.body.style.alignItems = "stretch";
    document.body.style.overflow = "auto";
    document.body.style.minHeight = "100vh";
  } else {
    document.body.style.justifyContent = "center";
    document.body.style.alignItems = "center";
    document.body.style.overflow = "hidden";
    document.body.style.minHeight = "100vh";
  }
}

function hideEl(el) {
  if (el) el.style.display = "none";
}
function showEl(el, display = "flex") {
  if (el) el.style.display = display;
}

// ==============================
// ELEMENTS / PAGES
// ==============================
const container = document.querySelector(".container");

const registerToggleBtn = document.getElementById("register-btn");
const loginToggleBtn = document.getElementById("login-btn");

const registerForm = document.querySelector("#registerBox form");
const loginForm = document.getElementById("loginForm");

const allPages = {
  homePage: document.getElementById("homePage"),
  dashboardPage: document.getElementById("dashboardPage"),
  patientDashboardPage: document.getElementById("patientdashboardPage"),
  doctorDashboardPage: document.getElementById("doctordashboardPage"),
  staffDashboardPage: document.getElementById("staffdashboardPage"),
  appointmentPage: document.getElementById("appointmentPage"),
  settingsPage: document.getElementById("settingsPage"),
};

const dashboardHolder_1 = document.querySelector(".home-nav-dashboard-holder_1");
const dashboardHolder_2 = document.querySelector(".home-nav-dashboard-holder_2");
const dashboardHolder_3 = document.querySelector(".home-nav-dashboard-holder_3");

const dashboardMain = document.querySelector(".dashboard-main");

function hideAllPages() {
  Object.values(allPages).forEach((p) => hideEl(p));
}

function showOnly(pageKey) {
  hideAllPages();

  if (pageKey === "auth") {
    setAppLayout(false);
    showEl(container, "flex");
    return;
  }

  setAppLayout(true);
  hideEl(container);

  const page = allPages[pageKey];
  showEl(page, "flex");
}

// ==============================
// DASHBOARD MAIN/SUB
// ==============================
function hideAllSubDashboards() {
  hideEl(allPages.patientDashboardPage);
  hideEl(allPages.doctorDashboardPage);
  hideEl(allPages.staffDashboardPage);
}

function showDashboardMainOnly() {
  showOnly("dashboardPage");
  showEl(dashboardMain, "block");
  hideAllSubDashboards();
}

function showSubDashboard(subDashboard) {
  showOnly("dashboardPage");
  hideEl(dashboardMain);
  hideAllSubDashboards();
  showEl(subDashboard, "block");
}

$("#homeBtnDash")?.addEventListener("click", () => showDashboardMainOnly());
$("#dashBtnApp")?.addEventListener("click", () => showDashboardMainOnly());
$("#dashBtnSett")?.addEventListener("click", () => showDashboardMainOnly());
$(".home-nav-item.active")?.addEventListener("click", () => showDashboardMainOnly());

dashboardHolder_1?.addEventListener("click", async () => {
  showSubDashboard(allPages.patientDashboardPage);
  await loadPatients();
});

dashboardHolder_2?.addEventListener("click", () => {
  showSubDashboard(allPages.doctorDashboardPage);
});

dashboardHolder_3?.addEventListener("click", async () => {
  showSubDashboard(allPages.staffDashboardPage);
  await safeLoadDashboardCounts();
});

// ==============================
// FIREBASE IMPORTS & CONFIG
// ==============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  addDoc,
  getDocs,
  collection,
  query,
  where,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBFyEuwRF0SBfF9FLqjGON8J-rSh1FeyT8",
  authDomain: "health-management-system-8397d.firebaseapp.com",
  projectId: "health-management-system-8397d",
  storageBucket: "health-management-system-8397d.firebasestorage.app",
  messagingSenderId: "85560894642",
  appId: "1:85560894642:web:7c81024f0c15e129ddd5ab"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==============================
// CAPTCHA (YOUR HTML IDS MATCH)
// ==============================
let captchaNum1 = 0;
let captchaNum2 = 0;

function generateCaptcha() {
  const questionEl = document.getElementById("captchaQuestion");
  const answerInput = document.getElementById("captchaAnswer");

  captchaNum1 = Math.floor(Math.random() * 50) + 1;
  captchaNum2 = Math.floor(Math.random() * 50) + 1;

  if (questionEl) questionEl.textContent = `What is ${captchaNum1} + ${captchaNum2}?`;
  if (answerInput) answerInput.value = "";
}

function captchaOk() {
  const answerInput = document.getElementById("captchaAnswer");
  const answer = parseInt((answerInput?.value || "").trim(), 10);
  return Number.isFinite(answer) && answer === captchaNum1 + captchaNum2;
}

// ==============================
// WELCOME NAME
// ==============================
async function updateWelcomeName(user) {
  const welcomeEl = document.getElementById("welcomeTitle");
  if (!welcomeEl) return;

  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) return;

    const data = snap.data();
    const name =
      data.username ||
      `${data.firstname || ""} ${data.lastname || ""}`.trim() ||
      "User";

    welcomeEl.textContent = `Welcome back, ${name}!`;
  } catch (e) {
    console.error(e);
  }
}

// ==============================
// AUTH ROUTING
// ==============================
let currentUser = null;

async function routeAfterAuth(user) {

  currentUser = user;

  if (!user) {
    showOnly("auth");
    generateCaptcha();
    return;
  }

  try {
    const snap = await getDoc(doc(db, "users", user.uid));

    if (!snap.exists()) {
      showOnly("homePage");
      return;
    }

    updateWelcomeName(user);

    const userData = snap.data();

    const role = (userData.role || "").toLowerCase();

    if (role === "doctor") {
      showOnly("homePage");
      wireDoctorDashboard();
      return;
    }

    showOnly("homePage");

  } catch (err) {

    showOnly("homePage");
  }
}


onAuthStateChanged(auth, (user) => {
  routeAfterAuth(user);
});

function applyRoleUI(role) {
  const r = (role || "").toLowerCase();

  if (dashboardHolder_1) dashboardHolder_1.style.display = "none";
  if (dashboardHolder_2) dashboardHolder_2.style.display = "none";
  if (dashboardHolder_3) dashboardHolder_3.style.display = "none";

  if (r === "patient") dashboardHolder_1.style.display = "block";
  if (r === "doctor") dashboardHolder_2.style.display = "block";
  if (r === "staff") dashboardHolder_3.style.display = "block";
}

// ==============================
// TOGGLE PASSWORD VISIBILITY
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  const passwordInput = document.getElementById('loginPassword');
  const confirmpasswordInput = document.getElementById('confirmpasswordInput');
  const toggleLoginPassword = document.getElementById('toggleLoginPassword');
  const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');

  // toggle login password
  toggleLoginPassword.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    toggleLoginPassword.classList.toggle('fa-eye');
    toggleLoginPassword.classList.toggle('fa-eye-slash');
  });

  // toggle confirm password
  toggleConfirmPassword.addEventListener('click', () => {
    const type = confirmpasswordInput.type === 'password' ? 'text' : 'password';
    confirmpasswordInput.type = type;
    toggleConfirmPassword.classList.toggle('fa-eye');
    toggleConfirmPassword.classList.toggle('fa-eye-slash');
  });
});

// ==============================
// REGISTER
// ==============================
registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const firstname = (document.getElementById("firstnameInput")?.value || "").trim();
  const lastname = (document.getElementById("lastanameInput")?.value || "").trim();
  const email = (document.getElementById("emailInput")?.value || "").trim();
  const username = (document.getElementById("usernameInput")?.value || "").trim();
  const password = (document.getElementById("passwordInput")?.value || "").trim();
  const confirm = (document.getElementById("confirmpasswordInput")?.value || "").trim();
  const role = document.getElementById("role")?.value;

  if (!firstname || !lastname || !email || !username || !password || !confirm || !role) {
    showAlert("Please fill all fields!");
    return;
  }
  if (password !== confirm) {
    showAlert("Passwords do not match!");
    return;
  }

  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);

    try {
      await setDoc(doc(db, "users", userCred.user.uid), {
        firstname,
        lastname,
        username,
        email,
        role: role.toLowerCase(),
        createdAt: serverTimestamp()
      });

      showAlert("Registration successful!");
      registerForm.reset();
      container?.classList.remove("active");
      generateCaptcha();
    } catch (err) {
      showAlert(err.message);
    }
  } catch (authError) {
    showCustomAlert(authError.message);
  }
});

// ==============================
// LOGIN
// ==============================
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!captchaNum1 || !captchaNum2) generateCaptcha();

  if (!captchaOk()) {
    showAlert("Incorrect verification. Try again.");
    generateCaptcha();
    return;
  }

  const email = (document.getElementById("loginEmail")?.value || "").trim();
  const password = (document.getElementById("loginPassword")?.value || "").trim();
  const role = document.getElementById("loginRole")?.value;

  if (!email || !password || !role) {
    showAlert("Enter credentials and select role.");
    generateCaptcha();
    return;
  }

  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const user = userCred.user;

    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) {
      showAlert("Profile not found.");
      await signOut(auth);
      generateCaptcha();
      return;
    }

    const savedRole = (snap.data().role || "").toLowerCase();
    if (savedRole !== role.toLowerCase()) {
      showAlert("Role does not match registered user.");
      await signOut(auth);
      generateCaptcha();
      return;
    }

    // onAuthStateChanged will redirect
  } catch (err) {
    showAlert(err.message);
    generateCaptcha();
  }
});

// ==============================
// TOGGLE LOGIN / REGISTER
// ==============================
registerToggleBtn?.addEventListener("click", () => {
  container?.classList.add("active");
  registerForm?.reset();
});
loginToggleBtn?.addEventListener("click", () => {
  container?.classList.remove("active");
  loginForm?.reset();
  generateCaptcha();
});

// ==============================
// RESET PASSWORD SETUP
// ==============================
const forgotLink = document.getElementById("resetEmail");
const resetBox = document.getElementById("resetBox");
const resetEmailInput = document.getElementById("resetEmailInput");
const resetBtn = document.getElementById("resetBtn");
const cancelResetBtn = document.getElementById("cancelResetBtn");

// OTP Elements
const otpPage = document.getElementById("otpPage");
const otpInputs = document.querySelectorAll(".otp-input");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const closeOtpBtn = document.getElementById("closeOtpBtn");
const countdownEl = document.getElementById("countdown");

// OTP Variables
let generatedOTP = null;
let otpExpiresAt = 0;
let otpTimerInterval = null;
let pendingResetEmail = null;
let otpAttempts = 0;

const MAX_ATTEMPTS = 3;

// Open reset box
forgotLink?.addEventListener("click", function (e) {
  e.preventDefault();
  showEl(resetBox, "block");
});

// Cancel reset
cancelResetBtn?.addEventListener("click", function () {
  hideEl(resetBox);
  resetEmailInput.value = "";
});

resetBtn?.addEventListener("click", function () {

  const email = resetEmailInput.value.trim();

  if (!email) {
    return showAlert("Please enter your registered email.");
  }

  pendingResetEmail = email;
  startOTPVerification(email);

});

function generateOTP() {

  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let otp = "";

  for (let i = 0; i < 6; i++) {
    otp += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return otp;
}

function startOTPVerification(email) {

  generatedOTP = generateOTP();
  otpExpiresAt = Date.now() + 15 * 60 * 1000;
  otpAttempts = 0;

  otpInputs.forEach(input => input.value = "");

  const expireTime = new Date(otpExpiresAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

  emailjs.send("service_j71aiur", "template_062tqku", {
    user_email: email,
    passcode: generatedOTP,
    time: expireTime
  })
    .then(() => {

      showEl(otpPage);
      startOtpCountdown(900);

      showAlert("OTP sent to your email.");

    })
    .catch(err => {

      console.error(err);
      showAlert("Failed to send OTP.");

    });
}

function startOtpCountdown(duration = 900) {

  clearInterval(otpTimerInterval);
  let remaining = duration;

  otpTimerInterval = setInterval(() => {

    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;

    countdownEl.textContent =
      `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    if (remaining <= 0) {

      clearInterval(otpTimerInterval);
      generatedOTP = null;

      showAlert("OTP expired.");
      hideEl(otpPage);

    }
    remaining--;
  }, 1000);
}

verifyOtpBtn?.addEventListener("click", () => {

  let entered = "";

  otpInputs.forEach(input => {
    entered += input.value;
  });

  entered = entered.toUpperCase();

  if (!generatedOTP) {
    return showAlert("No OTP generated.");
  }

  if (Date.now() > otpExpiresAt) {

    showAlert("OTP expired.");

    hideEl(otpPage);
    generatedOTP = null;

    return;
  }

  if (entered !== generatedOTP) {

    otpAttempts++;

    if (otpAttempts >= MAX_ATTEMPTS) {

      clearInterval(otpTimerInterval);
      generatedOTP = null;

      showAlert("Too many failed attempts.");
      hideEl(otpPage);

      return;
    }
    return showAlert(`Incorrect OTP (${otpAttempts}/${MAX_ATTEMPTS})`);
  }

  // OTP SUCCESS
  clearInterval(otpTimerInterval);

  showAlert("OTP Verified Successfully!");
  hideEl(otpPage);

  generatedOTP = null;
  sendResetLink();
});

function sendResetLink() {

  if (!pendingResetEmail) return;

  sendPasswordResetEmail(auth, pendingResetEmail)
    .then(() => {

      showAlert("Password reset link sent to your email.");
      hideEl(resetBox);

      resetEmailInput.value = "";
      pendingResetEmail = null;
    })
    .catch(err => {

      console.error(err);
      showAlert("Failed to send reset email.");
    });
}

closeOtpBtn?.addEventListener("click", () => {

  clearInterval(otpTimerInterval);
  generatedOTP = null;

  otpInputs.forEach(input => input.value = "");
  hideEl(otpPage);
});

otpInputs.forEach((input, index) => {

  input.addEventListener("input", () => {

    input.value = input.value.toUpperCase();

    if (input.value && index < otpInputs.length - 1) {
      otpInputs[index + 1].focus();
    }
  });

  input.addEventListener("keydown", (e) => {

    if (e.key === "Backspace" && !input.value && index > 0) {
      otpInputs[index - 1].focus();
    }
  });
});

emailjs.init("SIVcava9SobqWt4T7");

// ==============================
// NAVIGATION (WIRED ONCE)
// ==============================
let navWired = false;

async function goAppointmentPage() {
  showOnly("appointmentPage");
  await populateDoctorDropdown();
  await loadAppointments();
}

function wireNav() {
  if (navWired) return;
  navWired = true;

  // Dashboard sidebar
  $("#homeBtnDash")?.addEventListener("click", () => showOnly("homePage"));
  $("#appointmentBtnDash")?.addEventListener("click", goAppointmentPage);
  $("#settingsBtnDash")?.addEventListener("click", () => showOnly("settingsPage"));

  // Appointment sidebar
  $("#homeBtnApp")?.addEventListener("click", () => showOnly("homePage"));
  $("#dashBtnApp")?.addEventListener("click", () => showOnly("dashboardPage"));
  $("#settingsBtnApp")?.addEventListener("click", () => showOnly("settingsPage"));

  // Settings sidebar
  $("#homeBtnSett")?.addEventListener("click", () => showOnly("homePage"));
  $("#dashBtnSett")?.addEventListener("click", () => showOnly("dashboardPage"));
  $("#appBtnSett")?.addEventListener("click", goAppointmentPage);

  // Home sidebar nav (the ones without ids)
  const homeSidebar = allPages.homePage;
  if (homeSidebar) {
    $$(".home-nav-item", homeSidebar).forEach((btn) => {
      btn.addEventListener("click", async () => {
        const t = (btn.textContent || "").toLowerCase();
        if (t.includes("home")) showOnly("homePage");
        if (t.includes("dashboard")) showOnly("dashboardPage");
        if (t.includes("appointment")) await goAppointmentPage();
        if (t.includes("settings")) showOnly("settingsPage");
      });
    });
  }
}

// ==============================
// PATIENT DASHBOARD (SCOPED IDS SAFE)
// ==============================
async function loadPatients() {
  const page = allPages.patientDashboardPage;
  if (!page) return;

  const tbody = $("#patients-list", page);
  if (!tbody) return;

  tbody.innerHTML = "";

  const snap = await getDocs(collection(db, "patients_list"));
  const patients = [];
  snap.forEach((d) => {
    const data = d.data();
    if ((data.role || "").toLowerCase() === "patient") patients.push({ id: d.id, ...data });
  });

  patients.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  patients.forEach((p, i) => {
    const dt = p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000).toLocaleString() : "N/A";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${p.firstname || ""}</td>
      <td>${p.lastname || ""}</td>
      <td>${p.email || ""}</td>
      <td>${dt}</td>
    `;
    tbody.appendChild(tr);
  });

  const totalEl = document.getElementById("main-total-patients");
  if (totalEl) totalEl.textContent = String(patients.length);
}

let patientDashWired = false;
function wirePatientDashboard() {
  if (patientDashWired) return;
  patientDashWired = true;

  const page = allPages.patientDashboardPage;
  if (!page) return;

  const form = $("#add-patient-form", page);
  const tbody = $("#patients-list", page);

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const firstname = ($("#patient-firstname", page)?.value || "").trim();
    const lastname = ($("#patient-lastname", page)?.value || "").trim();
    const email = ($("#patient-email", page)?.value || "").trim().toLowerCase();

    if (!firstname || !lastname || !email) return showAlert("Fill all fields.");

    // Duplicate check
    const snap = await getDocs(collection(db, "patients_list"));
    let exists = false;
    snap.forEach((d) => {
      const data = d.data();
      if ((data.email || "").trim().toLowerCase() === email) exists = true;
    });
    if (exists) return showAlert("This patient already exists.");

    await addDoc(collection(db, "patients_list"), {
      firstname,
      lastname,
      email,
      role: "patient",
      createdAt: serverTimestamp(),
    });

    showAlert("Patient added!");
    form.reset();
    await loadPatients();
  });

  // Patient search controls (these exist only on patient dashboard form)
  const searchInput = $("#search-input", page);
  const searchBtn = $("#search-btn", page);
  const resetBtn = $("#reset-btn", page);

  searchBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    const val = (searchInput?.value || "").trim().toLowerCase();
    if (!val) return showAlert("Enter something to search.");

    if (!tbody) return;
    tbody.innerHTML = "";

    const snap = await getDocs(collection(db, "patients_list"));
    const filtered = [];
    snap.forEach((d) => {
      const data = d.data();
      const f = (data.firstname || "").toLowerCase();
      const l = (data.lastname || "").toLowerCase();
      const em = (data.email || "").toLowerCase();
      if (f.includes(val) || l.includes(val) || em.includes(val)) filtered.push({ id: d.id, ...data });
    });

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="5">No patient found.</td></tr>`;
      return;
    }

    filtered.forEach((p, i) => {
      const dt = p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000).toLocaleString() : "N/A";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${p.firstname || ""}</td>
        <td>${p.lastname || ""}</td>
        <td>${p.email || ""}</td>
        <td>${dt}</td>
      `;
      tbody.appendChild(tr);
    });
  });

  resetBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    if (searchInput) searchInput.value = "";
    await loadPatients();
  });
}

// ==============================
// CREATE PRESCRIPTION
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  // Get elements
  const createPrescriptionBtn = document.getElementById("createPrescriptionBtn");
  const prescriptionPage = document.getElementById("prescriptionPage");
  const prescriptionBackBtn = document.getElementById("prescriptionBackBtn");

  // Safety check
  if (!createPrescriptionBtn || !prescriptionPage || !prescriptionBackBtn) {
    console.error("One or more elements not found!");
    return;
  }

  // Show prescription page when "Create Prescription" is clicked
  createPrescriptionBtn.addEventListener("click", () => {
    prescriptionPage.style.display = "block";
  });

  // Hide prescription page when "Back" button is clicked
  prescriptionBackBtn.addEventListener("click", () => {
    prescriptionPage.style.display = "none";

    // Optional: clear all input fields when going back
    prescriptionPage.querySelectorAll("input, textarea").forEach(el => {
      el.value = "";
    });
  });
});

// ==============================
// APPOINTMENTS (USES CORRECT APPOINTMENT SEARCH IDS)
// ==============================
async function populateDoctorDropdown() {
  const page = allPages.appointmentPage;
  if (!page) return;

  const select = $("#rxDoctorSelect", page);
  if (!select) return;

  select.innerHTML = `<option value="">Select Doctor</option>`;

  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("role", "==", "doctor"));
    const snap = await getDocs(q);

    snap.forEach((d) => {
      const data = d.data();
      const name =
        `${data.firstname || ""} ${data.lastname || ""}`.trim() ||
        data.username ||
        "Doctor";

      const opt = document.createElement("option");
      opt.value = d.id;
      opt.textContent = name;
      select.appendChild(opt);
    });

    const test = document.createElement("option");
    test.value = "manual_test_doctor";
    test.textContent = "Dr. Test";
    select.appendChild(test);
  } catch (e) {
    console.error(e);
  }
}

function formatApptDateTime(appt) {
  if (appt.date && appt.time) {
    const dt = new Date(`${appt.date}T${appt.time}`);
    if (!isNaN(dt.getTime())) return dt.toLocaleString();
  }
  if (appt.createdAt?.seconds) return new Date(appt.createdAt.seconds * 1000).toLocaleString();
  return "N/A";
}

function renderAppointmentRow(appt, i) {
  const page = allPages.appointmentPage;
  if (!page) return;

  const tbody = $("#appointment-list", page);
  if (!tbody) return;

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${i}</td>
    <td>${(appt.firstname || "")} ${(appt.lastname || "")}</td>
    <td>${appt.email || ""}</td>
    <td>${formatApptDateTime(appt)}</td>
    <td>${appt.doctorName || "N/A"}</td>
    <td>
      <select class="appt-status-dropdown" data-id="${appt.id}">
        <option value="Pending" ${appt.status === "Pending" ? "selected" : ""}>Pending</option>
        <option value="In Process" ${appt.status === "In Process" ? "selected" : ""}>In Process</option>
        <option value="Completed" ${appt.status === "Completed" ? "selected" : ""}>Completed</option>
      </select>
    </td>
  `;
  tbody.appendChild(tr);

  // Attach event listener directly to this row's dropdown
  const statusDropdown = tr.querySelector(".appt-status-dropdown");
  statusDropdown.addEventListener("change", async (e) => {
    const newStatus = e.target.value;
    const apptId = e.target.dataset.id;

    try {
      // Update status in Firebase
      await updateDoc(doc(db, "appointments", apptId), { status: newStatus });

      // Optionally update dashboard counts without reloading table
      await safeLoadDashboardCounts();

      showAlert(`Appointment status updated to "${newStatus}"`);
    } catch (err) {
      console.error(err);
      showAlert("Failed to update appointment status.");
    }
  });
}


function updateAppointmentStats(appointments) {
  const totalEl = document.getElementById("total-count");
  const todayEl = document.getElementById("today-count");
  const pendingEl = document.getElementById("pending-count");
  const completedEl = document.getElementById("completed-count");

  const total = appointments.length;
  const todayStr = new Date().toISOString().slice(0, 10);

  const todayCount = appointments.filter((a) => a.date === todayStr).length;
  const pendingCount = appointments.filter((a) => (a.status || "Pending").toLowerCase() === "pending").length;
  const completedCount = appointments.filter((a) => (a.status || "").toLowerCase() === "completed").length;

  if (totalEl) totalEl.textContent = String(total);
  if (todayEl) todayEl.textContent = String(todayCount);
  if (pendingEl) pendingEl.textContent = String(pendingCount);
  if (completedEl) completedEl.textContent = String(completedCount);

  const dashTotal = document.getElementById("main-total-appointments");
  if (dashTotal) dashTotal.textContent = String(total);
}

async function loadAppointments() {
  const page = allPages.appointmentPage;
  if (!page) return;

  const tbody = $("#appointment-list", page);
  if (!tbody) return;

  tbody.innerHTML = "";

  const snap = await getDocs(collection(db, "appointments"));
  const list = [];
  snap.forEach((d) => list.push({ id: d.id, ...d.data() }));

  list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  list.forEach((appt, idx) => renderAppointmentRow(appt, idx + 1));
  updateAppointmentStats(list);
}

let appointmentWired = false;
function wireAppointmentPage() {
  if (appointmentWired) return;
  appointmentWired = true;

  const page = allPages.appointmentPage;
  if (!page) return;

  const form = $("#add-appointment-form", page);
  const select = $("#rxDoctorSelect", page);

  let saving = false;

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (saving) return;
    saving = true;

    const firstname = ($("#patient-firstname", page)?.value || "").trim();
    const lastname = ($("#patient-lastname", page)?.value || "").trim();
    const email = ($("#patient-email", page)?.value || "").trim();
    const contact = ($("#patient-contact", page)?.value || "").trim();
    const date = $("#appointment-date", page)?.value || "";
    const time = $("#appointment-time", page)?.value || "";

    if (!firstname || !lastname || !email || !contact || !date || !time) {
      showAlert("Please fill all fields.");
      saving = false;
      return;
    }

    if (!select || !select.value) {
      showAlert("Select doctor");
      saving = false;
      return;
    }

    const doctorName = select.options[select.selectedIndex]?.textContent || "Doctor";

    try {
      await addDoc(collection(db, "appointments"), {
        firstname,
        lastname,
        email,
        contact,
        date,
        time,
        doctorId: select.value,
        doctorName,
        status: "Pending",
        createdAt: serverTimestamp(),
      });
      // =============================
      // SEND EMAIL USING EMAILJS
      // =============================
      try {
        const appointmentDate = new Date(date);
        const formattedDate = appointmentDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric"
        });

        let formattedTime = time;
        if (time) {
          const [hours, minutes] = time.split(":");
          const timeObj = new Date();
          timeObj.setHours(hours, minutes);

          formattedTime = timeObj.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
          });
        }

        await emailjs.send(
          "service_j71aiur",
          "template_gz2refs",
          {
            to_email: email,
            patient_name: firstname + " " + lastname,
            doctor_name: doctorName,
            appointment_date: formattedDate,
            appointment_time: formattedTime,
          }
        );

        showAlert("Appointment added and confirmation email sent!");
      }
      catch (emailError) {
        console.error("Email error:", emailError);
        showAlert("Appointment saved, but email failed.");
      }

      form.reset();
      select.selectedIndex = 0;

      await loadAppointments();
      await safeLoadDashboardCounts();
    } catch (err) {
      console.error(err);
      showAlert("Error saving appointment.");
    } finally {
      saving = false;
    }
  });

  // Appointment search controls (USE YOUR APPOINTMENT IDs)
  const searchInput = $("#appointment-search-input", page);
  const searchBtn = $("#appointment-search-btn", page);
  const resetBtn = $("#appointment-reset-btn", page);

  searchBtn?.addEventListener("click", async () => {
    const val = (searchInput?.value || "").trim().toLowerCase();
    if (!val) return showAlert("Enter something to search.");

    const tbody = $("#appointment-list", page);
    if (!tbody) return;
    tbody.innerHTML = "";

    const snap = await getDocs(collection(db, "appointments"));
    const filtered = [];

    snap.forEach((d) => {
      const a = d.data();
      const name = `${a.firstname || ""} ${a.lastname || ""}`.toLowerCase();
      const em = (a.email || "").toLowerCase();
      const docName = (a.doctorName || "").toLowerCase();
      if (name.includes(val) || em.includes(val) || docName.includes(val)) {
        filtered.push({ id: d.id, ...a });
      }
    });

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="7">No appointment found.</td></tr>`;
      updateAppointmentStats([]);
      return;
    }

    filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    filtered.forEach((appt, idx) => renderAppointmentRow(appt, idx + 1));
    updateAppointmentStats(filtered);
  });

  resetBtn?.addEventListener("click", async () => {
    if (searchInput) searchInput.value = "";
    await loadAppointments();
  });
}

// ==============================
// LOGOUT
// ==============================
let logoutWired = false;
function wireLogout() {
  if (logoutWired) return;
  logoutWired = true;

  const settingsPage = allPages.settingsPage;
  if (!settingsPage) return;

  const logoutBtn = $(".btn-outline", settingsPage);
  logoutBtn?.addEventListener("click", async () => {
    try {
      await signOut(auth);
    } catch (e) { }

    currentUser = null;
    showOnly("auth");
    loginForm?.reset();
    registerForm?.reset();
    generateCaptcha();
  });
}

// ==============================
// DASHBOARD COUNTS
// ==============================
async function safeLoadDashboardCounts() {
  try {
    const apptSnap = await getDocs(collection(db, "appointments"));
    const appts = [];
    apptSnap.forEach((d) => appts.push(d.data()));
    const dashAppt = document.getElementById("main-total-appointments");
    if (dashAppt) dashAppt.textContent = String(appts.length);

    const patSnap = await getDocs(collection(db, "patients_list"));
    let pcount = 0;
    patSnap.forEach((d) => {
      if ((d.data().role || "").toLowerCase() === "patient") pcount++;
    });
    const dashPat = document.getElementById("main-total-patients");
    if (dashPat) dashPat.textContent = String(pcount);

    const usersRef = collection(db, "users");
    const qDocs = query(usersRef, where("role", "==", "doctor"));
    const docSnap = await getDocs(qDocs);
    const dashDoc = document.getElementById("main-total-doctors");
    if (dashDoc) dashDoc.textContent = String(docSnap.size);
  } catch (e) {
    console.error(e);
  }
}

// ==============================
// DOCTOR DASHBOARD APPOINTMENTS
// ==============================
let doctorDashboardWired = false;

async function loadDoctorDashboard() {

  if (!currentUser) return;

  const doctorId = currentUser.uid;

  const patientList = document.getElementById("doctor-patient-list");

  const totalPatientsEl = document.getElementById("doctor-total-patients");
  const todayAppointmentsEl = document.getElementById("doctor-today-appointments");
  const pendingRequestsEl = document.getElementById("doctor-pending-requests");

  if (!patientList) return;

  patientList.innerHTML = "";

  try {

    const snap = await getDocs(collection(db, "appointments"));

    const doctorAppointments = [];

    snap.forEach((d) => {
      const data = d.data();

      if (data.doctorId === doctorId) {
        doctorAppointments.push({
          id: d.id,
          ...data
        });
      }
    });

    // =========================
    // SORT NEWEST FIRST
    // =========================
    doctorAppointments.sort((a, b) =>
      (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    );

    let patientSet = new Set();
    let todayCount = 0;
    let pendingCount = 0;

    const todayStr = new Date().toISOString().slice(0, 10);

    doctorAppointments.forEach((appt, index) => {

      patientSet.add(appt.email);

      if (appt.date === todayStr) {
        todayCount++;
      }

      if ((appt.status || "").toLowerCase() === "pending") {
        pendingCount++;
      }

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${appt.firstname || ""}</td>
        <td>${appt.lastname || ""}</td>
        <td>${appt.email || ""}</td>
        <td>${appt.date || ""}</td>
      `;

      patientList.appendChild(tr);

    });

    // =========================
    // UPDATE DASHBOARD COUNTS
    // =========================
    if (totalPatientsEl) totalPatientsEl.textContent = patientSet.size;
    if (todayAppointmentsEl) todayAppointmentsEl.textContent = todayCount;
    if (pendingRequestsEl) pendingRequestsEl.textContent = pendingCount;

  } catch (err) {
    console.error("Doctor dashboard error:", err);
  }
}

// ==============================
// AUTO LOAD WHEN PAGE OPENS
// ==============================
function wireDoctorDashboard() {
  if (doctorDashboardWired) return;
  doctorDashboardWired = true;

  if (!currentUser) return;

  loadDoctorDashboard();
}

// ==============================
// INIT
// ==============================
function initOnce() {
  showOnly("auth");

  wireNav();
  wirePatientDashboard();
  wireAppointmentPage();
  wireLogout();

  generateCaptcha();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initOnce);
} else {
  initOnce();
}


