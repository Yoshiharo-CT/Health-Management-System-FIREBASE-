// ==============================
// ELEMENTS
// ==============================
const container = document.querySelector('.container');
const registerToggleBtn = document.getElementById('register-btn');
const loginToggleBtn = document.getElementById('login-btn');

const registerForm = document.querySelector('#registerBox form');
const loginForm = document.querySelector('#loginBox form');

const passwordInput = document.getElementById('passwordInput');
const confirmpasswordInput = document.getElementById('confirmpasswordInput');
const togglePassword = document.getElementById('togglePassword');
const togglePassword_1 = document.getElementById('togglePassword_1');

// Pages
const allPages = {
    homePage: document.getElementById('homePage'),
    dashboardPage: document.getElementById('dashboardPage'),
    patientDashboardPage: document.getElementById('patientdashboardPage'),
    doctorDashboardPage: document.getElementById('doctordashboardPage'),
    appointmentPage: document.getElementById('appointmentPage'),
    settingsPage: document.getElementById('settingsPage')
};

// Sidebar navigation
const dashboardHolder_1 = document.querySelector('.home-nav-dashboard-holder_1');
const dashboardHolder_2 = document.querySelector('.home-nav-dashboard-holder_2');
const dashboardMain = document.querySelector('.dashboard-main');

// ==============================
// FIREBASE IMPORTS & CONFIG
// ==============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

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
// HELPER: SHOW PAGE FUNCTION
// ==============================
function showPage(pageId) {
    Object.values(allPages).forEach(page => page.style.display = 'none');
    if (allPages[pageId]) allPages[pageId].style.display = 'flex';
}

// ==============================
// REDIRECT FUNCTION
// ==============================
async function redirectDashboard(user) {
    try {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (!docSnap.exists()) return;

        const role = docSnap.data().role.toLowerCase();

        // Hide login/register container
        container.style.display = 'none';

        // Hide all pages first
        Object.values(allPages).forEach(page => page.style.display = 'none');

        // Show the home page 
        showPage('homePage');        // Everyone sees Home first

        // Show role-specific dashboards if needed
        if (role === 'patient') {
            allPages.patientDashboardPage.style.display = 'none'; // start hidden
            allPages.doctorDashboardPage.style.display = 'none';
        } else if (role === 'doctor') {
            allPages.patientDashboardPage.style.display = 'none';
            allPages.doctorDashboardPage.style.display = 'none';
        } else if (role === 'staff') {
            allPages.patientDashboardPage.style.display = 'none';
            allPages.doctorDashboardPage.style.display = 'none';
        } else {
            alert("Unknown role. Cannot access.");
            container.style.display = 'block';
        }

    } catch (error) {
        console.error("Redirect Error:", error);
        alert("An error occurred during redirect. Try again.");
        container.style.display = 'block';
    }
}

// ==============================
// REGISTER USER
// ==============================
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstname = document.getElementById("firstnameInput").value.trim();
    const lastname = document.getElementById("lastanameInput").value.trim(); // matches your typo
    const email = document.getElementById("emailInput").value.trim();

    const username = registerForm.querySelectorAll("#usernameInput")[0].value.trim();
    const password = registerForm.querySelector("#passwordInput").value.trim();
    const confirmpassword = document.getElementById("confirmpasswordInput").value.trim();
    const role = registerForm.querySelector("#role").value;

    if (!firstname || !lastname || !email || !username || !password || !role) {
        alert("Please fill all required fields.");
        return;
    }

    if (password !== confirmpassword) {
        alert("Passwords do not match!");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
            firstname,
            lastname,
            username,
            email,
            role,
            createdAt: new Date()
        });

        alert("Registration Successful!");
        registerForm.reset();
        container.classList.remove('active');

    } catch (error) {
        alert(error.message);
    }
});

// ==============================
// LOGIN USER
// ==============================
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = loginForm.querySelector("#usernameInput").value.trim();
    const password = loginForm.querySelector("#passwordInput").value.trim();
    const role = loginForm.querySelector("#role").value;

    if (!username || !password || !role) {
        alert("Enter your credentials and select role.");
        return;
    }

    try {
        // Firebase requires EMAIL for login
        const userCredential = await signInWithEmailAndPassword(auth, username, password);
        const user = userCredential.user;

        const docSnap = await getDoc(doc(db, "users", user.uid));

        if (docSnap.exists() && docSnap.data().role.toLowerCase() === role.toLowerCase()) {
            redirectDashboard(user);
        } else {
            alert("Role does not match registered user.");
        }

    } catch (error) {
        alert(error.message);
    }
});

// ==============================
// TOGGLE PASSWORD VISIBILITY
// ==============================
togglePassword.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    togglePassword.classList.toggle('fa-eye');
    togglePassword.classList.toggle('fa-eye-slash');
});

togglePassword_1.addEventListener('click', () => {
    const type = confirmpasswordInput.type === 'password' ? 'text' : 'password';
    confirmpasswordInput.type = type;
    togglePassword_1.classList.toggle('fa-eye');
    togglePassword_1.classList.toggle('fa-eye-slash');
});

// ==============================
// TOGGLE LOGIN / REGISTER
// ==============================
registerToggleBtn.addEventListener('click', () => {
    container.classList.add('active');
    registerForm.reset();
});

loginToggleBtn.addEventListener('click', () => {
    container.classList.remove('active');
    loginForm.reset();
});

// ==============================
// DASHBOARD NAVIGATION
// ==============================
dashboardHolder_1.addEventListener('click', () => {
    dashboardMain.style.display = 'none';
    allPages.patientDashboardPage.style.display = 'block';
    allPages.doctorDashboardPage.style.display = 'none';
});

dashboardHolder_2.addEventListener('click', () => {
    dashboardMain.style.display = 'none';
    allPages.patientDashboardPage.style.display = 'none';
    allPages.doctorDashboardPage.style.display = 'block';
});

// DASHBOARD MAIN BUTTON
document.querySelector('#dashboardPage .fa-chart-line').parentElement.addEventListener('click', () => {
    dashboardMain.style.display = 'block';
    allPages.patientDashboardPage.style.display = 'none';
    allPages.doctorDashboardPage.style.display = 'none';
});

// NAVIGATION: Home / Dashboard / Appointment / Settings
document.querySelectorAll('.home-nav-item').forEach(btn => {
    btn.addEventListener('click', function () {
        const text = this.innerText.trim().toLowerCase();
        if (text.includes('home')) showPage('homePage');
        else if (text.includes('dashboard')) showPage('dashboardPage');
        else if (text.includes('appointment')) showPage('appointmentPage');
        else if (text.includes('settings')) showPage('settingsPage');
    });
});

// LOGOUT BUTTON
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-outline') || e.target.innerText === 'Logout') {
        Object.values(allPages).forEach(page => page.style.display = 'none');
        container.style.display = 'block';
        container.classList.remove('active');
    }
});
