import Script from "next/script";
import { LOCALE_STORAGE_KEY } from "@/lib/ui-i18n/locale-storage";
import { THEME_STORAGE_KEY } from "@/lib/theme-storage";

/** Runs before paint to avoid theme flash and sync locale cookie from localStorage. */
export function ThemeInitScript() {
  const script = `(function(){try{var tk=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(tk);var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.classList.toggle('light',!d);document.documentElement.style.colorScheme=d?'dark':'light';if(t==='light'||t==='dark'||t==='system'){if(!document.cookie.includes(tk+'=')){document.cookie=tk+'='+t+';path=/;max-age=31536000;SameSite=Lax';}}var lk=${JSON.stringify(LOCALE_STORAGE_KEY)};var ls=localStorage.getItem(lk);if(ls==='en'||ls==='pt-BR'){document.documentElement.lang=ls==='en'?'en':'pt-BR';if(!document.cookie.includes(lk+'=')){document.cookie=lk+'='+ls+';path=/;max-age=31536000;SameSite=Lax';}}}catch(e){}})();`;

  return (
    // beforeInteractive is supported in App Router root layouts (Next.js 16).
    // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
    <Script
      id="send-studio-theme-init"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
