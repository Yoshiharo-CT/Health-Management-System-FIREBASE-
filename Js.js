// ==============================
// ELEMENTS
// ==============================
const container = document.querySelector('.container');
const registerToggleBtn = document.getElementById('register-btn');
const loginToggleBtn = document.getElementById('login-btn');

const registerForm = document.querySelector('#registerBox form');
const loginForm = document.querySelector('#loginBox form');

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
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, addDoc, getDocs, collection } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

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
// PAGE FUNCTION
// ==============================
function showPage(pageId) {
    Object.values(allPages).forEach(page => page.style.display = 'none');
    if (allPages[pageId]) allPages[pageId].style.display = 'flex';
}

async function updateWelcomeName(user) {
    const welcomeEl = document.getElementById("welcomeTitle");
    if (!welcomeEl) return;

    try {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (!docSnap.exists()) return;

        const { username } = docSnap.data();
        welcomeEl.textContent = `Welcome back, ${username}!`;
    } catch (err) {
        console.error("Welcome name error:", err);
    }
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
            showCustomAlert("Unknown role. Cannot access.");
            container.style.display = 'block';
        }

    } catch (error) {
        console.error("Redirect Error:", error);
        showCustomAlert("An error occurred during redirect. Try again.");
        container.style.display = 'block';
    }

    try {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (!docSnap.exists()) return;

        const role = docSnap.data().role.toLowerCase();

        container.style.display = 'none';
        showPage('homePage');

        // ✅ Update welcome message
        await updateWelcomeName(user);

    } catch (error) {
        console.error("Redirect Error:", error);
        container.style.display = 'block';
    }
    await updateWelcomeName(user);
}

// ==============================
// REMEMBER USER (AFTER LOGIN)
// ==============================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        container.style.display = 'none';

        const lastPage = localStorage.getItem('currentPage') || 'homePage';

        if (allPages[lastPage]) {
            showPage(lastPage);
        } else {
            showPage('homePage');
        }

        await redirectDashboard(user);

    } else {
        container.style.display = 'block';
    }
}); 


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
        showCustomAlert("Please fill all fields!");
        return;
    }

    if (password !== confirmpassword) {
        showCustomAlert("Passwords do not match!");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        try {
            await setDoc(doc(db, "users", user.uid), {
                firstname,
                lastname,
                username,
                email,
                role,
                password,
                createdAt: new Date()
            });

            showCustomAlert("Registration Successful!");
            registerForm.reset();
            container.classList.remove('active');
        } catch (firestoreError) {
            await user.delete();
            showCustomAlert("Registration failed: " + firestoreError.message);
        }
    } catch (authError) {
        showCustomAlert(authError.message);
    }

});

// ==============================
// CAPTCHA
// ==============================
let num1, num2;

function generateQuestion() {
    const questionEl = document.getElementById('question');
    const num1Input = document.getElementById('num1');
    const num2Input = document.getElementById('num2');
    const answerInput = document.getElementById('captcha-answer');
    const feedbackEl = document.getElementById('feedback');

    num1 = Math.floor(Math.random() * 50) + 1;
    num2 = Math.floor(Math.random() * 50) + 1;

    questionEl.textContent = `What is ${num1} + ${num2}?`;
    num1Input.value = num1;
    num2Input.value = num2;
    answerInput.value = '';
}

document.addEventListener('DOMContentLoaded', generateQuestion);

// ==============================
// LOGIN USER
// ==============================
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // CAPTCHA CHECK 
    const userAnswer = parseInt(document.getElementById("captcha-answer").value, 10);
    const num1 = parseInt(document.getElementById("num1").value, 10);
    const num2 = parseInt(document.getElementById("num2").value, 10);
    const feedbackEl = document.getElementById("feedback");

    if (userAnswer !== num1 + num2) {
        showCustomAlert("Incorrect CAPTCHA. Please try again.");
        generateQuestion(); // refresh captcha
        return;
    }

    const username = loginForm.querySelector("#usernameInput").value.trim();
    const password = loginForm.querySelector("#passwordInput").value.trim();
    const role = loginForm.querySelector("#role").value;

    if (!username || !password || !role) {
        showCustomAlert("Enter your credentials and select role.");
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
            showCustomAlert("Role does not match registered user.");
        }

    } catch (error) {
        showCustomAlert(error.message);
    }
});

// =====================
// RESET PASSWORD
// =====================
const resetLink = document.getElementById("resetEmail");
const resetBox = document.getElementById("resetBox");
const resetEmailInput = document.getElementById("resetEmailInput");
const resetBtn = document.getElementById("resetBtn");
const cancelResetBtn = document.getElementById("cancelResetBtn");

resetLink.addEventListener("click", (e) => {
    e.preventDefault();
    container.classList.add("blur-background");
    resetBox.style.display = "block";
});

cancelResetBtn.addEventListener("click", () => {
    container.classList.remove("blur-background");
    resetBox.style.display = "none";
    container.style.display = "block";
    resetEmailInput.value = "";
});

resetBtn.addEventListener("click", async () => {
    const email = resetEmailInput.value.trim();
    if (!email) {
        showCustomAlert("Please enter your email address.");
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        showCustomAlert("If an account with this email exists, a password reset email has been sent.");
        resetEmailInput.value = "";
        resetBox.style.display = "none";
        container.style.display = "block";
    } catch (error) {
        console.error("Reset Password Error:", error);
        showCustomAlert("Error sending reset email: " + error.message);
    }
});

// ==============================
// TOGGLE PASSWORD VISIBILITY
// ==============================
document.addEventListener("DOMContentLoaded", () => {
    const passwordInput = document.getElementById('passwordInput');
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

    loadUsers(); // load users here
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

        if (text.includes('home')) {
            showPage('homePage');
        }

        else if (text.includes('dashboard')) {
            showPage('dashboardPage');

            dashboardMain.style.display = 'block';
            allPages.patientDashboardPage.style.display = 'none';
            allPages.doctorDashboardPage.style.display = 'none';
        }

        else if (text.includes('appointment')) {
            showPage('appointmentPage');
        }

        else if (text.includes('settings')) {
            showPage('settingsPage');
        }
    });
});

// LOGOUT BUTTON
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-outline') || e.target.innerText === 'Logout') {
        Object.values(allPages).forEach(page => page.style.display = 'none');
        container.style.display = 'block';
        container.classList.remove('active');
        loginForm.reset();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    function updateMainTotalPatients(count) {
        const el = document.getElementById("main-total-patients");
        if (el) {
            el.textContent = count;
        }
    }

    const patientList = document.querySelector('#patients-list');
    const userform = document.querySelector('#add-patient-form');

    // ==============================
    // RENDER USER FUNCTION
    // ==============================
    function renderUser(docSnap, rowNumber) {
        const tr = document.createElement('tr');

        const tdNumber = document.createElement('td');
        const tdFirst = document.createElement('td');
        const tdLast = document.createElement('td');
        const tdEmail = document.createElement('td');
        const tdDate = document.createElement('td');

        const data = docSnap.data();

        tdNumber.textContent = rowNumber; // <-- set the row number here
        tdFirst.textContent = data.firstname;
        tdLast.textContent = data.lastname;
        tdEmail.textContent = data.email;

        // Convert Firestore timestamp to readable format
        if (data.createdAt && data.createdAt.seconds) {
            const timestamp = data.createdAt;
            const date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
            tdDate.textContent = date.toLocaleString('en-US', {
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
                hour12: true
            });
        } else {
            tdDate.textContent = "N/A";
        }

        tr.appendChild(tdNumber);
        tr.appendChild(tdFirst);
        tr.appendChild(tdLast);
        tr.appendChild(tdEmail);
        tr.appendChild(tdDate);

        patientList.appendChild(tr);
    }

    // ==============================
    // LOAD USERS (ONLY PATIENTS)
    // ==============================
    async function loadUsers() {
        patientList.innerHTML = "";

        const querySnapshot = await getDocs(collection(db, "patients_list"));

        const patients = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.role && data.role.toLowerCase() === "patient") {
                patients.push({ id: docSnap.id, ...data });
            }
        });

        // Sort patients by createdAt (newest first)
        patients.sort((a, b) => {
            let dateA = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds * 1000 + a.createdAt.nanoseconds / 1000000 : 0;
            let dateB = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds * 1000 + b.createdAt.nanoseconds / 1000000 : 0;
            return dateB - dateA; // newest first. Use dateA - dateB for oldest first
        });

        // Render sorted patients
        patients.forEach((patient, index) => {
            renderUser({
                data: () => patient
            }, index + 1);
        });

        updateMainTotalPatients(patients.length);
    }

    loadUsers();

    // ==============================
    // ADD PATIENT TO FIRESTORE
    // ==============================
    userform.addEventListener("submit", async (e) => {
        e.preventDefault();

        const firstname = document.getElementById("patient-firstname").value.trim();
        const lastname = document.getElementById("patient-lastname").value.trim();
        const email = document.getElementById("patient-email").value.trim().toLowerCase();

        if (!firstname || !lastname || !email) {
            showCustomAlert("Please fill all fields.");
            return;
        }

        try {
            // Fetch all patients
            const patientsSnapshot = await getDocs(collection(db, "patients_list"));

            // Check for duplicates
            let duplicateFound = false;
            patientsSnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                if (data.role === "patient" && data.email.trim().toLowerCase() === email) {
                    duplicateFound = true;
                }
            });

            if (duplicateFound) {
                showCustomAlert("This patient is already in the system!");
                userform.reset();
                return;
            }

            // Add patient if no duplicate
            await addDoc(collection(db, "patients_list"), {
                firstname,
                lastname,
                email,
                role: "patient",
                createdAt: new Date()
            });

            showCustomAlert("Patient added successfully!");
            userform.reset();
            loadUsers();

        } catch (error) {
            console.error("Firestore error:", error);
            showCustomAlert("Error adding patient.");
        }
    });

    // ==============================
    // LOAD WHEN PATIENT DASHBOARD CLICKED
    // ==============================
    dashboardHolder_1.addEventListener('click', () => {
        dashboardMain.style.display = 'none';
        allPages.patientDashboardPage.style.display = 'block';
        allPages.doctorDashboardPage.style.display = 'none';

        loadUsers();
    });

    // ==============================
    // SEARCH & RESET FUNCTION
    // ==============================

    const searchInput = document.getElementById("search-input");
    const searchBtn = document.getElementById("search-btn");
    const resetBtn = document.getElementById("reset-btn");

    // SEARCH BUTTON CLICK
    searchBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        const searchValue = searchInput.value.trim().toLowerCase();

        if (!searchValue) {
            showCustomAlert("Please enter something to search.");
            return;
        }

        patientList.innerHTML = "";

        const querySnapshot = await getDocs(collection(db, "patients_list"));

        const filteredPatients = [];

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();

            if (data.role && data.role.toLowerCase() === "patient") {
                const firstname = data.firstname.toLowerCase();
                const lastname = data.lastname.toLowerCase();
                const email = data.email.toLowerCase();

                // Check if search matches any field
                if (
                    firstname.includes(searchValue) ||
                    lastname.includes(searchValue) ||
                    email.includes(searchValue)
                ) {
                    filteredPatients.push({ id: docSnap.id, ...data });
                }
            }
        });

        if (filteredPatients.length === 0) {
            patientList.innerHTML = `<tr><td colspan="5">No patient found.</td></tr>`;
            return;
        }

        // Sort newest first
        filteredPatients.sort((a, b) => {
            let dateA = a.createdAt?.seconds
                ? a.createdAt.seconds * 1000 + a.createdAt.nanoseconds / 1000000
                : 0;
            let dateB = b.createdAt?.seconds
                ? b.createdAt.seconds * 1000 + b.createdAt.nanoseconds / 1000000
                : 0;
            return dateB - dateA;
        });

        filteredPatients.forEach((patient, index) => {
            renderUser(
                {
                    data: () => patient
                },
                index + 1
            );
        });

        // ✅ Update main dashboard counter
        updateMainTotalPatients(patients.length);
    });

    // RESET BUTTON CLICK
    resetBtn.addEventListener("click", (e) => {
        e.preventDefault();
        searchInput.value = "";
        loadUsers(); // reload full list
    });
});

/* Custom Alert Box */
function showCustomAlert(message, duration = 6000) {
    const alertBox = document.getElementById('customAlert');
    const alertMessage = document.getElementById('customAlertMessage');

    alertMessage.textContent = message;

    // Show alert
    alertBox.style.display = 'flex';
    alertBox.style.pointerEvents = 'auto'; // enable clicks
    alertBox.style.opacity = '1';
    alertBox.style.animation = 'popOut 0.5s ease forwards';

    setTimeout(() => {
        alertBox.style.animation = 'popIn 0.4s ease forwards';
        setTimeout(() => {
            alertBox.style.display = 'none';
            alertBox.style.pointerEvents = 'none';
            alertBox.style.opacity = '0';
        }, 400);
    }, duration);
}

// Close button
document.getElementById('customAlertClose').addEventListener('click', () => {
    const alertBox = document.getElementById('customAlert');
    alertBox.style.animation = 'popIn 0.4s ease forwards';
    setTimeout(() => {
        alertBox.style.display = 'none';
        alertBox.style.pointerEvents = 'none';
        alertBox.style.opacity = '0';
    }, 400);
});

// ==============================
// LOAD PATIENTS TO DOCTOR DASHBOARD
// ==============================
async function loadDoctorPatients() {
    try {
        const patientsSnapshot = await getDocs(collection(db, "patients_list"));

        const tableBody = document.getElementById("doctor-patient-list");
        const totalPatientsElement = document.getElementById("doctor-total-patients");

        tableBody.innerHTML = "";
        let totalPatients = 0;

        patientsSnapshot.forEach((docSnap) => {
            const data = docSnap.data();

            // Only show patients
            if (data.role === "patient") {
                totalPatients++;

                const row = document.createElement("tr");

                row.innerHTML = `
                    <td><input type="checkbox"></td>
                    <td>${data.firstname}</td>
                    <td>${data.lastname}</td>
                    <td>${data.email}</td>
                    <td>${data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : "N/A"}</td>
                `;

                tableBody.appendChild(row);
            }
        });

        totalPatientsElement.textContent = totalPatients;

    } catch (error) {
        console.error("Error loading doctor patients:", error);
    }
}

