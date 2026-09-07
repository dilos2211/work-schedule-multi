// =========================================
// Cloudflare Pages Functions — _middleware.js
// =========================================
//
// Этот файл выполняется ПЕРЕД каждым API-эндпоинтом.
// Он добавляет:
// - CORS
// - обработку OPTIONS
// - общие заголовки
//
// Работает для всех файлов в /functions/api/*
// =========================================

export const onRequest = async ({ request }) => {

  // Обработка OPTIONS (CORS preflight)
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400"
      }
    });
  }

  // Для всех остальных запросов — добавляем CORS
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*"
    }
  });
};
