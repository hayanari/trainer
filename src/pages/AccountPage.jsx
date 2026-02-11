import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../data/authApi';
import { isSupabaseEnabled } from '../lib/supabase';

export default function AccountPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword !== confirmPassword) {
      setError('新しいパスワードが一致しません');
      return;
    }
    const minLen = isSupabaseEnabled() ? 6 : 4;
    if (newPassword.length < minLen) {
      setError(`新しいパスワードは${minLen}文字以上にしてください`);
      return;
    }
    setLoading(true);
    try {
      await changePassword(user.username, currentPassword, newPassword);
      setSuccess('パスワードを変更しました');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'パスワードの変更に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="page account-page">
      <Link to="/" className="back-link">← 戻る</Link>
      <h2>アカウント設定</h2>
      <p className="account-username">ユーザーID: {user.username}</p>

      <div className="card form-card">
        <h3>パスワードを変更</h3>
        <form onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}
          <label>
            現在のパスワード
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="現在のパスワードを入力"
              required
              disabled={loading}
            />
          </label>
          <label>
            新しいパスワード
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={isSupabaseEnabled() ? '6文字以上' : '4文字以上'}
              required
              disabled={loading}
            />
          </label>
          <label>
            新しいパスワード（確認）
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="もう一度入力"
              required
              disabled={loading}
            />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '変更中...' : 'パスワードを変更'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
