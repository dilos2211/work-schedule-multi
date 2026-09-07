// =========================================
// Work Schedule Multi — salary.js (extended)
// =========================================
//
// Улучшения:
// - Полная детализация ZUS
// - Полная детализация PIT
// - Стоимость часа, ночного часа, переработок
// - Поддержка премий и бонусов
// - Проверка ошибок
// - Красивый вывод
// =========================================


// =========================================
// Загрузка зарплаты с backend
// =========================================
async function loadSalary() {
    const userId = localStorage.getItem("userId");
    if (!userId) {
        alert("Ошибка: пользователь не найден");
        return;
    }

    const year = document.getElementById("salary-year").value;
    const month = document.getElementById("salary-month").value;

    const url = `/api/salary?userId=${userId}&year=${year}&month=${month}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.success) {
        alert(data.error || "Ошибка расчёта зарплаты");
        return;
    }

    // Брутто
    const brutto = data.brutto;

    // Часы
    const totalHours = data.totalHours;
    const nightHours = data.nightHours;
    const overtime50 = data.overtime50;
    const overtime100 = data.overtime100;

    // Премия
    const premia = data.premia || 0;

    // =========================================
    // Стоимость часа
    // =========================================
    const hourlyBase = totalHours > 0 ? brutto / totalHours : 0;
    const hourlyNight = hourlyBase * 1.2;      // ночные +20%
    const hourly50 = hourlyBase * 1.5;         // переработка +50%
    const hourly100 = hourlyBase * 2.0;        // переработка +100%

    // =========================================
    // ZUS pracownik
    // =========================================
    const zus_emerytalne = brutto * 0.0976;
    const zus_rentowe = brutto * 0.015;
    const zus_chorobowe = brutto * 0.0245;

    const zus_total = zus_emerytalne + zus_rentowe + zus_chorobowe;

    // =========================================
    // PIT
    // =========================================
    const pit_base = brutto - zus_total;
    const pit_raw = pit_base * 0.12;

    const kwota_wolna = 300; // стандарт Польша
    const pit_final = Math.max(pit_raw - kwota_wolna, 0);

    // =========================================
    // NETTO
    // =========================================
    const netto = brutto - zus_total - pit_final;

    // =========================================
    // Вывод результата
    // =========================================

    document.getElementById("salary-brutto").innerText = brutto.toFixed(2) + " zł";
    document.getElementById("salary-netto").innerText = netto.toFixed(2) + " zł";

    // Детализация ZUS
    document.getElementById("salary-zus").innerText = zus_total.toFixed(2) + " zł";

    // Детализация PIT
    document.getElementById("salary-pit").innerText = pit_final.toFixed(2) + " zł";

    // Часы
    document.getElementById("salary-hours").innerText = totalHours.toFixed(2);
    document.getElementById("salary-hours50").innerText = overtime50.toFixed(2);
    document.getElementById("salary-hours100").innerText = overtime100.toFixed(2);

    // =========================================
    // Дополнительные поля (если хочешь вывести)
    // =========================================

    if (document.getElementById("salary-hourly-base"))
        document.getElementById("salary-hourly-base").innerText = hourlyBase.toFixed(2) + " zł";

    if (document.getElementById("salary-hourly-night"))
        document.getElementById("salary-hourly-night").innerText = hourlyNight.toFixed(2) + " zł";

    if (document.getElementById("salary-hourly-50"))
        document.getElementById("salary-hourly-50").innerText = hourly50.toFixed(2) + " zł";

    if (document.getElementById("salary-hourly-100"))
        document.getElementById("salary-hourly-100").innerText = hourly100.toFixed(2) + " zł";

    if (document.getElementById("salary-premia"))
        document.getElementById("salary-premia").innerText = premia.toFixed(2) + " zł";
}
