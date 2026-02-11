import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { format, parseISO, isPast } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const {
    customers,
    appointments,
    payments,
    trainingRecords,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    addPayment,
    deletePayment,
    addTrainingRecord,
    deleteTrainingRecord,
    getConflictAppointments,
    updateCustomer,
  } = useApp();

  const customer = customers.find((c) => c.id === id);
  const [activeTab, setActiveTab] = useState('appointments');

  // 予約フォーム
  const [aptDate, setAptDate] = useState('');
  const [aptTime, setAptTime] = useState('09:00');
  const [aptSession, setAptSession] = useState(1);
  const [aptNotes, setAptNotes] = useState('');
  const [conflictWarning, setConflictWarning] = useState(null);
  const [forceAdd, setForceAdd] = useState(false);

  // 入金フォーム（4セッション＝1セット）
  const [paySets, setPaySets] = useState(1);
  const [payUnitPrice, setPayUnitPrice] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payForPeriod, setPayForPeriod] = useState('');
  const [payNote, setPayNote] = useState('');

  // 予約一覧：完了済みの表示切り替え
  const [showPastAppointments, setShowPastAppointments] = useState(false);

  // トレーニング記録フォーム
  const [recordDate, setRecordDate] = useState(new Date().toISOString().slice(0, 10));
  const [recordContent, setRecordContent] = useState('');

  const custAppointmentsAll = useMemo(
    () => appointments.filter((a) => a.customerId === id).sort((a, b) => new Date(a.datetime) - new Date(b.datetime)),
    [appointments, id]
  );
  const custAppointments = useMemo(() => {
    if (showPastAppointments) return custAppointmentsAll;
    const now = new Date();
    return custAppointmentsAll.filter((a) => !isPast(new Date(a.datetime)));
  }, [custAppointmentsAll, showPastAppointments]);
  const pastAppointmentsCount = custAppointmentsAll.filter((a) => isPast(new Date(a.datetime))).length;
  const custPayments = useMemo(
    () => payments.filter((p) => p.customerId === id).sort((a, b) => b.date.localeCompare(a.date)),
    [payments, id]
  );
  const custRecords = useMemo(
    () => trainingRecords.filter((t) => t.customerId === id).sort((a, b) => b.date.localeCompare(a.date)),
    [trainingRecords, id]
  );
  const totalPaid = useMemo(
    () =>
      custPayments.reduce(
        (sum, p) => sum + (p.sets && p.unitPrice != null ? p.sets * p.unitPrice : p.amount || 0),
        0
      ),
    [custPayments]
  );

  // 顧客の4回料金をフォームに反映
  const defaultUnitPrice = customer?.pricePer4Sessions || '';
  const payUnitPriceValue = payUnitPrice !== '' ? payUnitPrice : defaultUnitPrice;

  const checkConflict = async (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return;
    const datetime = new Date(`${dateStr}T${timeStr}`);
    const conflicts = await getConflictAppointments(datetime.toISOString());
    setConflictWarning(conflicts.length > 0 ? conflicts : null);
  };

  const handleAddAppointment = async (e) => {
    e.preventDefault();
    if (!aptDate || !aptTime) return;
    const datetime = new Date(`${aptDate}T${aptTime}`);
    const conflicts = await getConflictAppointments(datetime.toISOString());
    if (conflicts.length > 0 && !forceAdd) {
      setConflictWarning(conflicts);
      return;
    }
    await addAppointment(id, datetime.toISOString(), aptSession, aptNotes);
    setAptDate('');
    setAptTime('09:00');
    setAptSession(1);
    setAptNotes('');
    setConflictWarning(null);
    setForceAdd(false);
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    const unitPrice = Number(payUnitPriceValue) || 0;
    if (!payDate || unitPrice <= 0) return;
    await addPayment(id, paySets, unitPrice, payDate, payForPeriod, payNote);
    setPaySets(1);
    setPayUnitPrice('');
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayForPeriod('');
    setPayNote('');
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!recordContent.trim()) return;
    await addTrainingRecord(id, recordDate, recordContent);
    setRecordDate(new Date().toISOString().slice(0, 10));
    setRecordContent('');
  };

  if (!customer) {
    return (
      <div className="page">
        <p>顧客が見つかりません。</p>
        <Link to="/">顧客一覧に戻る</Link>
      </div>
    );
  }

  const tabs = [
    { key: 'appointments', label: '予約' },
    { key: 'payments', label: '入金' },
    { key: 'training', label: '記録' },
  ];

  return (
    <div className="page customer-detail-page">
      <div className="page-header">
        <Link to="/" className="back-link">← 顧客一覧へ戻る</Link>
        <h2>{customer.name}</h2>
      </div>

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? 'tab active' : 'tab'}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'appointments' && (
        <div className="tab-content">
          <h3>予約の追加（4セッション制）</h3>
          <form className="card form-card" onSubmit={handleAddAppointment}>
            <div className="form-row three">
              <label>
                日付
                <input
                  type="date"
                  value={aptDate}
                  onChange={(e) => {
                    setAptDate(e.target.value);
                    checkConflict(e.target.value, aptTime);
                  }}
                  required
                />
              </label>
              <label>
                時間
                <input
                  type="time"
                  value={aptTime}
                  onChange={(e) => {
                    setAptTime(e.target.value);
                    checkConflict(aptDate, e.target.value);
                  }}
                />
              </label>
              <label>
                セッション番号（1〜4）
                <select
                  value={aptSession}
                  onChange={(e) => setAptSession(Number(e.target.value))}
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              メモ
              <input
                type="text"
                value={aptNotes}
                onChange={(e) => setAptNotes(e.target.value)}
                placeholder="任意"
              />
            </label>
            {conflictWarning && conflictWarning.length > 0 && (
              <div className="conflict-warning">
                <strong>⚠️ 重複警告</strong>
                <p>この日時の予約は既に以下の顧客が使用しています：</p>
                <ul>
                  {conflictWarning.map((c) => (
                    <li key={c.id}>
                      {c.customerName} - {format(parseISO(c.datetime), 'M/d(E) HH:mm', { locale: ja })}
                    </li>
                  ))}
                </ul>
                <label className="force-add-label">
                  <input
                    type="checkbox"
                    checked={forceAdd}
                    onChange={(e) => setForceAdd(e.target.checked)}
                  />
                  それでも追加する（重複を承知）
                </label>
              </div>
            )}
            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!aptDate || !aptTime}
              >
                予約を追加
              </button>
            </div>
          </form>

          <div className="appointments-header">
            <h3>予約一覧</h3>
            {pastAppointmentsCount > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowPastAppointments(!showPastAppointments)}
              >
                {showPastAppointments ? '今後のみ表示' : `完了済み${pastAppointmentsCount}件を表示`}
              </button>
            )}
          </div>
          <div className="list">
            {custAppointments.length === 0 ? (
              <p className="empty-state">
                {showPastAppointments ? '予約がありません。' : pastAppointmentsCount > 0
                  ? '今後の予約はありません。'
                  : '予約がありません。'}
              </p>
            ) : (
              custAppointments.map((apt) => (
                <div key={apt.id} className="list-item">
                  <div>
                    <strong>セッション{apt.sessionNumber}</strong>
                    <span> {format(parseISO(apt.datetime), 'yyyy/MM/dd(E) HH:mm', { locale: ja })}</span>
                    {apt.notes && <span className="muted"> — {apt.notes}</span>}
                  </div>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => deleteAppointment(apt.id)}
                  >
                    削除
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="tab-content">
          <div className="card payment-setup">
            <h3>4セッションの料金設定</h3>
            <p className="payment-desc">この顧客の「4回で〇円」の料金を設定。入金時のデフォルトになります。</p>
            <div className="form-row">
              <label>
                4回あたりの料金（円）
                <span className="default-hint">基本3万円</span>
                <input
                  type="number"
                  value={customer?.pricePer4Sessions || ''}
                  onChange={(e) =>
                    updateCustomer(id, {
                      pricePer4Sessions: Number(e.target.value) || 0,
                    })
                  }
                  placeholder="30000"
                />
              </label>
            </div>
          </div>
          <h3>入金の追加（4セッション＝1セット）</h3>
          <form className="card form-card" onSubmit={handleAddPayment}>
            <div className="form-row">
              <label>
                セット数
                <select
                  value={paySets}
                  onChange={(e) => setPaySets(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}セット</option>
                  ))}
                </select>
              </label>
              <label>
                1セット（4回）あたり（円）
                <span className="default-hint">基本3万円</span>
                <input
                  type="number"
                  value={payUnitPriceValue}
                  onChange={(e) => setPayUnitPrice(e.target.value)}
                  placeholder={defaultUnitPrice || '30000'}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                入金日
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                />
              </label>
              <label>
                いつの分
                <input
                  type="text"
                  value={payForPeriod}
                  onChange={(e) => setPayForPeriod(e.target.value)}
                  placeholder="例：2月分、1/15〜2/12の4回"
                  required
                />
              </label>
            </div>
            <label>
              メモ
              <input
                type="text"
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
                placeholder="任意"
              />
            </label>
            <p className="payment-preview">
              = ¥{(paySets * (Number(payUnitPriceValue) || 0)).toLocaleString()}
            </p>
            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!payDate || !payForPeriod.trim() || !(Number(payUnitPriceValue) > 0)}
              >
                入金を記録
              </button>
            </div>
          </form>
          <p className="total-paid">合計入金: ¥{totalPaid.toLocaleString()}</p>
          <h3>入金履歴</h3>
          <div className="list">
            {custPayments.map((p) => {
              const amt = p.sets && p.unitPrice != null ? p.sets * p.unitPrice : p.amount || 0;
              return (
                <div key={p.id} className="list-item payment-item">
                  <div className="payment-content">
                    <div className="payment-main">
                      {format(parseISO(p.date), 'yyyy/MM/dd', { locale: ja })} 入金 —{' '}
                      {p.sets && p.unitPrice != null ? (
                        <span>{p.sets}セット × ¥{p.unitPrice.toLocaleString()} = ¥{amt.toLocaleString()}</span>
                      ) : (
                        <span>¥{amt.toLocaleString()} <span className="muted">(旧)</span></span>
                      )}
                      {p.note && <span className="muted"> — {p.note}</span>}
                    </div>
                    {p.forPeriod && (
                      <div className="payment-for-period">いつの分：{p.forPeriod}</div>
                    )}
                  </div>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => deletePayment(p.id)}
                  >
                    削除
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'training' && (
        <div className="tab-content">
          <h3>トレーニング記録の追加</h3>
          <form className="card form-card" onSubmit={handleAddRecord}>
            <div className="form-row">
              <label>
                日付
                <input
                  type="date"
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                />
              </label>
            </div>
            <label>
              内容
              <textarea
                value={recordContent}
                onChange={(e) => setRecordContent(e.target.value)}
                placeholder="トレーニング内容、気づき、注意点など"
                rows={4}
              />
            </label>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={!recordContent.trim()}>
                記録を追加
              </button>
            </div>
          </form>
          <h3>記録一覧</h3>
          <div className="list">
            {custRecords.map((r) => (
              <div key={r.id} className="list-item block">
                <div className="record-date">
                  {format(parseISO(r.date), 'yyyy/MM/dd', { locale: ja })}
                </div>
                <div className="record-content">{r.content}</div>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => deleteTrainingRecord(r.id)}
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
