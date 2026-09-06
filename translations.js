export const translations = {
    pl: {
        loginTitle: "Logowanie",
        registerTitle: "Rejestracja",
        emailLabel: "Email:",
        passwordLabel: "Hasło:",
        loginBtn: "Zaloguj",
        registerBtn: "Zarejestruj się",
        noAccount: "Nie masz konta?",
        hasAccount: "Masz już konto?",
        registerLink: "Zarejestruj się",
        loginLink: "Zaloguj",
        logoutBtn: "Wyloguj",

        tabCalendar: "📅 Kalendarz",
        tabSalary: "💰 Wynagrodzenie",
        tabSettings: "⚙️ Ustawienia",

        monthLabel: "Miesiąc:",
        yearLabel: "Rok:",
        calcTypeLabel: "Rodzaj umowy:",
        calcMonthly: "Umowa o pracę",
        calcHourly: "Umowa zlecenie",
        rateMonthlyLabel: "Wynagrodzenie miesięczne brutto (zł):",
        rateHourlyLabel: "Stawka godzinowa brutto (zł):",
        bonusLabel: "Premia (zł):",

        statDays: "Przepracowane dni:",
        statBaseHours: "Godziny bazowe:",
        statOvertime: "Nadgodziny:",
        statNight: "Godziny nocne (22:00-06:00):",
        statTotalHours: "Razem godzin:",
        statTotalMoney: "Razem",

        unsavedBadge: "⚠️ Dane wymagają zapisu",
        savedBadge: "✅ Dane zapisane",
        saveReportBtn: "Zapisz raport",

        settingsTitle: "⏰ Ustawienia czasu zmian",
        settingsDesc: "Wprowadź godzinę rozpoczęcia 1. zmiany. Pozostałe zmiany obliczą się automatycznie (+8 godzin każda).",
        shift1StartLabel: "Początek 1. zmiany:",
        autoScheduleTitle: "Harmonogram automatyczny:",
        saveSettingsBtn: "Zapisz ustawienia",

        salaryViewTitle: "Szczegóły kalkulacji wynagrodzenia",
        salaryViewDesc: "Poniżej znajduje się szczegółowe rozliczenie faktycznego wynagrodzenia brutto za dany miesiąc (wraz z premiami i dodatkami).",

        salaryHeader: "Rozliczenie wynagrodzenia",
        salaryHeaderWork: "Rozliczenie (Umowa o pracę)",
        salaryHeaderOrder: "Rozliczenie (Umowa zlecenie)",
        salaryBruttoTotalLabel: "Razem Brutto (z kalendarza):",
        zusWorkersLabel: "Składki społeczne ZUS (11.66%):",
        healthBaseLabel: "Podstawa składki zdrowotnej:",
        healthInsLabel: "Składka zdrowotna (9%):",
        taxBaseLabel: "Podstawa opodatkowania (PIT):",
        taxAdvanceLabel: "Zaliczka na PIT (12% - kwota wolna):",
        nettoFinalLabel: "Do wypłaty na konto (Netto):",
        employerCostLabel: "Całkowity koszt pracodawcy (~):",

        modalQuickShift: "Szybki wybór zmiany:",
        shift1Btn: "1 zmiana",
        shift2Btn: "2 zmiana",
        shift3Btn: "3 zmiana",
        noneShiftBtn: "Wolne",
        startLabel: "Początek:",
        endLabel: "Koniec:",
        hours50Label: "Godziny +50%:",
        hours100Label: "Godziny +100%:",
        bonusZlLabel: "Dodatek (zł):",
        applyBtn: "Zastosuj",

        themeCardTitle: "Wygląd",
        themeDarkActive: "Ciemny motyw włączony",
        themeLightActive: "Jasny motyw włączony",
        btnDarkText: "🌙 Ciemny",
        btnLightText: "☀️ Jasny",
        tooltipTheme: "Motyw",
        tooltipLogout: "Wyloguj",
        lblTotal: "Razem",
        lblBase: "Baza",
        lblNadg: "Nadg",
        tooltipHoliday: "Święto: ",
        tooltipWeekend: "Wolne (Weekend)",

        daysOfWeek: ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"],
        months: [
            "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
            "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
        ]
    },
    uk: {
        loginTitle: "Вхід",
        registerTitle: "Реєстрація",
        emailLabel: "Ел. пошта:",
        passwordLabel: "Пароль:",
        loginBtn: "Увійти",
        registerBtn: "Зареєструватися",
        noAccount: "Немає акаунта?",
        hasAccount: "Вже є акаунт?",
        registerLink: "Зареєструватися",
        loginLink: "Увійти",
        logoutBtn: "Вийти",

        tabCalendar: "📅 Календар",
        tabSalary: "💰 Зарплата",
        tabSettings: "⚙️ Налаштування",

        monthLabel: "Місяць:",
        yearLabel: "Рік:",
        calcTypeLabel: "Тип договору:",
        calcMonthly: "Umowa o pracę",
        calcHourly: "Umowa zlecenie",
        rateMonthlyLabel: "Місячний оклад брутто (zł):",
        rateHourlyLabel: "Погодинна ставка брутто (zł):",
        bonusLabel: "Премія (zł):",

        statDays: "Відпрацьовані дні:",
        statBaseHours: "Базові години:",
        statOvertime: "Надурочні (Nadgodziny):",
        statNight: "Нічні години (22:00-06:00):",
        statTotalHours: "Всього годин:",
        statTotalMoney: "Разом",

        unsavedBadge: "⚠️ Дані потрібно зберегти",
        savedBadge: "✅ Дані збережено",
        saveReportBtn: "Зберегти звіт",

        settingsTitle: "⏰ Налаштування часу змін",
        settingsDesc: "Вкажіть час початку 1-ї зміни. Решта змін розрахуються автоматично (+8 годин кожна).",
        shift1StartLabel: "Початок 1-ї зміни:",
        autoScheduleTitle: "Автоматичний графік:",
        saveSettingsBtn: "Зберегти налаштування",

        salaryViewTitle: "Деталізація розрахунку зарплати",
        salaryViewDesc: "Нижче наведено детальний розрахунок фактичного заробітку брутто за місяць разом із преміями та доплатами.",

        salaryHeader: "Розрахунок зарплати",
        salaryHeaderWork: "Розрахунок (Umowa o pracę)",
        salaryHeaderOrder: "Розрахунок (Umowa zlecenie)",
        salaryBruttoTotalLabel: "Всього Брутто (з календаря):",
        zusWorkersLabel: "Соціальні внески ZUS (11.66%):",
        healthBaseLabel: "База для медичного внеску:",
        healthInsLabel: "Медичний внесок (9%):",
        taxBaseLabel: "База оподаткування (PIT):",
        taxAdvanceLabel: "Податок PIT (12% - пільга):",
        nettoFinalLabel: "На руки (Netto):",
        employerCostLabel: "Загальні витрати роботодавця (~):",

        modalQuickShift: "Швидкий вибір зміни:",
        shift1Btn: "1 зміна",
        shift2Btn: "2 зміна",
        shift3Btn: "3 зміна",
        noneShiftBtn: "Вихідний",
        startLabel: "Початок:",
        endLabel: "Кінець:",
        hours50Label: "Години +50%:",
        hours100Label: "Години +100%:",
        bonusZlLabel: "Доплата (zł):",
        applyBtn: "Застосувати",

        themeCardTitle: "Тема оформлення",
        themeDarkActive: "Темну тему увімкнено",
        themeLightActive: "Світлу тему увімкнено",
        btnDarkText: "🌙 Темна",
        btnLightText: "☀️ Світла",
        tooltipTheme: "Тема",
        tooltipLogout: "Вийти",
        lblTotal: "Всього",
        lblBase: "База",
        lblNadg: "Понаднорм",
        tooltipHoliday: "Свято: ",
        tooltipWeekend: "Вихідний (Вікенд)",

        daysOfWeek: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"],
        months: [
            "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
            "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"
        ]
    }
};

let currentLang = localStorage.getItem('work_lang') || 'pl';

export function getLang() {
    return currentLang;
}

export function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('work_lang', lang);
}

export function t(key) {
    return translations[currentLang][key] || key;
}