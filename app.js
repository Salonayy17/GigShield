/* ==============================================
   GIGSHIELD — app.js
   Covers: Auth, Demo Slideshow, Weather Sim,
   WII, AI Earnings, Risk Meter, Fraud, Payout
   ============================================== */

// ──────── STATE ────────
const STATE = {
  isDemo: false,
  user: null,
  weather: { rainfall: 0, aqi: 65, temp: 30, wind: 10 },
  wii: 0,
  riskScore: 0,
  expectedEarnings: 2450,
  actualEarnings: 1820,
  fraudScore: 15,
  payoutDone: false,
  claims: [
    { id: 'CLM001', date: 'Mar 14', reason: 'Heavy Rain – Cyclone Alert',   amount: 580, status: 'Paid',  icon: '🌧️' },
    { id: 'CLM002', date: 'Feb 28', reason: 'High AQI (>300) – Smog Event', amount: 420, status: 'Paid',  icon: '😷' },
    { id: 'CLM003', date: 'Jan 19', reason: 'Flash Flood – Zone Closure',   amount: 700, status: 'Paid',  icon: '🌊' },
  ],
};

// ──────── DEMO SLIDESHOW ────────

const TOTAL_SLIDES = 7;
let demoCurrentSlide = 0;
let demoAutoplayTimer = null;
let demoAutoplayEnabled = true;

function launchDemo() {
  demoCurrentSlide = 0;
  const overlay = document.getElementById('demoOverlay');
  if (!overlay) return;
  overlay.style.display = 'flex';

  // Build dots
  buildDemoDots();
  goToSlide(0);
  startAutoplay();
}

function buildDemoDots() {
  const dots = document.getElementById('demoDots');
  if (!dots) return;
  dots.innerHTML = '';
  for (let i = 0; i < TOTAL_SLIDES; i++) {
    const d = document.createElement('div');
    d.className = 'demo-dot' + (i === 0 ? ' active' : '');
    d.onclick = () => goToSlide(i);
    dots.appendChild(d);
  }
}

function goToSlide(idx) {
  demoCurrentSlide = idx;

  // Show correct slide
  document.querySelectorAll('.demo-slide').forEach((s, i) => {
    s.classList.toggle('active', i === idx);
  });

  // Update dots
  document.querySelectorAll('.demo-dot').forEach((d, i) => {
    d.classList.toggle('active', i === idx);
  });

  // Progress bar
  const fill = document.getElementById('demoProgressFill');
  if (fill) fill.style.width = ((idx + 1) / TOTAL_SLIDES * 100) + '%';

  // Counter
  const counter = document.getElementById('demoCounter');
  if (counter) counter.textContent = `${idx + 1} / ${TOTAL_SLIDES}`;

  // Prev/Next buttons
  const prev = document.getElementById('demoPrev');
  const next = document.getElementById('demoNext');
  if (prev) prev.disabled = idx === 0;
  if (next) {
    if (idx === TOTAL_SLIDES - 1) {
      next.textContent = 'Enter Dashboard →';
      next.onclick = exitDemo;
    } else {
      next.textContent = 'Next →';
      next.onclick = () => demoNav(1);
    }
  }
}

function demoNav(dir) {
  const newIdx = demoCurrentSlide + dir;
  if (newIdx < 0 || newIdx >= TOTAL_SLIDES) return;
  goToSlide(newIdx);

  // Reset autoplay timer on manual nav
  if (demoAutoplayEnabled) {
    clearInterval(demoAutoplayTimer);
    startAutoplay();
  }
}

function startAutoplay() {
  clearInterval(demoAutoplayTimer);
  if (!demoAutoplayEnabled) return;
  demoAutoplayTimer = setInterval(() => {
    if (demoCurrentSlide < TOTAL_SLIDES - 1) {
      goToSlide(demoCurrentSlide + 1);
    } else {
      clearInterval(demoAutoplayTimer); // Stop at last slide
    }
  }, 5000);
}

function toggleAutoplay(enabled) {
  demoAutoplayEnabled = enabled;
  if (enabled) {
    startAutoplay();
  } else {
    clearInterval(demoAutoplayTimer);
  }
}

function exitDemo() {
  clearInterval(demoAutoplayTimer);
  const overlay = document.getElementById('demoOverlay');
  if (overlay) overlay.style.display = 'none';
}

// ──────── AUTH ────────

function handleLogin() {
  const id   = (document.getElementById('loginId')?.value || '').trim();
  const pass = (document.getElementById('loginPass')?.value || '').trim();

  if (!id || !pass) return showLoginError('Please fill in all fields.');

  const users = [
    { id: 'demo@gigshield.in', pass: 'demo123', name: 'Ravi Kumar',  platform: 'Zomato · Chennai', avatar: 'R' },
    { id: '9876543210',        pass: 'pass123',  name: 'Priya Singh', platform: 'Swiggy · Mumbai',  avatar: 'P' },
  ];

  const found = users.find(u => u.id === id && u.pass === pass);
  if (!found) return showLoginError('Invalid credentials. Try demo@gigshield.in / demo123');

  sessionStorage.setItem('gigshield_user', JSON.stringify(found));
  sessionStorage.removeItem('gigshield_demo');
  window.location.href = 'dashboard.html';
}

function handleDemoLogin() {
  const user = { name: 'Demo Worker', platform: 'Zomato · Chennai', avatar: 'D', isDemo: true };
  sessionStorage.setItem('gigshield_user', JSON.stringify(user));
  sessionStorage.setItem('gigshield_demo', 'true');
  window.location.href = 'dashboard.html';
}

function showLoginError(msg) {
  const el = document.getElementById('loginError');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

function logout() {
  sessionStorage.clear();
  window.location.href = 'index.html';
}

// ──────── DASHBOARD INIT ────────

function initDashboard() {
  const raw = sessionStorage.getItem('gigshield_user');
  if (!raw) { window.location.href = 'index.html'; return; }

  STATE.user   = JSON.parse(raw);
  STATE.isDemo = sessionStorage.getItem('gigshield_demo') === 'true';

  setText('workerName',     STATE.user.name);
  setText('workerPlatform', STATE.user.platform);
  setText('workerAvatar',   STATE.user.avatar);

  if (STATE.isDemo) {
    const tag = document.getElementById('demoTag');
    if (tag) tag.style.display = 'inline-block';
  }

  // Sidebar nav
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      switchSection(el.dataset.section);
    });
  });

  // Init all widgets
  updateWeatherUI();
  renderClaimsHistory();
  renderFraudChecks();
  renderEarningsChart();

  // Auto-launch demo slideshow for demo users
  if (STATE.isDemo) {
    setTimeout(launchDemo, 600);
  }
}

// ──────── NAV ────────

function switchSection(name) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));

  const navEl = document.querySelector(`[data-section="${name}"]`);
  const secEl = document.getElementById(`section-${name}`);
  if (navEl) navEl.classList.add('active');
  if (secEl) secEl.classList.add('active');

  const titles = { dashboard: 'Dashboard', earnings: 'Earnings', claims: 'Claims', fraud: 'Fraud Detection' };
  setText('sectionTitle', titles[name] || name);
}

// ──────── WEATHER SIMULATION ────────

const SCENARIOS = {
  normal: { rainfall: 0,   aqi: 65,  temp: 30, wind: 10 },
  rain:   { rainfall: 48,  aqi: 92,  temp: 27, wind: 28 },
  heavy:  { rainfall: 125, aqi: 115, temp: 23, wind: 65 },
  aqi:    { rainfall: 5,   aqi: 315, temp: 35, wind: 8  },
};

function simulateWeather(type) {
  // Update active button
  document.querySelectorAll('.sbtn').forEach(b => b.classList.remove('active-sim'));
  const clickedBtns = document.querySelectorAll('.sbtn');
  clickedBtns.forEach(b => {
    if (b.textContent.toLowerCase().includes(type === 'normal' ? 'normal' :
        type === 'rain' ? 'rain' : type === 'heavy' ? 'storm' : 'aqi')) {
      b.classList.add('active-sim');
    }
  });

  STATE.weather = { ...SCENARIOS[type] };
  updateWeatherUI();

  // Weather alert
  const alertEl = document.getElementById('weatherAlert');
  if (type === 'normal') {
    if (alertEl) alertEl.style.display = 'none';
  } else {
    const msgs = {
      rain:  { emoji: '🌧️', title: 'Rain Alert Active',       desc: 'Moderate rain detected. You may be eligible for a payout.' },
      heavy: { emoji: '⛈️', title: 'Severe Storm Detected',   desc: 'Heavy disruption in your zone. Payout is triggered.' },
      aqi:   { emoji: '😷', title: 'High AQI Alert',           desc: 'Air quality disruption active. Coverage triggered.' },
    };
    const m = msgs[type];
    if (alertEl && m) {
      setText('alertEmoji', m.emoji);
      setText('alertTitle', m.title);
      setText('alertDesc',  m.desc);
      alertEl.style.display = 'flex';
    }
    const notifs = {
      rain:  '🌧️ Rain detected in your zone. Check payout eligibility.',
      heavy: '⛈️ Severe storm! Income protection coverage is now active.',
      aqi:   '😷 High AQI detected. Air quality disruption coverage activated.',
    };
    showNotif(notifs[type]);
  }
}

// ──────── AI LOGIC ────────

/** Weather Impact Index: 0–100 */
function calcWII({ rainfall, aqi, temp, wind }) {
  const rain = Math.min(40, (rainfall / 150) * 40);
  const aqiS = Math.min(25, Math.max(0, (aqi - 100) / 300) * 25);
  const tmpS = Math.min(15, Math.max(0, (temp - 38) / 10) * 15);
  const wndS = Math.min(20, (wind / 80) * 20);
  return Math.round(rain + aqiS + tmpS + wndS);
}

function wiiLabel(wii) {
  if (wii >= 70) return '🔴 Severe disruption — payout auto-triggered';
  if (wii >= 40) return '🟡 Moderate disruption — eligible for payout';
  if (wii >= 20) return '🟢 Minor disruption — monitoring';
  return '⚪ Normal conditions — no disruption';
}

/** AI Earnings Predictor */
function predictEarnings(wii) {
  const base    = 2200;
  const penalty = Math.round(base * (wii / 100) * 0.35);
  const bonus   = 430;
  return Math.max(500, base - penalty + bonus);
}

/** Risk score + premium */
function calcRisk(wii) {
  const zone     = 35; // Anna Nagar
  const seasonal = 20;
  const score    = Math.min(100, Math.round(wii * 0.5 + zone * 0.3 + seasonal * 0.2));
  const premium  = Math.min(50, 20 + Math.round((score / 100) * 30));
  return { score, premium };
}

// ──────── UPDATE UI ────────

function updateWeatherUI() {
  STATE.wii = calcWII(STATE.weather);
  const { rainfall, aqi, temp, wind } = STATE.weather;

  // Bars
  setBar('barRain', 'valRain', rainfall, 150, `${rainfall} mm`);
  setBar('barAqi',  'valAqi',  aqi,      400, `${aqi}`);
  setBar('barTemp', 'valTemp', Math.max(0, temp - 15), 35, `${temp}°C`);
  setBar('barWind', 'valWind', wind,     80,  `${wind} km/h`);

  // WII display
  setText('wiiScore', STATE.wii);
  setText('wiiLabel', wiiLabel(STATE.wii));

  // Earnings
  STATE.expectedEarnings = predictEarnings(STATE.wii);
  const base    = 2200;
  const penalty = Math.round(base * (STATE.wii / 100) * 0.35);
  STATE.actualEarnings   = Math.max(300, STATE.expectedEarnings - Math.round(STATE.expectedEarnings * 0.27));

  const gap = Math.max(0, STATE.expectedEarnings - STATE.actualEarnings);
  setText('expectedEarnings', `₹${fmt(STATE.expectedEarnings)}`);
  setText('actualEarnings',   `₹${fmt(STATE.actualEarnings)}`);
  setText('incomeGap',        `₹${fmt(gap)}`);
  setText('gapStatus',        gap > 0 ? 'Eligible for payout' : 'No income gap');
  setText('weatherAdj',       `-₹${penalty}`);
  setText('aiPredicted',      `₹${fmt(STATE.expectedEarnings)}`);

  // Risk meter
  const { score, premium } = calcRisk(STATE.wii);
  STATE.riskScore = score;
  updateMeter(score);
  setText('dynamicPremium', `₹${premium}`);
  setText('planPrice',      `₹${premium}/wk`);

  const wR = STATE.wii > 50 ? 'high' : STATE.wii > 20 ? 'med' : 'low';
  setRiskPill('riskWeather', wR);

  // Payout section
  updatePayoutUI();

  // Fraud (re-run)
  renderFraudChecks();
}

function setBar(barId, valId, val, max, label) {
  const pct = Math.min(100, Math.round((val / max) * 100));
  const b = document.getElementById(barId);
  const v = document.getElementById(valId);
  if (b) b.style.width = pct + '%';
  if (v) v.textContent = label;
}

function updateMeter(score) {
  const arc = document.getElementById('meterArc');
  const val = document.getElementById('meterVal');
  if (arc) arc.style.strokeDashoffset = String(283 - (score / 100) * 283);
  if (val) val.textContent = score;
}

function setRiskPill(id, level) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `rpill ${level}`;
  el.textContent = level === 'low' ? 'Low' : level === 'med' ? 'Medium' : 'High';
}

function updatePayoutUI() {
  const gap      = Math.max(0, STATE.expectedEarnings - STATE.actualEarnings);
  const eligible = STATE.wii >= 40 && gap > 0 && STATE.fraudScore < 70;

  const eligEl = document.getElementById('payoutEligibility');
  if (eligEl) {
    eligEl.textContent = eligible ? 'Eligible ✅' : 'Not Eligible ✗';
    eligEl.className   = `badge ${eligible ? 'green' : 'red'}`;
  }
  setText('payoutAmount',  `₹${fmt(gap)}`);
  setText('wiiThreshold',  `Current WII: ${STATE.wii} (need ≥ 40)`);

  const fEl = document.getElementById('fraudScoreDisplay');
  if (fEl) {
    fEl.textContent = STATE.fraudScore < 40 ? '✅ Clean' : '⚠️ Flagged';
    fEl.className   = `badge ${STATE.fraudScore < 40 ? 'green' : 'yellow'}`;
  }

  const btn = document.getElementById('payoutBtn');
  if (btn) btn.disabled = !eligible || STATE.payoutDone;
}

// ──────── FRAUD DETECTION ────────

const FRAUD_RULES = [
  {
    icon: '📍', title: 'Location Verification',
    desc: 'GPS position vs registered delivery zone',
    run: () => ({ level: 'pass', label: '✅ Verified – Anna Nagar, Chennai', score: 5 }),
  },
  {
    icon: '🚶', title: 'Movement Analysis',
    desc: 'Rider movement detected during disruption window',
    run: () => ({ level: 'pass', label: '✅ Active movement confirmed', score: 0 }),
  },
  {
    icon: '👥', title: 'Group Fraud Detection',
    desc: 'Volume of simultaneous claims from same zone',
    run: () => {
      const flag = STATE.wii > 65;
      return {
        level: flag ? 'warn' : 'pass',
        label: flag ? '⚠️ High claim volume – under review' : '✅ Normal claim frequency',
        score: flag ? 20 : 5,
      };
    },
  },
  {
    icon: '🌧️', title: 'Environmental Consistency',
    desc: 'Claim matches live weather data for zone',
    run: () => {
      if (STATE.wii >= 40) return { level: 'pass', label: `✅ WII ${STATE.wii} confirms disruption`, score: 0 };
      if (STATE.wii > 0)   return { level: 'warn', label: `⚠️ WII ${STATE.wii} – mild conditions only`, score: 15 };
      return { level: 'fail', label: '❌ No disruption detected in zone', score: 40 };
    },
  },
  {
    icon: '📊', title: 'Earnings Pattern Analysis',
    desc: 'Claim amount vs 4-week historical average',
    run: () => {
      const gap   = Math.max(0, STATE.expectedEarnings - STATE.actualEarnings);
      const ratio = gap / (STATE.expectedEarnings || 1);
      const ok    = ratio < 0.8;
      return {
        level: ok ? 'pass' : 'warn',
        label: ok ? `✅ Claim is ${Math.round(ratio * 100)}% of weekly expected` : '⚠️ Claim amount unusually high',
        score: ok ? 5 : 25,
      };
    },
  },
];

function renderFraudChecks() {
  const container = document.getElementById('fraudChecks');
  if (!container) return;

  let total = 0;
  const html = FRAUD_RULES.map(rule => {
    const res = rule.run();
    total += res.score;
    return `
      <div class="fraud-row">
        <span class="fr-icon">${rule.icon}</span>
        <div class="fr-body">
          <div class="fr-title">${rule.title}</div>
          <div class="fr-desc">${rule.desc}</div>
        </div>
        <span class="fr-result ${res.level}">${res.label}</span>
      </div>`;
  });

  container.innerHTML = html.join('');
  STATE.fraudScore = Math.min(100, total);

  const fillEl = document.getElementById('fraudFill');
  if (fillEl) fillEl.style.width = STATE.fraudScore + '%';
  setText('fraudScoreNum', `${STATE.fraudScore} / 100`);

  const noteEl = document.getElementById('fraudNote');
  if (noteEl) {
    noteEl.textContent = STATE.fraudScore < 30
      ? '✅ Account looks clean. No suspicious activity detected.'
      : STATE.fraudScore < 60
      ? '⚠️ Minor anomalies detected. Claim is under soft review.'
      : '🚨 High fraud risk. Claim flagged for manual verification.';
  }
}

// ──────── PAYOUT ────────

function triggerPayout() {
  if (STATE.wii < 40) { showNotif('⚠️ Simulate a rain or storm event first (WII must be ≥ 40).'); return; }
  const upi = (document.getElementById('upiId')?.value || '').trim();
  if (!upi) { showNotif('⚠️ Please enter your UPI ID.'); return; }

  renderFraudChecks();
  if (STATE.fraudScore >= 70) { showNotif('🚨 Claim flagged. Please contact support.'); return; }

  const gap = Math.max(0, STATE.expectedEarnings - STATE.actualEarnings);
  const btn = document.getElementById('payoutBtn');
  if (btn) { btn.textContent = '⏳ Processing...'; btn.disabled = true; }

  setTimeout(() => {
    STATE.payoutDone = true;
    const resultEl = document.getElementById('payoutResult');
    if (resultEl) {
      resultEl.style.display = 'block';
      resultEl.innerHTML = `
        ✅ <strong>Payout Successful!</strong><br/>
        Amount: <strong>₹${fmt(gap)}</strong> &nbsp;·&nbsp;
        UPI: <strong>${upi}</strong><br/>
        Transaction ID: <strong>TXN${Date.now().toString().slice(-8)}</strong><br/>
        <span style="color:var(--muted);font-size:0.78rem">Typically credited within 2–10 minutes via UPI</span>
      `;
    }
    STATE.claims.unshift({
      id: `CLM00${STATE.claims.length + 1}`,
      date: 'Today',
      reason: payoutReason(),
      amount: gap,
      status: 'Processing',
      icon: payoutIcon(),
    });
    if (btn) btn.textContent = '✅ Payout Requested';
    showNotif(`✅ ₹${fmt(gap)} payout initiated to ${upi}`);
  }, 2000);
}

function payoutReason() {
  const { rainfall, aqi } = STATE.weather;
  if (rainfall > 80) return 'Heavy Rain / Storm Disruption';
  if (aqi > 200)     return 'High AQI / Air Quality Event';
  if (rainfall > 20) return 'Moderate Rain Disruption';
  return 'Weather Disruption';
}
function payoutIcon() {
  const { rainfall, aqi } = STATE.weather;
  if (rainfall > 80) return '⛈️';
  if (aqi > 200)     return '😷';
  if (rainfall > 20) return '🌧️';
  return '🌡️';
}

// ──────── CLAIMS ────────

function renderClaimsHistory() {
  const el = document.getElementById('claimsList');
  if (!el) return;

  if (!STATE.claims.length) {
    el.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem">No claims yet.</p>';
    return;
  }

  el.innerHTML = STATE.claims.map(c => `
    <div class="claim-row">
      <span class="claim-ico">${c.icon}</span>
      <div class="claim-bd">
        <div class="claim-title">${c.reason}</div>
        <div class="claim-meta">${c.id} · ${c.date}</div>
      </div>
      <div style="text-align:right">
        <div class="claim-amt">₹${fmt(c.amount)}</div>
        <div class="claim-st" style="color:${c.status === 'Paid' ? 'var(--green)' : 'var(--yellow)'}">
          ${c.status === 'Paid' ? '✅' : '⏳'} ${c.status}
        </div>
      </div>
    </div>`).join('');
}

// ──────── EARNINGS CHART ────────

function renderEarningsChart() {
  const container = document.getElementById('earningsChart');
  if (!container) return;

  const weeks = [
    { label: 'W1', exp: 2100, act: 1900 },
    { label: 'W2', exp: 2300, act: 2100 },
    { label: 'W3', exp: 2200, act: 1500 },
    { label: 'W4', exp: 2400, act: 2200 },
    { label: 'W5', exp: 2350, act: 2050 },
    { label: 'W6', exp: STATE.expectedEarnings, act: STATE.actualEarnings },
  ];

  const maxV = Math.max(...weeks.map(w => w.exp));
  const maxH = 110;

  container.innerHTML = weeks.map(w => `
    <div class="chart-group">
      <div class="chart-pair">
        <div class="cbar exp" style="height:${Math.round(w.exp / maxV * maxH)}px"></div>
        <div class="cbar act" style="height:${Math.round(w.act / maxV * maxH)}px"></div>
      </div>
      <div class="chart-wk">${w.label}</div>
    </div>`).join('');
}

// ──────── NOTIFICATIONS ────────

let notifTimer = null;
function showNotif(msg, duration = 6000) {
  const banner = document.getElementById('notifBanner');
  const text   = document.getElementById('notifText');
  if (!banner || !text) return;
  text.textContent = msg;
  banner.style.display = 'flex';
  clearTimeout(notifTimer);
  notifTimer = setTimeout(() => { banner.style.display = 'none'; }, duration);
}
function closeNotif() {
  const banner = document.getElementById('notifBanner');
  if (banner) banner.style.display = 'none';
}
function scrollToPayout() {
  const el = document.getElementById('payoutSection');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ──────── HELPERS ────────

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
function fmt(n) {
  return Number(n).toLocaleString('en-IN');
}

// ──────── BOOT ────────

document.addEventListener('DOMContentLoaded', () => {
  // Login page
  const loginId = document.getElementById('loginId');
  if (loginId) {
    document.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
  }

  // Dashboard page
  if (document.getElementById('section-dashboard')) {
    initDashboard();
  }
});
