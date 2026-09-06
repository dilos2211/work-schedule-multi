const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs'); // Для безопасного хэширования паролей

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Подключение к локальной базе данных SQLite
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Ошибка подключения к базе данных:', err.message);
  } else {
    console.log('Подключено к базе данных SQLite.');
    initDb();
  }
});

// Инициализация таблиц базы данных
function initDb() {
  db.serialize(() => {
    // 1. Таблица пользователей
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Таблица смен (привязана к user_id)
    db.run(`
      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        work_date TEXT NOT NULL,
        shift_type TEXT NOT NULL,
        start_time TEXT,
        end_time TEXT,
        total_hours REAL,
        overtime_hours REAL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, work_date)
      )
    `);

    // 3. Таблица индивидуальных настроек зарплаты и времени смен пользователя
    db.run(`
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id INTEGER PRIMARY KEY,
        calc_type TEXT DEFAULT 'monthly',
        monthly_rate REAL DEFAULT 5500,
        rate REAL DEFAULT 25,
        bonus REAL DEFAULT 850,
        manual_kantyna REAL DEFAULT 0,
        shifts_config TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  });
}

// ================= API АВТОРИЗАЦИИ =================

// Регистрация
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Заполните все поля' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    db.run(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email, passwordHash],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ success: false, error: 'Пользователь с таким email уже существует' });
          }
          return res.status(500).json({ success: false, error: err.message });
        }

        const userId = this.lastID;
        // Создаем дефолтные настройки для нового пользователя
        const defaultShiftsConfig = JSON.stringify({
          '1': { start: '06:00', end: '14:00' },
          '2': { start: '14:00', end: '22:00' },
          '3': { start: '22:00', end: '06:00' }
        });
        db.run('INSERT INTO user_settings (user_id, shifts_config) VALUES (?, ?)', [userId, defaultShiftsConfig]);

        res.json({ success: true, user: { id: userId, email } });
      }
    );
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Вход
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Заполните все поля' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!user) return res.status(401).json({ success: false, error: 'Неверный email или пароль' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ success: false, error: 'Неверный email или пароль' });

    res.json({ success: true, user: { id: user.id, email: user.email } });
  });
});

// ================= API НАСТРОЕК ПОЛЬЗОВАТЕЛЯ =================

app.get('/api/settings', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  db.get('SELECT * FROM user_settings WHERE user_id = ?', [userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.json({});

    // Корректно парсим shifts_config из строки в JSON перед отправкой клиенту
    let shiftsConfig = row.shifts_config;
    if (typeof shiftsConfig === 'string') {
      try {
        shiftsConfig = JSON.parse(shiftsConfig);
      } catch (e) {
        shiftsConfig = null;
      }
    }

    res.json({
      user_id: row.user_id,
      calc_type: row.calc_type,
      monthly_rate: row.monthly_rate,
      rate: row.rate,
      bonus: row.bonus,
      manual_kantyna: row.manual_kantyna,
      shifts_config: shiftsConfig
    });
  });
});

app.post('/api/settings', (req, res) => {
  const { userId, calcType, monthlyRate, rate, bonus, manualKantyna, shiftsConfig } = req.body;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  // Превращаем объект конфигурации смен в JSON-строку для хранения в TEXT колонке
  const shiftsConfigStr = JSON.stringify(shiftsConfig || {});

  db.run(
    `UPDATE user_settings 
     SET calc_type = ?, monthly_rate = ?, rate = ?, bonus = ?, manual_kantyna = ?, shifts_config = ?
     WHERE user_id = ?`,
    [calcType, monthlyRate, rate, bonus, manualKantyna, shiftsConfigStr, userId],
    (err) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true });
    }
  );
});

// ================= API СМЕН И КАЛЕНДАРЯ =================

app.get('/api/shifts', (req, res) => {
  const userId = req.query.userId;
  const year = req.query.year;
  const month = req.query.month;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  let query = "SELECT work_date, shift_type, start_time, end_time, total_hours, overtime_hours FROM reports WHERE user_id = ?";
  let params = [userId];

  if (year && month !== undefined) {
    const targetMonth = String(parseInt(month) + 1).padStart(2, '0');
    const prefix = `${year}-${targetMonth}-`;
    query += " AND work_date LIKE ?";
    params.push(prefix + '%');
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/shifts', (req, res) => {
  const { userId, year, month, scheduleData } = req.body;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  if (!scheduleData) {
    return res.json({ success: true });
  }

  const targetMonthStr = String(parseInt(month) + 1).padStart(2, '0');

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    const stmtUpdate = db.prepare(`
      UPDATE reports 
      SET shift_type = ?, start_time = ?, end_time = ?, total_hours = ?, overtime_hours = ?
      WHERE user_id = ? AND work_date = ?
    `);

    const stmtInsert = db.prepare(`
      INSERT INTO reports (user_id, work_date, shift_type, start_time, end_time, total_hours, overtime_hours)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const [dayNum, data] of Object.entries(scheduleData)) {
      const dayStr = String(dayNum).padStart(2, '0');
      const workDate = `${year}-${targetMonthStr}-${dayStr}`;

      // Сначала пробуем обновить, если запись есть
      db.get(
        "SELECT id FROM reports WHERE user_id = ? AND work_date = ?",
        [userId, workDate],
        (err, existing) => {
          if (existing) {
            stmtUpdate.run(
              data.shift, data.start, data.end, 
              data.totalHours || 0, data.overtime || 0, 
              userId, workDate
            );
          } else {
            stmtInsert.run(
              userId, workDate, 
              data.shift, data.start, data.end, 
              data.totalHours || 0, data.overtime || 0
            );
          }
        }
      );
    }

    db.run("COMMIT", (err) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true, message: 'Данные успешно сохранены!' });
    });

    stmtUpdate.finalize();
    stmtInsert.finalize();
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});