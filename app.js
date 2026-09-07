// =========================================
// Управление вкладками
// =========================================
function openTab(tabId) {
    document.querySelectorAll(".tab-content").forEach(tab => {
        tab.classList.remove("active");
    });

    document.getElementById(tabId).classList.add("active");
}

// Открываем вкладку входа по умолчанию
openTab("login-tab");

// =========================================
// Регистрация
// =========================================
async function register() {
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value.trim();

    if (!email || !password) {
        alert("Введите email и пароль");
        return;
    }

    const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!data.success) {
        alert(data.error || "Ошибка регистрации");
        return;
    }

    alert("Регистрация успешна!");
}

// =========================================
// Вход
// =========================================
async function login() {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    if (!email || !password) {
        alert("Введите email и пароль");
        return;
    }

    const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!data.success) {
        alert(data.error || "Ошибка входа");
        return;
    }

    localStorage.setItem("userId", data.user.id);

    alert("Вход выполнен!");
    openTab("settings-tab");
}

// =========================================
// Загрузка настроек
// =========================================
async function loadSettings() {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    const res = await fetch(`/api/settings?userId=${userId}`);
    const data = await res.json();

    if (!data) return;

    document.getElementById("calc-type").value = data.calc_type || "monthly";
    document.getElementById("monthly-rate").value = data.monthly_rate || 5500;
    document.getElementById("bonus").value = data.bonus || 850;
    document.getElementById("shift1-start").value = data.shift1_start || "06:00";
}

loadSettings();

// =========================================
// Сохранение настроек
// =========================================
async function saveSettings() {
    const userId = localStorage.getItem("userId");
    if (!userId) {
        alert("Ошибка: пользователь не найден");
        return;
    }

    const body = {
        userId,
        calcType: document.getElementById("calc-type").value,
        monthlyRate: Number(document.getElementById("monthly-rate").value),
        bonus: Number(document.getElementById("bonus").value),
        shift1Start: document.getElementById("shift1-start").value
    };

    const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!data.success) {
        alert("Ошибка сохранения настроек");
        return;
    }

    alert("Настройки сохранены!");
}

// =========================================
// Загрузка графика
// =========================================
async function loadSchedule() {
    const userId = localStorage.getItem("userId");
    if (!userId) {
        alert("Ошибка: пользователь не найден");
        return;
    }

    const year = document.getElementById("year").value;
    const month = document.getElementById("month").value;

    const res = await fetch(`/api/shifts?userId=${userId}&year=${year}&month=${month}`);
    const data = await res.json();

    const container = document.getElementById("schedule-container");
    container.innerHTML = "";

    const daysInMonth = new Date(year, Number(month) + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const row = document.createElement("div");
        row.className = "schedule-row";

        const dateLabel = document.createElement("span");
        dateLabel.innerText = `${day}.${Number(month) + 1}.${year}`;
        row.appendChild(dateLabel);

        const shiftSelect = document.createElement("select");
        shiftSelect.innerHTML = `
            <option value="none">Нет</option>
            <option value="1">1 смена</option>
            <option value="2">2 смена</option>
            <option value="3">3 смена</option>
        `;
        row.appendChild(shiftSelect);

        const startInput = document.createElement("input");
        startInput.type = "time";
        row.appendChild(startInput);

        const endInput = document.createElement("input");
        endInput.type = "time";
        row.appendChild(endInput);

        const existing = data.find(d => Number(d.work_date.split("-")[2]) === day);
        if (existing) {
            shiftSelect.value = existing.shift_type;
            startInput.value = existing.start_time;
            endInput.value = existing.end_time;
        }

        row.dataset.day = day;
        container.appendChild(row);
    }
}

// =========================================
// Сохранение графика
// =========================================
async function saveSchedule() {
    const userId = localStorage.getItem("userId");
    if (!userId) {
        alert("Ошибка: пользователь не найден");
        return;
    }

    const year = document.getElementById("year").value;
    const month = document.getElementById("month").value;

    const rows = document.querySelectorAll(".schedule-row");
    const scheduleData = {};

    rows.forEach(row => {
        const day = row.dataset.day;
        const shift = row.querySelector("select").value;
        const start = row.querySelector("input[type='time']:nth-child(3)").value;
        const end = row.querySelector("input[type='time']:nth-child(4)").value;

        scheduleData[day] = { shift, start, end };
    });

    const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, year, month, scheduleData })
    });

    const data = await res.json();

    if (!data.success) {
        alert("Ошибка сохранения графика");
        return;
    }

    alert("График сохранён!");
}
