// =========================================
// Work Schedule Multi — config.js
// =========================================
//
// Определяет:
// - смены (1, 2, 3)
// - время начала и конца
// - описания
// - экспорт функций для schedule.js
// =========================================


const SHIFT_CONFIG = {
    "1": {
        name: "1 zmiana",
        start: "06:00",
        end: "14:00",
        color: "shift-1",
        description: "Zmiana poranna 06:00–14:00"
    },

    "2": {
        name: "2 zmiana",
        start: "14:00",
        end: "22:00",
        color: "shift-2",
        description: "Zmiana popołudniowa 14:00–22:00"
    },

    "3": {
        name: "3 zmiana",
        start: "22:00",
        end: "06:00",
        color: "shift-3",
        description: "Zmiana nocna 22:00–06:00"
    },

    "0": {
        name: "Brak",
        start: "",
        end: "",
        color: "",
        description: "Dzień wolny"
    }
};


// =========================================
// Pobieranie czasu zmiany
// =========================================
function getShiftTimes(shiftType) {
    const shift = SHIFT_CONFIG[shiftType];
    if (!shift) {
        return { start: "", end: "" };
    }

    return {
        start: shift.start,
        end: shift.end
    };
}


// =========================================
// Pobieranie nazwy zmiany
// =========================================
function getShiftName(shiftType) {
    return SHIFT_CONFIG[shiftType]?.name || "Brak";
}


// =========================================
// Pobieranie klasy koloru (CSS)
// =========================================
function getShiftColor(shiftType) {
    return SHIFT_CONFIG[shiftType]?.color || "";
}


// =========================================
// Eksport
// =========================================
window.SHIFT_CONFIG = SHIFT_CONFIG;
window.getShiftTimes = getShiftTimes;
window.getShiftName = getShiftName;
window.getShiftColor = getShiftColor;
