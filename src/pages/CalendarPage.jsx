import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns';
import { ja } from 'date-fns/locale';

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const { appointments, customers, trainingRecords } = useApp();

  const customerMap = useMemo(() => {
    const m = {};
    customers.forEach((c) => (m[c.id] = c.name));
    return m;
  }, [customers]);

  const appointmentsByDate = useMemo(() => {
    const map = {};
    appointments.forEach((apt) => {
      const key = format(parseISO(apt.datetime), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push({
        ...apt,
        customerName: customerMap[apt.customerId] || '不明',
      });
    });
    return map;
  }, [appointments, customerMap]);

  // 顧客×日付でトレーニング記録を取得
  const trainingByCustomerDate = useMemo(() => {
    const map = {};
    trainingRecords.forEach((r) => {
      const key = `${r.customerId}_${r.date}`;
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return map;
  }, [trainingRecords]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    calendarDays.push(day);
    day = addDays(day, 1);
  }

  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') setSelectedEvent(null);
    };
    if (selectedEvent) {
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
    }
  }, [selectedEvent]);

  return (
    <div className="page calendar-page">
      <div className="page-header calendar-header">
        <h2>全体カレンダー</h2>
        <div className="calendar-nav">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            aria-label="前月"
          >
            ‹
          </button>
          <span className="calendar-month-title">
            {format(currentMonth, 'yyyy年M月', { locale: ja })}
          </span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            aria-label="翌月"
          >
            ›
          </button>
        </div>
      </div>

      <p className="calendar-desc">
        全顧客の予約を表示（過去データ含む）。予約をタップで内容を確認
      </p>

      <div className="calendar-container">
        <div className="calendar-grid">
          {weekDays.map((d) => (
            <div key={d} className="calendar-weekday">{d}</div>
          ))}
          {calendarDays.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayAppointments = appointmentsByDate[key] || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={key}
                className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
              >
                <div className="calendar-day-number">{format(day, 'd')}</div>
                <div className="calendar-day-events">
                  {dayAppointments
                    .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
                    .map((apt) => {
                      const dateKey = format(parseISO(apt.datetime), 'yyyy-MM-dd');
                      const records = trainingByCustomerDate[`${apt.customerId}_${dateKey}`] || [];
                      return (
                        <button
                          key={apt.id}
                          type="button"
                          className="calendar-event"
                          onClick={() => setSelectedEvent({ apt, records })}
                        >
                          <span className="event-time">
                            {format(parseISO(apt.datetime), 'HH:mm', { locale: ja })}
                          </span>
                          <span className="event-customer">{apt.customerName}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedEvent && (
        <div
          className="calendar-modal-overlay"
          onClick={() => setSelectedEvent(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="calendar-modal-title"
        >
          <div
            className="calendar-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="calendar-modal-header">
              <h3 id="calendar-modal-title">予約詳細</h3>
              <button
                type="button"
                className="calendar-modal-close"
                onClick={() => setSelectedEvent(null)}
                aria-label="閉じる"
              >
                ×
              </button>
            </div>
            <div className="calendar-modal-body">
              <div className="calendar-modal-apt">
                <strong>{selectedEvent.apt.customerName}</strong>
                <p>
                  {format(parseISO(selectedEvent.apt.datetime), 'yyyy/MM/dd(E) HH:mm', { locale: ja })}
                  {' '}— セッション{selectedEvent.apt.sessionNumber}
                </p>
                {selectedEvent.apt.notes && (
                  <p className="muted">メモ: {selectedEvent.apt.notes}</p>
                )}
              </div>
              <div className="calendar-modal-training">
                <h4>トレーニング内容</h4>
                {selectedEvent.records.length > 0 ? (
                  selectedEvent.records.map((r) => (
                    <div key={r.id} className="training-record-content">
                      {r.content}
                    </div>
                  ))
                ) : (
                  <p className="muted">記録なし</p>
                )}
              </div>
            </div>
            <div className="calendar-modal-footer">
              <Link
                to={`/customer/${selectedEvent.apt.customerId}`}
                className="btn btn-primary"
                onClick={() => setSelectedEvent(null)}
              >
                顧客詳細へ
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
