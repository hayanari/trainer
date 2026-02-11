import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function CustomersPage() {
  const { customers, appointments, payments, loading } = useApp();
  const [newName, setNewName] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { addCustomer } = useApp();

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await addCustomer(newName);
    setNewName('');
    setShowForm(false);
  };

  return (
    <div className="page customers-page">
      <div className="page-header">
        <h2>顧客一覧</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'キャンセル' : '+ 新規追加'}
        </button>
      </div>

      {showForm && (
        <form className="card form-card" onSubmit={handleAdd}>
          <label>
            お名前
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="顧客名を入力"
              autoFocus
            />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={!newName.trim()}>
              追加
            </button>
          </div>
        </form>
      )}

      <div className="customer-grid">
        {loading ? (
          <p className="empty-state">読み込み中...</p>
        ) : customers.length === 0 ? (
          <p className="empty-state">顧客がいません。新規顧客を追加してください。</p>
        ) : (
          customers.map((customer) => {
            const custAppointments = appointments.filter((a) => a.customerId === customer.id);
            const custPayments = payments.filter((p) => p.customerId === customer.id);
            const totalPaid = custPayments.reduce(
              (sum, p) => sum + (p.sets && p.unitPrice != null ? p.sets * p.unitPrice : p.amount || 0),
              0
            );
            return (
              <Link
                key={customer.id}
                to={`/customer/${customer.id}`}
                className="customer-card"
              >
                <h3>{customer.name}</h3>
                <div className="customer-stats">
                  <span>予約: {custAppointments.length}件</span>
                  <span>入金: ¥{totalPaid.toLocaleString()}</span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
