const TRAINER_EMAIL_DOMAIN = '@trainer.app';

const getSupabaseEmail = (username) => {
  const trimmed = username.trim().toLowerCase();
  return `${trimmed}${TRAINER_EMAIL_DOMAIN}`;
};

export const registerWithSupabase = async (supabase, username, password) => {
  const trimmed = username.trim().toLowerCase();
  if (!trimmed || !password) throw new Error('ユーザーIDとパスワードを入力してください');
  if (password.length < 6) throw new Error('パスワードは6文字以上にしてください');

  const { data, error } = await supabase.auth.signUp({
    email: getSupabaseEmail(trimmed),
    password,
    options: {
      data: { display_username: trimmed },
    },
  });

  if (error) {
    if (error.message.includes('already registered')) {
      throw new Error('このユーザーIDは既に使用されています');
    }
    throw new Error(error.message || '登録に失敗しました');
  }

  if (data?.user) {
    return {
      id: data.user.id,
      username: data.user.user_metadata?.display_username || trimmed,
    };
  }
  throw new Error('登録に失敗しました');
};

export const loginWithSupabase = async (supabase, username, password) => {
  const trimmed = username.trim().toLowerCase();
  if (!trimmed || !password) throw new Error('ユーザーIDとパスワードを入力してください');

  const { data, error } = await supabase.auth.signInWithPassword({
    email: getSupabaseEmail(trimmed),
    password,
  });

  if (error) {
    if (error.message.includes('Invalid login')) {
      throw new Error('ユーザーIDまたはパスワードが正しくありません');
    }
    throw new Error(error.message || 'ログインに失敗しました');
  }

  if (data?.user) {
    return {
      id: data.user.id,
      username: data.user.user_metadata?.display_username || trimmed,
    };
  }
  throw new Error('ログインに失敗しました');
};

export const getSessionFromSupabase = async (supabase) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  return {
    id: session.user.id,
    username: session.user.user_metadata?.display_username || session.user.email?.replace(TRAINER_EMAIL_DOMAIN, '') || 'ユーザー',
  };
};

export const logoutFromSupabase = async (supabase) => {
  await supabase.auth.signOut();
};

export const updatePasswordWithSupabase = async (supabase, newPassword) => {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('パスワードは6文字以上にしてください');
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message || 'パスワードの変更に失敗しました');
};
