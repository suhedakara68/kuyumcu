const express = require('express');
const cors = require('cors');
const webpush = require('web-push');
const dotenv = require('dotenv');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;

// Setup Web Push
webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// In-memory data (replace with DB later)
let subscriptions = [];
let alerts = [];
let lastPrices = {
  gram_altin: { name: 'Gram Altın', marginSell: 2500 },
  ceyrek_altin: { name: 'Çeyrek Altın', marginSell: 4100 }
};

// Routes
app.get('/', (req, res) => res.send('Noventra Backend is Running! 💎'));

// PWA Subscription
app.post('/subscribe', (req, res) => {
  const subscription = req.body;
  if (!subscriptions.find(s => s.endpoint === subscription.endpoint)) {
    subscriptions.push(subscription);
  }
  res.status(201).json({});
});

// Sync Alerts from Client
app.post('/sync-alerts', (req, res) => {
  alerts = req.body.alerts || [];
  res.json({ success: true });
});

// Price Tracking Logic (Every 1 minute)
cron.schedule('* * * * *', () => {
  console.log('🔍 Sunucu fiyatları kontrol ediyor...');
  
  // Mock price fluctuation
  lastPrices.gram_altin.marginSell += (Math.random() - 0.5) * 10;
  lastPrices.ceyrek_altin.marginSell += (Math.random() - 0.5) * 20;

  checkAlertsOnServer();
});

function checkAlertsOnServer() {
  alerts.forEach(alert => {
    if (!alert.isActive) return;

    const currentPrice = lastPrices[alert.symbol]?.marginSell;
    if (!currentPrice) return;

    let triggered = false;
    if (alert.condition === 'above' && currentPrice >= alert.targetPrice) triggered = true;
    if (alert.condition === 'below' && currentPrice <= alert.targetPrice) triggered = true;

    if (triggered) {
      console.log(`🔔 ALARM TETİKLENDİ: ${alert.label} -> ${currentPrice}`);
      sendPushNotification(alert, currentPrice);
      alert.isActive = false; // Disable after trigger
    }
  });
}

function sendPushNotification(alert, price) {
  const payload = JSON.stringify({
    title: '🚨 Fiyat Alarmı!',
    body: `${alert.label} fiyatı ${price.toFixed(2)} TL oldu.`,
    url: '/'
  });

  subscriptions.forEach(sub => {
    webpush.sendNotification(sub, payload).catch(err => {
      console.error('Bildirim gönderilemedi:', err.endpoint);
    });
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Sunucu ${PORT} portunda yayında!`);
});
