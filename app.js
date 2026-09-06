// --- ОСНОВНОЙ КЛИЕНТСКИЙ СКРИПТ (app.js) ---

let currentUser = JSON.parse(localStorage.getItem('work_user')) || null;
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let scheduleData = {};
let activeTab = 'calendar';
let selectedDayForModal = null;

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

// --- ЭКРАН АВТОРИЗАЦИИ (СВЕТЛАЯ ТЕМА) ---

function showAuthScreen() {
    document.body.style.backgroundColor = "#f4f4f5";
    document.body.innerHTML = `
        <div class="auth-container" style="display: flex; justify-content: center; align-items: center; height: 100vh;">
            <div class="auth-card" id="authCard" style="background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 100%; max-width: 400px; color: #18181b;">
                <h2 id="authTitle" style="margin-top: 0; text-align: center; color: #18181b;">Вход</h2>
                <div id="errorMsg" class="error-msg" style="display:none; color:#dc2626; margin-bottom:10px; font-size: 14px;"></div>
                <form id="authForm" onsubmit="handleAuth(event)">
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-size: 14px; font-weight: 500;">Email:</label>
                        <input type="email" id="authEmail" required style="width: 100%; padding: 10px; border: 1px solid #d4d4d8; border-radius: 6px; box-sizing: border-box; font-size: 14px;">
                    </div>
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-size: 14px; font-weight: 500;">Пароль:</label>
                        <input type="password" id="authPassword" required style="width: 100%; padding: 10px; border: 1px solid #d4d4d8; border-radius: 6px; box-sizing: border-box; font-size: 14px;">
                    </div>
                    <button type="submit" id="authBtn" style="width: 100%; background: #2563eb; color: #ffffff; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 15px;">Войти</button>
                </form>
                <p class="switch-auth" style="text-align: center; margin-top: 15px; font-size: 14px;">
                    <span id="switchText" style="color: #71717a;">Нет аккаунта?</span> 
                    <a href="#" onclick="toggleAuthMode(event)" id="switchLink" style="color: #2563eb; text-decoration: none; font-weight: 500;">Зарегистрироваться</a>
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

// --- ГЛАВНЫЙ ЭКРАН (СВЕТЛАЯ ТЕМА) ---

function showMainScreen() {
    document.body.style.backgroundColor = "#f4f4f5";
    document.body.innerHTML = `
        <div class="main-wrapper" style="max-width: 480px; margin: 20px auto; font-family: sans-serif; background: #ffffff; color: #18181b; padding: 15px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            
            <!-- Шапка с вкладками и кнопкой выхода -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div style="display: flex; background: #f4f4f5; padding: 4px; border-radius: 8px;">
                    <button onclick="switchTab('calendar')" id="tabCalendar" style="background: ${activeTab === 'calendar' ? '#2563eb' : 'transparent'}; color: ${activeTab === 'calendar' ? '#ffffff' : '#71717a'}; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 13px;">📅 Календарь</button>
                    <button onclick="switchTab('salary')" id="tabSalary" style="background: ${activeTab === 'salary' ? '#2563eb' : 'transparent'}; color: ${activeTab === 'salary' ? '#ffffff' : '#71717a'}; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 13px;">💰 Зарплата</button>
                </div>
                <button onclick="logout()" style="background: #fee2e2; color: #dc2626; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500;">Выйти</button>
            </div>

            <!-- Вкладка: Календарь -->
            <div id="viewCalendar" style="display: ${activeTab === 'calendar' ? 'block' : 'none'};">
                
                <!-- Выбор месяца и года -->
                <div style="background: #fafafa; border: 1px solid #e4e4e7; padding: 12px; border-radius: 8px; margin-bottom: 15px; display: grid; grid-template-columns: 2fr 1fr; gap: 10px;">
                    <div>
                        <label style="font-size: 12px; color: #71717a; font-weight: 500;">Месяц:</label>
                        <select id="selectMonth" onchange="changeMonthYear()" style="width: 100%; background: #ffffff; color: #18181b; border: 1px solid #d4d4d8; padding: 6px; border-radius: 6px;">
                            ${monthNames.map((m, idx) => `<option value="${idx}" ${idx === currentMonth ? 'selected' : ''}>${m}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="font-size: 12px; color: #71717a; font-weight: 500;">Год:</label>
                        <select id="selectYear" onchange="changeMonthYear()" style="width: 100%; background: #ffffff; color: #18181b; border: 1px solid #d4d4d8; padding: 6px; border-radius: 6px;">
                            <option value="2025" ${currentYear === 2025 ? 'selected' : ''}>2025</option>
                            <option value="2026" ${currentYear === 2026 ? 'selected' : ''}>2026</option>
                            <option value="2027" ${currentYear === 2027 ? 'selected' : ''}>2027</option>
                        </select>
                    </div>
                </div>

                <!-- Настройки оплаты -->
                <div style="background: #fafafa; border: 1px solid #e4e4e7; padding: 12px; border-radius: 8px; margin-bottom: 15px;">
                    <div style="margin-bottom: 8px;">
                        <label style="font-size: 12px; color: #71717a; font-weight: 500;">Тип оплаты:</label>
                        <select id="calcType" onchange="updateSettingsFromUI()" style="width: 100%; background: #ffffff; color: #18181b; border: 1px solid #d4d4d8; padding: 6px; border-radius: 6px;">
                            <option value="monthly" ${userSettings.calcType === 'monthly' ? 'selected' : ''}>Оклад за месяц (zł/мес)</option>
                            <option value="hourly" ${userSettings.calcType === 'hourly' ? 'selected' : ''}>Почасовая ставка (zł/ч)</option>
                        </select>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div>
                            <label style="font-size: 12px; color: #71717a; font-weight: 500;">Оклад брутто (zł):</label>
                            <input type="number" id="inputRateValue" value="${userSettings.monthlyRate}" oninput="updateSettingsFromUI()" style="width: 100%; background: #ffffff; color: #18181b; border: 1px solid #d4d4d8; padding: 6px; border-radius: 6px; box-sizing: border-box;">
                        </div>
                        <div>
                            <label style="font-size: 12px; color: #71717a; font-weight: 500;">Премия брутто (zł):</label>
                            <input type="number" id="inputBonus" value="${userSettings.bonus}" oninput="updateSettingsFromUI()" style="width: 100%; background: #ffffff; color: #18181b; border: 1px solid #d4d4d8; padding: 6px; border-radius: 6px; box-sizing: border-box;">
                        </div>
                    </div>
                </div>

                <!-- Сетка календаря -->
                <div id="calendarGrid" style="background: #fafafa; border: 1px solid #e4e4e7; padding: 10px; border-radius: 8px; margin-bottom: 15px;"></div>

                <!-- Статистика -->
                <div style="background: #fafafa; border: 1px solid #e4e4e7; padding: 12px; border-radius: 8px; margin-bottom: 15px; font-size: 14px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span style="color: #71717a;">Отработано дней:</span> <strong id="statDays">0</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span style="color: #71717a;">Базовые часы:</span> <strong id="statBaseHours">0 ч</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span style="color: #71717a;">Переработка (Nadgodziny):</span> <strong id="statOvertime" style="color: #d97706;">0.0 ч</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span style="color: #71717a;">Ночные часы (22:00-06:00):</span> <strong id="statNight" style="color: #7c3aed;">0.0 ч</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px; border-top: 1px solid #e4e4e7; padding-top: 6px;"><span style="color: #71717a;">Всего часов:</span> <strong id="statTotalHours">0.0 ч</strong></div>
                    <div style="display: flex; justify-content: space-between; font-size: 16px; border-top: 1px solid #e4e4e7; padding-top: 6px; margin-top: 6px; color: #2563eb;"><span>Ориентировочно брутто:</span> <strong id="statTotalMoney">0.00 zł</strong></div>
                </div>

                <button onclick="saveShiftsToServer(); alert('Отчет успешно сохранен!');" style="width: 100%; background: #2563eb; color: #ffffff; border: none; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 15px;">Сохранить отчет</button>
            </div>

            <!-- Вкладка: Расчет зарплаты -->
            <div id="viewSalary" style="display: ${activeTab === 'salary' ? 'block' : 'none'}; background: #fafafa; border: 1px solid #e4e4e7; padding: 15px; border-radius: 8px;">
                <h3 style="margin-top: 0; color: #18181b;">Детализация расчета</h3>
                <p style="color: #71717a; font-size: 14px; line-height: 1.5;">Здесь отображаются подробные начисления по часам, надбавки за ночные смены и праздничные дни согласно вашему графику.</p>
            </div>

        </div>

        <!-- Модальное окно редактирования дня -->
        <div id="dayModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); justify-content: center; align-items: center; z-index: 1000;">
            <div style="background: #ffffff; padding: 20px; border-radius: 12px; width: 90%; max-width: 320px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); color: #18181b;">
                <h3 id="modalTitle" style="margin-top: 0; margin-bottom: 15px; font-size: 18px; text-align: center;">Настройка дня</h3>
                
                <div style="margin-bottom: 12px;">
                    <label style="font-size: 12px; color: #71717a; font-weight: 500;">Тип смены:</label>
                    <select id="modalShiftType" style="width: 100%; background: #ffffff; color: #18181b; border: 1px solid #d4d4d8; padding: 8px; border-radius: 6px; margin-top: 4px;">
                        <option value="none">Выходной / Не работаю</option>
                        <option value="1">1 смена (утренняя)</option>
                        <option value="2">2 смена (вечерняя)</option>
                        <option value="3">3 смена (ночная)</option>
                    </select>
                </div>

                <div style="margin-bottom: 12px;">
                    <label style="font-size: 12px; color: #71717a; font-weight: 500;">Всего часов:</label>
                    <input type="number" id="modalTotalHours" step="0.5" style="width: 100%; background: #ffffff; color: #18181b; border: 1px solid #d4d4d8; padding: 8px; border-radius: 6px; box-sizing: border-box; margin-top: 4px;">
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="font-size: 12px; color: #71717a; font-weight: 500;">Переработка (Nadgodziny):</label>
                    <input type="number" id="modalOvertime" step="0.5" style="width: 100%; background: #ffffff; color: #18181b; border: 1px solid #d4d4d8; padding: 8px; border-radius: 6px; box-sizing: border-box; margin-top: 4px;">
                </div>

                <div style="display: flex; gap: 10px;">
                    <button onclick="closeDayModal()" style="flex: 1; background: #f4f4f5; color: #18181b; border: 1px solid #d4d4d8; padding: 10px; border-radius: 6px; font-weight: 500; cursor: pointer;">Отмена</button>
                    <button onclick="saveDayModal()" style="flex: 1; background: #2563eb; color: #ffffff; border: none; padding: 10px; border-radius: 6px; font-weight: bold; cursor: pointer;">Сохранить</button>
                </div>
            </div>
        </div>
    `;

    renderCalendarGrid();
    calculateStats();
}

// --- ЛОГИКА КАЛЕНДАРЯ И МОДАЛЬНОГО ОКНА ---

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

// Отрисовка сетки дней месяца в светлом стиле
function renderCalendarGrid() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    let html = `<div style="display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-size: 11px; color: #71717a; font-weight: 600; margin-bottom: 8px;">
        <div>Пн</div><div>Вт</div><div>Ср</div><div>Чт</div><div>Пт</div><div>Сб</div><div>Вс</div>
    </div><div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;">`;

    let firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    for (let i = 0; i < firstDayIndex; i++) {
        html += `<div></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const s = scheduleData[day] || { shift: 'none', totalHours: 0, overtime: 0 };
        let bgStyle = '#ffffff';
        let borderStyle = '#d4d4d8';
        let badgeBg = '#f4f4f5';
        let badgeColor = '#71717a';
        let badgeText = 'выходной';

        if (s.shift === '1') {
            bgStyle = '#eff6ff'; borderStyle = '#bfdbfe'; badgeBg = '#dbeafe'; badgeColor = '#1d4ed8'; badgeText = '1 смена';
        } else if (s.shift === '2') {
            bgStyle = '#fff7ed'; borderStyle = '#fed7aa'; badgeBg = '#ffedd5'; badgeColor = '#c2410c'; badgeText = '2 смена';
        } else if (s.shift === '3') {
            bgStyle = '#f5f3ff'; borderStyle = '#ddd6fe'; badgeBg = '#ede9fe'; badgeColor = '#6d28d9'; badgeText = '3 смена';
        }

        html += `
            <div onclick="openDayModal(${day})" style="background: ${bgStyle}; border: 1px solid ${borderStyle}; border-radius: 6px; padding: 6px 2px; text-align: center; cursor: pointer; min-height: 55px; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.2s;">
                <div style="font-size: 12px; font-weight: bold; color: #18181b;">${day}</div>
                <div style="font-size: 9px; background: ${badgeBg}; color: ${badgeColor}; border-radius: 4px; padding: 2px 1px; font-weight: 500;">${badgeText}</div>
            </div>
        `;
    }

    html += `</div>`;
    grid.innerHTML = html;
}

// Открытие модального окна для настройки конкретного дня
function openDayModal(day) {
    selectedDayForModal = day;
    const s = scheduleData[day] || { shift: '1', totalHours: 8, overtime: 0 };
    
    document.getElementById('modalTitle').innerText = `День ${day} ${monthNames[currentMonth]} ${currentYear}`;
    document.getElementById('modalShiftType').value = s.shift || 'none';
    document.getElementById('modalTotalHours').value = s.totalHours !== undefined ? s.totalHours : (s.shift !== 'none' ? 8 : 0);
    document.getElementById('modalOvertime').value = s.overtime || 0;
    
    document.getElementById('dayModal').style.display = 'flex';
}

function closeDayModal() {
    document.getElementById('dayModal').style.display = 'none';
    selectedDayForModal = null;
}

// Сохранение изменений из модального окна
function saveDayModal() {
    if (selectedDayForModal === null) return;
    
    const shiftType = document.getElementById('modalShiftType').value;
    const totalHours = parseFloat(document.getElementById('modalTotalHours').value) || 0;
    const overtime = parseFloat(document.getElementById('modalOvertime').value) || 0;

    if (shiftType === 'none') {
        delete scheduleData[selectedDayForModal];
    } else {
        scheduleData[selectedDayForModal] = {
            shift: shiftType,
            start: '06:00',
            end: '14:00',
            totalHours: totalHours,
            overtime: overtime
        };
    }

    closeDayModal();
    renderCalendarGrid();
    calculateStats();
}

// Расчет статистики
function calculateStats() {
    let daysWorked = 0;
    let totalHours = 0;
    let totalOvertime = 0;

    for (let day in scheduleData) {
        const s = scheduleData[day];
        if (s && s.shift && s.shift !== 'none') {
            daysWorked++;
            totalHours += (s.totalHours || 8);
            totalOvertime += (s.overtime || 0);
        }
    }

    const baseHours = Math.max(0, totalHours - totalOvertime);

    document.getElementById('statDays').innerText = daysWorked;
    document.getElementById('statBaseHours').innerText = `${baseHours.toFixed(1)} ч`;
    document.getElementById('statOvertime').innerText = `${totalOvertime.toFixed(1)} ч`;
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
            showMainScreen();
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