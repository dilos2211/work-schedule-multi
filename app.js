import { t, getLang, setLang } from './translations.js';
import { 
    currentUser, currentYear, currentMonth, scheduleData, activeTab, 
    selectedDayForModal, hasUnsavedChanges, currentModalShift, isRegisterMode,
    userSettings, setCurrentUser, setYearMonth, setActiveTab, setSelectedDay, 
    setUnsavedChanges, setModalShift, setRegisterMode, getHolidayName, 
    getCalculatedShiftsConfig 
} from './config.js';
import { apiLoadSettings, apiLoadShifts, apiSaveAll } from './api.js';

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
        apiLoadSettings().then(() => {
            showMainScreen();
            apiLoadShifts(() => {
                setUnsavedChanges(false);
                renderCalendarGrid();
                calculateStats();
                updateSaveStatusUI();
            });
        });
    }
}

// Делаем функции доступными глобально для вызова из HTML (onclick="...")
window.toggleLanguage = function(lang) {
    setLang(lang);
    if (!currentUser) {
        showAuthScreen();
    } else {
        showMainScreen();
    }
};

window.toggleAuthMode = function(e) {
    e.preventDefault();
    setRegisterMode(!isRegisterMode);
    showAuthScreen();
};

window.handleAuth = async function(event) {
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

        setCurrentUser(data.user);
        location.reload();
    } catch (err) {
        errBox.innerText = err.message;
        errBox.style.display = 'block';
    }
};

window.logout = function() {
    setCurrentUser(null);
    location.reload();
};

window.switchTab = function(tab) {
    setActiveTab(tab);
    showMainScreen();
};

window.changeMonthYear = function() {
    let m = parseInt(document.getElementById('selectMonth').value);
    let y = parseInt(document.getElementById('selectYear').value);
    setYearMonth(y, m);
    apiLoadShifts(() => {
        setUnsavedChanges(false);
        renderCalendarGrid();
        calculateStats();
        updateSaveStatusUI();
    });
};

window.updateSettingsFromUI = function() {
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
        labelElem.innerText = userSettings.calcType === 'hourly' ? t('rateHourlyLabel') : t('rateMonthlyLabel');
    }

    setUnsavedChanges(true);
    updateSaveStatusUI();
    calculateStats();
};

window.updateShift1ConfigFromUI = function() {
    userSettings.shift1Start = document.getElementById('cfgShift1Start').value;
    setUnsavedChanges(true);
    updateSaveStatusUI();
    showMainScreen();
};

function showAuthScreen() {
    const lang = getLang();
    document.body.style.backgroundColor = "#f4f4f5";
    document.body.style.margin = "0";
    document.body.style.padding = "10px";
    document.body.style.boxSizing = "border-box";
    
    document.body.innerHTML = `
        <div class="auth-container" style="display: flex; justify-content: center; align-items: center; min-height: 95vh;">
            <div class="auth-card" style="background: #ffffff; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 100%; max-width: 400px; color: #18181b; box-sizing: border-box;">
                
                <div style="display: flex; justify-content: flex-end; gap: 5px; margin-bottom: 15px;">
                    <button onclick="toggleLanguage('pl')" style="background: ${lang === 'pl' ? '#2563eb' : '#e4e4e7'}; color: ${lang === 'pl' ? '#fff' : '#333'}; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; cursor: pointer;">PL</button>
                    <button onclick="toggleLanguage('uk')" style="background: ${lang === 'uk' ? '#2563eb' : '#e4e4e7'}; color: ${lang === 'uk' ? '#fff' : '#333'}; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; cursor: pointer;">UA</button>
                </div>

                <h2 style="margin-top: 0; text-align: center; color: #18181b;">${isRegisterMode ? t('registerTitle') : t('loginTitle')}</h2>
                <div id="errorMsg" class="error-msg" style="display:none; color:#dc2626; margin-bottom:10px; font-size: 14px;"></div>
                <form id="authForm" onsubmit="handleAuth(event)">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-size: 14px; font-weight: 500;">${t('emailLabel')}</label>
                        <input type="email" id="authEmail" required style="width: 100%; padding: 10px; border: 1px solid #d4d4d8; border-radius: 6px; box-sizing: border-box; font-size: 14px;">
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-size: 14px; font-weight: 500;">${t('passwordLabel')}</label>
                        <input type="password" id="authPassword" required style="width: 100%; padding: 10px; border: 1px solid #d4d4d8; border-radius: 6px; box-sizing: border-box; font-size: 14px;">
                    </div>
                    <button type="submit" style="width: 100%; background: #2563eb; color: #ffffff; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 15px;">${isRegisterMode ? t('registerBtn') : t('loginBtn')}</button>
                </form>
                <p style="text-align: center; margin-top: 15px; font-size: 14px;">
                    <span style="color: #71717a;">${isRegisterMode ? t('hasAccount') : t('noAccount')}</span> 
                    <a href="#" onclick="toggleAuthMode(event)" style="color: #2563eb; text-decoration: none; font-weight: 500;">${isRegisterMode ? t('loginLink') : t('registerLink')}</a>
                </p>
            </div>
        </div>
    `;
}

function showMainScreen() {
    const lang = getLang();
    const isHourly = userSettings.calcType === 'hourly';
    const shifts = getCalculatedShiftsConfig();
    const monthNames = translations[lang].months;

    document.body.style.backgroundColor = "#f4f4f5";
    document.body.style.margin = "0";
    document.body.style.padding = "0";

    document.body.innerHTML = `
        <div style="width: 100%; max-width: 480px; margin: 0 auto; font-family: sans-serif; background: #ffffff; color: #18181b; padding: 10px; box-sizing: border-box; min-height: 100vh;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 4px;">
                <div style="display: flex; background: #f4f4f5; padding: 3px; border-radius: 8px; flex-grow: 1; justify-content: space-around;">
                    <button onclick="switchTab('calendar')" style="background: ${activeTab === 'calendar' ? '#2563eb' : 'transparent'}; color: ${activeTab === 'calendar' ? '#ffffff' : '#71717a'}; border: none; padding: 8px 6px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 11px; flex: 1;">${t('tabCalendar')}</button>
                    <button onclick="switchTab('salary')" style="background: ${activeTab === 'salary' ? '#2563eb' : 'transparent'}; color: ${activeTab === 'salary' ? '#ffffff' : '#71717a'}; border: none; padding: 8px 6px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 11px; flex: 1;">${t('tabSalary')}</button>
                    <button onclick="switchTab('settings')" style="background: ${activeTab === 'settings' ? '#2563eb' : 'transparent'}; color: ${activeTab === 'settings' ? '#ffffff' : '#71717a'}; border: none; padding: 8px 6px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 11px; flex: 1;">${t('tabSettings')}</button>
                </div>
                
                <div style="display: flex; gap: 3px;">
                    <button onclick="toggleLanguage('pl')" style="background: ${lang === 'pl' ? '#2563eb' : '#e4e4e7'}; color: ${lang === 'pl' ? '#fff' : '#333'}; border: none; padding: 6px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; cursor: pointer;">PL</button>
                    <button onclick="toggleLanguage('uk')" style="background: ${lang === 'uk' ? '#2563eb' : '#e4e4e7'}; color: ${lang === 'uk' ? '#fff' : '#333'}; border: none; padding: 6px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; cursor: pointer;">UA</button>
                    <button onclick="logout()" style="background: #fee2e2; color: #dc2626; border: none; padding: 6px 8px; border-radius: 6px; cursor: pointer; font-size: 10px; font-weight: 500;">✕</button>
                </div>
            </div>

            <!-- Вкладка: Календарь -->
            <div style="display: ${activeTab === 'calendar' ? 'block' : 'none'};">
                <div style="background: #fafafa; border: 1px solid #e4e4e7; padding: 10px; border-radius: 8px; margin-bottom: 12px; display: grid; grid-template-columns: 2fr 1fr; gap: 8px;">
                    <div>
                        <label style="font-size: 12px; color: #71717a; font-weight: 500; display: block; margin-bottom: 3px;">${t('monthLabel')}</label>
                        <select id="selectMonth" onchange="changeMonthYear()" style="width: 100%; background: #ffffff; color: #18181b; border: 1px solid #d4d4d8; padding: 8px 6px; border-radius: 6px;">
                            ${monthNames.map((m, idx) => `<option value="${idx}" ${idx === currentMonth ? 'selected' : ''}>${m}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="font-size: 12px; color: #71717a; font-weight: 500; display: block; margin-bottom: 3px;">${t('yearLabel')}</label>
                        <select id="selectYear" onchange="changeMonthYear()" style="width: 100%; background: #ffffff; color: #18181b; border: 1px solid #d4d4d8; padding: 8px 6px; border-radius: 6px;">
                            <option value="2025" ${currentYear === 2025 ? 'selected' : ''}>2025</option>
                            <option value="2026" ${currentYear === 2026 ? 'selected' : ''}>2026</option>
                            <option value="2027" ${currentYear === 2027 ? 'selected' : ''}>2027</option>
                        </select>
                    </div>
                </div>

                <div style="background: #fafafa; border: 1px solid #e4e4e7; padding: 10px; border-radius: 8px; margin-bottom: 12px;">
                    <div style="margin-bottom: 8px;">
                        <label style="font-size: 12px; color: #71717a; font-weight: 500; display: block; margin-bottom: 3px;">${t('calcTypeLabel')}</label>
                        <select id="calcType" onchange="updateSettingsFromUI()" style="width: 100%; background: #ffffff; color: #18181b; border: 1px solid #d4d4d8; padding: 8px; border-radius: 6px;">
                            <option value="monthly" ${!isHourly ? 'selected' : ''}>${t('calcMonthly')}</option>
                            <option value="hourly" ${isHourly ? 'selected' : ''}>${t('calcHourly')}</option>
                        </select>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <div>
                            <label style="font-size: 11px; color: #71717a; font-weight: 500; display: block; margin-bottom: 3px;" id="labelRateName">${isHourly ? t('rateHourlyLabel') : t('rateMonthlyLabel')}</label>
                            <input type="number" id="inputRateValue" value="${isHourly ? userSettings.rate : userSettings.monthlyRate}" oninput="updateSettingsFromUI()" style="width: 100%; background: #ffffff; color: #18181b; border: 1px solid #d4d4d8; padding: 8px; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-size: 11px; color: #71717a; font-weight: 500; display: block; margin-bottom: 3px;">${t('bonusLabel')}</label>
                            <input type="number" id="inputBonus" value="${userSettings.bonus}" oninput="updateSettingsFromUI()" style="width: 100%; background: #ffffff; color: #18181b; border: 1px solid #d4d4d8; padding: 8px; border-radius: 6px;">
                        </div>
                    </div>
                </div>

                <div id="calendarGrid" style="background: #fafafa; border: 1px solid #e4e4e7; padding: 8px; border-radius: 8px; margin-bottom: 12px;"></div>

                <div style="background: #fafafa; border: 1px solid #e4e4e7; padding: 10px; border-radius: 8px; margin-bottom: 12px; font-size: 13px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span style="color: #71717a;">${t('statDays')}</span> <strong id="statDays">0</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span style="color: #71717a;">${t('statBaseHours')}</span> <strong id="statBaseHours">0 ч</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span style="color: #71717a;">${t('statOvertime')}</span> <strong id="statOvertime" style="color: #d97706;">0.0 ч</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span style="color: #71717a;">${t('statNight')}</span> <strong id="statNight" style="color: #7c3aed;">0.0 ч</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; border-top: 1px solid #e4e4e7; padding-top: 5px;"><span style="color: #71717a;">${t('statTotalHours')}</span> <strong id="statTotalHours">0.0 ч</strong></div>
                    <div style="display: flex; justify-content: space-between; font-size: 15px; border-top: 1px solid #e4e4e7; padding-top: 5px; margin-top: 5px; color: #2563eb;"><span>${t('statTotalMoney')}:</span> <strong id="statTotalMoney">0.00 zł</strong></div>
                </div>

                <div id="saveStatusBadge" style="padding: 8px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; text-align: center; margin-bottom: 10px; display: none;"></div>

                <button onclick="window.handleSaveReport()" style="width: 100%; background: #2563eb; color: #ffffff; border: none; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 15px; margin-bottom: 20px;">${t('saveReportBtn')}</button>
            </div>

            <!-- Вкладка: Зарплата -->
            <div style="display: ${activeTab === 'salary' ? 'block' : 'none'}; background: #fafafa; border: 1px solid #e4e4e7; padding: 12px; border-radius: 8px;">
                <h3 style="margin-top: 0; color: #18181b; font-size: 16px;">${t('salaryViewTitle')}</h3>
                <p style="color: #71717a; font-size: 13px; line-height: 1.4;">${t('salaryViewDesc')}</p>
            </div>

            <!-- Вкладка: Настройки -->
            <div style="display: ${activeTab === 'settings' ? 'block' : 'none'}; background: #fafafa; border: 1px solid #e4e4e7; padding: 12px; border-radius: 8px;">
                <h3 style="margin-top: 0; color: #18181b; font-size: 16px; margin-bottom: 10px;">${t('settingsTitle')}</h3>
                <p style="color: #71717a; font-size: 12px; line-height: 1.4; margin-bottom: 15px;">${t('settingsDesc')}</p>
                
                <div style="background: #ffffff; border: 1px solid #e4e4e7; padding: 10px; border-radius: 8px; margin-bottom: 15px;">
                    <label style="font-size: 12px; font-weight: bold; color: #1d4ed8; display: block; margin-bottom: 5px;">${t('shift1StartLabel')}</label>
                    <input type="time" id="cfgShift1Start" value="${userSettings.shift1Start}" onchange="updateShift1ConfigFromUI()" style="width: 100%; border: 1px solid #d4d4d8; padding: 8px; border-radius: 6px; background: #fff; font-size: 14px;">
                </div>

                <div style="background: #ffffff; border: 1px solid #e4e4e7; padding: 10px; border-radius: 8px; margin-bottom: 15px; font-size: 12px; color: #52525b; line-height: 1.5;">
                    <div style="font-weight: bold; margin-bottom: 5px; color: #18181b;">${t('autoScheduleTitle')}</div>
                    <div>🟢 1 zmiana: <strong>${shifts['1'].start} - ${shifts['1'].end}</strong></div>
                    <div>🟠 2 zmiana: <strong>${shifts['2'].start} - ${shifts['2'].end}</strong></div>
                    <div>🟣 3 zmiana: <strong>${shifts['3'].start} - ${shifts['3'].end}</strong></div>
                </div>

                <div id="saveStatusBadgeSettings" style="padding: 8px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; text-align: center; margin-bottom: 10px; display: none;"></div>

                <button onclick="window.handleSaveReport()" style="width: 100%; background: #2563eb; color: #ffffff; border: none; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;">${t('saveSettingsBtn')}</button>
            </div>
        </div>

        <!-- Модальное окно -->
        <div id="dayModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); justify-content: center; align-items: center; z-index: 1000; padding: 15px; box-sizing: border-box;">
            <div style="background: #ffffff; padding: 15px; border-radius: 12px; width: 100%; max-width: 380px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); color: #18181b; position: relative; max-height: 90vh; overflow-y: auto;">
                
                <button onclick="window.closeDayModal()" style="position: absolute; top: 12px; right: 12px; background: transparent; border: none; font-size: 18px; cursor: pointer; color: #71717a; padding: 4px;">✕</button>

                <h3 id="modalTitle" style="margin-top: 0; margin-bottom: 10px; font-size: 16px; font-weight: bold;"></h3>
                <div style="font-size: 11px; color: #71717a; margin-bottom: 4px; font-weight: 500;">${t('modalQuickShift')}</div>
                
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-bottom: 10px;">
                    <button type="button" id="btnShift1" onclick="window.selectModalShift('1')" style="padding: 6px 2px; border-radius: 6px; border: 1px solid #d4d4d8; background: #ffffff; color: #18181b; font-size: 11px; font-weight: bold; cursor: pointer;">${t('shift1Btn')}</button>
                    <button type="button" id="btnShift2" onclick="window.selectModalShift('2')" style="padding: 6px 2px; border-radius: 6px; border: 1px solid #d4d4d8; background: #ffffff; color: #18181b; font-size: 11px; font-weight: bold; cursor: pointer;">${t('shift2Btn')}</button>
                    <button type="button" id="btnShift3" onclick="window.selectModalShift('3')" style="padding: 6px 2px; border-radius: 6px; border: 1px solid #d4d4d8; background: #ffffff; color: #18181b; font-size: 11px; font-weight: bold; cursor: pointer;">${t('shift3Btn')}</button>
                    <button type="button" id="btnShiftNone" onclick="window.selectModalShift('none')" style="padding: 6px 2px; border-radius: 6px; border: 1px solid #d4d4d8; background: #ffffff; color: #71717a; font-size: 10px; font-weight: bold; cursor: pointer;">${t('noneShiftBtn')}</button>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
                    <div>
                        <label style="font-size: 11px; color: #71717a; font-weight: 500; display: block; margin-bottom: 2px;">${t('startLabel')}</label>
                        <input type="time" id="modalStart" onchange="window.recalculateModalHours()" style="width: 100%; border: 1px solid #d4d4d8; padding: 6px; border-radius: 6px; font-size: 13px;">
                    </div>
                    <div>
                        <label style="font-size: 11px; color: #71717a; font-weight: 500; display: block; margin-bottom: 2px;">${t('endLabel')}</label>
                        <input type="time" id="modalEnd" onchange="window.recalculateModalHours()" style="width: 100%; border: 1px solid #d4d4d8; padding: 6px; border-radius: 6px; font-size: 13px;">
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-bottom: 10px;">
                    <div>
                        <label style="font-size: 10px; color: #71717a; font-weight: 500; display: block; margin-bottom: 2px;">${t('hours50Label')}</label>
                        <input type="number" step="0.5" id="modalHours50" value="0" style="width: 100%; border: 1px solid #d4d4d8; padding: 6px; border-radius: 6px; font-size: 13px;">
                    </div>
                    <div>
                        <label style="font-size: 10px; color: #71717a; font-weight: 500; display: block; margin-bottom: 2px;">${t('hours100Label')}</label>
                        <input type="number" step="0.5" id="modalHours100" value="0" style="width: 100%; border: 1px solid #d4d4d8; padding: 6px; border-radius: 6px; font-size: 13px;">
                    </div>
                    <div>
                        <label style="font-size: 10px; color: #71717a; font-weight: 500; display: block; margin-bottom: 2px;">${t('bonusZlLabel')}</label>
                        <input type="number" step="1" id="modalBonusZl" value="0" style="width: 100%; border: 1px solid #d4d4d8; padding: 6px; border-radius: 6px; font-size: 13px;">
                    </div>
                </div>

                <div id="modalStatsInfo" style="background: #f4f4f5; padding: 6px; border-radius: 6px; font-size: 11px; text-align: center; color: #3f3f46; margin-bottom: 10px; font-weight: 500;"></div>

                <button onclick="window.saveDayModal()" style="width: 100%; background: #2563eb; color: #ffffff; border: none; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;">${t('applyBtn')}</button>
            </div>
        </div>
    `;

    renderCalendarGrid();
    calculateStats();
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
            badge.innerText = t('unsavedBadge');
        } else {
            badge.style.background = '#dcfce7';
            badge.style.color = '#16a34a';
            badge.style.border = '1px solid #bbf7d0';
            badge.innerText = t('savedBadge');
        }
    });
}

function renderCalendarGrid() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;

    const lang = getLang();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysOfWeek = translations[lang].daysOfWeek;
    
    let html = `<div style="display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-size: 11px; font-weight: 600; margin-bottom: 6px;">`;
    daysOfWeek.forEach((d, idx) => {
        let color = (idx >= 5) ? '#dc2626' : '#71717a';
        html += `<div style="color: ${color};">${d}</div>`;
    });
    html += `</div><div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px;">`;

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

        if (s.overtime && s.overtime > 0) {
            badgeText = `${s.totalHours}h (+${s.overtime})`;
        }

        if (isWeekend || isHoliday) {
            dayNumberColor = '#dc2626';
            if (s.shift === 'none') {
                borderStyle = '#fca5a5';
                bgStyle = '#fef2f2';
            }
        }

        let holidayHtml = '';
        if (isHoliday) {
            holidayHtml = `<div style="font-size: 7.5px; color: #dc2626; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.1;" title="${holidayName}">${holidayName}</div>`;
        }

        html += `
            <div onclick="window.openDayModal(${day})" title="${holidayName ? 'Święto: ' + holidayName : (isWeekend ? 'Wolne (Weekend)' : '')}" style="background: ${bgStyle}; border: 1px solid ${borderStyle}; border-radius: 5px; padding: 4px 2px; text-align: center; cursor: pointer; min-height: 52px; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box;">
                <div style="font-size: 11px; font-weight: bold; color: ${dayNumberColor};">${day}</div>
                <div>
                    <div style="font-size: 8px; background: ${badgeBg}; color: ${badgeColor}; border-radius: 3px; padding: 2px 1px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 1px;">${badgeText}</div>
                    ${holidayHtml}
                </div>
            </div>
        `;
    }

    html += `</div>`;
    grid.innerHTML = html;
}

window.openDayModal = function(day) {
    setSelectedDay(day);
    const shiftsConfig = getCalculatedShiftsConfig();
    const defaultShiftTime = shiftsConfig['1'];
    const s = scheduleData[day] || { shift: '1', start: defaultShiftTime.start, end: defaultShiftTime.end, hours50: 0, hours100: 0, bonusZl: 0 };
    
    const lang = getLang();
    const monthNames = translations[lang].months;
    document.getElementById('modalTitle').innerText = `${day} ${monthNames[currentMonth]}`;
    setModalShift(s.shift || '1');
    
    document.getElementById('modalStart').value = s.start || defaultShiftTime.start;
    document.getElementById('modalEnd').value = s.end || defaultShiftTime.end;
    document.getElementById('modalHours50').value = s.hours50 || 0;
    document.getElementById('modalHours100').value = s.hours100 || 0;
    document.getElementById('modalBonusZl').value = s.bonusZl || 0;
    
    updateModalShiftButtons();
    window.recalculateModalHours();
    
    document.getElementById('dayModal').style.display = 'flex';
};

window.closeDayModal = function() {
    document.getElementById('dayModal').style.display = 'none';
    setSelectedDay(null);
};

window.selectModalShift = function(shiftType) {
    setModalShift(shiftType);
    updateModalShiftButtons();

    if (shiftType !== 'none') {
        const shiftsConfig = getCalculatedShiftsConfig();
        const cfg = shiftsConfig[shiftType];
        if (cfg) {
            document.getElementById('modalStart').value = cfg.start;
            document.getElementById('modalEnd').value = cfg.end;
        }
    }
    window.recalculateModalHours();
};

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

window.recalculateModalHours = function() {
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
};

window.saveDayModal = function() {
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

    window.closeDayModal();
    renderCalendarGrid();
    calculateStats();
    setUnsavedChanges(true);
    updateSaveStatusUI();
};

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

window.handleSaveReport = async function() {
    await apiSaveAll(() => {
        setUnsavedChanges(false);
        updateSaveStatusUI();
    }, () => {
        const badge = document.getElementById('saveStatusBadge') || document.getElementById('saveStatusBadgeSettings');
        if (badge) {
            badge.style.display = 'block';
            badge.style.background = '#fee2e2';
            badge.style.color = '#dc2626';
            badge.style.border = '1px solid #fca5a5';
            badge.innerText = '❌ Ошибка при сохранении!';
        }
    });
};