// =========================================
// Work Schedule Multi — schedule.js
// =========================================
//
// Отвечает за:
// - генерацию таблицы графика на месяц
// - автозаполнение времени по типу смены
// - подготовку данных для сохранения в /api/shifts
//
// Использует:
// - window.getShiftTimes из config.js
// =========================================

// Генерация графика на основе данных с backend
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

    // Автозаполнение при выборе смены
    shiftSelect.addEventListener("change", () => {
      const times = window.getShiftTimes(shiftSelect.value);
      startInput.value = times.start;
      endInput.value = times.end;
    });

    // Заполнение из существующих данных
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

// Сохранение графика в backend
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
    const inputs = row.querySelectorAll("input[type='time']");
    const start = inputs[0].value;
    const end = inputs[1].value;

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
