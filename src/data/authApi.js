import { supabase, isSupabaseEnabled } from '../lib/supabase';
import {
  registerWithSupabase,
  loginWithSupabase,
  getSessionFromSupabase,
  logoutFromSupabase,
  updatePasswordWithSupabase,
} from './supabaseAuth';
import {
  registerUser as registerLocal,
  loginUser as loginLocal,
  getSession as getSessionLocal,
  logoutUser as logoutLocal,
  changePasswordLocal,
} from './auth';

export const changePassword = async (username, currentPassword, newPassword) => {
  if (isSupabaseEnabled()) {
    const { error } = await supabase.auth.signInWithPassword({
      email: `${username.trim().toLowerCase()}@trainer.app`,
      password: currentPassword,
    });
    if (error) throw new Error('現在のパスワードが正しくありません');
    return updatePasswordWithSupabase(supabase, newPassword);
  }
  return changePasswordLocal(username, currentPassword, newPassword);
};

export const registerUser = async (username, password) => {
  if (isSupabaseEnabled()) {
    return registerWithSupabase(supabase, username, password);
  }
  return registerLocal(username, password);
};

export const loginUser = async (username, password) => {
  if (isSupabaseEnabled()) {
    return loginWithSupabase(supabase, username, password);
  }
  return loginLocal(username, password);
};

export const getSession = async () => {
  if (isSupabaseEnabled()) {
    return getSessionFromSupabase(supabase);
  }
  return Promise.resolve(getSessionLocal());
};

export const logoutUser = async () => {
  if (isSupabaseEnabled()) {
    await logoutFromSupabase(supabase);
  } else {
    logoutLocal();
  }
};
