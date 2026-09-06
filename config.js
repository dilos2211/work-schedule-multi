export let currentUser = JSON.parse(localStorage.getItem('work_user')) || null;
export let currentYear = new Date().getFullYear();
export let currentMonth = new Date().getMonth();
export let scheduleData = {};
export let activeTab = 'calendar';
export let selectedDayForModal = null;
export let hasUnsavedChanges = false;
export let currentModalShift = '1';
export let isRegisterMode = false;

export let userSettings = {
    calcType: 'monthly',
    monthlyRate: 5500,
    rate: 25,
    bonus: 850,
    manualKantyna: 0,
    shift1Start: '06:00'
};

export function setCurrentUser(user) {
    currentUser = user;
    if (user) {
        localStorage.setItem('work_user', JSON.stringify(user));
    } else {
        localStorage.removeItem('work_user');
    }
}

export function setYearMonth(y, m) {
    currentYear = y;
    currentMonth = m;
}

export function setActiveTab(tab) {
    activeTab = tab;
}

export function setSelectedDay(day) {
    selectedDayForModal = day;
}

export function setUnsavedChanges(val) {
    hasUnsavedChanges = val;
}

export function setModalShift(shift) {
    currentModalShift = shift;
}

export function setRegisterMode(mode) {
    isRegisterMode = mode;
}

// Праздники Польши
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

export function getHolidayName(year, month, day) {
    let holidays = [...polishHolidaysFixed, ...getPolishFloatingHolidays(year)];
    let found = holidays.find(h => h.m === month && h.d === day);
    return found ? found.name : null;
}

export function addHoursToTime(timeStr, hoursToAdd) {
    let [h, m] = timeStr.split(':').map(Number);
    let totalM = h * 60 + m + hoursToAdd * 60;
    let newH = Math.floor(totalM / 60) % 24;
    let newM = totalM % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

export function getCalculatedShiftsConfig() {
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