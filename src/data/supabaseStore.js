import { supabase } from '../lib/supabase';

const toCustomer = (r) => ({
  id: r.id,
  name: r.name,
  userId: r.user_id,
  pricePer4Sessions: r.price_per_4_sessions ?? 30000,
  createdAt: r.created_at,
});

const toAppointment = (r) => ({
  id: r.id,
  customerId: r.customer_id,
  datetime: r.datetime,
  sessionNumber: r.session_number ?? 1,
  notes: r.notes ?? '',
});

const toPayment = (r) => ({
  id: r.id,
  customerId: r.customer_id,
  sets: r.sets,
  unitPrice: r.unit_price,
  amount: r.sets * r.unit_price,
  date: r.date,
  forPeriod: r.for_period ?? '',
  note: r.note ?? '',
});

const toTrainingRecord = (r) => ({
  id: r.id,
  customerId: r.customer_id,
  date: r.date,
  content: r.content ?? '',
});

export const fetchCustomers = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(toCustomer);
};

export const fetchAppointments = async () => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('datetime', { ascending: true });
  if (error) throw error;
  return (data || []).map(toAppointment);
};

export const fetchPayments = async () => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map(toPayment);
};

export const fetchTrainingRecords = async () => {
  const { data, error } = await supabase
    .from('training_records')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map(toTrainingRecord);
};

export const insertCustomer = async (userId, name, pricePer4Sessions = 30000) => {
  const { data, error } = await supabase
    .from('customers')
    .insert({
      user_id: userId,
      name: name.trim(),
      price_per_4_sessions: pricePer4Sessions,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
};

export const updateCustomerDb = async (id, updates) => {
  const obj = {};
  if (updates.name !== undefined) obj.name = updates.name;
  if (updates.pricePer4Sessions !== undefined) obj.price_per_4_sessions = updates.pricePer4Sessions;
  if (Object.keys(obj).length === 0) return;
  const { error } = await supabase.from('customers').update(obj).eq('id', id);
  if (error) throw error;
};

export const deleteCustomerDb = async (id) => {
  const { error } = await supabase.from('customers').delete().eq('id', id);
  if (error) throw error;
};

export const insertAppointment = async (customerId, datetime, sessionNumber, notes) => {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      customer_id: customerId,
      datetime: new Date(datetime).toISOString(),
      session_number: sessionNumber || 1,
      notes: (notes || '').trim(),
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
};

export const updateAppointmentDb = async (id, updates) => {
  const obj = {};
  if (updates.datetime !== undefined) obj.datetime = updates.datetime;
  if (updates.sessionNumber !== undefined) obj.session_number = updates.sessionNumber;
  if (updates.notes !== undefined) obj.notes = updates.notes;
  if (Object.keys(obj).length === 0) return;
  const { error } = await supabase.from('appointments').update(obj).eq('id', id);
  if (error) throw error;
};

export const deleteAppointmentDb = async (id) => {
  const { error } = await supabase.from('appointments').delete().eq('id', id);
  if (error) throw error;
};

export const insertPayment = async (customerId, sets, unitPrice, date, forPeriod, note) => {
  const { data, error } = await supabase
    .from('payments')
    .insert({
      customer_id: customerId,
      sets: Number(sets) || 0,
      unit_price: Number(unitPrice) || 0,
      date: new Date(date).toISOString().slice(0, 10),
      for_period: (forPeriod || '').trim(),
      note: (note || '').trim(),
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
};

export const deletePaymentDb = async (id) => {
  const { error } = await supabase.from('payments').delete().eq('id', id);
  if (error) throw error;
};

export const insertTrainingRecord = async (customerId, date, content) => {
  const { data, error } = await supabase
    .from('training_records')
    .insert({
      customer_id: customerId,
      date: new Date(date).toISOString().slice(0, 10),
      content: (content || '').trim(),
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
};

export const updateTrainingRecordDb = async (id, updates) => {
  const obj = {};
  if (updates.date !== undefined) obj.date = updates.date;
  if (updates.content !== undefined) obj.content = updates.content;
  if (Object.keys(obj).length === 0) return;
  const { error } = await supabase.from('training_records').update(obj).eq('id', id);
  if (error) throw error;
};

export const deleteTrainingRecordDb = async (id) => {
  const { error } = await supabase.from('training_records').delete().eq('id', id);
  if (error) throw error;
};

export const fetchAppointmentsForConflictCheck = async (customerIds) => {
  if (!customerIds?.length) return [];
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .in('customer_id', customerIds);
  if (error) throw error;
  return (data || []).map(toAppointment);
};
