/**
 * GIGSHIELD — Backend API Server
 * Stack: Node.js + Express
 * Run: npm install express cors && node server.js
 * API runs on: http://localhost:3000
 */

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serve frontend static files (when running locally)
app.use(express.static(path.join(__dirname)));

// ─────────────────────────────────────
//  MOCK DATABASE (In-memory)
// ─────────────────────────────────────

const DB = {
  users: [
    { id: 1, email: 'demo@gigshield.in', pass: 'demo123', name: 'Ravi Kumar',  platform: 'Zomato', city: 'Chennai', zone: 'Anna Nagar' },
    { id: 2, email: '9876543210',        pass: 'pass123',  name: 'Priya Singh', platform: 'Swiggy', city: 'Mumbai',  zone: 'Bandra' },
  ],
  subscriptions: [
    { userId: 1, plan: 'Shield Pro', premium: 35, status: 'active', weeksLeft: 4, startDate: '2025-03-01' },
    { userId: 2, plan: 'Shield Basic', premium: 20, status: 'active', weeksLeft: 2, startDate: '2025-03-10' },
  ],
  earnings: [
    { userId: 1, week: 'W10', expected: 2100, actual: 1900 },
    { userId: 1, week: 'W11', expected: 2300, actual: 2100 },
    { userId: 1, week: 'W12', expected: 2200, actual: 1500 },
    { userId: 1, week: 'W13', expected: 2400, actual: 2200 },
  ],
  claims: [
    { id: 'CLM001', userId: 1, date: '2025-03-14', reason: 'Heavy Rain', amount: 580, status: 'paid', wii: 65 },
    { id: 'CLM002', userId: 1, date: '2025-02-28', reason: 'High AQI',   amount: 420, status: 'paid', wii: 50 },
    { id: 'CLM003', userId: 1, date: '2025-01-19', reason: 'Flash Flood', amount: 700, status: 'paid', wii: 80 },
  ],
  // Tracks recent claims per zone to detect group fraud
  zoneClaims: {},
};

// ─────────────────────────────────────
//  UTILITY FUNCTIONS (AI Logic)
// ─────────────────────────────────────

/**
 * Weather Impact Index
 * WII = f(rainfall, aqi, temp, wind) → 0–100
 */
function calculateWII({ rainfall = 0, aqi = 80, temp = 30, wind = 10 }) {
  const rainScore = Math.min(40, (rainfall / 150) * 40);
  const aqiScore  = Math.min(25, Math.max(0, (aqi - 100) / 300) * 25);
  const tempScore = Math.min(15, Math.max(0, (temp - 38) / 10) * 15);
  const windScore = Math.min(20, (wind / 80) * 20);
  return Math.round(rainScore + aqiScore + tempScore + windScore);
}

/**
 * AI Earnings Predictor
 * Uses historical average + weather penalty + zone demand
 */
function predictEarnings(userId, weather) {
  const history = DB.earnings.filter(e => e.userId === userId);
  const baseAvg = history.length > 0
    ? Math.round(history.reduce((s, e) => s + e.expected, 0) / history.length)
    : 2200;

  const wii = calculateWII(weather);
  const weatherPenalty = Math.round(baseAvg * (wii / 100) * 0.35);
  const locationBonus  = 430; // zone-specific demand boost (mocked)

  return {
    baseAverage: baseAvg,
    weatherPenalty,
    locationBonus,
    predicted: Math.max(500, baseAvg - weatherPenalty + locationBonus),
    wii,
  };
}

/**
 * Risk Score + Dynamic Premium
 */
function calculateRiskAndPremium(wii, zone) {
  const zoneRiskMap = { 'Anna Nagar': 35, 'Bandra': 40, 'Whitefield': 25 };
  const zoneRisk    = zoneRiskMap[zone] || 30;
  const seasonal    = 20; // March: monsoon approaching
  const riskScore   = Math.min(100, Math.round(wii * 0.5 + zoneRisk * 0.3 + seasonal * 0.2));
  const premium     = Math.min(50, 20 + Math.round((riskScore / 100) * 30));
  return { riskScore, premium };
}

/**
 * Fraud Detection
 * Multi-layer rule-based system
 */
function detectFraud(userId, zone, wii, claimAmount, expectedEarnings) {
  const checks = [];
  let fraudScore = 0;

  // 1. Location verification (mocked GPS check)
  checks.push({ check: 'Location', result: 'pass', message: 'GPS verified in registered zone' });

  // 2. Movement analysis (mocked)
  const isMoving = Math.random() > 0.1; // 90% chance moving (demo)
  if (!isMoving) {
    checks.push({ check: 'Movement', result: 'fail', message: 'No movement detected — suspicious' });
    fraudScore += 35;
  } else {
    checks.push({ check: 'Movement', result: 'pass', message: 'Active movement confirmed' });
  }

  // 3. Group fraud: too many claims in same zone
  const now = Date.now();
  const key  = `${zone}_${Math.floor(now / 3600000)}`; // per-hour bucket
  DB.zoneClaims[key] = (DB.zoneClaims[key] || 0) + 1;
  if (DB.zoneClaims[key] > 50) { // >50 claims/hour from one zone = suspicious
    checks.push({ check: 'Group Fraud', result: 'warn', message: `${DB.zoneClaims[key]} claims from zone this hour` });
    fraudScore += 20;
  } else {
    checks.push({ check: 'Group Fraud', result: 'pass', message: 'Normal claim volume in zone' });
    fraudScore += 5;
  }

  // 4. Environmental consistency
  if (wii < 40) {
    checks.push({ check: 'Weather Match', result: 'fail', message: `WII ${wii} below threshold — no real disruption` });
    fraudScore += 30;
  } else {
    checks.push({ check: 'Weather Match', result: 'pass', message: `WII ${wii} confirms disruption` });
  }

  // 5. Claim amount sanity
  const ratio = claimAmount / expectedEarnings;
  if (ratio > 0.85) {
    checks.push({ check: 'Amount Check', result: 'warn', message: `Claim is ${Math.round(ratio * 100)}% of weekly expected` });
    fraudScore += 15;
  } else {
    checks.push({ check: 'Amount Check', result: 'pass', message: 'Claim amount is reasonable' });
  }

  return {
    fraudScore: Math.min(100, fraudScore),
    checks,
    verdict: fraudScore < 30 ? 'clean' : fraudScore < 60 ? 'review' : 'flagged',
  };
}

// ─────────────────────────────────────
//  ROUTES
// ─────────────────────────────────────

/** POST /login */
app.post('/login', (req, res) => {
  const { email, pass } = req.body;
  const user = DB.users.find(u => u.email === email && u.pass === pass);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const { pass: _, ...safeUser } = user;
  const subscription = DB.subscriptions.find(s => s.userId === user.id);

  res.json({ success: true, user: safeUser, subscription, token: `mock_token_${user.id}` });
});

/** GET /subscribe?userId=1&plan=pro */
app.post('/subscribe', (req, res) => {
  const { userId, plan } = req.body;
  const user = DB.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const premiums = { basic: 20, standard: 30, pro: 35, max: 50 };
  const premium  = premiums[plan] || 35;

  const sub = {
    userId,
    plan: `Shield ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
    premium,
    status: 'active',
    weeksLeft: 4,
    startDate: new Date().toISOString().slice(0, 10),
  };

  // Upsert subscription in mock DB
  const idx = DB.subscriptions.findIndex(s => s.userId === userId);
  if (idx >= 0) DB.subscriptions[idx] = sub;
  else DB.subscriptions.push(sub);

  res.json({ success: true, subscription: sub, message: `Subscribed to ₹${premium}/week plan` });
});

/** GET /check-weather?lat=13.08&lng=80.27 */
app.get('/check-weather', (req, res) => {
  // Mock weather based on query (in production: call OpenWeatherMap / IMD API)
  const scenarios = [
    { rainfall: 0,   aqi: 65,  temp: 30, wind: 10, condition: 'Clear' },
    { rainfall: 45,  aqi: 90,  temp: 27, wind: 25, condition: 'Moderate Rain' },
    { rainfall: 120, aqi: 110, temp: 24, wind: 60, condition: 'Heavy Storm' },
    { rainfall: 5,   aqi: 310, temp: 35, wind: 8,  condition: 'High AQI' },
  ];

  // In demo: return random scenario
  const weather = scenarios[Math.floor(Math.random() * scenarios.length)];
  const wii = calculateWII(weather);

  res.json({
    success: true,
    weather,
    wii,
    wiiLabel: wii >= 70 ? 'Severe' : wii >= 40 ? 'Moderate' : wii >= 20 ? 'Low' : 'Normal',
    location: { lat: req.query.lat || 13.08, lng: req.query.lng || 80.27, zone: 'Anna Nagar, Chennai' },
  });
});

/** POST /predict-earnings */
app.post('/predict-earnings', (req, res) => {
  const { userId, weather } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const prediction = predictEarnings(userId, weather || {});
  const user = DB.users.find(u => u.id === userId);
  const { riskScore, premium } = calculateRiskAndPremium(prediction.wii, user?.zone || 'Anna Nagar');

  // Get latest actual earnings from DB
  const latest = DB.earnings.filter(e => e.userId === userId).slice(-1)[0];
  const actualEarnings = latest ? latest.actual : Math.round(prediction.predicted * 0.75);
  const gap = Math.max(0, prediction.predicted - actualEarnings);

  res.json({
    success: true,
    prediction: {
      ...prediction,
      actualEarnings,
      incomeGap: gap,
      payoutEligible: prediction.wii >= 40 && gap > 0,
    },
    risk: { riskScore, premium },
  });
});

/** POST /payout */
app.post('/payout', (req, res) => {
  const { userId, upiId, weather, expectedEarnings, actualEarnings } = req.body;

  if (!userId || !upiId) return res.status(400).json({ error: 'userId and upiId required' });

  const user = DB.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const sub = DB.subscriptions.find(s => s.userId === userId && s.status === 'active');
  if (!sub) return res.status(403).json({ error: 'No active subscription' });

  const wii   = calculateWII(weather || {});
  const gap   = Math.max(0, (expectedEarnings || 2450) - (actualEarnings || 1820));
  const fraud = detectFraud(userId, user.zone, wii, gap, expectedEarnings || 2450);

  // Reject if fraud flagged
  if (fraud.verdict === 'flagged') {
    return res.status(403).json({
      success: false,
      error: 'Claim flagged by fraud detection',
      fraudScore: fraud.fraudScore,
      checks: fraud.checks,
    });
  }

  // Reject if WII too low
  if (wii < 40) {
    return res.status(403).json({
      success: false,
      error: `Weather Impact Index (${wii}) is below threshold (40). No disruption detected.`,
    });
  }

  // Approve payout
  const claim = {
    id: `CLM${String(DB.claims.length + 1).padStart(3, '0')}`,
    userId,
    date: new Date().toISOString().slice(0, 10),
    reason: getWIIReasonText(weather),
    amount: gap,
    status: 'processing',
    wii,
    upiId,
    txnId: `TXN${Date.now().toString().slice(-8)}`,
  };

  DB.claims.push(claim);

  // Simulate payment (mark as paid after delay in real system)
  setTimeout(() => {
    claim.status = 'paid';
  }, 3000);

  res.json({
    success: true,
    payout: {
      amount: gap,
      upiId,
      txnId: claim.txnId,
      status: 'processing',
      message: `₹${gap} payout initiated to ${upiId}. Credit within 2–10 minutes.`,
    },
    fraud: { score: fraud.fraudScore, verdict: fraud.verdict },
    wii,
  });
});

/** GET /claims?userId=1 */
app.get('/claims', (req, res) => {
  const userId = parseInt(req.query.userId);
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const claims = DB.claims.filter(c => c.userId === userId);
  res.json({ success: true, claims, total: claims.length });
});

/** GET /health */
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'GigShield API', version: '1.0.0' }));

// ─────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────

function getWIIReasonText(weather = {}) {
  if ((weather.rainfall || 0) > 80) return 'Heavy Rain / Storm Disruption';
  if ((weather.aqi || 0) > 200)     return 'High AQI / Air Quality Disruption';
  if ((weather.rainfall || 0) > 20) return 'Moderate Rain Disruption';
  return 'Weather Disruption';
}

// ─────────────────────────────────────
//  START
// ─────────────────────────────────────

app.listen(PORT, () => {
  console.log(`
  ⚡ GigShield API running at http://localhost:${PORT}
  
  Endpoints:
    POST /login            — Mock authentication
    POST /subscribe        — Subscribe to a plan
    GET  /check-weather    — Get weather + WII
    POST /predict-earnings — AI earnings prediction
    POST /payout           — Trigger payout (with fraud check)
    GET  /claims           — Get claims history
    GET  /health           — Health check
  `);
});
