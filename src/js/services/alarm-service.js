// ============================================
// KUYUMCU PWA — Alarm Service
// ============================================

const STORAGE_KEY = 'kuyumcu_alarms';

export function getAlarms() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

export function addAlarm(alarm) {
  const alarms = getAlarms();
  alarm.id = 'a' + Date.now();
  alarm.active = true;
  alarm.createdAt = new Date().toISOString();
  alarm.triggeredAt = null;
  alarms.push(alarm);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
  return alarm;
}

export function removeAlarm(id) {
  let alarms = getAlarms();
  alarms = alarms.filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
}

export function toggleAlarm(id) {
  const alarms = getAlarms();
  const alarm = alarms.find(a => a.id === id);
  if (alarm) {
    alarm.active = !alarm.active;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
  }
  return alarm;
}

/** Check alarms against current prices */
export function checkAlarms(prices) {
  const alarms = getAlarms();
  const triggered = [];

  alarms.forEach(alarm => {
    if (!alarm.active) return;
    const price = prices[alarm.priceKey];
    if (!price) return;

    const currentValue = price.sell;
    if (alarm.condition === 'above' && currentValue >= alarm.targetPrice) {
      triggered.push({ ...alarm, currentPrice: currentValue });
    } else if (alarm.condition === 'below' && currentValue <= alarm.targetPrice) {
      triggered.push({ ...alarm, currentPrice: currentValue });
    }
  });

  // Mark triggered
  if (triggered.length > 0) {
    const updated = getAlarms().map(a => {
      const t = triggered.find(tr => tr.id === a.id);
      if (t) return { ...a, active: false, triggeredAt: new Date().toISOString() };
      return a;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  return triggered;
}
