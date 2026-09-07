// =========================================
// Work Schedule Multi — app.js
// =========================================
//
// Отвечает за:
// - переключение вкладок
// - инициализацию календаря и настроек
// - базовую логику интерфейса
// =========================================


// =========================================
// Переключение вкладок
// =========================================
document.addEventListener("DOMContentLoaded", () => {

    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {

            // Удаляем active у всех кнопок
            tabButtons.forEach(b => b.classList.remove("active"));

            // Добавляем active на выбранную
            btn.classList.add("active");

            const tab = btn.dataset.tab;

            // Скрываем все вкладки
            tabContents.forEach(content => {
                content.classList.remove("active");
            });

            // Показываем выбранную вкладку
            document.getElementById(tab).classList.add("active");

            // Авто‑инициализация вкладок
            if (tab === "calendar") {
                loadSchedule();
            }

            if (tab === "salary") {
                // ничего не делаем — пользователь сам нажмёт "Oblicz"
            }

            if (tab === "settings") {
                loadSettings();
            }
        });
    });

    // Авто‑загрузка настроек при старте
    loadSettings();
});


// =========================================
// Кнопки календаря
// =========================================
document.getElementById("load-schedule").addEventListener("click", () => {
    loadSchedule();
});

document.getElementById("save-schedule").addEventListener("click", () => {
    saveSchedule();
});


// =========================================
// Кнопки зарплаты
// =========================================
document.getElementById("load-salary").addEventListener("click", () => {
    loadSalary();
});


// =========================================
// Кнопка сохранения настроек
// =========================================
document.getElementById("save-settings").addEventListener("click", () => {
    saveSettings();
});
