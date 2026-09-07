// =========================================
// Work Schedule Multi — salary.js
// =========================================
//
// Отвечает за:
// - загрузку расчёта зарплаты из backend
// - вывод данных в карточки интерфейса
// =========================================


async function loadSalary() {
    const userId = localStorage.getItem("userId");
    if (!userId) {
        alert("Błąd: użytkownik nie znaleziony");
        return;
    }

    const year = Number(document.getElementById("salary-year").value);
    const month = Number(document.getElementById("salary-month").value);

    try {
        const res = await fetch(`/api/salary?userId=${userId}&year=${year}&month=${month}`);
        const data = await res.json();

        if (!data.success) {
            alert(data.error || "Błąd obliczeń wynagrodzenia");
            return;
        }

        // ============================
        // Wyświetlanie wyników
        // ============================

        // Brutto / Netto
        document.getElementById("salary-brutto").innerText =
            (data.brutto || 0).toFixed(2) + " zł";

        document.getElementById("salary-netto").innerText =
            (data.netto || 0).toFixed(2) + " zł";

        // ZUS
        document.getElementById("salary-zus").innerText =
            (data.zus_total || 0).toFixed(2) + " zł";

        // PIT
        document.getElementById("salary-pit").innerText =
            (data.pit_final || 0).toFixed(2) + " zł";

        // Godziny
        document.getElementById("salary-hours").innerText =
            (data.totalHours || 0).toFixed(2);

        document.getElementById("salary-hours50").innerText =
            (data.overtime50 || 0).toFixed(2);

        document.getElementById("salary-hours100").innerText =
            (data.overtime100 || 0).toFixed(2);

        // Jeśli masz dodatkowe pola (stawka godzinowa itd.)
        if (document.getElementById("salary-hourly-base")) {
            document.getElementById("salary-hourly-base").innerText =
                (data.hourlyBase || 0).toFixed(2) + " zł";
        }

        if (document.getElementById("salary-hourly-night")) {
            document.getElementById("salary-hourly-night").innerText =
                (data.hourlyNight || 0).toFixed(2) + " zł";
        }

        if (document.getElementById("salary-hourly-50")) {
            document.getElementById("salary-hourly-50").innerText =
                (data.hourly50 || 0).toFixed(2) + " zł";
        }

        if (document.getElementById("salary-hourly-100")) {
            document.getElementById("salary-hourly-100").innerText =
                (data.hourly100 || 0).toFixed(2) + " zł";
        }

        if (document.getElementById("salary-premia")) {
            document.getElementById("salary-premia").innerText =
                (data.premia || 0).toFixed(2) + " zł";
        }

    } catch (err) {
        console.error("Błąd ładowania wynagrodzenia:", err);
        alert("Błąd ładowania wynagrodzenia");
    }
}
