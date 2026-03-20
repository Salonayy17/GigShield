# ⚡ GigShield — AI Parametric Insurance for Gig Workers

> Protecting India's delivery heroes from income loss due to weather disruptions.

---

## 🚀 Quick Start (Frontend Only — No Setup Needed)

Just open `index.html` in any browser:

```bash
# Option 1: Direct open
open index.html    # macOS
# or double-click index.html in File Explorer

# Option 2: Live server (VS Code extension recommended)
# Right-click index.html → Open with Live Server
```

**Demo Login:**
- Email: `demo@gigshield.in`  
- Password: `demo123`  
- Or click **"Enter Demo Mode"** (no login needed)

---

## 🖥️ Backend Setup (Optional)

```bash
npm install
node server.js
# API runs at http://localhost:3000
```

---

## 📁 Project Structure

```
gigshield/
├── index.html        ← Login page
├── dashboard.html    ← Main dashboard
├── style.css         ← All styles
├── app.js            ← Frontend logic (AI, fraud, weather)
├── server.js         ← Node.js Express API
├── package.json      ← Backend dependencies
└── README.md
```

---

## 🎯 Demo Mode Flow (For Judges)

1. **Open `index.html`** → Click **"Enter Demo Mode"**
2. **Dashboard loads** with simulated data
3. **Simulate weather** using the buttons:
   - ☀️ **Normal** → No disruption
   - 🌧️ **Rain** → Moderate disruption, WII rises
   - ⛈️ **Heavy Storm** → Severe disruption, payout eligible
   - 😷 **High AQI** → Air quality disruption
4. **Watch the dashboard update**:
   - WII Score changes
   - Risk Meter updates
   - Income Gap recalculates
   - Dynamic Premium adjusts
5. **Click "Request Payout via UPI"** → Fraud checks run → Payout simulated
6. **Explore sections** via left sidebar: Earnings, Claims, Fraud Score

---

## 🏗️ System Architecture

```
User (Gig Worker)
      │
      ▼
┌─────────────┐
│  Frontend   │  index.html + dashboard.html
│  HTML/CSS/JS│  app.js handles all logic
└──────┬──────┘
       │ API calls (optional)
       ▼
┌─────────────┐
│  Backend    │  Node.js + Express
│  server.js  │  /login /subscribe /payout
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│              AI Engine                   │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │ WII Calculator│  │Earnings Predictor│  │
│  │ (weather→0-100)│  │ (avg + penalty)  │  │
│  └─────────────┘  └──────────────────┘  │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │Risk Scorer  │  │Fraud Detector    │  │
│  │(dynamic price)│  │(5-layer rules)   │  │
│  └─────────────┘  └──────────────────┘  │
└─────────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│  Payout     │  UPI simulation (instant)
│  Engine     │  
└─────────────┘
```

---

## 🤖 AI Logic Explained

### 1. Weather Impact Index (WII)
```
WII = (rainfall/150)×40 + (AQI-100)/300×25 + (temp-38)/10×15 + (wind/80)×20
WII range: 0–100
Payout threshold: WII ≥ 40
```

### 2. AI Earnings Predictor
```
Predicted = BaseAvg - WeatherPenalty + LocationBonus
WeatherPenalty = BaseAvg × (WII/100) × 0.35
LocationBonus = zone-specific demand multiplier
```

### 3. Dynamic Premium Pricing
```
Risk Score = WII×0.5 + ZoneRisk×0.3 + Seasonal×0.2
Premium = ₹20 + (RiskScore/100 × ₹30)   [capped at ₹50]
```

### 4. Fraud Detection (5 layers)
| Check | Method | Flag if |
|-------|--------|---------|
| Location | GPS zone match | Outside registered zone |
| Movement | Motion analysis | No movement + claim |
| Group fraud | Zone claim volume | >50 claims/hr in zone |
| Weather match | WII validation | WII < 40 (no disruption) |
| Amount check | Claim/expected ratio | >85% of weekly expected |

---

## 📊 Database Schema

```sql
Users         { id, email, name, platform, city, zone }
Subscriptions { userId, plan, premium, status, weeksLeft }
Earnings      { userId, week, expected, actual }
Claims        { id, userId, date, reason, amount, status, wii }
```

---

## 🛣️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | Mock authentication |
| POST | `/subscribe` | Subscribe to plan |
| GET  | `/check-weather` | Get WII + weather |
| POST | `/predict-earnings` | AI earnings prediction |
| POST | `/payout` | Trigger payout + fraud check |
| GET  | `/claims` | Claims history |
| GET  | `/health` | Health check |

---

## 💰 Pricing Plans

| Plan | Weekly Premium | Coverage |
|------|---------------|----------|
| Basic | ₹20 | Up to ₹500/week |
| Standard | ₹30 | Up to ₹1,000/week |
| Pro | ₹35 | Up to ₹1,500/week |
| Max | ₹50 | Up to ₹2,500/week |

Premiums adjust dynamically based on WII, zone risk, and season.

---

## ✨ Unique Features

1. **Micro-Zone Coverage** — Insurance adjusts per neighbourhood (Anna Nagar vs Adyar)
2. **Live Risk Meter** — Real-time visual risk score with SVG arc
3. **Demo Controls** — One-click weather simulation for judges
4. **5-Layer Fraud Engine** — Rule-based fraud scoring without ML overhead
5. **Dynamic Pricing** — Premium changes with risk score every week

---

## 🏆 Hackathon MVP Priority

**Must Have (24hrs):**
- ✅ Login + Demo Mode
- ✅ Dashboard with weather simulation
- ✅ WII calculation
- ✅ Payout trigger

**Nice to Have (48hrs):**
- ✅ Risk meter + fraud score
- ✅ Claims history
- ✅ Micro-zone map
- ✅ Backend API

---

Built for hackathon demo. All weather data and payments are simulated.
