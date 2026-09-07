// =========================================
// Work Schedule Multi — schedule.js
// =========================================
//
// Отвечает за:
// - генерацию календаря
// - отображение смен
// - загрузку и сохранение графика
// =========================================


// =========================================
// Генерация календаря
// =========================================
function generateCalendar(year, month, shiftsData = {}) {
    const container = document.getElementById("schedule-container");
    container.innerHTML = "";

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // В JS воскресенье = 0 → нам нужно понедельник = 0
    const startOffset = (firstDay === 0 ? 6 : firstDay - 1);

    // Пустые ячейки перед началом месяца
    for (let i = 0; i < startOffset; i++) {
        const empty = document.createElement("div");
        empty.className = "day-card empty";
        container.appendChild(empty);
    }

    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
        const card = document.createElement("div");
        card.className = "day-card";

        const number = document.createElement("div");
        number.className = "day-number";
        number.textContent = day;

        card.appendChild(number);

        // Проверяем смену
        const shift = shiftsData[day];
        if (shift) {
            card.classList.add(`shift-${shift}`);
        }

        // Клик по дню → смена
        card.addEventListener("click", () => {
            const currentShift = shiftsData[day] || 0;
            const nextShift = currentShift === 3 ? 0 : currentShift + 1;

            shiftsData[day] = nextShift;

            // Обновляем визуально
            card.className = "day-card";
            if (nextShift > 0) {
                card.classList.add(`shift-${nextShift}`);
            }
        });

        container.appendChild(card);
    }

    return shiftsData;
}


// =========================================
// Загрузка графика из backend
// =========================================
async function loadSchedule() {
    const userId = localStorage.getItem("userId");
    if (!userId) {
        alert("Błąd: użytkownik nie znaleziony");
        return;
    }

    const year = Number(document.getElementById("year").value);
    const month = Number(document.getElementById("month").value);

    try {
        const res = await fetch(`/api/shifts?userId=${userId}&year=${year}&month=${month}`);
        const data = await res.json();

        if (data.error) {
            // Если нет данных — создаём пустой календарь
            generateCalendar(year, month, {});
            return;
        }

        generateCalendar(year, month, data.shifts || {});

    } catch (err) {
        console.error("Ошибка загрузки графика:", err);
        alert("Błąd ładowania grafiku");
    }
}


// =========================================
// Сохранение графика в backend
// =========================================
async function saveSchedule() {
    const userId = localStorage.getItem("userId");
    if (!userId) {
        alert("Błąd: użytkownik nie znaleziony");
        return;
    }

    const year = Number(document.getElementById("year").value);
    const month = Number(document.getElementById("month").value);

    // Собираем смены из DOM
    const cards = document.querySelectorAll(".day-card");
    const shifts = {};
    let dayCounter = 1;

    cards.forEach(card => {
        if (!card.classList.contains("empty")) {
            if (card.classList.contains("shift-1")) shifts[dayCounter] = 1;
            else if (card.classList.contains("shift-2")) shifts[dayCounter] = 2;
            else if (card.classList.contains("shift-3")) shifts[dayCounter] = 3;
            else shifts[dayCounter] = 0;

            dayCounter++;
        }
    });

    try {
        const res = await fetch("/api/shifts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId,
                year,
                month,
                shifts
            })
        });

        const data = await res.json();

        if (!data.success) {
            alert("Błąd zapisu grafiku");
            return;
        }

        alert("Grafik zapisany!");

    } catch (err) {
        console.error("Ошибка сохранения графика:", err);
        alert("Błąd zapisu grafiku");
    }
}
