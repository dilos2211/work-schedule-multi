import { t, getLang, setLang, translations } from './translations.js';
import { 
    currentUser, currentYear, currentMonth, scheduleData, activeTab, 
    selectedDayForModal, hasUnsavedChanges, currentModalShift, isRegisterMode,
    userSettings, setCurrentUser, setYearMonth, setActiveTab, setSelectedDay, 
    setUnsavedChanges, setModalShift, setRegisterMode, getHolidayName, 
    getCalculatedShiftsConfig 
} from './config.js';
import { apiLoadSettings, apiLoadShifts, apiSaveAll } from './api.js';

let currentTheme = localStorage.getItem('app_theme') || 'light';

const getThemeColors = (theme) => {
    if (theme === 'dark') {
        return {
            bg: '#121212', cardBg: '#1e1e1e', text: '#e0e0e0', textSecondary: '#a0a0a0',
            border: '#333333', inputBg: '#2a2a2a', inputBorder: '#444444', accent: '#3b82f6',
            gridBg: '#181818', dayBg: '#1e1e1e', dayBorder: '#333333', dayText: '#e0e0e0',
            shift1Bg: '#1e3a8a', shift1Border: '#3b82f6', shift1Text: '#93c5fd',
            shift2Bg: '#7c2d12', shift2Border: '#f97316', shift2Text: '#fdba74',
            shift3Bg: '#581c87', shift3Border: '#8b5cf6', shift3Text: '#c4b5fd',
            modalBg: '#1e1e1e', modalText: '#e0e0e0', badgeBg: '#2a2a2a',
        };
    } else {
        return {
            bg: '#f4f4f5', cardBg: '#ffffff', text: '#18181b', textSecondary: '#71717a',
            border: '#d4d4d8', inputBg: '#ffffff', inputBorder: '#d4d4d8', accent: '#2563eb',
            gridBg: '#fafafa', dayBg: '#ffffff', dayBorder: '#d4d4d8', dayText: '#18181b',
            shift1Bg: '#eff6ff', shift1Border: '#bfdbfe', shift1Text: '#1d4ed8',
            shift2Bg: '#fff7ed', shift2Border: '#fed7aa', shift2Text: '#c2410c',
            shift3Bg: '#f5f3ff', shift3Border: '#ddd6fe', shift3Text: '#6d28d9',
            modalBg: '#ffffff', modalText: '#18181b', badgeBg: '#f4f4f5',
        };
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    if (!currentUser) {
        showAuthScreen();
    } else {
        apiLoadSettings().then(() => {
            const savedShift1 = localStorage.getItem('shift1Start');
            if (savedShift1) {
                userSettings.shift1Start = savedShift1;
                let [h, m] = savedShift1.split(':').map(Number);
                let d2StartH = (h + 8) % 24;
                let d3StartH = (h + 16) % 24;
                let formatTime = (num) => String(num).padStart(2, '0') + ':' + String(m).padStart(2, '0');
                userSettings.shift2Start = formatTime(d2StartH);
                userSettings.shift3Start = formatTime(d3StartH);
            }

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

window.toggleTheme = function() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('app_theme', currentTheme);
    if (!currentUser) showAuthScreen();
    else showMainScreen();
};

window.toggleLanguage = function(lang) {
    setLang(lang);
    if (!currentUser) showAuthScreen();
    else showMainScreen();
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
        if (!data.success) throw new Error(data.error || 'Помилка авторизації');
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
    const inputVal = document.getElementById('cfgShift1Start').value;
    if (!inputVal) return;

    userSettings.shift1Start = inputVal;
    localStorage.setItem('shift1Start', inputVal);
    
    let [h, m] = inputVal.split(':').map(Number);
    let d2StartH = (h + 8) % 24;
    let d3StartH = (h + 16) % 24;
    let formatTime = (num) => String(num).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    
    userSettings.shift2Start = formatTime(d2StartH);
    userSettings.shift3Start = formatTime(d3StartH);

    setUnsavedChanges(true);
    updateSaveStatusUI();
    showMainScreen();
};

function showAuthScreen() {
    const lang = getLang();
    const appContainer = document.getElementById('app');
    const c = getThemeColors(currentTheme);
    document.body.style.backgroundColor = c.bg;
    
    appContainer.innerHTML = `
        <div class="auth-container" style="display: flex; justify-content: center; align-items: center; min-height: 95vh; padding: 10px; box-sizing: border-box;">
            <div class="auth-card" style="background: ${c.cardBg}; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 100%; max-width: 400px; color: ${c.text}; border: 1px solid ${c.border};">
                <div style="display: flex; justify-content: flex-end; gap: 5px; margin-bottom: 15px;">
                    <button onclick="toggleTheme()" style="background: ${c.badgeBg}; color: ${c.text}; border: 1px solid ${c.border}; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; cursor: pointer;">${currentTheme === 'dark' ? '🌙' : '☀️'}</button>
                    <button onclick="toggleLanguage('pl')" style="background: ${lang === 'pl' ? c.accent : c.badgeBg}; color: ${lang === 'pl' ? '#fff' : c.text}; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; cursor: pointer;">PL</button>
                    <button onclick="toggleLanguage('uk')" style="background: ${lang === 'uk' ? c.accent : c.badgeBg}; color: ${lang === 'uk' ? '#fff' : c.text}; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; cursor: pointer;">UA</button>
                </div>
                <h2 style="margin-top: 0; text-align: center; color: ${c.text};">${isRegisterMode ? t('registerTitle') : t('loginTitle')}</h2>
                <div id="errorMsg" class="error-msg" style="display:none; color:#dc2626; margin-bottom:10px; font-size: 14px;"></div>
                <form id="authForm" onsubmit="handleAuth(event)">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-size: 14px; font-weight: 500;">${t('emailLabel')}</label>
                        <input type="email" id="authEmail" required style="width: 100%; padding: 10px; border: 1px solid ${c.inputBorder}; background: ${c.inputBg}; color: ${c.text}; border-radius: 6px;">
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-size: 14px; font-weight: 500;">${t('passwordLabel')}</label>
                        <input type="password" id="authPassword" required style="width: 100%; padding: 10px; border: 1px solid ${c.inputBorder}; background: ${c.inputBg}; color: ${c.text}; border-radius: 6px;">
                    </div>
                    <button type="submit" style="width: 100%; background: ${c.accent}; color: #ffffff; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 15px;">${isRegisterMode ? t('registerBtn') : t('loginBtn')}</button>
                </form>
                <p style="text-align: center; margin-top: 15px; font-size: 14px;">
                    <span style="color: ${c.textSecondary};">${isRegisterMode ? t('hasAccount') : t('noAccount')}</span> 
                    <a href="#" onclick="toggleAuthMode(event)" style="color: ${c.accent}; text-decoration: none; font-weight: 500;">${isRegisterMode ? t('loginLink') : t('registerLink')}</a>
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
    const appContainer = document.getElementById('app');
    const c = getThemeColors(currentTheme);

    document.body.style.backgroundColor = c.bg;

    appContainer.innerHTML = `
        <div style="width: 100%; max-width: 480px; margin: 0 auto; font-family: sans-serif; background: ${c.cardBg}; color: ${c.text}; padding: 10px; box-sizing: border-box; min-height: 100vh; border-left: 1px solid ${c.border}; border-right: 1px solid ${c.border};">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 4px;">
                <div style="display: flex; background: ${c.badgeBg}; padding: 3px; border-radius: 8px; flex-grow: 1; justify-content: space-around;">
                    <button onclick="switchTab('calendar')" style="background: ${activeTab === 'calendar' ? c.accent : 'transparent'}; color: ${activeTab === 'calendar' ? '#ffffff' : c.textSecondary}; border: none; padding: 8px 6px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 11px; flex: 1;">${t('tabCalendar')}</button>
                    <button onclick="switchTab('salary')" style="background: ${activeTab === 'salary' ? c.accent : 'transparent'}; color: ${activeTab === 'salary' ? '#ffffff' : c.textSecondary}; border: none; padding: 8px 6px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 11px; flex: 1;">${t('tabSalary')}</button>
                    <button onclick="switchTab('settings')" style="background: ${activeTab === 'settings' ? c.accent : 'transparent'}; color: ${activeTab === 'settings' ? '#ffffff' : c.textSecondary}; border: none; padding: 8px 6px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 11px; flex: 1;">${t('tabSettings')}</button>
                </div>
                
                <div style="display: flex; gap: 3px;">
                    <button onclick="toggleTheme()" style="background: ${c.badgeBg}; color: ${c.text}; border: 1px solid ${c.border}; padding: 6px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; cursor: pointer;" title="${t('tooltipTheme')}">${currentTheme === 'dark' ? '🌙' : '☀️'}</button>
                    <button onclick="toggleLanguage('pl')" style="background: ${lang === 'pl' ? c.accent : c.badgeBg}; color: ${lang === 'pl' ? '#fff' : c.text}; border: none; padding: 6px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; cursor: pointer;">PL</button>
                    <button onclick="toggleLanguage('uk')" style="background: ${lang === 'uk' ? c.accent : c.badgeBg}; color: ${lang === 'uk' ? '#fff' : c.text}; border: none; padding: 6px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; cursor: pointer;">UA</button>
                    <button onclick="logout()" style="background: ${currentTheme === 'dark' ? '#7f1d1d' : '#fee2e2'}; color: #dc2626; border: none; padding: 6px 8px; border-radius: 6px; cursor: pointer; font-size: 10px; font-weight: 500;" title="${t('tooltipLogout')}">✕</button>
                </div>
            </div>

            <!-- Вкладка: Календарь -->
            <div style="display: ${activeTab === 'calendar' ? 'block' : 'none'};">
                <div style="background: ${c.gridBg}; border: 1px solid ${c.border}; padding: 10px; border-radius: 8px; margin-bottom: 12px; display: grid; grid-template-columns: 2fr 1fr; gap: 8px;">
                    <div>
                        <label style="font-size: 12px; color: ${c.textSecondary}; font-weight: 500; display: block; margin-bottom: 3px;">${t('monthLabel')}</label>
                        <select id="selectMonth" onchange="changeMonthYear()" style="width: 100%; background: ${c.inputBg}; color: ${c.text}; border: 1px solid ${c.inputBorder}; padding: 8px 6px; border-radius: 6px;">
                            ${monthNames.map((m, idx) => `<option value="${idx}" ${idx === currentMonth ? 'selected' : ''}>${m}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="font-size: 12px; color: ${c.textSecondary}; font-weight: 500; display: block; margin-bottom: 3px;">${t('yearLabel')}</label>
                        <select id="selectYear" onchange="changeMonthYear()" style="width: 100%; background: ${c.inputBg}; color: ${c.text}; border: 1px solid ${c.inputBorder}; padding: 8px 6px; border-radius: 6px;">
                            <option value="2025" ${currentYear === 2025 ? 'selected' : ''}>2025</option>
                            <option value="2026" ${currentYear === 2026 ? 'selected' : ''}>2026</option>
                            <option value="2027" ${currentYear === 2027 ? 'selected' : ''}>2027</option>
                        </select>
                    </div>
                </div>

                <div style="background: ${c.gridBg}; border: 1px solid ${c.border}; padding: 10px; border-radius: 8px; margin-bottom: 12px;">
                    <div style="margin-bottom: 8px;">
                        <label style="font-size: 12px; color: ${c.textSecondary}; font-weight: 500; display: block; margin-bottom: 3px;">${t('calcTypeLabel')}</label>
                        <select id="calcType" onchange="updateSettingsFromUI()" style="width: 100%; background: ${c.inputBg}; color: ${c.text}; border: 1px solid ${c.inputBorder}; padding: 8px; border-radius: 6px;">
                            <option value="monthly" ${!isHourly ? 'selected' : ''}>${t('calcMonthly')}</option>
                            <option value="hourly" ${isHourly ? 'selected' : ''}>${t('calcHourly')}</option>
                        </select>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <div>
                            <label style="font-size: 11px; color: ${c.textSecondary}; font-weight: 500; display: block; margin-bottom: 3px;" id="labelRateName">${isHourly ? t('rateHourlyLabel') : t('rateMonthlyLabel')}</label>
                            <input type="number" id="inputRateValue" value="${isHourly ? userSettings.rate : userSettings.monthlyRate}" oninput="updateSettingsFromUI()" style="width: 100%; background: ${c.inputBg}; color: ${c.text}; border: 1px solid ${c.inputBorder}; padding: 8px; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-size: 11px; color: ${c.textSecondary}; font-weight: 500; display: block; margin-bottom: 3px;">${t('bonusLabel')}</label>
                            <input type="number" id="inputBonus" value="${userSettings.bonus}" oninput="updateSettingsFromUI()" style="width: 100%; background: ${c.inputBg}; color: ${c.text}; border: 1px solid ${c.inputBorder}; padding: 8px; border-radius: 6px;">
                        </div>
                    </div>
                </div>

                <div id="calendarGrid" style="background: ${c.gridBg}; border: 1px solid ${c.border}; padding: 8px; border-radius: 8px; margin-bottom: 12px;"></div>

                <div style="background: ${c.gridBg}; border: 1px solid ${c.border}; padding: 10px; border-radius: 8px; margin-bottom: 12px; font-size: 13px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span style="color: ${c.textSecondary};">${t('statDays')}</span> <strong id="statDays" style="color: ${c.text};">0</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span style="color: ${c.textSecondary};">${t('statBaseHours')}</span> <strong id="statBaseHours" style="color: ${c.text};">0 ч</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span style="color: ${c.textSecondary};">${t('statOvertime')} (+50%)</span> <strong id="statOvertime50" style="color: #d97706;">0.0 ч</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span style="color: ${c.textSecondary};">Переробка (+100%)</span> <strong id="statOvertime100" style="color: #dc2626;">0.0 ч</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span style="color: ${c.textSecondary};">${t('statNight')}</span> <strong id="statNight" style="color: #7c3aed;">0.0 ч</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; border-top: 1px solid ${c.border}; padding-top: 5px;"><span style="color: ${c.textSecondary};">${t('statTotalHours')}</span> <strong id="statTotalHours" style="color: ${c.text};">0.0 ч</strong></div>
                    <div style="display: flex; justify-content: space-between; font-size: 15px; border-top: 1px solid ${c.border}; padding-top: 5px; margin-top: 5px; color: ${c.accent};"><span>${t('statTotalMoney')}:</span> <strong id="statTotalMoney">0.00 zł</strong></div>
                </div>

                <div id="saveStatusBadge" style="padding: 8px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; text-align: center; margin-bottom: 10px; display: none;"></div>

                <button onclick="window.handleSaveReport()" style="width: 100%; background: ${c.accent}; color: #ffffff; border: none; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 15px; margin-bottom: 20px;">${t('saveReportBtn')}</button>
            </div>

            <!-- Вкладка: Зарплата -->
            <div style="display: ${activeTab === 'salary' ? 'block' : 'none'};">
                <div style="background: ${c.gridBg}; border: 1px solid ${c.border}; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                    <h3 style="margin-top: 0; color: ${c.text}; font-size: 16px; margin-bottom: 6px;">${t('salaryViewTitle')}</h3>
                    <p style="color: ${c.textSecondary}; font-size: 12px; line-height: 1.4; margin-bottom: 12px;">${t('salaryViewDesc')}</p>
                    
                    <div style="background: ${c.cardBg}; border: 1px solid ${c.border}; padding: 12px; border-radius: 8px;">
                        <div style="font-size: 13px; font-weight: bold; color: ${c.accent}; margin-bottom: 10px; border-bottom: 1px solid ${c.border}; padding-bottom: 6px;">
                            ${t('salaryHeader')}
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
                            <span style="color: ${c.textSecondary};">${t('salaryBruttoTotalLabel')}</span>
                            <strong id="salaryTabTotalBrutto" style="color: ${c.text};">0.00 zł</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
                            <span style="color: ${c.textSecondary};">${t('zusWorkersLabel')}</span>
                            <strong id="salaryTabZus" style="color: #dc2626;">- 0.00 zł</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
                            <span style="color: ${c.textSecondary};">${t('healthInsLabel')}</span>
                            <strong id="salaryTabHealth" style="color: #dc2626;">- 0.00 zł</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px;">
                            <span style="color: ${c.textSecondary};">${t('taxAdvanceLabel')}</span>
                            <strong id="salaryTabTax" style="color: #dc2626;">- 0.00 zł</strong>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; font-size: 15px; border-top: 2px solid ${c.border}; padding-top: 8px; margin-top: 8px; color: #16a34a;">
                            <span><strong>${t('nettoFinalLabel')}</strong></span>
                            <strong id="salaryTabNetto">0.00 zł</strong>
                        </div>

                        <div style="display: flex; justify-content: space-between; font-size: 11px; color: ${c.textSecondary}; border-top: 1px dashed ${c.border}; padding-top: 6px; margin-top: 8px;">
                            <span>${t('employerCostLabel')}</span>
                            <span id="salaryTabEmployerCost">~0.00 zł</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Вкладка: Настройки -->
            <div style="display: ${activeTab === 'settings' ? 'block' : 'none'}; background: ${c.gridBg}; border: 1px solid ${c.border}; padding: 12px; border-radius: 8px;">
                <h3 style="margin-top: 0; color: ${c.text}; font-size: 16px; margin-bottom: 10px;">${t('settingsTitle')}</h3>
                <p style="color: ${c.textSecondary}; font-size: 12px; line-height: 1.4; margin-bottom: 15px;">${t('settingsDesc')}</p>
                
                <div style="background: ${c.cardBg}; border: 1px solid ${c.border}; padding: 10px; border-radius: 8px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 12px; font-weight: bold; color: ${c.text}; margin-bottom: 2px;">${t('themeCardTitle')}</div>
                        <div style="font-size: 11px; color: ${c.textSecondary};">${currentTheme === 'dark' ? t('themeDarkActive') : t('themeLightActive')}</div>
                    </div>
                    <button onclick="toggleTheme()" style="background: ${c.accent}; color: #fff; border: none; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer;">
                        ${currentTheme === 'dark' ? t('btnDarkText') : t('btnLightText')}
                    </button>
                </div>

                <div style="background: ${c.cardBg}; border: 1px solid ${c.border}; padding: 10px; border-radius: 8px; margin-bottom: 15px;">
                    <label style="font-size: 12px; font-weight: bold; color: ${c.accent}; display: block; margin-bottom: 5px;">${t('shift1StartLabel')}</label>
                    <input type="time" id="cfgShift1Start" value="${userSettings.shift1Start}" onchange="updateShift1ConfigFromUI()" style="width: 100%; border: 1px solid ${c.inputBorder}; background: ${c.inputBg}; color: ${c.text}; padding: 8px; border-radius: 6px; font-size: 14px;">
                </div>

                <div style="background: ${c.cardBg}; border: 1px solid ${c.border}; padding: 10px; border-radius: 8px; margin-bottom: 15px; font-size: 12px; color: ${c.textSecondary}; line-height: 1.5;">
                    <div style="font-weight: bold; margin-bottom: 5px; color: ${c.text};">${t('autoScheduleTitle')}</div>
                    <div>🟢 1 zmiana: <strong style="color: ${c.text};">${shifts['1'].start} - ${shifts['1'].end}</strong></div>
                    <div>🟠 2 zmiana: <strong style="color: ${c.text};">${shifts['2'].start} - ${shifts['2'].end}</strong></div>
                    <div>🟣 3 zmiana: <strong style="color: ${c.text};">${shifts['3'].start} - ${shifts['3'].end}</strong></div>
                </div>

                <div id="saveStatusBadgeSettings" style="padding: 8px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; text-align: center; margin-bottom: 10px; display: none;"></div>

                <button onclick="window.handleSaveReport()" style="width: 100%; background: ${c.accent}; color: #ffffff; border: none; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;">${t('saveSettingsBtn')}</button>
            </div>
        </div>

        <!-- Модальное окно -->
        <div id="dayModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); justify-content: center; align-items: center; z-index: 1000; padding: 15px; box-sizing: border-box;">
            <div style="background: ${c.modalBg}; padding: 15px; border-radius: 12px; width: 100%; max-width: 380px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); color: ${c.modalText}; position: relative; max-height: 90vh; overflow-y: auto; border: 1px solid ${c.border};">
                
                <button onclick="window.closeDayModal()" style="position: absolute; top: 12px; right: 12px; background: transparent; border: none; font-size: 18px; cursor: pointer; color: ${c.textSecondary}; padding: 4px;">✕</button>

                <h3 id="modalTitle" style="margin-top: 0; margin-bottom: 10px; font-size: 16px; font-weight: bold;"></h3>
                <div style="font-size: 11px; color: ${c.textSecondary}; margin-bottom: 4px; font-weight: 500;">${t('modalQuickShift')}</div>
                
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-bottom: 10px;">
                    <button type="button" id="btnShift1" onclick="window.selectModalShift('1')" style="padding: 6px 2px; border-radius: 6px; border: 1px solid ${c.border}; background: ${c.inputBg}; color: ${c.text}; font-size: 11px; font-weight: bold; cursor: pointer;">${t('shift1Btn')}</button>
                    <button type="button" id="btnShift2" onclick="window.selectModalShift('2')" style="padding: 6px 2px; border-radius: 6px; border: 1px solid ${c.border}; background: ${c.inputBg}; color: ${c.text}; font-size: 11px; font-weight: bold; cursor: pointer;">${t('shift2Btn')}</button>
                    <button type="button" id="btnShift3" onclick="window.selectModalShift('3')" style="padding: 6px 2px; border-radius: 6px; border: 1px solid ${c.border}; background: ${c.inputBg}; color: ${c.text}; font-size: 11px; font-weight: bold; cursor: pointer;">${t('shift3Btn')}</button>
                    <button type="button" id="btnShiftNone" onclick="window.selectModalShift('none')" style="padding: 6px 2px; border-radius: 6px; border: 1px solid ${c.border}; background: ${c.inputBg}; color: ${c.textSecondary}; font-size: 10px; font-weight: bold; cursor: pointer;">${t('noneShiftBtn')}</button>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
                    <div>
                        <label style="font-size: 11px; color: ${c.textSecondary}; font-weight: 500; display: block; margin-bottom: 2px;">${t('startLabel')}</label>
                        <input type="time" id="modalStart" onchange="window.recalculateModalHours()" style="width: 100%; border: 1px solid ${c.inputBorder}; background: ${c.inputBg}; color: ${c.text}; padding: 6px; border-radius: 6px; font-size: 13px;">
                    </div>
                    <div>
                        <label style="font-size: 11px; color: ${c.textSecondary}; font-weight: 500; display: block; margin-bottom: 2px;">${t('endLabel')}</label>
                        <input type="time" id="modalEnd" onchange="window.recalculateModalHours()" style="width: 100%; border: 1px solid ${c.inputBorder}; background: ${c.inputBg}; color: ${c.text}; padding: 6px; border-radius: 6px; font-size: 13px;">
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-bottom: 10px;">
                    <div>
                        <label style="font-size: 10px; color: ${c.textSecondary}; font-weight: 500; display: block; margin-bottom: 2px;">${t('hours50Label')}</label>
                        <input type="number" step="0.5" id="modalHours50" value="0" style="width: 100%; border: 1px solid ${c.inputBorder}; background: ${c.inputBg}; color: ${c.text}; padding: 6px; border-radius: 6px; font-size: 13px;">
                    </div>
                    <div>
                        <label style="font-size: 10px; color: ${c.textSecondary}; font-weight: 500; display: block; margin-bottom: 2px;">${t('hours100Label')}</label>
                        <input type="number" step="0.5" id="modalHours100" value="0" style="width: 100%; border: 1px solid ${c.inputBorder}; background: ${c.inputBg}; color: ${c.text}; padding: 6px; border-radius: 6px; font-size: 13px;">
                    </div>
                    <div>
                        <label style="font-size: 10px; color: ${c.textSecondary}; font-weight: 500; display: block; margin-bottom: 2px;">${t('bonusZlLabel')}</label>
                        <input type="number" step="1" id="modalBonusZl" value="0" style="width: 100%; border: 1px solid ${c.inputBorder}; background: ${c.inputBg}; color: ${c.text}; padding: 6px; border-radius: 6px; font-size: 13px;">
                    </div>
                </div>

                <div id="modalStatsInfo" style="background: ${c.badgeBg}; padding: 6px; border-radius: 6px; font-size: 11px; text-align: center; color: ${c.text}; margin-bottom: 10px; font-weight: 500;"></div>

                <button onclick="window.saveDayModal()" style="width: 100%; background: ${c.accent}; color: #ffffff; border: none; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;">${t('applyBtn')}</button>
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
            badge.style.background = '#fef3c7'; badge.style.color = '#d97706'; badge.style.border = '1px solid #fde68a';
            badge.innerText = t('unsavedBadge');
        } else {
            badge.style.background = '#dcfce7'; badge.style.color = '#16a34a'; badge.style.border = '1px solid #bbf7d0';
            badge.innerText = t('savedBadge');
        }
    });
}

function renderCalendarGrid() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;

    const c = getThemeColors(currentTheme);
    const lang = getLang();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysOfWeek = translations[lang].daysOfWeek;
    
    let html = `<div style="display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-size: 11px; font-weight: 600; margin-bottom: 6px;">`;
    daysOfWeek.forEach((d, idx) => {
        let color = (idx >= 5) ? '#ef4444' : c.textSecondary;
        html += `<div style="color: ${color};">${d}</div>`;
    });
    html += `</div><div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px;">`;

    let firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    for (let i = 0; i < firstDayIndex; i++) html += `<div></div>`;

    for (let day = 1; day <= daysInMonth; day++) {
        const s = scheduleData[day] || { shift: 'none', totalHours: 0 };
        
        let dateObj = new Date(currentYear, currentMonth, day);
        let dayOfWeek = dateObj.getDay();
        let isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        let holidayName = getHolidayName(currentYear, currentMonth, day);
        let isHoliday = (holidayName !== null);

        let bgStyle = c.dayBg;
        let borderStyle = c.dayBorder;
        let badgeBg = c.badgeBg;
        let badgeColor = c.textSecondary;
        let badgeText = '-';
        let dayNumberColor = c.dayText;

        if (s.shift === '1') {
            bgStyle = c.shift1Bg; borderStyle = c.shift1Border; badgeBg = c.shift1Border; badgeColor = c.shift1Text; badgeText = `${s.totalHours || 8}h`;
        } else if (s.shift === '2') {
            bgStyle = c.shift2Bg; borderStyle = c.shift2Border; badgeBg = c.shift2Border; badgeColor = c.shift2Text; badgeText = `${s.totalHours || 8}h`;
        } else if (s.shift === '3') {
            bgStyle = c.shift3Bg; borderStyle = c.shift3Border; badgeBg = c.shift3Border; badgeColor = c.shift3Text; badgeText = `${s.totalHours || 8}h`;
        }

        if (isWeekend || isHoliday) {
            dayNumberColor = '#ef4444';
            if (s.shift === 'none') {
                borderStyle = currentTheme === 'dark' ? '#7f1d1d' : '#fca5a5';
                bgStyle = currentTheme === 'dark' ? '#450a0a' : '#fef2f2';
            }
        }

        let holidayHtml = '';
        if (isHoliday) {
            holidayHtml = `<div style="font-size: 7.5px; color: #ef4444; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${holidayName}">${holidayName}</div>`;
        }

        const tooltipTitle = holidayName ? (t('tooltipHoliday') + holidayName) : (isWeekend ? t('tooltipWeekend') : '');

        html += `
            <div onclick="window.openDayModal(${day})" title="${tooltipTitle}" style="background: ${bgStyle}; border: 1px solid ${borderStyle}; border-radius: 5px; padding: 4px 2px; text-align: center; cursor: pointer; min-height: 52px; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box;">
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
    const c = getThemeColors(currentTheme);
    ['1', '2', '3', 'none'].forEach(type => {
        const btn = document.getElementById(type === 'none' ? 'btnShiftNone' : `btnShift${type}`);
        if (!btn) return;
        if (currentModalShift === type) {
            btn.style.background = c.accent; btn.style.color = '#ffffff'; btn.style.borderColor = c.accent;
        } else {
            btn.style.background = c.inputBg; btn.style.color = type === 'none' ? c.textSecondary : c.text; btn.style.borderColor = c.inputBorder;
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
    if (endMinutes <= startMinutes) endMinutes += 24 * 60;

    let totalH = (endMinutes - startMinutes) / 60;
    let baseH = Math.min(totalH, 8);
    let nadgH = Math.max(0, totalH - 8);

    document.getElementById('modalStatsInfo').innerText = 
        `${t('lblTotal')}: ${totalH}h | ${t('lblBase')}: ${baseH}h | ${t('lblNadg')}: ${nadgH}h`;
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

    if (currentModalShift === 'none' && totalH === 0 && h50 === 0 && h100 === 0 && bZl === 0) {
        delete scheduleData[selectedDayForModal];
    } else {
        scheduleData[selectedDayForModal] = {
            shift: currentModalShift,
            start: startStr,
            end: endStr,
            totalHours: totalH,
            hours50: h50,
            hours100: h100,
            bonusZl: bZl
        };
    }

    setUnsavedChanges(true);
    window.closeDayModal();
    renderCalendarGrid();
    calculateStats();
    updateSaveStatusUI();
};

window.handleSaveReport = function() {
    apiSaveAll(() => {
        setUnsavedChanges(false);
        updateSaveStatusUI();
    });
};

function calculateStats() {
    let totalDays = 0;
    let totalHoursAll = 0;
    let calculatedMoney = 0;

    // Считаем общую норму рабочих часов месяца (Пн-Пт без праздников * 8)
    let standardMonthHours = 0;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
        let dateObj = new Date(currentYear, currentMonth, day);
        let dayOfWeek = dateObj.getDay();
        let isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        let holidayName = getHolidayName(currentYear, currentMonth, day);
        if (!isWeekend && !holidayName) {
            standardMonthHours += 8;
        }
    }

    // Собираем отработанные часы и распределяем переработки по дням
    let accumulatedTotalHours = 0;
    
    // Сначала посчитаем суммарно отработанные часы по всем дням
    Object.entries(scheduleData).forEach(([dayStr, s]) => {
        if (s.shift && s.shift !== 'none') {
            totalDays++;
            accumulatedTotalHours += (s.totalHours || 0);
        }
    });

    let totalOvertimeAll = Math.max(0, accumulatedTotalHours - standardMonthHours);
    let totalBaseH = Math.min(accumulatedTotalHours, standardMonthHours);

    // Автоматическое распределение сверх нормы:
    // Если пользователь вручную указал 50% или 100% в днях — берем оттуда, иначе раскидываем автоматически
    let manualH50 = 0;
    let manualH100 = 0;
    let hasManualOvertimeConfig = false;

    Object.values(scheduleData).forEach(s => {
        if (s.hours50) manualH50 += s.hours50;
        if (s.hours100) manualH100 += s.hours100;
        if (s.hours50 || s.hours100) hasManualOvertimeConfig = true;
    });

    let autoOvertime50 = 0;
    let autoOvertime100 = 0;

    if (hasManualOvertimeConfig) {
        autoOvertime50 = manualH50;
        autoOvertime100 = manualH100;
    } else {
        // Автоматика: проходим по дням и распределяем общую переработку
        // Выходные и праздники -> +100%, Будни (сверх 8 часов) -> +50%
        let remainingOvertime = totalOvertimeAll;

        // Сначала распределяем переработки выходных/праздников в +100%
        Object.entries(scheduleData).forEach(([dayStr, s]) => {
            if (remainingOvertime <= 0) return;
            let dayNum = parseInt(dayStr);
            let dateObj = new Date(currentYear, currentMonth, dayNum);
            let dayOfWeek = dateObj.getDay();
            let isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
            let holidayName = getHolidayName(currentYear, currentMonth, dayNum);

            if ((isWeekend || holidayName) && s.totalHours > 0) {
                let take = Math.min(remainingOvertime, s.totalHours);
                autoOvertime100 += take;
                remainingOvertime -= take;
            }
        });

        // Остальное (переработки в будни) уходит в +50%
        if (remainingOvertime > 0) {
            autoOvertime50 += remainingOvertime;
        }
    }

    totalHoursAll = accumulatedTotalHours;
    let totalNightH = 0;

    if (userSettings.calcType === 'hourly') {
        calculatedMoney = totalHoursAll * (userSettings.rate || 0);
    } else {
        calculatedMoney = (userSettings.monthlyRate || 0);
    }

    calculatedMoney += (userSettings.bonus || 0);
    Object.values(scheduleData).forEach(s => {
        if (s.bonusZl) calculatedMoney += s.bonusZl;
    });

    const elDays = document.getElementById('statDays');
    const elBase = document.getElementById('statBaseHours');
    const elOver50 = document.getElementById('statOvertime50');
    const elOver100 = document.getElementById('statOvertime100');
    const elNight = document.getElementById('statNight');
    const elTotalH = document.getElementById('statTotalHours');
    const elTotalM = document.getElementById('statTotalMoney');

    if (elDays) elDays.innerText = totalDays;
    if (elBase) elBase.innerText = `${totalBaseH.toFixed(1)} ч`;
    if (elOver50) elOver50.innerText = `${autoOvertime50.toFixed(1)} ч`;
    if (elOver100) elOver100.innerText = `${autoOvertime100.toFixed(1)} ч`;
    if (elNight) elNight.innerText = `${totalNightH.toFixed(1)} ч`;
    if (elTotalH) elTotalH.innerText = `${totalHoursAll.toFixed(1)} ч`;
    if (elTotalM) elTotalM.innerText = `${calculatedMoney.toFixed(2)} zł`;

    // Расчёт налогов Netto
    const totalBrutto = calculatedMoney;
    const zusWorkers = totalBrutto * 0.1166;
    const healthBase = totalBrutto - zusWorkers;
    const healthIns = healthBase * 0.09;
    const taxBase = healthBase - 250; 
    const taxAdvance = Math.max(0, (taxBase * 0.12) - 300); 
    const nettoFinal = totalBrutto - zusWorkers - healthIns - taxAdvance;
    const employerCost = totalBrutto * 1.2048; 

    const elTabBrutto = document.getElementById('salaryTabTotalBrutto');
    const elTabZus = document.getElementById('salaryTabZus');
    const elTabHealth = document.getElementById('salaryTabHealth');
    const elTabTax = document.getElementById('salaryTabTax');
    const elTabNetto = document.getElementById('salaryTabNetto');
    const elTabEmployer = document.getElementById('salaryTabEmployerCost');

    if (elTabBrutto) elTabBrutto.innerText = `${totalBrutto.toFixed(2)} zł`;
    if (elTabZus) elTabZus.innerText = `- ${zusWorkers.toFixed(2)} zł`;
    if (elTabHealth) elTabHealth.innerText = `- ${healthIns.toFixed(2)} zł`;
    if (elTabTax) elTabTax.innerText = `- ${taxAdvance.toFixed(2)} zł`;
    if (elTabNetto) elTabNetto.innerText = `${nettoFinal.toFixed(2)} zł`;
    if (elTabEmployer) elTabEmployer.innerText = `~${employerCost.toFixed(2)} zł`;
}