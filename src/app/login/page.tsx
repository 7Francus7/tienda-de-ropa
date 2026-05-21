'use client';

import { useActionState } from 'react';
import { loginAction } from './actions';

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return await loginAction(formData) ?? null;
    },
    null,
  );

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        padding: '24px 16px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 360 }}>
        {/* Logo / titulo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 32,
            }}
          >
            🌸
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            Tienda
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 6 }}>
            Ingresá tu contraseña para continuar
          </p>
        </div>

        {/* Form */}
        <form action={formAction}>
          <div className="ios-input-group" style={{ marginBottom: 16 }}>
            <div className="ios-input-row">
              <label style={{ minWidth: 'auto', fontSize: 15 }}>Contraseña</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                autoFocus
                autoComplete="current-password"
                required
                style={{ fontSize: 17 }}
              />
            </div>
          </div>

          {state?.error && (
            <p
              style={{
                fontSize: 13,
                color: 'var(--danger)',
                textAlign: 'center',
                marginBottom: 16,
                fontWeight: 500,
              }}
            >
              {state.error}
            </p>
          )}

          <button
            type="submit"
            className="ios-btn-primary"
            disabled={pending}
            style={{ opacity: pending ? 0.6 : 1 }}
          >
            {pending ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
