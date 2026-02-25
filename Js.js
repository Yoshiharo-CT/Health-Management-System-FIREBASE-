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
import { getFirestore, doc, setDoc, getDoc, addDoc, getDocs, collection, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

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

// ===================
// APPOINTMENT
// ===================

document.addEventListener("DOMContentLoaded", async () => {

    const appointmentForm = document.getElementById("add-appointment-form");
    const appointmentList = document.getElementById("appointment-list");

    const totalAppointmentsEl = document.getElementById("total-appointments");

    const searchInput = document.getElementById("appointment-search-input");
    const searchBtn = document.getElementById("appointment-search-btn");
    const resetBtn = document.getElementById("appointment-reset-btn");

    // ==============================
    // UPDATE TOTAL COUNT
    // ==============================
    function updateTotalAppointments(count) {
        if (totalAppointmentsEl) {
            totalAppointmentsEl.textContent = count;
        }
    }

    // ==============================
    // HANDLE APPOINTMENT FORM SUBMISSION
    // ==============================
    document.addEventListener("DOMContentLoaded", async () => {

        const rxappointmentForm = document.getElementById("add-appointment-form");
        const rxDoctorSelect = document.getElementById("rxDoctorSelect");
        let doctors = [];

        // ==============================
        // LOAD DOCTORS INTO DROPDOWN
        // ==============================
        async function populateDoctorDropdown() {
            rxDoctorSelect.innerHTML = '<option value="">Select Doctor</option>';
            doctors = [];

            try {
                const usersRef = collection(db, "users");
                const doctorQuery = query(usersRef, where("role", "==", "doctor"));
                const querySnapshot = await getDocs(doctorQuery);

                querySnapshot.forEach(docSnap => {
                    const data = docSnap.data();
                    const fullName = `${data.firstname} ${data.lastname}`;

                    const option = document.createElement("option");
                    option.value = docSnap.id;
                    option.textContent = fullName;

                    rxDoctorSelect.appendChild(option);
                    doctors.push({ id: docSnap.id, name: fullName });
                });

                // ✅ Manual Test Doctor
                const testOption = document.createElement("option");
                testOption.value = "manual_test_doctor";
                testOption.textContent = "Dr. Test Doctor (Manual)";
                rxDoctorSelect.appendChild(testOption);

            } catch (error) {
                console.error("Error loading doctors:", error);
            }
        }

        await populateDoctorDropdown(); // IMPORTANT

        // ==============================
        // SUBMIT FORM
        // ==============================
        rxappointmentForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const firstName = document.getElementById("patient-firstname").value.trim();
            const lastName = document.getElementById("patient-lastname").value.trim();
            const email = document.getElementById("patient-email").value.trim();
            const contact = document.getElementById("patient-contact").value.trim();
            const date = document.getElementById("appointment-date").value;
            const time = document.getElementById("appointment-time").value;
            const selectedDoctorId = rxDoctorSelect.value;

            if (!selectedDoctorId) {
                alert("Please select a doctor!");
                return;
            }

            const selectedDoctor =
                doctors.find(doc => doc.id === selectedDoctorId)?.name
                || "Dr. Test";

            try {

                // 🔥 SAVE TO FIRESTORE
                await addDoc(collection(db, "appointments"), {
                    firstname: firstName,
                    lastname: lastName,
                    email: email,
                    contact: contact,
                    date: date,
                    time: time,
                    doctorId: selectedDoctorId,
                    doctorName: selectedDoctor,
                    status: "Pending",
                    createdAt: serverTimestamp()
                });

                const rowNumber =
                    document.getElementById('appointment-list').children.length + 1;

                // ✅ ADD TO TABLE IMMEDIATELY
                renderAppointment({
                    firstname: firstName,
                    lastname: lastName,
                    email: email,
                    contact: contact,
                    date: date,
                    time: time,
                    doctorName: selectedDoctor
                }, rowNumber);

                rxappointmentForm.reset();
                rxDoctorSelect.selectedIndex = 0;

                showCustomAlert("Appointment added successfully!");

            } catch (error) {
                console.error("Error adding appointment:", error);
                showCustomAlert("Error saving appointment.");
            }
        });

    });

    // ==============================
    // RENDER APPOINTMENT FUNCTION
    // ==============================
    function renderAppointment(appointmentData, rowNumber) {

        const tr = document.createElement('tr');

        const tdNumber = document.createElement('td');
        const tdName = document.createElement('td');
        const tdEmail = document.createElement('td');
        const tdDate_Time = document.createElement('td');
        const tdDoctor = document.createElement('td');
        const tdStatus = document.createElement('td');
        const tdActions = document.createElement('td');

        tdNumber.textContent = rowNumber;
        tdName.textContent = `${appointmentData.firstname} ${appointmentData.lastname}`;
        tdEmail.textContent = appointmentData.email;

        // ✅ Combine selected date + time
        if (appointmentData.date && appointmentData.time) {
            const dateObj = new Date(`${appointmentData.date}T${appointmentData.time}`);

            tdDate_Time.textContent = dateObj.toLocaleString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                hour12: true
            });
        } else {
            tdDate_Time.textContent = "N/A";
        }

        tdDoctor.textContent = appointmentData.doctorName || "N/A";
        tdStatus.textContent = "Pending";

        tdActions.innerHTML = `
        <button class="btn-edit">Edit</button>
        <button class="btn-delete">Delete</button>
    `;

        tr.appendChild(tdNumber);
        tr.appendChild(tdName);
        tr.appendChild(tdEmail);
        tr.appendChild(tdDate_Time);
        tr.appendChild(tdDoctor);
        tr.appendChild(tdStatus);
        tr.appendChild(tdActions);

        document.getElementById('appointment-list').appendChild(tr);
    }

    // ==============================
    // LOAD APPOINTMENTS
    // ==============================
    async function loadAppointments() {

        appointmentList.innerHTML = "";

        const querySnapshot = await getDocs(collection(db, "appointments"));

        const appointments = [];

        querySnapshot.forEach((docSnap) => {
            appointments.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Sort by newest
        appointments.sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        appointments.forEach((appt, index) => {
            renderAppointment(appt, index + 1);
        });

        updateTotalAppointments(appointments.length);
    }

    // ==============================
    // SEARCH APPOINTMENT
    // ==============================
    searchBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        const searchValue = searchInput.value.trim().toLowerCase();

        if (!searchValue) {
            showCustomAlert("Enter something to search.");
            return;
        }

        appointmentList.innerHTML = "";

        try {
            const querySnapshot = await getDocs(collection(db, "appointments"));
            const filtered = [];

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                if (
                    data.firstname.toLowerCase().includes(searchValue) ||
                    data.lastname.toLowerCase().includes(searchValue) ||
                    data.email.toLowerCase().includes(searchValue) ||
                    (data.status && data.status.toLowerCase().includes(searchValue))
                ) {
                    filtered.push({ id: docSnap.id, ...data });
                }
            });

            if (filtered.length === 0) {
                appointmentList.innerHTML = `<tr><td colspan="6" style="text-align:center;">No appointment found.</td></tr>`;
                updateTotalAppointments(0);
                return;
            }

            filtered.forEach((appt, index) => {
                renderAppointment(appt, index + 1);
            });

            updateTotalAppointments(filtered.length);
        } catch (error) {
            console.error("Error searching appointments:", error);
            showCustomAlert("Error fetching appointments. Try again.");
        }
    });

    // RESET SEARCH
    resetBtn.addEventListener("click", async () => {
        searchInput.value = "";
        appointmentList.innerHTML = "";
        const querySnapshot = await getDocs(collection(db, "appointments"));
        let total = 0;
        querySnapshot.forEach((docSnap, index) => {
            renderAppointment(docSnap.data(), index + 1);
            total++;
        });
        updateTotalAppointments(total);
    });



    // ==============================
    // LOAD WHEN APPOINTMENT PAGE OPENED
    // ==============================
    document.querySelectorAll('.home-nav-item').forEach(btn => {
        btn.addEventListener('click', function () {
            if (this.innerText.toLowerCase().includes("appointment")) {
                loadAppointments();
            }
        });
    });
});

// ==============================
// MEDICINE PRESCRIPTION
// ==============================
document.addEventListener("DOMContentLoaded", () => {

    const $ = (sel) => document.querySelector(sel);
    const STORAGE_KEY = "prescriptions";

    function normalize(v) {
        return String(v || "").trim().toLowerCase();
    }

    function getSession() {
        return JSON.parse(localStorage.getItem("currentUser") || "null");
    }

    function getAllPrescriptions() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    }

    function saveAllPrescriptions(list) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }

    function getVisiblePrescriptions() {
        const session = getSession();
        const all = getAllPrescriptions();

        if (!session) return [];

        if (session.role === "patient") {
            return all.filter(p =>
                normalize(p.patientEmail) === normalize(session.email)
            );
        }
        return all;
    }

    /* ========================= */
    /* MODAL */
    /* ========================= */

    function openModal() {
        const session = getSession();

        if (!session || (session.role !== "doctor" && session.role !== "staff")) {
            showCustomAlert("Only doctors or staff can create prescriptions.");
            return;
        }

        $("#prescriptionModal").style.display = "flex";

        // Auto-fill doctor name
        if (session.name) {
            $("#rxDoctor").value = session.name;
        }
    }

    function closeModal() {
        $("#prescriptionModal").style.display = "none";
        $("#prescriptionForm").reset();
    }

    /* ========================= */
    /* RENDER TABLE */
    /* ========================= */

    function renderTable(data = null) {
        const tbody = $("#rxTableBody");
        if (!tbody) return;

        const list = data || getVisiblePrescriptions();
        tbody.innerHTML = "";

        if (list.length === 0) {
            tbody.innerHTML =
                `<tr><td colspan="4" style="text-align:center;">No prescriptions found</td></tr>`;
            return;
        }

        list.forEach(rx => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${rx.date}</td>
                <td>${rx.patientName}</td>
                <td>${rx.medicine}</td>
                <td>${rx.doctor}</td>
            `;
            tbody.appendChild(row);
        });
    }

    /* ========================= */
    /* SEARCH */
    /* ========================= */

    function handleSearch() {
        const value = normalize($("#rxSearch").value);
        const list = getVisiblePrescriptions();

        const filtered = list.filter(rx =>
            normalize(rx.patientName).includes(value) ||
            normalize(rx.medicine).includes(value) ||
            normalize(rx.doctor).includes(value)
        );

        renderTable(filtered);
    }

    /* ========================= */
    /* SORT */
    /* ========================= */

    let sortMode = "AZ";

    function handleSort() {
        sortMode = sortMode === "AZ" ? "ZA" : "AZ";

        $("#rxSortBtn").textContent =
            sortMode === "AZ" ? "Sort A–Z" : "Sort Z–A";

        const list = [...getVisiblePrescriptions()].sort((a, b) => {
            const A = normalize(a.patientName);
            const B = normalize(b.patientName);
            return sortMode === "AZ"
                ? A.localeCompare(B)
                : B.localeCompare(A);
        });

        renderTable(list);
    }

    /* ========================= */
    /* SAVE PRESCRIPTION */
    /* ========================= */

    $("#prescriptionForm")?.addEventListener("submit", (e) => {
        e.preventDefault();

        const newRx = {
            id: Date.now(),
            patientName: $("#rxPatientName").value,
            patientEmail: $("#rxPatientEmail").value,
            medicine: $("#rxMedicine").value,
            doctor: $("#rxDoctor").value,
            date: new Date().toLocaleString()
        };

        const list = getAllPrescriptions();
        list.push(newRx);
        saveAllPrescriptions(list);

        closeModal();
        renderTable();
        showCustomAlert("Prescription saved successfully");
    });

    /* ========================= */
    /* BUTTON EVENTS */
    /* ========================= */

    $("#createPrescriptionBtn")?.addEventListener("click", openModal);
    $("#rxcreatePrescriptionBtn")?.addEventListener("click", openModal);
    $("#closeRxModal")?.addEventListener("click", closeModal);
    $("#rxSearchBtn")?.addEventListener("click", handleSearch);
    $("#rxResetBtn")?.addEventListener("click", () => {
        $("#rxSearch").value = "";
        renderTable();
    });
    $("#rxSortBtn")?.addEventListener("click", handleSort);

    renderTable();

    createBtn?.addEventListener("click", () => {
        if (prescriptionSection.style.display === "block") {
            prescriptionSection.style.display = "none";
        } else {
            prescriptionSection.style.display = "block";
        }
    });
});

// ==========================
// SEND EMAIL FUNCTION 
// ==========================
function sendEmail(firstName, lastName, email, date, time) {

    const templateParams = {
        first_name: firstName,
        last_name: lastName,
        to_email: email,
        appointment_date: date,
        appointment_time: time
    };

    emailjs.send("service_j71aiur", "template_gz2refs", templateParams)
        .then(function (response) {
            console.log("SUCCESS!", response.status, response.text);
            showCustomAlert("Appointment email sent successfully!");
        })
        .catch(function (error) {
            console.error("FAILED...", error);
            showCustomAlert("Email sending failed.");
        });
}