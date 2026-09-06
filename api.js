import { currentUser, userSettings, currentYear, currentMonth, scheduleData } from './config.js';

export async function apiLoadSettings() {
    if (!currentUser) return;
    try {
        const res = await fetch(`/api/settings?userId=${currentUser.id}`);
        const data = await res.json();
        if (data && data.user_id) {
            userSettings.calcType = data.calc_type || 'monthly';
            userSettings.monthlyRate = data.monthly_rate !== undefined ? data.monthly_rate : 5500;
            userSettings.rate = data.rate !== undefined ? data.rate : 25;
            userSettings.bonus = data.bonus !== undefined ? data.bonus : 850;
            userSettings.manualKantyna = data.manual_kantyna !== undefined ? data.manual_kantyna : 0;
            userSettings.shift1Start = data.shift1_start || '06:00';
        }
    } catch (e) {
        console.error('Ошибка загрузки настроек:', e);
    }
}

export async function apiSaveSettings() {
    if (!currentUser) return;
    try {
        await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                calcType: userSettings.calcType,
                monthlyRate: userSettings.monthlyRate,
                rate: userSettings.rate,
                bonus: userSettings.bonus,
                manualKantyna: userSettings.manualKantyna,
                shift1Start: userSettings.shift1Start
            })
        });
    } catch (e) {
        console.error('Ошибка сохранения настроек:', e);
        throw e;
    }
}

export async function apiLoadShifts(onSuccess) {
    if (!currentUser) return;
    try {
        const res = await fetch(`/api/shifts?userId=${currentUser.id}&year=${currentYear}&month=${currentMonth}`);
        const data = await res.json();
        
        // Очищаем и наполняем scheduleData заново
        for (let key in scheduleData) delete scheduleData[key];

        if (Array.isArray(data)) {
            data.forEach(item => {
                const dayNum = parseInt(item.work_date.split('-')[2]);
                scheduleData[dayNum] = {
                    shift: item.shift_type,
                    start: item.start_time,
                    end: item.end_time,
                    totalHours: item.total_hours,
                    overtime: item.overtime_hours,
                    hours50: item.hours_50 || 0,
                    hours100: item.hours_100 || 0,
                    bonusZl: item.bonus_zl || 0
                };
            });
        }
        if (onSuccess) onSuccess();
    } catch (e) {
        console.error('Ошибка загрузки смен:', e);
    }
}

export async function apiSaveAll(onSuccess, onError) {
    if (!currentUser) return;
    try {
        await apiSaveSettings();
        await fetch('/api/shifts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                year: currentYear,
                month: currentMonth,
                scheduleData: scheduleData
            })
        });
        if (onSuccess) onSuccess();
    } catch (e) {
        console.error('Ошибка сохранения отчета:', e);
        if (onError) onError(e);
    }
}