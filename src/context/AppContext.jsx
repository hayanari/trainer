import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import * as supabaseStore from '../data/supabaseStore';
import {
  loadCustomers,
  saveCustomers,
  loadAppointments,
  saveAppointments,
  loadPayments,
  savePayments,
  loadTrainingRecords,
  saveTrainingRecords,
  checkAppointmentConflict,
  generateId,
} from '../data/store';

const AppContext = createContext(null);

export const AppProvider = ({ children, userId }) => {
  const [allCustomers, setAllCustomers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [trainingRecords, setTrainingRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const useSupabase = isSupabaseEnabled() && !!userId;

  const customers = userId
    ? allCustomers.filter((c) => !c.userId || c.userId === userId)
    : [];
  const customerIds = customers.map((c) => c.id);
  const filteredAppointments = customerIds.length
    ? appointments.filter((a) => customerIds.includes(a.customerId))
    : [];
  const filteredPayments = customerIds.length
    ? payments.filter((p) => customerIds.includes(p.customerId))
    : [];
  const filteredTrainingRecords = customerIds.length
    ? trainingRecords.filter((t) => customerIds.includes(t.customerId))
    : [];

  const loadData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      if (useSupabase) {
        const [c, a, p, t] = await Promise.all([
          supabaseStore.fetchCustomers(),
          supabaseStore.fetchAppointments(),
          supabaseStore.fetchPayments(),
          supabaseStore.fetchTrainingRecords(),
        ]);
        setAllCustomers(c);
        setAppointments(a);
        setPayments(p);
        setTrainingRecords(t);
      } else {
        setAllCustomers(loadCustomers());
        setAppointments(loadAppointments());
        setPayments(loadPayments());
        setTrainingRecords(loadTrainingRecords());
      }
    } catch (err) {
      console.error('データ読み込みエラー:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, useSupabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!userId) return;
    if (!useSupabase) {
      const stored = loadCustomers();
      const needsMigration = stored.some((c) => !c.userId);
      if (needsMigration) {
        const updated = stored.map((c) => (!c.userId ? { ...c, userId } : c));
        saveCustomers(updated);
        setAllCustomers(updated);
      }
    }
  }, [userId, useSupabase]);

  useEffect(() => {
    if (!useSupabase) {
      saveCustomers(allCustomers);
    }
  }, [allCustomers, useSupabase]);
  useEffect(() => {
    if (!useSupabase) {
      saveAppointments(appointments);
    }
  }, [appointments, useSupabase]);
  useEffect(() => {
    if (!useSupabase) {
      savePayments(payments);
    }
  }, [payments, useSupabase]);
  useEffect(() => {
    if (!useSupabase) {
      saveTrainingRecords(trainingRecords);
    }
  }, [trainingRecords, useSupabase]);

  const addCustomer = useCallback(
    async (name, pricePer4Sessions = 30000) => {
      if (!userId) return null;
      const id = useSupabase
        ? await supabaseStore.insertCustomer(userId, name, pricePer4Sessions)
        : (() => {
            const newCustomer = {
              id: generateId(),
              name: name.trim(),
              userId,
              pricePer4Sessions: Number(pricePer4Sessions) || 30000,
              createdAt: new Date().toISOString(),
            };
            setAllCustomers((prev) => [...prev, newCustomer]);
            return newCustomer.id;
          })();
      if (useSupabase) loadData();
      return id;
    },
    [userId, useSupabase, loadData]
  );

  const updateCustomer = useCallback(
    async (id, updates) => {
      if (useSupabase) {
        await supabaseStore.updateCustomerDb(id, updates);
        loadData();
      } else {
        setAllCustomers((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
        );
      }
    },
    [useSupabase, loadData]
  );

  const deleteCustomer = useCallback(
    async (id) => {
      if (useSupabase) {
        await supabaseStore.deleteCustomerDb(id);
      } else {
        setAllCustomers((prev) => prev.filter((c) => c.id !== id));
        setAppointments((prev) => prev.filter((a) => a.customerId !== id));
        setPayments((prev) => prev.filter((p) => p.customerId !== id));
        setTrainingRecords((prev) => prev.filter((t) => t.customerId !== id));
      }
      if (useSupabase) loadData();
    },
    [useSupabase, loadData]
  );

  const addAppointment = useCallback(
    async (customerId, datetime, sessionNumber = 1, notes = '') => {
      if (useSupabase) {
        await supabaseStore.insertAppointment(customerId, datetime, sessionNumber, notes);
        loadData();
      } else {
        const newAppointment = {
          id: generateId(),
          customerId,
          datetime: new Date(datetime).toISOString(),
          sessionNumber: Number(sessionNumber) || 1,
          notes: (notes || '').trim(),
        };
        setAppointments((prev) => [...prev, newAppointment]);
      }
    },
    [useSupabase, loadData]
  );

  const updateAppointment = useCallback(
    async (id, updates) => {
      if (useSupabase) {
        await supabaseStore.updateAppointmentDb(id, updates);
        loadData();
      } else {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
        );
      }
    },
    [useSupabase, loadData]
  );

  const deleteAppointment = useCallback(
    async (id) => {
      if (useSupabase) {
        await supabaseStore.deleteAppointmentDb(id);
        loadData();
      } else {
        setAppointments((prev) => prev.filter((a) => a.id !== id));
      }
    },
    [useSupabase, loadData]
  );

  const addPayment = useCallback(
    async (customerId, sets, unitPrice, date, forPeriod = '', note = '') => {
      if (useSupabase) {
        await supabaseStore.insertPayment(customerId, sets, unitPrice, date, forPeriod, note);
        loadData();
      } else {
        const s = Number(sets) || 0;
        const u = Number(unitPrice) || 0;
        const newPayment = {
          id: generateId(),
          customerId,
          sets: s,
          unitPrice: u,
          amount: s * u,
          date: new Date(date).toISOString().slice(0, 10),
          forPeriod: (forPeriod || '').trim(),
          note: (note || '').trim(),
        };
        setPayments((prev) => [...prev, newPayment]);
      }
    },
    [useSupabase, loadData]
  );

  const deletePayment = useCallback(
    async (id) => {
      if (useSupabase) {
        await supabaseStore.deletePaymentDb(id);
        loadData();
      } else {
        setPayments((prev) => prev.filter((p) => p.id !== id));
      }
    },
    [useSupabase, loadData]
  );

  const addTrainingRecord = useCallback(
    async (customerId, date, content) => {
      if (useSupabase) {
        await supabaseStore.insertTrainingRecord(customerId, date, content);
        loadData();
      } else {
        const newRecord = {
          id: generateId(),
          customerId,
          date: new Date(date).toISOString().slice(0, 10),
          content: (content || '').trim(),
        };
        setTrainingRecords((prev) => [...prev, newRecord]);
      }
    },
    [useSupabase, loadData]
  );

  const updateTrainingRecord = useCallback(
    async (id, updates) => {
      if (useSupabase) {
        await supabaseStore.updateTrainingRecordDb(id, updates);
        loadData();
      } else {
        setTrainingRecords((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
        );
      }
    },
    [useSupabase, loadData]
  );

  const deleteTrainingRecord = useCallback(
    async (id) => {
      if (useSupabase) {
        await supabaseStore.deleteTrainingRecordDb(id);
        loadData();
      } else {
        setTrainingRecords((prev) => prev.filter((r) => r.id !== id));
      }
    },
    [useSupabase, loadData]
  );

  const getConflictAppointments = useCallback(
    async (datetime, excludeId = null) => {
      let apts = [];
      if (useSupabase && customerIds.length) {
        apts = await supabaseStore.fetchAppointmentsForConflictCheck(customerIds);
      } else {
        apts = loadAppointments();
        if (customerIds.length) {
          apts = apts.filter((a) => customerIds.includes(a.customerId));
        }
      }
      const targetTime = new Date(datetime).getTime();
      const oneHourMs = 60 * 60 * 1000;
      const conflicts = apts.filter((apt) => {
        if (apt.id === excludeId) return false;
        const aptTime = new Date(apt.datetime).getTime();
        return Math.abs(aptTime - targetTime) < oneHourMs;
      });
      return conflicts.map((apt) => {
        const customer = customers.find((c) => c.id === apt.customerId);
        return { ...apt, customerName: customer?.name || '不明' };
      });
    },
    [customers, customerIds, useSupabase]
  );

  const value = {
    customers,
    appointments: filteredAppointments,
    payments: filteredPayments,
    trainingRecords: filteredTrainingRecords,
    loading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    addPayment,
    deletePayment,
    addTrainingRecord,
    updateTrainingRecord,
    deleteTrainingRecord,
    getConflictAppointments,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
