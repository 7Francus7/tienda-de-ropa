import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/store/StoreContext";
import { ToastProvider } from "@/context/ToastContext";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import { PWAUpdateHandler } from "@/components/pwa/PWAUpdateHandler";
import { SyncErrorBanner } from "@/components/SyncErrorBanner";

export const metadata: Metadata = {
  title: "Tienda — Gestión Comercial",
  description: "Sistema de gestión para tienda de ropa. Clientes, ventas, inventario, stock y balance.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tienda",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F2F2F7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ToastProvider>
          <StoreProvider>
            <div className="app-container">
              <PWAUpdateHandler />
              <InstallBanner />
              {children}
              <SyncErrorBanner />
              <OfflineIndicator />
            </div>
          </StoreProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
