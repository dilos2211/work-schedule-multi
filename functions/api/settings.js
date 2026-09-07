// =========================================
// /api/settings — загрузка и сохранение настроек
// =========================================
//
// GET  /api/settings?userId=ID
// POST /api/settings
//
// Таблица user_settings содержит:
// - user_id
// - calc_type
// - monthly_rate
// - bonus
// - shift1_start
// =========================================

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

// =========================================
// GET — загрузка настроек
// =========================================
export const onRequestGet = async ({ request, env }) => {
  const db = env.DB;
  const url = new URL(request.url);

  const userId = url.searchParams.get("userId");
  if (!userId) {
    return json({ success: false, error: "userId не указан" }, 400);
  }

  const settings = await db
    .prepare("SELECT * FROM user_settings WHERE user_id = ?")
    .bind(userId)
    .first();

  if (!settings) {
    return json({ success: false, error: "Настройки не найдены" }, 404);
  }

  return json(settings);
};

// =========================================
// POST — сохранение настроек
// =========================================
export const onRequestPost = async ({ request, env }) => {
  const db = env.DB;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: "Некорректный JSON" }, 400);
  }

  const { userId, calcType, monthlyRate, bonus, shift1Start } = body;

  if (!userId) {
    return json({ success: false, error: "userId не указан" }, 400);
  }

  // Проверяем, есть ли настройки
  const existing = await db
    .prepare("SELECT user_id FROM user_settings WHERE user_id = ?")
    .bind(userId)
    .first();

  if (!existing) {
    // Создаём новые настройки
    await db
      .prepare(
        `
        INSERT INTO user_settings (
          user_id,
          calc_type,
          monthly_rate,
          bonus,
          shift1_start
        )
        VALUES (?, ?, ?, ?, ?)
      `
      )
      .bind(
        userId,
        calcType || "monthly",
        monthlyRate || 5500,
        bonus || 850,
        shift1Start || "06:00"
      )
      .run();

    return json({ success: true });
  }

  // Обновляем существующие настройки
  await db
    .prepare(
      `
      UPDATE user_settings
      SET calc_type = ?,
          monthly_rate = ?,
          bonus = ?,
          shift1_start = ?
      WHERE user_id = ?
    `
    )
    .bind(
      calcType || "monthly",
      monthlyRate || 5500,
      bonus || 850,
      shift1Start || "06:00",
      userId
    )
    .run();

  return json({ success: true });
};
