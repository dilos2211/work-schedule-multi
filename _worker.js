export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const db = env.DB; // Наша привязанная база данных D1

    // Заголовки для CORS (если нужно)
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 1. РЕГИСТРАЦИЯ
      if (path === "/api/register" && request.method === "POST") {
        const { email, password } = await request.json();
        if (!email || !password) {
          return Response.json({ success: false, error: "Заполните все поля" }, { status: 400, headers: corsHeaders });
        }

        // Проверяем, есть ли уже такой यूजर
        const existing = await db.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
        if (existing) {
          return Response.json({ success: false, error: "Пользователь с таким email уже существует" }, { status: 400, headers: corsHeaders });
        }

        // Сохраняем (в реальном проекте лучше хешировать, но для простоты сохраним как есть или через простую проверку)
        const insertRes = await db.prepare("INSERT INTO users (email, password) VALUES (?, ?)").bind(email, password).run();
        const newUser = await db.prepare("SELECT id, email FROM users WHERE email = ?").bind(email).first();

        return Response.json({ success: true, user: newUser }, { headers: corsHeaders });
      }

      // 2. ВХОД
      if (path === "/api/login" && request.method === "POST") {
        const { email, password } = await request.json();
        const user = await db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").bind(email, password).first();

        if (!user) {
          return Response.json({ success: false, error: "Неверный email или пароль" }, { status: 400, headers: corsHeaders });
        }

        return Response.json({ success: true, user: { id: user.id, email: user.email } }, { headers: corsHeaders });
      }

      // 3. ПОЛУЧЕНИЕ НАСТРОЕК
      if (path === "/api/settings" && request.method === "GET") {
        const userId = url.searchParams.get("userId");
        const settings = await db.prepare("SELECT * FROM settings WHERE user_id = ?").bind(userId).first();
        return Response.json(settings || {}, { headers: corsHeaders });
      }

      // 4. СОХРАНЕНИЕ НАСТРОЕК
      if (path === "/api/settings" && request.method === "POST") {
        const { userId, calcType, monthlyRate, rate, bonus, manualKantyna } = await request.json();
        await db.prepare(`
          INSERT INTO settings (user_id, calc_type, monthly_rate, rate, bonus, manual_kantyna)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET
            calc_type = excluded.calc_type,
            monthly_rate = excluded.monthly_rate,
            rate = excluded.rate,
            bonus = excluded.bonus,
            manual_kantyna = excluded.manual_kantyna
        `).bind(userId, calcType, monthlyRate, rate, bonus, manualKantyna).run();

        return Response.json({ success: true }, { headers: corsHeaders });
      }

      // 5. ПОЛУЧЕНИЕ СМЕН
      if (path === "/api/shifts" && request.method === "GET") {
        const userId = url.searchParams.get("userId");
        const year = url.searchParams.get("year");
        const month = String(parseInt(url.searchParams.get("month")) + 1).padStart(2, '0');
        const prefix = `${year}-${month}`;

        const { results } = await db.prepare(
          "SELECT * FROM shifts WHERE user_id = ? AND work_date LIKE ?"
        ).bind(userId, `${prefix}%`).all();

        return Response.json(results || [], { headers: corsHeaders });
      }

      // 6. СОХРАНЕНИЕ СМЕН
      if (path === "/api/shifts" && request.method === "POST") {
        const { userId, month, year, scheduleData } = await request.json();
        const mStr = String(parseInt(month) + 1).padStart(2, '0');

        // Удаляем старые записи за этот месяц для этого юзера, чтобы записать новые актуальные
        for (const day in scheduleData) {
          const dStr = String(day).padStart(2, '0');
          const dateFull = `${year}-${mStr}-${dStr}`;
          const s = scheduleData[day];

          // Удаляем старую запись на этот день
          await db.prepare("DELETE FROM shifts WHERE user_id = ? AND work_date = ?").bind(userId, dateFull).run();

          // Если смена не пустая, сохраняем
          if (s.shift && s.shift !== 'none') {
            await db.prepare(`
              INSERT INTO shifts (user_id, work_date, shift_type, start_time, end_time, total_hours, overtime_hours)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).bind(userId, dateFull, s.shift, s.start, s.end, s.totalHours, s.overtime).run();
          }
        }

        return Response.json({ success: true }, { headers: corsHeaders });
      }

      return new Response("Not found", { status: 404, headers: corsHeaders });
    } catch (err) {
      return Response.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
    }
  }
};