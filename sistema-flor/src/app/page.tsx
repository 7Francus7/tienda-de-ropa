import Link from "next/link";

const stats = [
  {
    label: "Productos",
    value: "128",
    sub: "en catálogo",
    icon: "👗",
    bg: "bg-rose-50",
    iconBg: "bg-rose-100",
    text: "text-rose-700",
  },
  {
    label: "Stock bajo",
    value: "8",
    sub: "requieren atención",
    icon: "⚠️",
    bg: "bg-amber-50",
    iconBg: "bg-amber-100",
    text: "text-amber-700",
    alert: true,
  },
  {
    label: "Valor total",
    value: "$45.200",
    sub: "en inventario",
    icon: "💰",
    bg: "bg-emerald-50",
    iconBg: "bg-emerald-100",
    text: "text-emerald-700",
  },
  {
    label: "Ventas hoy",
    value: "12",
    sub: "transacciones",
    icon: "🛍️",
    bg: "bg-violet-50",
    iconBg: "bg-violet-100",
    text: "text-violet-700",
  },
];

const quickActions = [
  { label: "Nuevo producto", icon: "＋", href: "/productos/nuevo", desc: "Agregar al catálogo" },
  { label: "Registrar venta", icon: "🛒", href: "/ventas/nueva", desc: "Venta manual" },
  { label: "Ver reportes", icon: "📊", href: "/reportes", desc: "Estadísticas y gráficos" },
  { label: "Proveedores", icon: "🚚", href: "/proveedores", desc: "Gestionar proveedores" },
];

const lowStockItems = [
  { name: "Remera blanca talle S", stock: 2, min: 5 },
  { name: "Jean slim negro", stock: 1, min: 3 },
  { name: "Vestido floral talle M", stock: 3, min: 5 },
  { name: "Campera de cuero", stock: 0, min: 2 },
  { name: "Calza deportiva XL", stock: 1, min: 4 },
];

const recentActivity = [
  { action: "Venta registrada", item: "Vestido rosa talle S", time: "hace 10 min", icon: "💸" },
  { action: "Stock actualizado", item: "Remeras básicas × 20", time: "hace 45 min", icon: "📦" },
  { action: "Nuevo producto", item: "Campera gris talle M", time: "hace 2 h", icon: "✨" },
  { action: "Venta registrada", item: "Jean skinny azul", time: "hace 3 h", icon: "💸" },
];

export default function Home() {
  const today = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* ── Navbar ── */}
      <header
        role="banner"
        className="sticky top-0 z-50 border-b"
        style={{ background: "var(--card)", borderColor: "var(--card-border)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-sm"
              style={{ background: "linear-gradient(135deg, #f43f5e, #be123c)" }}
              aria-hidden="true"
            >
              F
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight" style={{ color: "var(--foreground)" }}>
                Sistema Flor
              </p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                Tienda de ropa
              </p>
            </div>
          </div>

          <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-1">
            {[
              { href: "/", label: "Inicio" },
              { href: "/inventario", label: "Inventario" },
              { href: "/ventas", label: "Ventas" },
              { href: "/reportes", label: "Reportes" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="focus-ring px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-rose-50 hover:text-rose-600"
                style={{ color: "var(--muted)" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/inventario"
              className="focus-ring flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm"
              style={{ background: "linear-gradient(135deg, #f43f5e, #be123c)" }}
              aria-label="Ir a inventario y stock"
            >
              <svg
                aria-hidden="true"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"
                />
              </svg>
              <span className="hidden sm:inline">Stock</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* ── Welcome ── */}
        <section aria-label="Bienvenida">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1
                className="text-2xl sm:text-3xl font-bold tracking-tight"
                style={{ color: "var(--foreground)" }}
              >
                ¡Hola, Flor! 👋
              </h1>
              <p className="mt-1 text-sm capitalize" style={{ color: "var(--muted)" }}>
                {today}
              </p>
            </div>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 self-start sm:self-auto"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
              Tienda abierta
            </span>
          </div>
        </section>

        {/* ── Stats cards ── */}
        <section aria-label="Resumen del negocio">
          <h2 className="sr-only">Estadísticas principales</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className={`stat-card ${s.bg} border-0`}
                role="region"
                aria-label={`${s.label}: ${s.value}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${s.iconBg}`}
                    aria-hidden="true"
                  >
                    {s.icon}
                  </div>
                  {s.alert && (
                    <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                      Alerta
                    </span>
                  )}
                </div>
                <p className={`text-2xl sm:text-3xl font-bold ${s.text}`}>{s.value}</p>
                <p className="text-xs mt-0.5 font-medium" style={{ color: "var(--muted)" }}>
                  {s.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {s.sub}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── INVENTORY BUTTON — Main CTA ── */}
        <section aria-label="Acceso rápido al inventario">
          <Link
            href="/inventario"
            className="inventory-btn focus-ring group flex items-center justify-between w-full rounded-2xl p-6 sm:p-7 text-white transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, #f43f5e 0%, #be123c 50%, #881337 100%)",
              boxShadow: "0 8px 32px rgba(225, 29, 72, 0.25)",
            }}
            aria-label="Gestionar inventario y stock completo de la tienda"
          >
            <div className="flex items-center gap-4 sm:gap-6">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.2)" }}
                aria-hidden="true"
              >
                <svg
                  className="w-7 h-7 sm:w-8 sm:h-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M9 12h6M9 16h6"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-widest opacity-80">
                  Gestión de tienda
                </p>
                <h2 className="text-xl sm:text-2xl font-bold mt-0.5">
                  Stock e Inventario
                </h2>
                <p className="text-sm mt-1 opacity-80">
                  128 productos · 8 con stock bajo · Actualizado ahora
                </p>
              </div>
            </div>
            <div
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ml-4 transition-transform duration-300 group-hover:translate-x-1"
              style={{ background: "rgba(255,255,255,0.2)" }}
              aria-hidden="true"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </section>

        {/* ── Quick actions + Low stock ── */}
        <section aria-label="Acciones y alertas" className="grid md:grid-cols-2 gap-6">
          {/* Quick actions */}
          <div className="card p-6">
            <h2 className="font-semibold text-base mb-4" style={{ color: "var(--foreground)" }}>
              Acciones rápidas
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="focus-ring flex flex-col gap-1 p-3 rounded-xl border transition-all hover:border-rose-200 hover:bg-rose-50 group"
                  style={{ borderColor: "var(--card-border)" }}
                  aria-label={`${action.label} — ${action.desc}`}
                >
                  <span className="text-xl" aria-hidden="true">{action.icon}</span>
                  <span className="text-sm font-semibold group-hover:text-rose-600 transition-colors" style={{ color: "var(--foreground)" }}>
                    {action.label}
                  </span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>{action.desc}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Low stock alerts */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-base" style={{ color: "var(--foreground)" }}>
                Alertas de stock
              </h2>
              <Link
                href="/inventario?filtro=bajo-stock"
                className="focus-ring text-xs font-medium text-rose-600 hover:text-rose-700 hover:underline"
                aria-label="Ver todos los productos con stock bajo"
              >
                Ver todos →
              </Link>
            </div>
            <ul className="space-y-2" role="list" aria-label="Productos con stock bajo">
              {lowStockItems.map((item) => {
                const isCritical = item.stock === 0;
                return (
                  <li
                    key={item.name}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                    style={{ borderColor: "var(--card-border)" }}
                  >
                    <span className="text-sm" style={{ color: "var(--foreground)" }}>
                      {item.name}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${isCritical ? "stock-critical" : "stock-low"}`}
                      role="status"
                      aria-label={
                        isCritical
                          ? `Sin stock — ${item.name}`
                          : `Stock bajo: ${item.stock} de ${item.min} mínimo — ${item.name}`
                      }
                    >
                      {isCritical ? "Sin stock" : `${item.stock} ud.`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* ── Recent activity ── */}
        <section aria-label="Actividad reciente">
          <div className="card p-6">
            <h2 className="font-semibold text-base mb-4" style={{ color: "var(--foreground)" }}>
              Actividad reciente
            </h2>
            <ul className="space-y-3" role="list">
              {recentActivity.map((a, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: "var(--background)" }}
                    aria-hidden="true"
                  >
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                      {a.action}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
                      {a.item}
                    </p>
                  </div>
                  <time className="text-xs flex-shrink-0" style={{ color: "var(--muted)" }} dateTime="">
                    {a.time}
                  </time>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav
        aria-label="Navegación móvil"
        className="md:hidden fixed bottom-0 inset-x-0 border-t z-50 flex"
        style={{ background: "var(--card)", borderColor: "var(--card-border)" }}
      >
        {[
          { href: "/", label: "Inicio", icon: "🏠" },
          { href: "/inventario", label: "Stock", icon: "📦", primary: true },
          { href: "/ventas", label: "Ventas", icon: "🛒" },
          { href: "/reportes", label: "Reportes", icon: "📊" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`focus-ring flex flex-col items-center justify-center gap-0.5 flex-1 py-3 text-xs font-medium transition-colors ${
              item.primary
                ? "text-rose-600"
                : ""
            }`}
            style={{ color: item.primary ? "#e11d48" : "var(--muted)" }}
            aria-label={item.label}
          >
            <span className="text-lg leading-none" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom padding for mobile nav */}
      <div className="md:hidden h-16" aria-hidden="true" />
    </div>
  );
}
