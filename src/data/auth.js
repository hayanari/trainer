const STORAGE_KEYS = {
  USERS: 'trainer_users',
  SESSION: 'trainer_session',
};

// パスワードをSHA-256でハッシュ（ソルト付き）
async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const loadUsers = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveUsers = (users) => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const getSession = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const setSession = (user) => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({
      id: user.id,
      username: user.username,
    }));
  } else {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }
};

export const generateUserId = () =>
  `u_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export const registerUser = async (username, password) => {
  const users = loadUsers();
  const trimmed = username.trim().toLowerCase();
  if (!trimmed || !password) throw new Error('ユーザーIDとパスワードを入力してください');
  if (password.length < 4) throw new Error('パスワードは4文字以上にしてください');
  if (users.some((u) => u.username.toLowerCase() === trimmed)) {
    throw new Error('このユーザーIDは既に使用されています');
  }
  const salt = trimmed + '_trainer_salt_2024';
  const passwordHash = await hashPassword(password, salt);
  const newUser = {
    id: generateUserId(),
    username: trimmed,
    passwordHash,
  };
  users.push(newUser);
  saveUsers(users);
  setSession(newUser);
  return { id: newUser.id, username: newUser.username };
};

export const loginUser = async (username, password) => {
  const users = loadUsers();
  const trimmed = username.trim().toLowerCase();
  const user = users.find((u) => u.username.toLowerCase() === trimmed);
  if (!user) throw new Error('ユーザーIDまたはパスワードが正しくありません');
  const salt = user.username + '_trainer_salt_2024';
  const passwordHash = await hashPassword(password, salt);
  if (passwordHash !== user.passwordHash) {
    throw new Error('ユーザーIDまたはパスワードが正しくありません');
  }
  setSession(user);
  return { id: user.id, username: user.username };
};

export const logoutUser = () => {
  setSession(null);
};

export const changePasswordLocal = async (username, currentPassword, newPassword) => {
  const users = loadUsers();
  const trimmed = username.trim().toLowerCase();
  const user = users.find((u) => u.username.toLowerCase() === trimmed);
  if (!user) throw new Error('ユーザーが見つかりません');
  const salt = user.username + '_trainer_salt_2024';
  const currentHash = await hashPassword(currentPassword, salt);
  if (currentHash !== user.passwordHash) {
    throw new Error('現在のパスワードが正しくありません');
  }
  if (newPassword.length < 4) throw new Error('新しいパスワードは4文字以上にしてください');
  const newHash = await hashPassword(newPassword, salt);
  user.passwordHash = newHash;
  saveUsers(users);
};
