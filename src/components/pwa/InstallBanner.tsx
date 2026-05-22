"use client";

import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

const INSTALL_BANNER_DISMISSED_KEY = "pwa-install-banner-dismissed";

export function InstallBanner() {
  const { isInstallable, promptToInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(INSTALL_BANNER_DISMISSED_KEY) === "1";
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isInstallable || dismissed) return;

    const timeoutId = window.setTimeout(() => setIsVisible(true), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [dismissed, isInstallable]);

  const dismissBanner = () => {
    setDismissed(true);
    setIsVisible(false);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(INSTALL_BANNER_DISMISSED_KEY, "1");
    }
  };

  if (!isInstallable || dismissed || !isVisible) return null;

  return (
    <div className="fixed inset-x-4 bottom-[calc(72px+env(safe-area-inset-bottom,0px))] z-40 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-black/10 bg-white/95 px-4 py-3 text-black shadow-[0_18px_40px_rgba(15,23,42,0.18)] backdrop-blur-md animate-in slide-in-from-bottom-3 md:bottom-6 md:right-6 md:left-auto md:mx-0 xl:hidden">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-white">
        <Download className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">Instalar INDOOR App</div>
        <div className="text-xs text-black/65">Abrila mas rapido y usala sin conexion.</div>
      </div>
      <button
        onClick={promptToInstall}
        className="shrink-0 rounded-full bg-black px-3 py-1.5 text-sm font-medium text-white transition-transform active:scale-95"
      >
        Instalar
      </button>
      <button
        onClick={dismissBanner}
        className="shrink-0 rounded-full p-1.5 text-black/45 transition-colors hover:text-black"
        aria-label="Cerrar aviso de instalacion"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
