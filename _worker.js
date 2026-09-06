export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const db = env.DB;

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
      if (path.endsWith("/api/register") && request.method === "POST") {
        const body = await request.json();
        const email = body.email;
        const password = body.password;

        if (!email || !password) {
          return new Response(JSON.stringify({ success: false, error: "Заполните все поля" }), { 
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } 
          });
        }

        const existing = await db.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
        if (existing) {
          return new Response(JSON.stringify({ success: false, error: "Пользователь с таким email уже существует" }), { 
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } 
          });
        }

        await db.prepare("INSERT INTO users (email, password) VALUES (?, ?)").bind(email, password).run();
        const newUser = await db.prepare("SELECT id, email FROM users WHERE email = ?").bind(email).first();

        return new Response(JSON.stringify({ success: true, user: newUser }), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // 2. ВХОД
      if (path.endsWith("/api/login") && request.method === "POST") {
        const body = await request.json();
        const user = await db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").bind(body.email, body.password).first();

        if (!user) {
          return new Response(JSON.stringify({ success: false, error: "Неверный email или пароль" }), { 
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } 
          });
        }

        return new Response(JSON.stringify({ success: true, user: { id: user.id, email: user.email } }), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // 3. ПОЛУЧЕНИЕ НАСТРОЕК
      if (path.endsWith("/api/settings") && request.method === "GET") {
        const userId = url.searchParams.get("userId");
        const settings = await db.prepare("SELECT * FROM settings WHERE user_id = ?").bind(userId).first();
        return new Response(JSON.stringify(settings || {}), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // 4. СОХРАНЕНИЕ НАСТРОЕК
      if (path.endsWith("/api/settings") && request.method === "POST") {
        const body = await request.json();
        await db.prepare(`
          INSERT INTO settings (user_id, calc_type, monthly_rate, rate, bonus, manual_kantyna)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET
            calc_type = excluded.calc_type,
            monthly_rate = excluded.monthly_rate,
            rate = excluded.rate,
            bonus = excluded.bonus,
            manual_kantyna = excluded.manual_kantyna
        `).bind(body.userId, body.calcType, body.monthlyRate, body.rate, body.bonus, body.manualKantyna).run();

        return new Response(JSON.stringify({ success: true }), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // 5. ПОЛУЧЕНИЕ СМЕН
      if (path.endsWith("/api/shifts") && request.method === "GET") {
        const userId = url.searchParams.get("userId");
        const year = url.searchParams.get("year");
        const month = String(parseInt(url.searchParams.get("month")) + 1).padStart(2, '0');
        const prefix = `${year}-${month}`;

        const { results } = await db.prepare(
          "SELECT * FROM shifts WHERE user_id = ? AND work_date LIKE ?"
        ).bind(userId, `${prefix}%`).all();

        return new Response(JSON.stringify(results || []), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // 6. СОХРАНЕНИЕ СМЕН
      if (path.endsWith("/api/shifts") && request.method === "POST") {
        const body = await request.json();
        const mStr = String(parseInt(body.month) + 1).padStart(2, '0');
        const scheduleData = body.scheduleData;

        for (const day in scheduleData) {
          const dStr = String(day).padStart(2, '0');
          const dateFull = `${body.year}-${mStr}-${dStr}`;
          const s = scheduleData[day];

          await db.prepare("DELETE FROM shifts WHERE user_id = ? AND work_date = ?").bind(body.userId, dateFull).run();

          if (s.shift && s.shift !== 'none') {
            await db.prepare(`
              INSERT INTO shifts (user_id, work_date, shift_type, start_time, end_time, total_hours, overtime_hours)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).bind(body.userId, dateFull, s.shift, s.start, s.end, s.totalHours, s.overtime).run();
          }
        }

        return new Response(JSON.stringify({ success: true }), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      return new Response(JSON.stringify({ success: false, error: "API endpoint not found: " + path }), { 
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), { 
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }
  }
};