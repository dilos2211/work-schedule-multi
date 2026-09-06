// --- ОСНОВНОЙ КЛИЕНТСКИЙ СКРИПТ (app.js) ---

let currentUser = JSON.parse(localStorage.getItem('work_user')) || null;
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let scheduleData = {};
let userSettings = {
    calcType: 'monthly',
    monthlyRate: 4000,
    rate: 25,
    bonus: 20,
    manualKantyna: 0
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    if (!currentUser) {
        showAuthScreen();
    } else {
        showMainScreen();
        loadSettings();
        loadShifts();
    }
}

// --- ЭКРАНЫ АВТОРИЗАЦИИ И СМЕНЫ ---

function showAuthScreen() {
    document.body.innerHTML = `
        <div class="auth-container">
            <div class="auth-card" id="authCard">
                <h2 id="authTitle">Вход</h2>
                <div id="errorMsg" class="error-msg" style="display:none; color:red; margin-bottom:10px;"></div>
                <form id="authForm" onsubmit="handleAuth(event)">
                    <div class="form-group">
                        <label>Email:</label>
                        <input type="email" id="authEmail" required>
                    </div>
                    <div class="form-group">
                        <label>Пароль:</label>
                        <input type="password" id="authPassword" required>
                    </div>
                    <button type="submit" id="authBtn" class="btn-primary">Войти</button>
                </form>
                <p class="switch-auth">
                    <span id="switchText">Нет аккаунта?</span> 
                    <a href="#" onclick="toggleAuthMode(event)" id="switchLink">Зарегистрироваться</a>
                </p>
            </div>
        </div>
    `;
}

let isRegisterMode = false;
function toggleAuthMode(e) {
    e.preventDefault();
    isRegisterMode = !isRegisterMode;
    document.getElementById('authTitle').innerText = isRegisterMode ? 'Регистрация' : 'Вход';
    document.getElementById('authBtn').innerText = isRegisterMode ? 'Зарегистрироваться' : 'Войти';
    document.getElementById('switchText').innerText = isRegisterMode ? 'Уже есть аккаунт?' : 'Нет аккаунта?';
    document.getElementById('switchLink').innerText = isRegisterMode ? 'Войти' : 'Зарегистрироваться';
}

async function handleAuth(event) {
    event.preventDefault();
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    const endpoint = isRegisterMode ? '/register' : '/login';

    const errBox = document.getElementById('errorMsg');
    errBox.style.display = 'none';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Ошибка авторизации');
        }

        currentUser = data.user;
        localStorage.setItem('work_user', JSON.stringify(currentUser));
        location.reload();
    } catch (err) {
        errBox.innerText = err.message;
        errBox.style.display = 'block';
    }
}

function logout() {
    localStorage.removeItem('work_user');
    currentUser = null;
    location.reload();
}

function showMainScreen() {
    document.body.innerHTML = `
        <div class="app-container" style="padding: 20px; font-family: Arial, sans-serif;">
            <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px;">
                <h2>Управление сменами и зарплатой</h2>
                <div>
                    <span id="userEmailDisplay" style="margin-right: 15px; font-weight: bold;">${currentUser.email}</span>
                    <button id="logoutBtn" class="btn-secondary" style="padding: 5px 15px; cursor: pointer;">Выйти</button>
                </div>
            </header>
            <main>
                <div id="calendarContainer">
                    <h3>Календарь смен</h3>
                    <div id="calendarView"></div>
                </div>
            </main>
        </div>
    `;

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.onclick = logout;

    loadSettings();
    loadShifts();
}

// --- РАБОТА С НАСТРОЙКАМИ ---

async function loadSettings() {
    if (!currentUser) return;
    try {
        const res = await fetch(`/settings?userId=${currentUser.id}`);
        const data = await res.json();
        if (data && data.user_id) {
            userSettings = {
                calcType: data.calc_type || 'monthly',
                monthlyRate: data.monthly_rate || 4000,
                rate: data.rate || 25,
                bonus: data.bonus || 20,
                manualKantyna: data.manual_kantyna || 0
            };
            updateSettingsUI();
        }
    } catch (e) {
        console.error('Ошибка загрузки настроек:', e);
    }
}

async function saveSettingsToServer() {
    if (!currentUser) return;
    try {
        await fetch('/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                calcType: userSettings.calcType,
                monthlyRate: userSettings.monthlyRate,
                rate: userSettings.rate,
                bonus: userSettings.bonus,
                manualKantyna: userSettings.manualKantyna
            })
        });
    } catch (e) {
        console.error('Ошибка сохранения настроек:', e);
    }
}

function updateSettingsUI() {
    const calcTypeEl = document.getElementById('calcType');
    if (calcTypeEl) calcTypeEl.value = userSettings.calcType;
}

// --- РАБОТА СО СМЕНАМИ И КАЛЕНДАРЕМ ---

async function loadShifts() {
    if (!currentUser) return;
    try {
        const res = await fetch(`/shifts?userId=${currentUser.id}&year=${currentYear}&month=${currentMonth}`);
        const data = await res.json();
        
        scheduleData = {};
        if (Array.isArray(data)) {
            data.forEach(item => {
                const dayNum = parseInt(item.work_date.split('-')[2]);
                scheduleData[dayNum] = {
                    shift: item.shift_type,
                    start: item.start_time,
                    end: item.end_time,
                    totalHours: item.total_hours,
                    overtime: item.overtime_hours
                };
            });
        }
        renderCalendar();
    } catch (e) {
        console.error('Ошибка загрузки смен:', e);
    }
}

async function saveShiftsToServer() {
    if (!currentUser) return;
    try {
        await fetch('/shifts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                year: currentYear,
                month: currentMonth,
                scheduleData: scheduleData
            })
        });
    } catch (e) {
        console.error('Ошибка сохранения смен:', e);
    }
}

function renderCalendar() {
    console.log("Календарь обновлен для месяца:", currentMonth, currentYear);
}