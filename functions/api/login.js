// =========================================
// /api/login — вход пользователя
// =========================================
//
// Принимает:
// {
//   email: "...",
//   password: "..."
// }
//
// Возвращает:
// {
//   success: true,
//   user: { id, email }
// }
//
// Ошибки:
// - Некорректный JSON
// - Неверный email или пароль
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

  // Ищем пользователя
  const user = await db
    .prepare("SELECT id, email, password FROM users WHERE email = ?")
    .bind(email)
    .first();

  if (!user) {
    return json({ success: false, error: "Пользователь не найден" }, 400);
  }

  // Проверяем пароль (пока без хеширования)
  if (user.password !== password) {
    return json({ success: false, error: "Неверный пароль" }, 400);
  }

  // Успешный вход
  return json({
    success: true,
    user: {
      id: user.id,
      email: user.email
    }
  });
};
