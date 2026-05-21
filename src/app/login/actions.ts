'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const password = formData.get('password') as string;
  const appPassword = process.env.APP_PASSWORD;

  if (!appPassword) {
    return { error: 'Sistema no configurado. Contactá al administrador.' };
  }

  if (password !== appPassword) {
    return { error: 'Contraseña incorrecta.' };
  }

  const cookieStore = await cookies();
  cookieStore.set('auth_session', 'ok', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 días
    path: '/',
  });

  redirect('/');
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_session');
  redirect('/login');
}
