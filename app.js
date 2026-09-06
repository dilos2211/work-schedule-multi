let currentUser = JSON.parse(localStorage.getItem('work_user')) || null;
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let scheduleData = {};
let activeTab = 'calendar';
let selectedDayForModal = null;
let hasUnsavedChanges = false;

let userSettings = {
    calcType: 'monthly',
    monthlyRate: 5500,
    rate: 25,
    bonus: 850,
    manualKantyna: 0,
    shift1Start: '06:00'
};

const monthNames = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

const polishHolidaysFixed = [
    { m: 0, d: 1, name: "Nowy Rok" },
    { m: 0, d: 6, name: "Trzech Króli" },
    { m: 4, d: 1, name: "Święto Pracy" },
    { m: 4, d: 3, name: "Święto Konstytucji 3 Maja" },
    { m: 7, d: 15, name: "Wniebowzięcie NMP" },
    { m: 10, d: 1, name: "Wszystkich Świętych" },
    { m: 10, d: 11, name: "Święto Niepodległości" },
    { m: 11, d: 25, name: "Boże Narodzenie" },
    { m: 11, d: 26, name: "Drugi dzień Bożego Narodzenia" }
];

function getPolishFloatingHolidays(year) {
    let a = year % 19,
        b = Math.floor(year / 100),
        c = year % 100,
        d = Math.floor(b / 4),
        e = b % 4,
        f = Math.floor((b + 8) / 25),
        g = Math.floor((b - f + 1) / 3),
        h = (19 * a + b - d - g + 15) % 30,
        i = Math.floor(c / 4),
        k = c % 4,
        l = (32 + 2 * e + 2 * i - h - k) % 7,
        m = Math.floor((a + 11 * h + 22 * l) / 451),
        month = Math.floor((h + l - 7 * m + 114) / 31) - 1,
        day = ((h + l - 7 * m + 114) % 31) + 1;

    let easterDate = new Date(year, month, day);
    let easterMonday = new Date(easterDate);
    easterMonday.setDate(easterDate.getDate() + 1);

    let pentecost = new Date(easterDate);
    pentecost.setDate(easterDate.getDate() + 49);

    let corpusChristi = new Date(easterDate);
    corpusChristi.setDate(easterDate.getDate() + 60);

    return [
        { m: easterMonday.getMonth(), d: easterMonday.getDate(), name: "Poniedziałek Wielkanocny" },
        { m: pentecost.getMonth(), d: pentecost.getDate(), name: "Zielone Świątki" },
        { m: corpusChristi.getMonth(), d: corpusChristi.getDate(), name: "Boże Ciało" }
    ];
}

function getHolidayName(year, month, day) {
    let holidays = [...polishHolidaysFixed, ...getPolishFloatingHolidays(year)];
    let found = holidays.find(h => h.m === month && h.d === day);
    return found ? found.name : null;
}

function addHoursToTime(timeStr, hoursToAdd) {
    let [h, m] = timeStr.split(':').map(Number);
    let totalM = h * 60 + m + hoursToAdd * 60;
    let newH = Math.floor(totalM / 60) % 24;
    let newM = totalM % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

function getCalculatedShiftsConfig() {
    const s1Start = userSettings.shift1Start || '06:00';
    const s1End = addHoursToTime(s1Start, 8);
    const s2Start = s1End;
    const s2End = addHoursToTime(s2Start, 8);
    const s3Start = s2End;
    const s3End = s1Start;

    return {
        '1': { start: s1Start, end: s1End },
        '2': { start: s2Start, end: s2End },
        '3': { start: s3Start, end: s3End }
    };
}

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    let metaViewport = document.querySelector('meta[name=viewport]');
    if (!metaViewport) {
        metaViewport = document.createElement('meta');
        metaViewport.name = 'viewport';
        document.head.appendChild(metaViewport);
    }
    metaViewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';

    if (!currentUser) {
        showAuthScreen();
    } else {
        loadSettings().then(() => {
            showMainScreen();
            loadShifts();
        });
    }
}

// --- ЭКРАН АВТОРИЗАЦИИ ---

function showAuthScreen() {
    document.body.style.backgroundColor = "#f4f4f5";
    document.body.style.margin = "0";
    document.body.style.padding = "10px";
    document.body.style.boxSizing = "border-box";
    
    document.body.innerHTML = `
        <div class="auth-container" style="display: flex; justify-content: center; align-items: center; min-height: 95vh;">
            <div class="auth-card" id="authCard" style="background: #ffffff; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 100%; max-width: 400px; color: #18181b; box-sizing: border-box;">
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
                    <button type="submit" id="authBtn" style="width: 100%; background: #2563eb; color: #ffffff; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 15px; box-sizing: border-box;">Войти</button>
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
    const endpoint = isRegisterMode ? '/api/register' : '/api/login';

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

// --- ГЛАВНЫЙ ЭКРАН ---

function showMainScreen() {
    const isHourly = userSettings.calcType === 'hourly';
    const shifts = getCalculatedShiftsConfig();

    document.body.style.backgroundColor = "#f4f4f5";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.boxSizing = "border-box";

    document.body.innerHTML = `
        <div class="main-wrapper" style="width: 100%; max-width: 480px; margin: 0 auto; font-family: sans-serif; background: #ffffff; color: #18181b; padding: 10px; box-sizing: border-box; min-height: 100vh;">
            
            <!-- Навигационные вкладки -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 4px;">
                <div style="display: flex; background: #f4f4f5; padding: 3px; border-radius: 8px; flex-grow: 1; justify-content: space-around;">
                    <button onclick="switchTab('calendar')" id="tabCalendar" style="background: ${activeTab === 'calendar' ? '#2563eb' : 'transparent'}; color: ${activeTab === 'calendar' ? '#ffffff' : '#71717a'}; border: none; padding: 8px 6px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px; flex: 1;">📅 Календарь</button>
                    <button onclick="switchTab('salary')" id="tabSalary" style="background: ${activeTab === 'salary' ? '#2563eb' : 'transparent'}; color: ${activeTab === 'salary' ? '#ffffff' : '#71717a'}; border: none; padding: 8px 6px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px; flex: 1;">💰 Зарплата</button>
                    <button onclick="switchTab('settings')" id="tabSettings" style="background: ${activeTab === 'settings' ? '#2563eb' : 'transparent'}; color: ${activeTab === 'settings' ? '#ffffff' : '#71717a'}; border: none; padding: 8px 6px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px; flex: 1;">⚙️ Настройки</button>
                </div>
                <button onclick="logout()" style="background: #fee2e2; color: #dc2626; border: none; padding: 8px 8px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 500; white-space: nowrap;">Выйти</button>
            </div>

            <!-- Вкладка: Календарь -->
            <div id="viewCalendar" style="display: ${activeTab === 'calendar' ? 'block' : 'none'};">
                
                <div style="background: #fafafa; border: 1px solid #e4e4e7; padding: 10px; border-radius: 8px; margin-bottom: 12px; display: grid; grid-template-columns: 2fr 1fr; gap: 8px; box-sizing: border-box;">
                    <div>
                        <label style="font-size: 12px; color: #71717a; font-weight: 500; display: block; margin-bottom: 3px;">Месяц:</label>
                        <select id="selectMonth" onchange="changeMonthYear()" style="width: 100%; background: #ffffff; color: #18181b; border: 1px solid #d4d4d8; padding: 8px 6px; border-radius: 6px; box-sizing: border-box;">
                            ${monthNames.map((m, idx) => `<option value="${idx}" ${idx === currentMonth ? 'selected' : ''}>${m}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="font-size: 12px; color: #71717a; font-weight: 500; display: block; margin-bottom: 3px;">Год:</label>
                        <select id="selectYear" onchange="changeMonthYear()" style="width: 100%; background: #ffffff; color: #18181b; border: 1px solid #d4d4d8; padding: 8px 6px; border-radius: 6px; box-sizing: border-box;">
                            <option value="2025" ${currentYear === 2025 ? 'selected' : ''}>2025</option>
                            <option value="2026" ${currentYear === 2026 ? 'selected' : ''}>2026</option>
                            <option value="2027" ${currentYear === 2027 ? 'selected' : ''}>2027</option>
                        </select>
                    </div>
                </div>

                <div style="background: #fafafa; border: 1px solid #e4e4e7; padding: 10px; border-radius: 8px; margin-bottom: 12px; box-sizing: border-box;">
                    <div style="margin-bottom: 8px;">
                        <label style="font-size: 12px; color: #71717a; font-weight: 500; display: block; margin-bottom: 3px;">Тип оплаты:</label>
                        <select id="calcType" onchange="updateSettingsFromUI()" style="width: 100%; background: #ffffff; color: #18181b; border: 1px solid #d4d4d8; padding: 8px; border-radius: 6px; box-sizing: border-box;">
                            <option value="monthly" ${!isHourly ? 'selected' : ''}>Оклад за месяц (брутто)</option>
                            <option value="hourly" ${isHourly ? 'selected' : ''}>Почасовая ставка (нетто)</option>
                        </select>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <div>
                            <label style="font-size: 11px; color: #71717a; font-weight: 500; display: block; margin-bottom: 3px;" id="labelRateName">${isHourly ? 'Ставка час (нетто):' : 'Оклад брутто (zł):'}</label>
                            <input type="number" id="inputRateValue" value="${isHourly ? userSettings.rate : userSettings.monthlyRate}" oninput="updateSettingsFromUI()" style="width: 100%; background: #ffffff; color: #18181b; border: 1px solid #d4d4d8; padding: 8px; border-radius: 6px; box-sizing: border-box;">
                        </div>
                        <div>
                            <label style="font-size: 11px; color: #71717a; font-weight: 500; display: block; margin-bottom: 3px;">Премия (zł):</label>
                            <input type="number" id="inputBonus" value="${userSettings.bonus}" oninput="updateSettingsFromUI()" style="width: 100%; background: #ffffff; color: #18181b; border: 1px solid #d4d4d8; padding: 8px; border-radius: 6px; box-sizing: border-box;">
                        </div>
                    </div>
                </div>

                <!-- Сетка календаря -->
                <div id="calendarGrid" style="background: #fafafa; border: 1px solid #e4e4e7; padding: 8px; border-radius: 8px; margin-bottom: 12px; box-sizing: border-box;"></div>

                <!-- Статистика -->
                <div style="background: #fafafa; border: 1px solid #e4e4e7; padding: 10px; border-radius: 8px; margin-bottom: 12px; font-size: 13px; box-sizing: border-box;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span style="color: #71717a;">Отработано дней:</span> <strong id="statDays">0</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span style="color: #71717a;">Базовые часы:</span> <strong id="statBaseHours">0 ч</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span style="color: #71717a;">Переработка (Nadgodziny):</span> <strong id="statOvertime" style="color: #d97706;">0.0 ч</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span style="color: #71717a;">Ночные часы (22:00-06:00):</span> <strong id="statNight" style="color: #7c3aed;">0.0 ч</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; border-top: 1px solid #e4e4e7; padding-top: 5px;"><span style="color: #71717a;">Всего часов:</span> <strong id="statTotalHours">0.0 ч</strong></div>
                    <div style="display: flex; justify-content: space-between; font-size: 15px; border-top: 1px solid #e4e4e7; padding-top: 5px; margin-top: 5px; color: #2563eb;"><span>Итого (${isHourly ? 'нетто' : 'брутто'}):</span> <strong id="statTotalMoney">0.00 zł</strong></div>
                </div>

                <!-- Плашка статуса сохранения -->
                <div id="saveStatusBadge" style="padding: 8px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; text-align: center; margin-bottom: 10px; display: none; box-sizing: border-box;"></div>

                <button onclick="saveAllData();" style="width: 100%; background: #2563eb; color: #ffffff; border: none; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 15px; box-sizing: border-box; margin-bottom: 20px;">Сохранить отчет</button>
            </div>

            <!-- Вкладка: Зарплата -->
            <div id="viewSalary" style="display: ${activeTab === 'salary' ? 'block' : 'none'}; background: #fafafa; border: 1px solid #e4e4e7; padding: 12px; border-radius: 8px; box-sizing: border-box;">
                <h3 style="margin-top: 0; color: #18181b; font-size: 16px;">Детализация расчета</h3>
                <p style="color: #71717a; font-size: 13px; line-height: 1.4;">Здесь отображаются подробные начисления по часам, надбавки за ночные смены и праздничные дни согласно вашему графику.</p>
            </div>

            <!-- Вкладка: Настройки -->
            <div id="viewSettings" style="display: ${activeTab === 'settings' ? 'block' : 'none'}; background: #fafafa; border: 1px solid #e4e4e7; padding: 12px; border-radius: 8px; box-sizing: border-box;">
                <h3 style="margin-top: 0; color: #18181b; font-size: 16px; margin-bottom: 10px;">⏰ Настройка времени смен</h3>
                <p style="color: #71717a; font-size: 12px; line-height: 1.4; margin-bottom: 15px;">Укажите время начала 1-й смены. Остальные смены рассчитаются автоматически (+8 часов каждая).</p>
                
                <div style="background: #ffffff; border: 1px solid #e4e4e7; padding: 10px; border-radius: 8px; margin-bottom: 15px;">
                    <label style="font-size: 12px; font-weight: bold; color: #1d4ed8; display: block; margin-bottom: 5px;">Начало 1-й смены:</label>
                    <input type="time" id="cfgShift1Start" value="${userSettings.shift1Start}" onchange="updateShift1ConfigFromUI()" style="width: 100%; border: 1px solid #d4d4d8; padding: 8px; border-radius: 6px; box-sizing: border-box; background: #fff; font-size: 14px;">
                </div>

                <div style="background: #ffffff; border: 1px solid #e4e4e7; padding: 10px; border-radius: 8px; margin-bottom: 15px; font-size: 12px; color: #52525b; line-height: 1.5;">
                    <div style="font-weight: bold; margin-bottom: 5px; color: #18181b;">Автоматический график:</div>
                    <div>🟢 1 смена: <strong>${shifts['1'].start} - ${shifts['1'].end}</strong></div>
                    <div>🟠 2 смена: <strong>${shifts['2'].start} - ${shifts['2'].end}</strong></div>
                    <div>🟣 3 смена: <strong>${shifts['3'].start} - ${shifts['3'].end}</strong></div>
                </div>

                <div id="saveStatusBadgeSettings" style="padding: 8px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; text-align: center; margin-bottom: 10px; display: none; box-sizing: border-box;"></div>

                <button onclick="saveAllData()" style="width: 100%; background: #2563eb; color: #ffffff; border: none; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;">Сохранить настройки</button>
            </div>

        </div>

        <!-- Модальное окно редактирования дня -->
        <div id="dayModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); justify-content: center; align-items: center; z-index: 1000; box-sizing: border-box; padding: 15px;">
            <div style="background: #ffffff; padding: 15px; border-radius: 12px; width: 100%; max-width: 380px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); color: #18181b; position: relative; box-sizing: border-box; max-height: 90vh; overflow-y: auto;">
                
                <button onclick="closeDayModal()" style="position: absolute; top: 12px; right: 12px; background: transparent; border: none; font-size: 18px; cursor: pointer; color: #71717a; padding: 4px;">✕</button>

                <h3 id="modalTitle" style="margin-top: 0; margin-bottom: 10px; font-size: 16px; font-weight: bold;">1 Сентябрь</h3>
                
                <div style="font-size: 11px; color: #71717a; margin-bottom: 4px; font-weight: 500;">Быстрый выбор смены:</div>
                
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-bottom: 10px;">
                    <button type="button" id="btnShift1" onclick="selectModalShift('1')" style="padding: 6px 2px; border-radius: 6px; border: 1px solid #d4d4d8; background: #ffffff; color: #18181b; font-size: 11px; font-weight: bold; cursor: pointer;">1 смена</button>
                    <button type="button" id="btnShift2" onclick="selectModalShift('2')" style="padding: 6px 2px; border-radius: 6px; border: 1px solid #d4d4d8; background: #ffffff; color: #18181b; font-size: 11px; font-weight: bold; cursor: pointer;">2 смена</button>
                    <button type="button" id="btnShift3" onclick="selectModalShift('3')" style="padding: 6px 2px; border-radius: 6px; border: 1px solid #d4d4d8; background: #ffffff; color: #18181b; font-size: 11px; font-weight: bold; cursor: pointer;">3 смена</button>
                    <button type="button" id="btnShiftNone" onclick="selectModalShift('none')" style="padding: 6px 2px; border-radius: 6px; border: 1px solid #d4d4d8; background: #ffffff; color: #71717a; font-size: 10px; font-weight: bold; cursor: pointer;">Выходной</button>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
                    <div>
                        <label style="font-size: 11px; color: #71717a; font-weight: 500; display: block; margin-bottom: 2px;">Начало:</label>
                        <input type="time" id="modalStart" value="06:00" onchange="recalculateModalHours()" style="width: 100%; background: #ffffff; color: #18181b; border: 1px solid #d4d4d8; padding: 6px; border-radius: 6px; box-sizing: border-box; font-size: 13px;">
                    </div>
                    <div>
                        <label style="font-size: 11px; color: #71717a; font-weight: 500; display: block; margin-bottom: 2px;">Конец:</label>
                        <input type="time" id="modalEnd" value="14:00" onchange="recalculateModalHours()" style="width: 100%; background: #ffffff; color: #18181b; border: 1px solid #d4d4d8; padding: 6px; border-radius: 6px; box-sizing: border-box; font-size: 13px;">
                    </div>
                </div>

                <!-- Поля для доплат и надбавок -->
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-bottom: 10px;">
                    <div>
                        <label style="font-size: 10px; color: #71717a; font-weight: 500; display: block; margin-bottom: 2px;">Часы +50%:</label>
                        <input type="number" step="0.5" id="modalHours50" value="0" style="width: 100%; background: #ffffff; color: #18181b; border: 1px solid #d4d4d8; padding: 6px; border-radius: 6px; box-sizing: border-box; font-size: 13px;">
                    </div>
                    <div>
                        <label style="font-size: 10px; color: #71717a; font-weight: 500; display: block; margin-bottom: 2px;">Часы +100%:</label>
                        <input type="number" step="0.5" id="modalHours100" value="0" style="width: 100%; background: #ffffff; color: #18181b; border: 1px solid #d4d4d8; padding: 6px; border-radius: 6px; box-sizing: border-box; font-size: 13px;">
                    </div>
                    <div>
                        <label style="font-size: 10px; color: #71717a; font-weight: 500; display: block; margin-bottom: 2px;">Доплата (zł):</label>
                        <input type="number" step="1" id="modalBonusZl" value="0" style="width: 100%; background: #ffffff; color: #18181b; border: 1px solid #d4d4d8; padding: 6px; border-radius: 6px; box-sizing: border-box; font-size: 13px;">
                    </div>
                </div>

                <div id="modalStatsInfo" style="background: #f4f4f5; padding: 6px; border-radius: 6px; font-size: 11px; text-align: center; color: #3f3f46; margin-bottom: 10px; font-weight: 500;">
                    Всего: 8h | База: 8h | Nadg: 0h
                </div>

                <button onclick="saveDayModal()" style="width: 100%; background: #2563eb; color: #ffffff; border: none; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px; box-sizing: border-box;">Применить</button>
            </div>
        </div>
    `;

    renderCalendarGrid();
    calculateStats();
    updateSaveStatusUI();
}

function setUnsaved() {
    hasUnsavedChanges = true;
    updateSaveStatusUI();
}

function updateSaveStatusUI() {
    ['saveStatusBadge', 'saveStatusBadgeSettings'].forEach(id => {
        const badge = document.getElementById(id);
        if (!badge) return;

        badge.style.display = 'block';
        if (hasUnsavedChanges) {
            badge.style.background = '#fef3c7';
            badge.style.color = '#d97706';
            badge.style.border = '1px solid #fde68a';
            badge.innerText = '⚠️ Данные нужно сохранить';
        } else {
            badge.style.background = '#dcfce7';
            badge.style.color = '#16a34a';
            badge.style.border = '1px solid #bbf7d0';
            badge.innerText = '✅ Данные сохранены';
        }
    });
}

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
    const valInput = parseFloat(document.getElementById('inputRateValue').value) || 0;
    
    if (userSettings.calcType === 'hourly') {
        userSettings.rate = valInput;
    } else {
        userSettings.monthlyRate = valInput;
    }
    
    userSettings.bonus = parseFloat(document.getElementById('inputBonus').value) || 0;
    
    const labelElem = document.getElementById('labelRateName');
    if (labelElem) {
        labelElem.innerText = userSettings.calcType === 'hourly' ? 'Ставка час (нетто):' : 'Оклад брутто (zł):';
    }

    setUnsaved();
    calculateStats();
}

function updateShift1ConfigFromUI() {
    userSettings.shift1Start = document.getElementById('cfgShift1Start').value;
    setUnsaved();
    showMainScreen();
}

function renderCalendarGrid() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    let html = `<div style="display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-size: 11px; font-weight: 600; margin-bottom: 6px;">
        <div style="color: #71717a;">Пн</div>
        <div style="color: #71717a;">Вт</div>
        <div style="color: #71717a;">Ср</div>
        <div style="color: #71717a;">Чт</div>
        <div style="color: #71717a;">Пт</div>
        <div style="color: #dc2626;">Сб</div>
        <div style="color: #dc2626;">Вс</div>
    </div><div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px;">`;

    let firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    for (let i = 0; i < firstDayIndex; i++) {
        html += `<div></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const s = scheduleData[day] || { shift: 'none', totalHours: 0, overtime: 0 };
        
        let dateObj = new Date(currentYear, currentMonth, day);
        let dayOfWeek = dateObj.getDay();
        let isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        let holidayName = getHolidayName(currentYear, currentMonth, day);
        let isHoliday = (holidayName !== null);

        let bgStyle = '#ffffff';
        let borderStyle = '#d4d4d8';
        let badgeBg = '#f4f4f5';
        let badgeColor = '#71717a';
        let badgeText = '-';
        let dayNumberColor = '#18181b';

        if (s.shift === '1') {
            bgStyle = '#eff6ff'; borderStyle = '#bfdbfe'; badgeBg = '#dbeafe'; badgeColor = '#1d4ed8'; 
            badgeText = `${s.totalHours || 8}h`;
        } else if (s.shift === '2') {
            bgStyle = '#fff7ed'; borderStyle = '#fed7aa'; badgeBg = '#ffedd5'; badgeColor = '#c2410c'; 
            badgeText = `${s.totalHours || 8}h`;
        } else if (s.shift === '3') {
            bgStyle = '#f5f3ff'; borderStyle = '#ddd6fe'; badgeBg = '#ede9fe'; badgeColor = '#6d28d9'; 
            badgeText = `${s.totalHours || 8}h`;
        }

        // Если есть переработка, отобразим её акцентом
        if (s.overtime && s.overtime > 0) {
            badgeText = `${s.totalHours}h (+${s.overtime})`;
        }

        if (isWeekend || isHoliday) {
            dayNumberColor = '#dc2626';
            if (s.shift === 'none') {
                borderStyle = '#fca5a5';
                bgStyle = '#fef2f2';
                if (isHoliday) badgeText = 'święto';
            }
        }

        html += `
            <div onclick="openDayModal(${day})" title="${holidayName ? 'Święto: ' + holidayName : (isWeekend ? 'Wolne (Weekend)' : '')}" style="background: ${bgStyle}; border: 1px solid ${borderStyle}; border-radius: 5px; padding: 4px 2px; text-align: center; cursor: pointer; min-height: 52px; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box;">
                <div style="font-size: 11px; font-weight: bold; color: ${dayNumberColor};">${day}</div>
                <div style="font-size: 8px; background: ${badgeBg}; color: ${badgeColor}; border-radius: 3px; padding: 2px 1px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${badgeText}</div>
            </div>
        `;
    }

    html += `</div>`;
    grid.innerHTML = html;
}

let currentModalShift = '1';

function openDayModal(day) {
    selectedDayForModal = day;
    const shiftsConfig = getCalculatedShiftsConfig();
    const defaultShiftTime = shiftsConfig['1'];
    const s = scheduleData[day] || { shift: '1', start: defaultShiftTime.start, end: defaultShiftTime.end, hours50: 0, hours100: 0, bonusZl: 0 };
    
    document.getElementById('modalTitle').innerText = `${day} ${monthNames[currentMonth]}`;
    currentModalShift = s.shift || '1';
    
    document.getElementById('modalStart').value = s.start || defaultShiftTime.start;
    document.getElementById('modalEnd').value = s.end || defaultShiftTime.end;
    document.getElementById('modalHours50').value = s.hours50 || 0;
    document.getElementById('modalHours100').value = s.hours100 || 0;
    document.getElementById('modalBonusZl').value = s.bonusZl || 0;
    
    updateModalShiftButtons();
    recalculateModalHours();
    
    document.getElementById('dayModal').style.display = 'flex';
}

function closeDayModal() {
    document.getElementById('dayModal').style.display = 'none';
    selectedDayForModal = null;
}

function selectModalShift(shiftType) {
    currentModalShift = shiftType;
    updateModalShiftButtons();

    if (shiftType !== 'none') {
        const shiftsConfig = getCalculatedShiftsConfig();
        const cfg = shiftsConfig[shiftType];
        if (cfg) {
            document.getElementById('modalStart').value = cfg.start;
            document.getElementById('modalEnd').value = cfg.end;
        }
    }
    recalculateModalHours();
}

function updateModalShiftButtons() {
    ['1', '2', '3', 'none'].forEach(type => {
        const btn = document.getElementById(type === 'none' ? 'btnShiftNone' : `btnShift${type}`);
        if (!btn) return;
        if (currentModalShift === type) {
            btn.style.background = '#2563eb';
            btn.style.color = '#ffffff';
            btn.style.borderColor = '#2563eb';
        } else {
            btn.style.background = '#ffffff';
            btn.style.color = type === 'none' ? '#71717a' : '#18181b';
            btn.style.borderColor = '#d4d4d8';
        }
    });
}

function recalculateModalHours() {
    const startStr = document.getElementById('modalStart').value;
    const endStr = document.getElementById('modalEnd').value;
    
    if (!startStr || !endStr) return;

    let [startH, startM] = startStr.split(':').map(Number);
    let [endH, endM] = endStr.split(':').map(Number);

    let startMinutes = startH * 60 + startM;
    let endMinutes = endH * 60 + endM;

    if (endMinutes <= startMinutes) {
        endMinutes += 24 * 60;
    }

    let diffMinutes = endMinutes - startMinutes;
    let totalH = diffMinutes / 60;
    let baseH = Math.min(totalH, 8);
    let nadgH = Math.max(0, totalH - 8);

    document.getElementById('modalStatsInfo').innerText = 
        `Всего: ${totalH}h | База: ${baseH}h | Nadg: ${nadgH}h`;
}

function saveDayModal() {
    if (selectedDayForModal === null) return;
    
    const startStr = document.getElementById('modalStart').value;
    const endStr = document.getElementById('modalEnd').value;
    const h50 = parseFloat(document.getElementById('modalHours50').value) || 0;
    const h100 = parseFloat(document.getElementById('modalHours100').value) || 0;
    const bZl = parseFloat(document.getElementById('modalBonusZl').value) || 0;

    let [startH, startM] = startStr.split(':').map(Number);
    let [endH, endM] = endStr.split(':').map(Number);
    let startMinutes = startH * 60 + startM;
    let endMinutes = endH * 60 + endM;
    if (endMinutes <= startMinutes) endMinutes += 24 * 60;
    
    let totalH = (endMinutes - startMinutes) / 60;
    let nadgH = Math.max(0, totalH - 8);

    if (currentModalShift === 'none' && totalH === 0 && h50 === 0 && h100 === 0 && bZl === 0) {
        delete scheduleData[selectedDayForModal];
    } else {
        scheduleData[selectedDayForModal] = {
            shift: currentModalShift,
            start: startStr,
            end: endStr,
            totalHours: totalH,
            overtime: nadgH,
            hours50: h50,
            hours100: h100,
            bonusZl: bZl
        };
    }

    closeDayModal();
    renderCalendarGrid();
    calculateStats();
    setUnsaved();
}

function calculateStats() {
    let daysWorked = 0;
    let totalHours = 0;
    let totalOvertime = 0;
    let calculatedMoney = 0;

    const hourlyRate = userSettings.rate || 25;
    const isHourly = userSettings.calcType === 'hourly';

    for (let day in scheduleData) {
        const s = scheduleData[day];
        if (s && s.shift && s.shift !== 'none') {
            daysWorked++;
            const tH = (s.totalHours || 8);
            totalHours += tH;
            totalOvertime += (s.overtime || 0);

            if (isHourly) {
                calculatedMoney += tH * hourlyRate;
                calculatedMoney += (s.hours50 || 0) * (hourlyRate * 1.5);
                calculatedMoney += (s.hours100 || 0) * (hourlyRate * 2.0);
            }
            calculatedMoney += (s.bonusZl || 0);
        }
    }

    const baseHours = Math.max(0, totalHours - totalOvertime);

    document.getElementById('statDays').innerText = daysWorked;
    document.getElementById('statBaseHours').innerText = `${baseHours.toFixed(1)} ч`;
    document.getElementById('statOvertime').innerText = `${totalOvertime.toFixed(1)} ч`;
    document.getElementById('statNight').innerText = `0.0 ч`;
    document.getElementById('statTotalHours').innerText = `${totalHours.toFixed(1)} ч`;

    let totalMoney = 0;
    if (isHourly) {
        totalMoney = calculatedMoney + userSettings.bonus;
    } else {
        totalMoney = userSettings.monthlyRate + userSettings.bonus + calculatedMoney;
    }

    document.getElementById('statTotalMoney').innerText = `${totalMoney.toFixed(2)} zł`;
}

// --- СЕТЕВЫЕ ЗАПРОСЫ (API) ---

async function loadSettings() {
    if (!currentUser) return;
    try {
        const res = await fetch(`/api/settings?userId=${currentUser.id}`);
        const data = await res.json();
        if (data && data.user_id) {
            userSettings.calcType = data.calc_type || 'monthly';
            userSettings.monthlyRate = data.monthly_rate !== undefined ? data.monthly_rate : 5500;
            userSettings.rate = data.rate !== undefined ? data.rate : 25;
            userSettings.bonus = data.bonus !== undefined ? data.bonus : 850;
            userSettings.manualKantyna = data.manual_kantyna !== undefined ? data.manual_kantyna : 0;
            userSettings.shift1Start = data.shift1_start || '06:00';
        }
    } catch (e) {
        console.error('Ошибка загрузки настроек:', e);
    }
}

async function saveSettingsToServer() {
    if (!currentUser) return;
    try {
        await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                calcType: userSettings.calcType,
                monthlyRate: userSettings.monthlyRate,
                rate: userSettings.rate,
                bonus: userSettings.bonus,
                manualKantyna: userSettings.manualKantyna,
                shift1Start: userSettings.shift1Start
            })
        });
    } catch (e) {
        console.error('Ошибка сохранения настроек:', e);
        throw e;
    }
}

async function loadShifts() {
    if (!currentUser) return;
    try {
        const res = await fetch(`/api/shifts?userId=${currentUser.id}&year=${currentYear}&month=${currentMonth}`);
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
                    overtime: item.overtime_hours,
                    hours50: item.hours_50 || 0,
                    hours100: item.hours_100 || 0,
                    bonusZl: item.bonus_zl || 0
                };
            });
        }
        hasUnsavedChanges = false;
        renderCalendarGrid();
        calculateStats();
        updateSaveStatusUI();
    } catch (e) {
        console.error('Ошибка загрузки смен:', e);
    }
}

async function saveAllData() {
    if (!currentUser) return;
    try {
        await saveSettingsToServer();
        await fetch('/api/shifts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                year: currentYear,
                month: currentMonth,
                scheduleData: scheduleData
            })
        });
        hasUnsavedChanges = false;
        updateSaveStatusUI();
    } catch (e) {
        console.error('Ошибка сохранения отчета:', e);
        const badge = document.getElementById('saveStatusBadge') || document.getElementById('saveStatusBadgeSettings');
        if (badge) {
            badge.style.display = 'block';
            badge.style.background = '#fee2e2';
            badge.style.color = '#dc2626';
            badge.style.border = '1px solid #fca5a5';
            badge.innerText = '❌ Ошибка при сохранении!';
        }
    }
}