// =========================================
// /api/register — регистрация пользователя
// =========================================
//
// Принимает:
// {
//   email: "...",
//   password: "..."
// }
//
// Возвращает:
// { success: true } или ошибку
//
// Создаёт:
// - запись в таблице users
// - запись в таблице user_settings
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

export const onRequestPost = async ({ request, env }) => {
  const db = env.DB;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: "Некорректный JSON" }, 400);
  }

  const { email, password } = body;

  if (!email || !password) {
    return json({ success: false, error: "Введите email и пароль" }, 400);
  }

  // Проверяем, существует ли пользователь
  const existing = await db
    .prepare("SELECT id FROM users WHERE email = ?")
    .bind(email)
    .first();

  if (existing) {
    return json({ success: false, error: "Пользователь уже существует" }, 400);
  }

  // Создаём пользователя
  const result = await db
    .prepare("INSERT INTO users (email, password) VALUES (?, ?)")
    .bind(email, password)
    .run();

  const userId = result.lastRowId;

  // Создаём настройки по умолчанию
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
      "monthly",   // тип расчёта
      5500,        // ставка по умолчанию
      850,         // бонус по умолчанию
      "06:00"      // начало 1 смены
    )
    .run();

  return json({ success: true });
};
