const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===== In-Memory Data Store =====
const users = new Map();
const otpStore = new Map();
const trips = new Map();
const drivers = new Map();
const activeSockets = new Map();

// ===== Mock Drivers =====
const mockDrivers = [
  { id: 'd1', name: 'أحمد محمد', phone: '+201001234567', carType: 'suzuki', plateNumber: 'أ ب ج ١٢٣٤', rating: 4.8, totalTrips: 342, lat: 30.0444, lng: 31.2357, isAvailable: true },
  { id: 'd2', name: 'محمود علي', phone: '+201009876543', carType: 'chevrolet', plateNumber: 'د هـ و ٥٦٧٨', rating: 4.6, totalTrips: 218, lat: 30.0526, lng: 31.2445, isAvailable: true },
  { id: 'd3', name: 'حسن إبراهيم', phone: '+201005551234', carType: 'suzuki', plateNumber: 'ز ح ط ٩٠١٢', rating: 4.9, totalTrips: 567, lat: 30.0626, lng: 31.2545, isAvailable: true },
  { id: 'd4', name: 'يوسف خالد', phone: '+201007778901', carType: 'suzuki', plateNumber: 'ك ل م ٣٤٥٦', rating: 4.7, totalTrips: 189, lat: 30.0344, lng: 31.2257, isAvailable: true },
  { id: 'd5', name: 'عمر حسن', phone: '+201003334567', carType: 'chevrolet', plateNumber: 'ن س ع ٧٨٩٠', rating: 4.5, totalTrips: 421, lat: 30.0726, lng: 31.2645, isAvailable: true },
];
mockDrivers.forEach(d => drivers.set(d.id, d));

// ===== Fare Constants =====
const FARE = {
  suzuki: { base: 20, perKm: 13, perMin: 2, min: 50 },
  chevrolet: { base: 30, perKm: 16, perMin: 2.5, min: 70 },
};
const COMMISSION = { base: 8, rate: 0.08, min: 15, max: 40 };

function calcFare(carType, distanceKm, durationMin) {
  const f = FARE[carType] || FARE.suzuki;
  const fare = f.base + (f.perKm * distanceKm) + (f.perMin * durationMin);
  return Math.max(fare, f.min);
}
function calcCommission(fare) {
  const c = COMMISSION.base + (fare * COMMISSION.rate);
  return Math.min(Math.max(c, COMMISSION.min), COMMISSION.max);
}
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ===== OTP (real 4-digit code) =====
app.post('/api/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'رقم الهاتف مطلوب' });

  const code = String(Math.floor(1000 + Math.random() * 9000));
  otpStore.set(phone, { code, expires: Date.now() + 5 * 60 * 1000 });

  console.log(`📱 OTP for ${phone}: ${code}`);

  // TODO: integrate Twilio/Firebase here
  // For now, we return the code in dev mode
  res.json({ success: true, message: 'تم إرسال الرمز', dev_code: code });
});

app.post('/api/verify-otp', (req, res) => {
  const { phone, code } = req.body;
  const stored = otpStore.get(phone);

  if (!stored) return res.status(400).json({ error: 'لم يتم إرسال رمز لهذا الرقم' });
  if (Date.now() > stored.expires) {
    otpStore.delete(phone);
    return res.status(400).json({ error: 'انتهت صلاحية الرمز' });
  }
  if (stored.code !== code) return res.status(400).json({ error: 'رمز غير صحيح' });

  otpStore.delete(phone);

  let user = [...users.values()].find(u => u.phone === phone);
  if (!user) {
    user = { id: uuidv4().slice(0, 8), phone, name: 'مستخدم', createdAt: new Date().toISOString() };
    users.set(user.id, user);
  }

  res.json({ success: true, user });
});

// ===== Profile =====
app.put('/api/profile', (req, res) => {
  const { userId, name } = req.body;
  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
  user.name = name || user.name;
  users.set(userId, user);
  res.json({ success: true, user });
});

// ===== Estimate Fare =====
app.post('/api/estimate', (req, res) => {
  const { carType, pickupLat, pickupLng, destLat, destLng } = req.body;
  const dist = haversineKm(pickupLat, pickupLng, destLat, destLng);
  const duration = Math.round(dist * 2.5);
  const fare = calcFare(carType || 'suzuki', dist, duration);
  const commission = calcCommission(fare);
  res.json({ distance: +dist.toFixed(1), duration, fare: +fare.toFixed(0), commission: +commission.toFixed(0) });
});

// ===== Create Trip =====
app.post('/api/trip', (req, res) => {
  const { userId, carType, passengerCount, pickup, pickupLat, pickupLng, destination, destLat, destLng } = req.body;
  const dist = haversineKm(pickupLat, pickupLng, destLat, destLng);
  const duration = Math.round(dist * 2.5);
  const fare = calcFare(carType, dist, duration);
  const commission = calcCommission(fare);

  const trip = {
    id: 'T' + uuidv4().slice(0, 6).toUpperCase(),
    userId, carType, passengerCount: passengerCount || 1,
    pickup, pickupLat, pickupLng,
    destination, destLat, destLng,
    distance: +dist.toFixed(1), duration,
    fare: +fare.toFixed(0), commission: +commission.toFixed(0),
    status: 'searching',
    createdAt: new Date().toISOString(),
  };
  trips.set(trip.id, trip);
  res.json({ success: true, trip });
});

// ===== Find Driver =====
app.post('/api/find-driver', (req, res) => {
  const { tripId, carType } = req.body;
  const trip = trips.get(tripId);
  if (!trip) return res.status(404).json({ error: 'الرحلة غير موجودة' });

  const available = [...drivers.values()].filter(d => d.isAvailable && d.carType === carType);
  if (available.length === 0) {
    const any = [...drivers.values()].filter(d => d.isAvailable);
    if (any.length === 0) return res.json({ success: false, message: 'لا يوجد سائقين متاحين' });
    const driver = any[Math.floor(Math.random() * any.length)];
    driver.isAvailable = false;
    trip.driverId = driver.id;
    trip.status = 'assigned';
    trips.set(tripId, trip);
    return res.json({ success: true, driver, trip });
  }

  const driver = available[Math.floor(Math.random() * available.length)];
  driver.isAvailable = false;
  trip.driverId = driver.id;
  trip.status = 'assigned';
  trips.set(tripId, trip);
  res.json({ success: true, driver, trip });
});

// ===== Update Trip Status =====
app.put('/api/trip/:id/status', (req, res) => {
  const trip = trips.get(req.params.id);
  if (!trip) return res.status(404).json({ error: 'الرحلة غير موجودة' });
  trip.status = req.body.status;
  if (trip.status === 'completed') {
    trip.completedAt = new Date().toISOString();
    const driver = drivers.get(trip.driverId);
    if (driver) driver.isAvailable = true;
  }
  trips.set(trip.id, trip);
  res.json({ success: true, trip });
});

// ===== Rate Trip =====
app.put('/api/trip/:id/rate', (req, res) => {
  const trip = trips.get(req.params.id);
  if (!trip) return res.status(404).json({ error: 'الرحلة غير موجودة' });
  trip.rating = req.body.rating;
  trips.set(trip.id, trip);
  res.json({ success: true });
});

// ===== Trip History =====
app.get('/api/trips/:userId', (req, res) => {
  const userTrips = [...trips.values()]
    .filter(t => t.userId === req.params.userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ trips: userTrips });
});

// ===== WebSocket for real-time =====
io.on('connection', (socket) => {
  console.log('🔌 connected:', socket.id);
  socket.on('join-trip', (tripId) => socket.join('trip:' + tripId));
  socket.on('driver-location', ({ tripId, lat, lng }) => {
    io.to('trip:' + tripId).emit('driver-moved', { lat, lng });
  });
  socket.on('disconnect', () => console.log('🔌 disconnected:', socket.id));
});

// ===== SPA fallback =====
app.get('/{*splat}', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`🚐 ميكروباصي running on port ${PORT}`));
