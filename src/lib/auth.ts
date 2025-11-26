import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClientComponentClient();
  }
  return supabaseInstance;
}

// Export as object property to lazy-load
export const supabase = {
  get auth() {
    return getSupabaseClient().auth;
  },
  get from() {
    return getSupabaseClient().from;
  },
  get storage() {
    return getSupabaseClient().storage;
  },
};

export async function signIn(email: string, password: string) {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const client = getSupabaseClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const client = getSupabaseClient();
  const { data: { user } } = await client.auth.getUser();
  return user;
}

export async function resetPassword(email: string) {
  const client = getSupabaseClient();
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const client = getSupabaseClient();
  const { error } = await client.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
}