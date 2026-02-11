const STORAGE_KEYS = {
  CUSTOMERS: 'trainer_customers',
  APPOINTMENTS: 'trainer_appointments',
  PAYMENTS: 'trainer_payments',
  TRAINING_RECORDS: 'trainer_training_records',
};

// ユーティリティ
const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const loadCustomers = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveCustomers = (customers) => {
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
};

export const loadAppointments = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveAppointments = (appointments) => {
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
};

export const loadPayments = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const savePayments = (payments) => {
  localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
};

export const loadTrainingRecords = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TRAINING_RECORDS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveTrainingRecords = (records) => {
  localStorage.setItem(STORAGE_KEYS.TRAINING_RECORDS, JSON.stringify(records));
};

// 指定時刻に重複予約があるかチェック（自分自身の予約は除外可能）
// customerIds: 現在のユーザーの顧客IDリスト（他ユーザーの予約は除外）
export const checkAppointmentConflict = (
  datetime,
  excludeAppointmentId = null,
  customerIds = null
) => {
  const appointments = loadAppointments();
  const filtered = customerIds
    ? appointments.filter((a) => customerIds.includes(a.customerId))
    : appointments;
  const targetTime = new Date(datetime).getTime();
  const oneHourMs = 60 * 60 * 1000;

  return filtered.filter((apt) => {
    if (apt.id === excludeAppointmentId) return false;
    const aptTime = new Date(apt.datetime).getTime();
    // 1時間の枠で重複チェック
    return Math.abs(aptTime - targetTime) < oneHourMs;
  });
};

export { generateId, STORAGE_KEYS };
