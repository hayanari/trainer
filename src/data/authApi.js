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

export const deleteAccount = async (userId) => {
  if (isSupabaseEnabled()) {
    const { data: customers } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', userId);
    if (customers?.length) {
      for (const c of customers) {
        await supabase.from('customers').delete().eq('id', c.id);
      }
    }
    await logoutFromSupabase(supabase);
  } else {
    const {
      loadUsers,
      saveUsers,
      setSession,
    } = await import('./auth');
    const {
      loadCustomers,
      saveCustomers,
      loadAppointments,
      saveAppointments,
      loadPayments,
      savePayments,
      loadTrainingRecords,
      saveTrainingRecords,
    } = await import('./store');
    const allCustomers = loadCustomers();
    const myCustomers = allCustomers.filter((c) => c.userId === userId);
    const customerIds = myCustomers.map((c) => c.id);
    saveUsers(loadUsers().filter((u) => u.id !== userId));
    saveCustomers(allCustomers.filter((c) => c.userId !== userId));
    saveAppointments(loadAppointments().filter((a) => !customerIds.includes(a.customerId)));
    savePayments(loadPayments().filter((p) => !customerIds.includes(p.customerId)));
    saveTrainingRecords(loadTrainingRecords().filter((t) => !customerIds.includes(t.customerId)));
    setSession(null);
  }
};
