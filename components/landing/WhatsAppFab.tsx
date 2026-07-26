"use client";

import { useEffect, useState } from "react";

const WA_URL =
  "https://wa.me/573000000000?text=Hola,%20quiero%20recuperar%20el%20IVA%20de%20mi%20veh%C3%ADculo%20el%C3%A9ctrico%20o%20h%C3%ADbrido";

/** Botón flotante de WhatsApp que aparece al bajar del hero. */
export default function WhatsAppFab() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href={WA_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 font-bold text-white shadow-lg transition-all duration-300 animate-pulse-ring ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
        <path d="M17.5 14.4c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.6c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 1.9 3 4.7 4.2 2.3 1 2.8.8 3.3.8.5 0 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.2-.2-.4-.2zM12 21.5c-1.7 0-3.3-.4-4.7-1.3l-3.3.9.9-3.2c-1-1.5-1.5-3.2-1.5-5C3.4 7.2 7.3 3.4 12 3.4s8.6 3.8 8.6 8.5-3.9 8.6-8.6 8.6zM12 1.5C6.2 1.5 1.5 6.2 1.5 12c0 1.9.5 3.7 1.4 5.3L1.5 22.5l5.4-1.4c1.5.8 3.3 1.3 5.1 1.3 5.8 0 10.5-4.7 10.5-10.4C22.5 6.2 17.8 1.5 12 1.5z" />
      </svg>
      <span className="hidden sm:inline">Escríbenos</span>
    </a>
  );
}
