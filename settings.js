// =========================================
// Work Schedule Multi — settings.js (frontend)
// =========================================
//
// Отвечает за:
// - загрузку настроек пользователя в UI
// - сохранение настроек через backend
// - обновление вкладки "Настройки"
// =========================================


// =========================================
// Загрузка настроек пользователя
// =========================================
async function loadSettings() {
    const userId = localStorage.getItem("userId");
    if (!userId) {
        console.warn("Пользователь не найден — настройки не загружены");
        return;
    }

    try {
        const res = await fetch(`/api/settings?userId=${userId}`);
        const data = await res.json();

        if (!data || data.error) {
            console.warn("Настройки не найдены или ошибка:", data?.error);
            return;
        }

        // Заполняем UI
        document.getElementById("calc-type").value = data.calc_type || "monthly";
        document.getElementById("monthly-rate").value = data.monthly_rate || 5500;
        document.getElementById("bonus").value = data.bonus || 850;
        document.getElementById("shift1-start").value = data.shift1_start || "06:00";

    } catch (err) {
        console.error("Ошибка загрузки настроек:", err);
        alert("Ошибка загрузки настроек");
    }
}


// =========================================
// Сохранение настроек пользователя
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

    try {
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

    } catch (err) {
        console.error("Ошибка сохранения настроек:", err);
        alert("Ошибка сохранения настроек");
    }
}


// =========================================
// Автоматическая загрузка настроек при входе
// =========================================
document.addEventListener("DOMContentLoaded", () => {
    loadSettings();
});
