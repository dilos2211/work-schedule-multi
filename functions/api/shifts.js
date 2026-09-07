function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// =========================
// Расчёт часов и надбавок
// =========================
function calculateHours(start, end) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);

  let startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;
  if (endMin <= startMin) endMin += 24 * 60;

  const totalMinutes = endMin - startMin;
  const totalHours = totalMinutes / 60;

  // Ночные часы (22:00–06:00)
  const nightStart = 22 * 60;
  const nightEnd = 6 * 60 + 24 * 60;
  let nightMinutes = 0;
  for (let t = startMin; t < endMin; t++) {
    const mod = t % (24 * 60);
    if (mod >= nightStart || mod < 6 * 60) nightMinutes++;
  }

  const nightHours = nightMinutes / 60;
  const overtime = totalHours > 8 ? totalHours - 8 : 0;

  return {
    totalHours: Number(totalHours.toFixed(2)),
    nightHours: Number(nightHours.toFixed(2)),
    overtime: Number(overtime.toFixed(2)),
  };
}

// =========================
// Расчёт надбавок по смене
// =========================
function calculateBonus(shiftType, start, end) {
  const calc = calculateHours(start, end);
  let bonus50 = 0;
  let bonus100 = 0;

  switch (shiftType) {
    case "1":
      // 1 смена → переработка 22–06 (+100 % + ночные)
      bonus100 = calc.totalHours;
      break;
    case "2":
      // 2 смена → переработка 06–22 (+50 %)
      bonus50 = calc.totalHours;
      break;
    case "3":
      // 3 смена → переработка 06–22 (+50 % + ночные)
      bonus50 = calc.totalHours;
      break;
  }

  return {
    bonus50: Number(bonus50.toFixed(2)),
    bonus100: Number(bonus100.toFixed(2)),
    nightHours: calc.nightHours,
    totalHours: calc.totalHours,
    overtime: calc.overtime,
  };
}

// =========================
// GET /api/shifts
// =========================
export const onRequestGet = async ({ request, env }) => {
  const db = env.DB;
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const year = url.searchParams.get("year");
  const month = url.searchParams.get("month");

  const prefix = `${year}-${String(parseInt(month) + 1).padStart(2, "0")}`;
  const { results } = await db
    .prepare(
      "SELECT work_date, shift_type, start_time, end_time, total_hours, overtime_hours, hours_50, hours_100, bonus_zl FROM reports WHERE user_id = ? AND work_date LIKE ?"
    )
    .bind(userId, `${prefix}%`)
    .all();

  return json(results || []);
};

// =========================
// POST /api/shifts
// =========================
export const onRequestPost = async ({ request, env }) => {
  const db = env.DB;
  const body = await request.json();
  const { userId, year, month, scheduleData } = body;
  const monthStr = String(parseInt(month) + 1).padStart(2, "0");

  for (const [day, data] of Object.entries(scheduleData)) {
    const dayStr = String(day).padStart(2, "0");
    const dateFull = `${year}-${monthStr}-${dayStr}`;

    await db
      .prepare("DELETE FROM reports WHERE user_id = ? AND work_date = ?")
      .bind(userId, dateFull)
      .run();

    if (!data.shift || data.shift === "none") continue;
    if (!data.start || !data.end)
      return json({ success: false, error: `Некорректное время в дне ${day}` }, 400);

    const calc = calculateBonus(data.shift, data.start, data.end);

    await db
      .prepare(`
        INSERT INTO reports (
          user_id, work_date, shift_type, start_time, end_time,
          total_hours, overtime_hours, hours_50, hours_100, bonus_zl
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        userId,
        dateFull,
        data.shift,
        data.start,
        data.end,
        calc.totalHours,
        calc.overtime,
        calc.bonus50,
        calc.bonus100,
        data.bonusZl || 0
      )
      .run();
  }

  return json({ success: true });
};
