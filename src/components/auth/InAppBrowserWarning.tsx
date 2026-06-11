"use client";
import { useEffect, useState } from "react";

// Встроенные браузеры (Telegram, VK, Instagram и т.п.) режут куки —
// сессия Supabase не сохраняется и после входа выкидывает на /login.
function detectInAppBrowser(): boolean {
  const ua = navigator.userAgent;

  // Telegram Android выставляет TelegramWebviewProxy
  if ("TelegramWebviewProxy" in window) return true;
  if (/Telegram/i.test(ua)) return true;

  // Android WebView помечается токеном "; wv)"
  if (/; wv\)/.test(ua)) return true;

  // iOS WKWebView: есть iPhone/iPad, но нет токена Safari
  if (/iPhone|iPad|iPod/.test(ua) && !/Safari\//.test(ua)) return true;

  // Популярные in-app браузеры
  if (/FBAN|FBAV|Instagram|VKClient|OkApp/i.test(ua)) return true;

  return false;
}

export function InAppBrowserWarning() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(detectInAppBrowser());
  }, []);

  if (!show) return null;

  return (
    <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-xl px-4 py-3 mb-4 text-sm">
      <p className="font-semibold mb-1">⚠️ Вы во встроенном браузере</p>
      <p>
        Вход может не сработать. Нажмите <b>⋯</b> в углу экрана и выберите{" "}
        <b>«Открыть в браузере»</b> (Safari или Chrome).
      </p>
    </div>
  );
}
