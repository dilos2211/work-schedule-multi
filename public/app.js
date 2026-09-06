// --- УПРАВЛЕНИЕ АВТОРИЗАЦИЕЙ ---
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let isRegisterMode = false;

const authScreen = document.getElementById('authScreen');
const appContainer = document.getElementById('appContainer');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authEmailInput = document.getElementById('authEmail');
const authPasswordInput = document.getElementById('authPassword');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authSwitchBtn = document.getElementById('authSwitchBtn');
const authSwitchText = document.getElementById('authSwitchText');
const authError = document.getElementById('authError');
const userEmailDisplay = document.getElementById('userEmailDisplay');
const logoutBtn = document.getElementById('logoutBtn');

function checkAuthUI() {
  if (currentUser) {
    authScreen.style.display = 'none';
    appContainer.style.display = 'block';
    userEmailDisplay.innerText = currentUser.email;
    loadUserSettingsAndShifts();
  } else {
    authScreen.style.display = 'flex';
    appContainer.style.display = 'none';
  }
}

authSwitchBtn.addEventListener('click', (e) => {
  e.preventDefault();
  isRegisterMode = !isRegisterMode;
  if (isRegisterMode) {
    authTitle.innerText = translations[currentLang].regTitle || "Регистрация";
    authSubmitBtn.innerText = translations[currentLang].regBtn || "Зарегистрироваться";
    authSwitchText.innerText = "Уже есть аккаунт?";
    authSwitchBtn.innerText = "Войти";
  } else {
    authTitle.innerText = translations[currentLang].loginTitle || "Вход в систему";
    authSubmitBtn.innerText = translations[currentLang].loginBtn || "Войти";
    authSwitchText.innerText = "Нет аккаунта?";
    authSwitchBtn.innerText = "Зарегистрироваться";
  }
  authError.style.display = 'none';
});

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authError.style.display = 'none';
  const email = authEmailInput.value.trim();
  const password = authPasswordInput.value.trim();

  const endpoint = isRegisterMode ? '/api/register' : '/api/login';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Ошибка авторизации');
    }

    currentUser = data.user;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    checkAuthUI();
  } catch (err) {
    authError.innerText = err.message;
    authError.style.display = 'block';
  }
});

logoutBtn.addEventListener('click', () => {
  currentUser = null;
  localStorage.removeItem('currentUser');
  checkAuthUI();
});


// --- ЯЗЫКИ И ПЕРЕВОДЫ ---
let currentLang = localStorage.getItem('appLang') || 'ru';

const translations = {
  ru: {
    loginTitle: "Вход в систему",
    regTitle: "Регистрация",
    loginBtn: "Войти",
    regBtn: "Зарегистрироваться",
    tabCalendar: "📅 Календарь",
    tabSalary: "💰 Расчет зарплаты",
    monthLabel: "Месяц:",
    yearLabel: "Год:",
    todayBtn: "📅 Текущий месяц",
    sumDays: "Отработано дней:",
    sumBaseHours: "Базовые часы:",
    sumOvertime: "Переработка:",
    sumNightHours: "Ночные часы:",
    sumAllHours: "Всего часов:",
    sumGross: "Ориентировочно брутто:",
    saveBtn: "Сохранить отчет",
    savingBtn: "Сохранение...",
    saveSuccess: "Данные успешно сохранены!",
    saveError: "Ошибка при сохранении",
    calcTypeLabel: "Тип оплаты:",
    optMonthly: "Оклад за месяц (zł/мес)",
    optHourly: "Почасовая ставка (zł/ч)",
    monthlyRateLabel: "Оклад брутто (zł):",
    hourlyRateLabel: "Ставка в час (zł/ч):",
    bonusLabel: "Премия брутто (zł):",
    slipTitle: "Детализированный расчет (Pasek Płacowy)",
    slipSubtitle: "Структура начислений и удержаний (ZUS, PIT, PPK)",
    secEarnings: "Начисления (Składniki wynagrodzenia)",
    lblBruttoTotal: "Итого Брутто (Przychód / Brutto):",
    secZusWorker: "Взносы ZUS за счет работника (13.71%)",
    lblZusWorkerTotal: "Всего ZUS работника:",
    secPpk: "PPK (Pracownicze Plany Kapitałowe)",
    lblPpkZatr: "Взносы сотрудника (PPK zatrudniony - 2%):",
    secHealth: "Медицинское страхование (Składka zdrowotna NFZ - 9%)",
    lblHealthBase: "База для сл. здоровья:",
    lblHealthSum: "Сумма взноса:",
    secTax: "Подоходный налог (Podatek dochodowy PIT)",
    lblTaxBase: "Налогооблагаемая база:",
    lblTaxSum: "Аванс по налогу:",
    secOther: "Прочие удержания (Potrącenia inne)",
    lblNettoFinal: "К выплате на руки (NETTO / Na konto):",
    quickSelectLabel: "Быстрый выбор смены:",
    shift1Btn: "1 смена",
    shift2Btn: "2 смена",
    shift3Btn: "3 смена",
    shiftOffBtn: "Выходной",
    timeStart: "Начало:",
    timeEnd: "Конец:",
    applyBtn: "Применить",
    weekdays: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
    months: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
    shift1Text: "1 смена",
    shift2Text: "2 смена",
    shift3Text: "3 смена",
    shiftOffText: "Выходной"
  },
  pl: {
    loginTitle: "Logowanie",
    regTitle: "Rejestracja",
    loginBtn: "Zaloguj się",
    regBtn: "Zarejestruj się",
    tabCalendar: "📅 Kalendarz",
    tabSalary: "💰 Obliczenie płacy",
    monthLabel: "Miesiąc:",
    yearLabel: "Rok:",
    todayBtn: "📅 Bieżący miesiąc",
    sumDays: "Przepracowane dni:",
    sumBaseHours: "Godziny bazowe:",
    sumOvertime: "Nadgodziny:",
    sumNightHours: "Godziny nocne:",
    sumAllHours: "Razem godzin:",
    sumGross: "Szacunkowe brutto:",
    saveBtn: "Zapisz raport",
    savingBtn: "Zapisywanie...",
    saveSuccess: "Dane zostały zapisane!",
    saveError: "Błąd podczas zapisu",
    calcTypeLabel: "Rodzaj wynagrodzenia:",
    optMonthly: "Miesięczne (zł/mc)",
    optHourly: "Godzinowe (zł/h)",
    monthlyRateLabel: "Pensja brutto (zł):",
    hourlyRateLabel: "Stawka godzinowa (zł/h):",
    bonusLabel: "Premia brutto (zł):",
    slipTitle: "Szczegółowe rozliczenie (Pasek Płacowy)",
    slipSubtitle: "Struktura przychodów i potrąceń (ZUS, PIT, PPK)",
    secEarnings: "Składniki wynagrodzenia",
    lblBruttoTotal: "Razem Brutto (Przychód / Brutto):",
    secZusWorker: "Składki ZUS finansowane przez pracownika (13.71%)",
    lblZusWorkerTotal: "Razem ZUS pracownika:",
    secPpk: "PPK (Pracownicze Plany Kapitałowe)",
    lblPpkZatr: "Składka pracownika (PPK zatrudniony - 2%):",
    secHealth: "Ubezpieczenie zdrowotne (Składka zdrowotna NFZ - 9%)",
    lblHealthBase: "Podstawa składki zdrowotnej:",
    lblHealthSum: "Kwota składki:",
    secTax: "Podatek dochodowy (PIT)",
    lblTaxBase: "Podstawa opodatkowania:",
    lblTaxSum: "Zaliczka na podatek:",
    secOther: "Pozostałe potrącenia",
    lblNettoFinal: "Do wypłaty (NETTO / Na konto):",
    quickSelectLabel: "Szybki wybór zmiany:",
    shift1Btn: "1 zmiana",
    shift2Btn: "2 zmiana",
    shift3Btn: "3 zmiana",
    shiftOffBtn: "Wolne",
    timeStart: "Poczatek:",
    timeEnd: "Koniec:",
    applyBtn: "Zastosuj",
    weekdays: ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Niedz"],
    months: ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"],
    shift1Text: "1 zmiana",
    shift2Text: "2 zmiana",
    shift3Text: "3 zmiana",
    shiftOffText: "Выходной"
  }
};

function t(key) {
  return translations[currentLang][key] || key;
}

// --- DOM ЭЛЕМЕНТЫ КАЛЕНДАРЯ ---
const langRu = document.getElementById('langRu');
const langPl = document.getElementById('langPl');
const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');
const todayBtn = document.getElementById('todayBtn');
const weekdaysGrid = document.getElementById('weekdaysGrid');
const calendarGrid = document.getElementById('calendarGrid');
const saveBtn = document.getElementById('saveBtn');
const statusMsg = document.getElementById('statusMsg');

// Вкладки
const tabBtnCalendar = document.getElementById('tabBtnCalendar');
const tabBtnSalary = document.getElementById('tabBtnSalary');
const tabContentCalendar = document.getElementById('tabContentCalendar');
const tabContentSalary = document.getElementById('tabContentSalary');

// Итоги
const totalShiftsEl = document.getElementById('totalShifts');
const totalBaseHoursEl = document.getElementById('totalBaseHours');
const totalOvertimeHoursEl = document.getElementById('totalOvertimeHours');
const totalNightHoursEl = document.getElementById('totalNightHours');
const totalAllHoursEl = document.getElementById('totalAllHours');
const totalGrossEarnedEl = document.getElementById('totalGrossEarned');

// Настройки ЗП
const calcTypeSelect = document.getElementById('calcTypeSelect');
const monthlyRateBox = document.getElementById('monthlyRateBox');
const hourlyRateBox = document.getElementById('hourlyRateBox');
const monthlyRateInput = document.getElementById('monthlyRateInput');
const rateInput = document.getElementById('rateInput');
const bonusInput = document.getElementById('bonusInput');
const manualKantynaInput = document.getElementById('manualKantynaInput');

// Модальное окно
const dayModal = document.getElementById('dayModal');
const modalTitle = document.getElementById('modalTitle');
const modalClose = document.getElementById('modalClose');
const modalHolidayBanner = document.getElementById('modalHolidayBanner');
const startTimeInput = document.getElementById('startTime');
const endTimeInput = document.getElementById('endTime');
const overtimePreview = document.getElementById('overtimePreview');
const modalSaveBtn = document.getElementById('modalSaveBtn');

let selectedDay = null;
let monthData = {}; // Данные смен текущего месяца

// Инициализация селектов месяцев
function initSelectors() {
  monthSelect.innerHTML = '';
  const months = translations[currentLang].months;
  months.forEach((mName, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = mName;
    monthSelect.appendChild(opt);
  });
}

function setCurrentDate() {
  const now = new Date();
  monthSelect.value = now.getMonth();
  yearSelect.value = now.getFullYear();
}

// Переключение языков
function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('appLang', lang);
  langRu.classList.toggle('active', lang === 'ru');
  langPl.classList.toggle('active', lang === 'pl');

  initSelectors();
  updateTexts();
  renderCalendar();
}

langRu.addEventListener('click', () => setLanguage('ru'));
langPl.addEventListener('click', () => setLanguage('pl'));

function updateTexts() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[currentLang][key]) {
      el.textContent = translations[currentLang][key];
    }
  });
  renderWeekdays();
}

function renderWeekdays() {
  weekdaysGrid.innerHTML = '';
  const days = translations[currentLang].weekdays;
  days.forEach(d => {
    const div = document.createElement('div');
    div.className = 'weekday-header';
    div.textContent = d;
    weekdaysGrid.appendChild(div);
  });
}

// Переключение вкладок
tabBtnCalendar.addEventListener('click', () => {
  tabBtnCalendar.classList.add('active');
  tabBtnSalary.classList.remove('active');
  tabContentCalendar.classList.add('active');
  tabContentSalary.classList.remove('active');
});

tabBtnSalary.addEventListener('click', () => {
  tabBtnSalary.classList.add('active');
  tabBtnCalendar.classList.remove('active');
  tabContentSalary.classList.add('active');
  tabContentCalendar.classList.remove('active');
  calculatePayslip();
});

calcTypeSelect.addEventListener('change', () => {
  const isMonthly = calcTypeSelect.value === 'monthly';
  monthlyRateBox.style.display = isMonthly ? 'block' : 'none';
  hourlyRateBox.style.display = isMonthly ? 'none' : 'block';
  calculatePayslip();
});

// Загрузка данных с сервера
async function loadUserSettingsAndShifts() {
  if (!currentUser) return;
  const month = monthSelect.value;
  const year = yearSelect.value;

  try {
    const settingsRes = await fetch(`/api/settings?userId=${currentUser.id}`);
    if (settingsRes.ok) {
      const settings = await settingsRes.json();
      if (settings.calc_type) calcTypeSelect.value = settings.calc_type;
      monthlyRateInput.value = settings.monthly_rate || '5500';
      rateInput.value = settings.rate || '';
      bonusInput.value = settings.bonus || '850';
      manualKantynaInput.value = settings.manual_kantyna || '0';
    }

    monthlyRateBox.style.display = calcTypeSelect.value === 'monthly' ? 'block' : 'none';
    hourlyRateBox.style.display = calcTypeSelect.value === 'monthly' ? 'none' : 'block';

    const res = await fetch(`/api/shifts?userId=${currentUser.id}&year=${year}&month=${month}`);
    if (!res.ok) throw new Error();
    const rows = await res.json();
    monthData = {};
    rows.forEach(row => {
      const dayNum = parseInt(row.work_date.split('-')[2], 10);
      monthData[dayNum] = {
        shift: row.shift_type,
        start: row.start_time,
        end: row.end_time,
        totalHours: row.total_hours,
        overtime: row.overtime_hours
      };
    });
    renderCalendar();
    statusMsg.style.display = 'none';
  } catch (err) {
    monthData = {};
    renderCalendar();
    statusMsg.style.display = 'none';
  }
}

// Рендер календаря с правильными классами плиток
function renderCalendar() {
  calendarGrid.innerHTML = '';
  const year = parseInt(yearSelect.value);
  const month = parseInt(monthSelect.value);

  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Пн = 0
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Пустые ячейки для выравнивания
  for (let i = 0; i < firstDayIndex; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'calendar-day empty';
    calendarGrid.appendChild(emptyCell);
  }

  for (let day = 1; day <= totalDays; day++) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day';
    
    const dayData = monthData[day] || { shift: 'none', totalHours: 0, overtime: 0 };
    
    // Присваиваем класс смены или выходного
    if (dayData.shift && dayData.shift !== 'none') {
      cell.classList.add(`shift-${dayData.shift}`);
    } else {
      cell.classList.add('shift-off');
    }

    let shiftText = translations[currentLang].shiftOffText || "Выходной";
    if (dayData.shift === '1') shiftText = translations[currentLang].shift1Text || "1 смена";
    if (dayData.shift === '2') shiftText = translations[currentLang].shift2Text || "2 смена";
    if (dayData.shift === '3') shiftText = translations[currentLang].shift3Text || "3 смена";

    cell.innerHTML = `
      <div class="day-number">${day}</div>
      <div class="day-shift-info">${shiftText}</div>
    `;

    cell.addEventListener('click', () => openDayModal(day));
    calendarGrid.appendChild(cell);
  }

  calculateTotals();
}

// Расчет итогов за месяц
function calculateTotals() {
  let daysWorked = 0;
  let baseHours = 0;
  let overtimeHours = 0;
  let nightHours = 0;
  let grossEarned = 0;

  const rate = parseFloat(rateInput.value) || 35;
  const isMonthly = calcTypeSelect.value === 'monthly';
  const monthlyVal = parseFloat(monthlyRateInput.value) || 5500;
  const bonusVal = parseFloat(bonusInput.value) || 850;

  for (const day in monthData) {
    const d = monthData[day];
    if (d.shift && d.shift !== 'none') {
      daysWorked++;
      const th = d.totalHours || 8;
      const ot = d.overtime || 0;
      const b = Math.max(0, th - ot);

      baseHours += b;
      overtimeHours += ot;

      if (d.shift === '3') {
        nightHours += 8;
      }

      if (!isMonthly) {
        grossEarned += th * rate;
      }
    }
  }

  const allHours = baseHours + overtimeHours;
  if (isMonthly) {
    grossEarned = monthlyVal + bonusVal; 
  }

  totalShiftsEl.textContent = daysWorked;
  totalBaseHoursEl.textContent = baseHours + " ч";
  totalOvertimeHoursEl.textContent = overtimeHours + " ч";
  totalNightHoursEl.textContent = nightHours + " ч";
  totalAllHoursEl.textContent = allHours + " ч";
  totalGrossEarnedEl.textContent = grossEarned.toFixed(2) + " zł";
}

// Модальное окно настройки дня
function openDayModal(day) {
  selectedDay = day;
  modalTitle.textContent = `${day} ${translations[currentLang].months[monthSelect.value]} ${yearSelect.value}`;
  
  const dData = monthData[day] || { shift: 'none', start: '06:00', end: '14:00' };
  startTimeInput.value = dData.start || '06:00';
  endTimeInput.value = dData.end || '14:00';

  updateOvertimePreview();
  dayModal.style.display = 'flex';
}

modalClose.addEventListener('click', () => { dayModal.style.display = 'none'; });
window.addEventListener('click', (e) => { if (e.target === dayModal) dayModal.style.display = 'none'; });

// Быстрый выбор смен в модалке
document.querySelectorAll('.btn-quick').forEach(btn => {
  btn.addEventListener('click', () => {
    const shift = btn.getAttribute('data-shift');
    if (shift === '1') { startTimeInput.value = '06:00'; endTimeInput.value = '14:00'; }
    if (shift === '2') { startTimeInput.value = '14:00'; endTimeInput.value = '22:00'; }
    if (shift === '3') { startTimeInput.value = '22:00'; endTimeInput.value = '06:00'; }
    if (shift === 'none') { startTimeInput.value = ''; endTimeInput.value = ''; }
    
    saveDayData(shift);
  });
});

function calculateHoursFromTimes(start, end) {
  if (!start || !end) return { total: 0, overtime: 0 };
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  
  let startMinutes = sh * 60 + sm;
  let endMinutes = eh * 60 + em;
  if (endMinutes <= startMinutes) endMinutes += 24 * 60;

  const totalMins = endMinutes - startMinutes;
  const totalH = totalMins / 60;
  const overtime = Math.max(0, totalH - 8);

  return { total: parseFloat(totalH.toFixed(1)), overtime: parseFloat(overtime.toFixed(1)) };
}

function updateOvertimePreview() {
  const { total, overtime } = calculateHoursFromTimes(startTimeInput.value, endTimeInput.value);
  overtimePreview.textContent = `Всего: ${total}ч (Переработка: ${overtime}ч)`;
}

startTimeInput.addEventListener('input', updateOvertimePreview);
endTimeInput.addEventListener('input', updateOvertimePreview);

modalSaveBtn.addEventListener('click', () => {
  let shiftType = '1';
  const start = startTimeInput.value;
  const end = endTimeInput.value;
  if (!start || !end) {
    shiftType = 'none';
  } else if (start.startsWith('14')) {
    shiftType = '2';
  } else if (start.startsWith('22')) {
    shiftType = '3';
  }
  saveDayData(shiftType);
});

function saveDayData(shiftType) {
  const start = startTimeInput.value;
  const end = endTimeInput.value;
  const { total, overtime } = calculateHoursFromTimes(start, end);

  monthData[selectedDay] = {
    shift: shiftType,
    start: shiftType === 'none' ? '' : start,
    end: shiftType === 'none' ? '' : end,
    totalHours: shiftType === 'none' ? 0 : total,
    overtime: shiftType === 'none' ? 0 : overtime
  };

  dayModal.style.display = 'none';
  renderCalendar();
}

// Детализированный расчет зарплаты (Pasek Płacowy)
function calculatePayslip() {
  const isMonthly = calcTypeSelect.value === 'monthly';
  const monthlyVal = parseFloat(monthlyRateInput.value) || 5500;
  const bonusVal = parseFloat(bonusInput.value) || 850;
  const manualKantyna = parseFloat(manualKantynaInput.value) || 0;

  let gross = isMonthly ? (monthlyVal + bonusVal) : 35 * 168;

  document.getElementById('slipEarningsList').innerHTML = isMonthly ? `
    <div class="slip-row"><span>Wynagrodzenie zasadnicze (Оклад):</span><span>${monthlyVal.toFixed(2)} zł</span></div>
    <div class="slip-row"><span>Premia regulaminowa (Премия):</span><span>${bonusVal.toFixed(2)} zł</span></div>
  ` : `<div class="slip-row"><span>Wynagrodzenie godzinowe:</span><span>${gross.toFixed(2)} zł</span></div>`;

  document.getElementById('slipBruttoVal').textContent = gross.toFixed(2) + ' zł';

  const zusEmeryt = gross * 0.0976;
  const zusRent = gross * 0.015;
  const zusChor = gross * 0.0245;
  const zusWorkerTotal = zusEmeryt + zusRent + zusChor;

  document.getElementById('zusEmeryt').textContent = zusEmeryt.toFixed(2) + ' zł';
  document.getElementById('zusRent').textContent = zusRent.toFixed(2) + ' zł';
  document.getElementById('zusChor').textContent = zusChor.toFixed(2) + ' zł';
  document.getElementById('slipZusWorkerTotal').textContent = zusWorkerTotal.toFixed(2) + ' zł';

  const ppkZatr = gross * 0.02;
  document.getElementById('ppkZatrVal').textContent = ppkZatr.toFixed(2) + ' zł';

  const healthBase = gross - zusWorkerTotal;
  const healthSum = healthBase * 0.09;
  document.getElementById('healthBaseVal').textContent = healthBase.toFixed(2) + ' zł';
  document.getElementById('healthSumVal').textContent = healthSum.toFixed(2) + ' zł';

  const taxBase = Math.max(0, healthBase - 300);
  let taxSum = taxBase * 0.12 - 300;
  if (taxSum < 0) taxSum = 0;
  document.getElementById('taxBaseVal').textContent = taxBase.toFixed(2) + ' zł';
  document.getElementById('taxSumVal').textContent = taxSum.toFixed(2) + ' zł';

  const otherDeductions = 32.00 + 15.00 + 4.90 + manualKantyna;
  document.getElementById('otherDeductionsSumVal').textContent = otherDeductions.toFixed(2) + ' zł';

  const net = gross - zusWorkerTotal - ppkZatr - healthSum - taxSum - otherDeductions;
  document.getElementById('slipNettoVal').textContent = net.toFixed(2) + ' zł';
}

[monthlyRateInput, rateInput, bonusInput, manualKantynaInput].forEach(inp => {
  inp.addEventListener('input', calculatePayslip);
});

// Кнопка сохранения
saveBtn.addEventListener('click', async () => {
  if (!currentUser) return;
  saveBtn.disabled = true;
  saveBtn.innerText = t('savingBtn');
  
  try {
    const res = await fetch('/api/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        month: monthSelect.value,
        year: yearSelect.value,
        scheduleData: monthData
      })
    });

    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        calcType: calcTypeSelect.value,
        monthlyRate: monthlyRateInput.value,
        rate: rateInput.value,
        bonus: bonusInput.value,
        manualKantyna: manualKantynaInput.value
      })
    });

    if (!res.ok) throw new Error();
    statusMsg.style.backgroundColor = "rgba(74, 222, 128, 0.1)";
    statusMsg.style.color = "var(--success-color)";
    statusMsg.innerText = t('saveSuccess');
    statusMsg.style.display = "block";
  } catch (err) {
    statusMsg.style.backgroundColor = "rgba(248, 113, 113, 0.1)";
    statusMsg.style.color = "var(--error-color)";
    statusMsg.innerText = t('saveError');
    statusMsg.style.display = "block";
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerText = t('saveBtn');
  }
});

monthSelect.addEventListener('change', loadUserSettingsAndShifts);
yearSelect.addEventListener('change', loadUserSettingsAndShifts);
todayBtn.addEventListener('click', () => {
  setCurrentDate();
  loadUserSettingsAndShifts();
});

// Инициализация при старте
initSelectors();
setCurrentDate();
updateTexts();
checkAuthUI();