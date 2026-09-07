export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const db = env.DB;

    // Проверка подключения к базе
    if (!db) {
      return new Response(JSON.stringify({ success: false, error: "База данных D1 не привязана!" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      // 🔹 1. Регистрация
      if (path === "/api/register" && request.method === "POST") {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
          return new Response(JSON.stringify({ success: false, error: "Заполните все поля" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const existing = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
        if (existing) {
          return new Response(JSON.stringify({ success: false, error: "Пользователь уже существует" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Хэширование пароля
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const passwordHash = Array.from(new Uint8Array(hashBuffer))
          .map(b => b.toString(16).padStart(2, "0"))
          .join("");

        await db.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)").bind(email, passwordHash).run();
        const newUser = await db.prepare("SELECT id, email FROM users WHERE email = ?").bind(email).first();

        // Создаём базовые настройки
        await db.prepare("INSERT INTO user_settings (user_id) VALUES (?)").bind(newUser.id).run();

        return new Response(JSON.stringify({ success: true, user: newUser }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 🔹 2. Вход
      if (path === "/api/login" && request.method === "POST") {
        const body = await request.json();
        const { email, password } = body;

        const user = await db.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
        if (!user) {
          return new Response(JSON.stringify({ success: false, error: "Неверный email или пароль" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Проверка пароля
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const passwordHash = Array.from(new Uint8Array(hashBuffer))
          .map(b => b.toString(16).padStart(2, "0"))
          .join("");

        if (passwordHash !== user.password_hash) {
          return new Response(JSON.stringify({ success: false, error: "Неверный email или пароль" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, user: { id: user.id, email: user.email } }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 🔹 3. Получение настроек
      if (path === "/api/settings" && request.method === "GET") {
        const userId = url.searchParams.get("userId");
        const settings = await db.prepare("SELECT * FROM user_settings WHERE user_id = ?").bind(userId).first();
        return new Response(JSON.stringify(settings || {}), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 🔹 4. Сохранение настроек
      if (path === "/api/settings" && request.method === "POST") {
        const body = await request.json();
        await db.prepare(`
          INSERT INTO user_settings (user_id, calc_type, monthly_rate, rate, bonus, manual_kantyna, shift1_start)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET
            calc_type = excluded.calc_type,
            monthly_rate = excluded.monthly_rate,
            rate = excluded.rate,
            bonus = excluded.bonus,
            manual_kantyna = excluded.manual_kantyna,
            shift1_start = excluded.shift1_start
        `).bind(
          body.userId,
          body.calcType,
          body.monthlyRate,
          body.rate,
          body.bonus,
          body.manualKantyna,
          body.shift1Start || "06:00"
        ).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 🔹 5. Получение смен
      if (path === "/api/shifts" && request.method === "GET") {
        const userId = url.searchParams.get("userId");
        const year = url.searchParams.get("year");
        const month = url.searchParams.get("month");
        const prefix = `${year}-${String(parseInt(month) + 1).padStart(2, "0")}`;

        const { results } = await db.prepare(
          "SELECT work_date, shift_type, start_time, end_time, total_hours, overtime_hours, hours_50, hours_100, bonus_zl FROM reports WHERE user_id = ? AND work_date LIKE ?"
        ).bind(userId, `${prefix}%`).all();

        return new Response(JSON.stringify(results || []), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 🔹 6. Сохранение смен
      if (path === "/api/shifts" && request.method === "POST") {
        const body = await request.json();
        const { userId, year, month, scheduleData } = body;
        const monthStr = String(parseInt(month) + 1).padStart(2, "0");

        for (const [day, data] of Object.entries(scheduleData)) {
          const dayStr = String(day).padStart(2, "0");
          const dateFull = `${year}-${monthStr}-${dayStr}`;

          await db.prepare("DELETE FROM reports WHERE user_id = ? AND work_date = ?").bind(userId, dateFull).run();

          if (data.shift && data.shift !== "none") {
            await db.prepare(`
              INSERT INTO reports (user_id, work_date, shift_type, start_time, end_time, total_hours, overtime_hours, hours_50, hours_100, bonus_zl)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
              userId,
              dateFull,
              data.shift,
              data.start,
              data.end,
              data.totalHours || 0,
              data.overtime || 0,
              data.hours50 || 0,
              data.hours100 || 0,
              data.bonusZl || 0
            ).run();
          }
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 🔹 7. Отдача статических файлов
      return env.ASSETS.fetch(request);

    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: "Worker Exception: " + err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};
