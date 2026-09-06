// --- ОСНОВНОЙ КЛИЕНТСКИЙ СКРИПТ (app.js) ---

let currentUser = JSON.parse(localStorage.getItem('work_user')) || null;
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); // 0 - Январь, 8 - Сентябрь и т.д.
let scheduleData = {};
let activeTab = 'calendar'; // 'calendar' или 'salary'

let userSettings = {
    calcType: 'monthly',
    monthlyRate: 5500,
    rate: 25,
    bonus: 850,
    manualKantyna: 0
};

const monthNames = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

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

// --- ЭКРАН АВТОРИЗАЦИИ ---

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

// --- ГЛАВНЫЙ ЭКРАН (КАК В ПРОШЛОМ ПРОЕКТЕ) ---

function showMainScreen() {
    document.body.innerHTML = `
        <div class="main-wrapper" style="max-width: 480px; margin: 20px auto; font-family: sans-serif; background: #18181b; color: #f4f4f5; padding: 15px; border-radius: 12px;">
            
            <!-- Шапка с вкладками и кнопкой выхода -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div style="display: flex; background: #27272a; padding: 4px; border-radius: 8px;">
                    <button onclick="switchTab('calendar')" id="tabCalendar" style="background: ${activeTab === 'calendar' ? '#d4af37' : 'transparent'}; color: ${activeTab === 'calendar' ? '#000' : '#fff'}; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-weight: bold;">📅 Календарь</button>
                    <button onclick="switchTab('salary')" id="tabSalary" style="background: ${activeTab === 'salary' ? '#d4af37' : 'transparent'}; color: ${activeTab === 'salary' ? '#000' : '#fff'}; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-weight: bold;">💰 Расчет зарплаты</button>
                </div>
                <button onclick="logout()" style="background: #ef4444; color: #fff; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 12px;">Выйти</button>
            </div>

            <!-- Вкладка: Календарь -->
            <div id="viewCalendar" style="display: ${activeTab === 'calendar' ? 'block' : 'none'};">
                
                <!-- Выбор месяца и года -->
                <div style="background: #27272a; padding: 12px; border-radius: 8px; margin-bottom: 15px; display: grid; grid-template-columns: 2fr 1fr; gap: 10px;">
                    <div>
                        <label style="font-size: 12px; color: #a1a1aa;">Месяц:</label>
                        <select id="selectMonth" onchange="changeMonthYear()" style="width: 100%; background: #18181b; color: #fff; border: 1px solid #3f3f46; padding: 6px; border-radius: 6px;">
                            ${monthNames.map((m, idx) => `<option value="${idx}" ${idx === currentMonth ? 'selected' : ''}>${m}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="font-size: 12px; color: #a1a1aa;">Год:</label>
                        <select id="selectYear" onchange="changeMonthYear()" style="width: 100%; background: #18181b; color: #fff; border: 1px solid #3f3f46; padding: 6px; border-radius: 6px;">
                            <option value="2025" ${currentYear === 2025 ? 'selected' : ''}>2025</option>
                            <option value="2026" ${currentYear === 2026 ? 'selected' : ''}>2026</option>
                            <option value="2027" ${currentYear === 2027 ? 'selected' : ''}>2027</option>
                        </select>
                    </div>
                </div>

                <!-- Настройки оплаты -->
                <div style="background: #27272a; padding: 12px; border-radius: 8px; margin-bottom: 15px;">
                    <div style="margin-bottom: 8px;">
                        <label style="font-size: 12px; color: #a1a1aa;">Тип оплаты:</label>
                        <select id="calcType" onchange="updateSettingsFromUI()" style="width: 100%; background: #18181b; color: #fff; border: 1px solid #3f3f46; padding: 6px; border-radius: 6px;">
                            <option value="monthly" ${userSettings.calcType === 'monthly' ? 'selected' : ''}>Оклад за месяц (zł/мес)</option>
                            <option value="hourly" ${userSettings.calcType === 'hourly' ? 'selected' : ''}>Почасовая ставка (zł/ч)</option>
                        </select>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div>
                            <label style="font-size: 12px; color: #a1a1aa;" id="labelRateName">Оклад брутто (zł):</label>
                            <input type="number" id="inputRateValue" value="${userSettings.monthlyRate}" oninput="updateSettingsFromUI()" style="width: 100%; background: #18181b; color: #fff; border: 1px solid #3f3f46; padding: 6px; border-radius: 6px; box-sizing: border-box;">
                        </div>
                        <div>
                            <label style="font-size: 12px; color: #a1a1aa;">Премия брутто (zł):</label>
                            <input type="number" id="inputBonus" value="${userSettings.bonus}" oninput="updateSettingsFromUI()" style="width: 100%; background: #18181b; color: #fff; border: 1px solid #3f3f46; padding: 6px; border-radius: 6px; box-sizing: border-box;">
                        </div>
                    </div>
                </div>

                <!-- Сетка календаря -->
                <div id="calendarGrid" style="background: #27272a; padding: 10px; border-radius: 8px; margin-bottom: 15px;">
                    <!-- Динамически заполняется днями -->
                </div>

                <!-- Статистика -->
                <div style="background: #27272a; padding: 12px; border-radius: 8px; margin-bottom: 15px; font-size: 14px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span>Отработано дней:</span> <strong id="statDays">0</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span>Базовые часы:</span> <strong id="statBaseHours">0 ч</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span>Переработка (Nadgodziny):</span> <strong id="statOvertime" style="color: #f59e0b;">0.0 ч</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span>Ночные часы (22:00-06:00):</span> <strong id="statNight" style="color: #a78bfa;">0.0 ч</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px; border-top: 1px solid #3f3f46; padding-top: 6px;"><span>Всего часов:</span> <strong id="statTotalHours">0.0 ч</strong></div>
                    <div style="display: flex; justify-content: space-between; font-size: 16px; border-top: 1px solid #3f3f46; padding-top: 6px; margin-top: 6px; color: #d4af37;"><span>Ориентировочно брутто:</span> <strong id="statTotalMoney">0.00 zł</strong></div>
                </div>

                <button onclick="saveShiftsToServer(); alert('Отчет сохранен!');" style="width: 100%; background: #d4af37; color: #000; border: none; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer;">Сохранить отчет</button>
            </div>

            <!-- Вкладка: Расчет зарплаты (Детали) -->
            <div id="viewSalary" style="display: ${activeTab === 'salary' ? 'block' : 'none'}; background: #27272a; padding: 15px; border-radius: 8px;">
                <h3>Детализация расчета</h3>
                <p style="color: #a1a1aa; font-size: 14px;">Здесь отображаются подробные начисления по часам, надбавки за ночные смены и праздничные дни в соответствии с вашим графиком.</p>
            </div>

        </div>
    `;

    renderCalendarGrid();
    calculateStats();
}

// --- ЛОГИКА КАЛЕНДАРЯ И ПЕРЕКЛЮЧЕНИЙ ---

function switchTab(tab) {
    activeTab = tab;
    showMainScreen();
}

function changeMonthYear() {
    currentMonth = parseInt(document.getElementById('selectMonth').value);
    currentYear = parseInt(document.getElementById('selectYear').value);
    loadShifts();
}

function updateSettingsFromUI() {
    userSettings.calcType = document.getElementById('calcType').value;
    userSettings.monthlyRate = parseFloat(document.getElementById('inputRateValue').value) || 0;
    userSettings.bonus = parseFloat(document.getElementById('inputBonus').value) || 0;
    saveSettingsToServer();
    calculateStats();
}

// Отрисовка сетки дней месяца
function renderCalendarGrid() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Шапка дней недели
    let html = `<div style="display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-size: 11px; color: #a1a1aa; margin-bottom: 8px;">
        <div>Пн</div><div>Вт</div><div>Ср</div><div>Чт</div><div>Пт</div><div>Сб</div><div>Вс</div>
    </div><div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;">`;

    // Определяем день недели для первого дня месяца (0 - Пн в нашей верстке)
    let firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Сдвиг под Пн

    // Пустые ячейки для выравнивания начала месяца
    for (let i = 0; i < firstDayIndex; i++) {
        html += `<div></div>`;
    }

    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
        const shiftData = scheduleData[day] || { shift: 'none', start: '06:00', end: '14:00', totalHours: 8, overtime: 0 };
        let bgStyle = '#18181b';
        let badgeText = '';

        if (shiftData.shift === '1') {
            bgStyle = '#1e3a8a'; // Синий для 1 смены
            badgeText = '1 смена';
        } else if (shiftData.shift === '2') {
            bgStyle = '#78350f'; // Оранжевый/Коричневый для 2 смены
            badgeText = '2 смена';
        } else if (shiftData.shift === '3') {
            bgStyle = '#3b0764'; // Фиолетовый для 3 смены
            badgeText = '3 смена';
        }

        html += `
            <div onclick="cycleShift(${day})" style="background: ${bgStyle}; border: 1px solid #3f3f46; border-radius: 6px; padding: 6px 2px; text-align: center; cursor: pointer; min-height: 50px; display: flex; flex-direction: column; justify-content: space-between;">
                <div style="font-size: 12px; font-weight: bold;">${day}</div>
                <div style="font-size: 9px; background: rgba(0,0,0,0.3); border-radius: 3px; padding: 2px;">${badgeText || 'выходной'}</div>
            </div>
        `;
    }

    html += `</div>`;
    grid.innerHTML = html;
}

// Переключение смены по клику на день (none -> 1 -> 2 -> 3 -> none)
function cycleShift(day) {
    if (!scheduleData[day]) {
        scheduleData[day] = { shift: '1', start: '06:00', end: '14:00', totalHours: 8, overtime: 0 };
    } else {
        const current = scheduleData[day].shift;
        if (current === 'none') scheduleData[day].shift = '1';
        else if (current === '1') scheduleData[day].shift = '2';
        else if (current === '2') scheduleData[day].shift = '3';
        else scheduleData[day].shift = 'none';
    }
    renderCalendarGrid();
    calculateStats();
}

// Расчет статистики
function calculateStats() {
    let daysWorked = 0;
    let totalHours = 0;

    for (let day in scheduleData) {
        const s = scheduleData[day];
        if (s && s.shift && s.shift !== 'none') {
            daysWorked++;
            totalHours += 8; // Базово 8 часов за смену
        }
    }

    const baseHours = Math.min(totalHours, 168); // Норма часов примерно
    const overtime = Math.max(0, totalHours - 168);

    document.getElementById('statDays').innerText = daysWorked;
    document.getElementById('statBaseHours').innerText = `${baseHours} ч (из 168ч)`;
    document.getElementById('statOvertime').innerText = `${overtime.toFixed(1)} ч`;
    document.getElementById('statNight').innerText = `0.0 ч`;
    document.getElementById('statTotalHours').innerText = `${totalHours.toFixed(1)} ч`;

    let totalMoney = userSettings.monthlyRate + userSettings.bonus;
    document.getElementById('statTotalMoney').innerText = `${totalMoney.toFixed(2)} zł`;
}

// --- СЕТЕВЫЕ ЗАПРОСЫ (API) ---

async function loadSettings() {
    if (!currentUser) return;
    try {
        const res = await fetch(`/settings?userId=${currentUser.id}`);
        const data = await res.json();
        if (data && data.user_id) {
            userSettings = {
                calcType: data.calc_type || 'monthly',
                monthlyRate: data.monthly_rate || 5500,
                rate: data.rate || 25,
                bonus: data.bonus || 850,
                manualKantyna: data.manual_kantyna || 0
            };
            showMainScreen(); // Перерисовываем с актуальными данными
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
        renderCalendarGrid();
        calculateStats();
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