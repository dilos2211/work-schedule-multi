export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/shifts")) {
      try {
        // Создаем таблицу с поддержкой детальных полей для каждого дня
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            work_date TEXT,
            shift_type TEXT,
            start_time TEXT,
            end_time TEXT,
            total_hours REAL,
            overtime_hours REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run();

        // 1. GET: Загрузка данных за конкретный месяц и год
        if (request.method === "GET") {
          const year = url.searchParams.get("year");
          const month = url.searchParams.get("month");

          let query = "SELECT work_date, shift_type, start_time, end_time, total_hours, overtime_hours FROM reports";
          let stmt;

          if (year && month !== null) {
            // Формируем шаблон для поиска по дате, например "2026-08-%" (месяц в JS передается от 0 до 11, учтите это или передавайте в SQL строку)
            const targetMonth = String(parseInt(month) + 1).padStart(2, '0');
            const prefix = `${year}-${targetMonth}-`;
            query += " WHERE work_date LIKE ?";
            stmt = env.DB.prepare(query).bind(prefix + "%");
          } else {
            stmt = env.DB.prepare(query);
          }

          const { results } = await stmt.all();

          return new Response(JSON.stringify(results), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        // 2. POST: Сохранение данных графика
        if (request.method === "POST") {
          const payload = await request.json();
          const { year, month, scheduleData } = payload;

          if (scheduleData) {
            const targetMonthStr = String(parseInt(month) + 1).padStart(2, '0');

            // Проходим по каждому дню месяца из расписания и сохраняем в базу
            for (const [dayNum, data] of Object.entries(scheduleData)) {
              const dayStr = String(dayNum).padStart(2, '0');
              const workDate = `${year}-${targetMonthStr}-${dayStr}`;

              // Проверяем, есть ли уже запись на этот день, чтобы обновить или вставить новую
              const existing = await env.DB.prepare(
                "SELECT id FROM reports WHERE work_date = ?"
              ).bind(workDate).first();

              if (existing) {
                await env.DB.prepare(`
                  UPDATE reports 
                  SET shift_type = ?, start_time = ?, end_time = ?, total_hours = ?, overtime_hours = ?
                  WHERE work_date = ?
                `).bind(
                  data.shift, 
                  data.start, 
                  data.end, 
                  data.totalHours || 0, 
                  data.overtime || 0, 
                  workDate
                ).run();
              } else {
                await env.DB.prepare(`
                  INSERT INTO reports (work_date, shift_type, start_time, end_time, total_hours, overtime_hours)
                  VALUES (?, ?, ?, ?, ?, ?)
                `).bind(
                  workDate, 
                  data.shift, 
                  data.start, 
                  data.end, 
                  data.totalHours || 0, 
                  data.overtime || 0
                ).run();
              }
            }
          }

          return new Response(JSON.stringify({ success: true, message: 'Данные успешно сохранены!' }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    return env.ASSETS.fetch(request);
  }
};