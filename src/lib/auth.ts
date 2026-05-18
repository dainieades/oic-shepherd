import { createClient } from '@/utils/supabase/client';

export async function authSignInWithGoogle(redirectTo: string): Promise<{ error: string | null }> {
  const { error } = await createClient().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  return { error: error?.message ?? null };
}

export async function authSignUp(
  email: string,
  password: string,
  redirectTo: string
): Promise<{ error: string | null }> {
  const { error } = await createClient().auth.signUp({
    email,
    password,
    options: { emailRedirectTo: redirectTo },
  });
  return { error: error?.message ?? null };
}

export async function authSignInWithPassword(
  email: string,
  password: string
): Promise<{ error: string | null; code: string | null }> {
  const { error } = await createClient().auth.signInWithPassword({ email, password });
  return {
    error: error?.message ?? null,
    code: (error as { code?: string } | null)?.code ?? null,
  };
}

export async function authResendConfirmation(
  email: string,
  redirectTo: string
): Promise<{ error: string | null }> {
  const { error } = await createClient().auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: redirectTo },
  });
  return { error: error?.message ?? null };
}

export async function authResetPasswordForEmail(
  email: string,
  redirectTo: string
): Promise<{ error: string | null }> {
  const { error } = await createClient().auth.resetPasswordForEmail(email, { redirectTo });
  return { error: error?.message ?? null };
}

export async function authUpdatePassword(
  currentPassword: string,
  password: string
): Promise<{ error: string | null }> {
  const { error } = await createClient().auth.updateUser({
    current_password: currentPassword,
    password,
  });
  return { error: error?.message ?? null };
}

export async function authSetNewPassword(password: string): Promise<{ error: string | null }> {
  const { error } = await createClient().auth.updateUser({ password });
  return { error: error?.message ?? null };
}
