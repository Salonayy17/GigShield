# ⚡ GigShield — AI Parametric Income Insurance for Gig Workers

---

## Inspiration

India has **15 million gig delivery workers** — the people who bring your Zomato biryani at midnight, your Zepto groceries in 10 minutes, your Amazon package on a scorching Tuesday afternoon. They are the backbone of a ₹2.3 trillion gig economy.

But here's what nobody talks about: **when it rains, they don't earn.**

A single bad monsoon week can wipe out 40–60% of a delivery worker's income. They can't work safely in a storm. Orders dry up. Restaurants close. And yet — there is no insurance product in India that covers this specific, measurable, repeatable problem.

We asked ourselves: _What if insurance didn't require a claim form? What if a payout could happen before the worker even realized they were owed one?_

That question became GigShield. The idea of **parametric insurance** — where payouts are triggered by objective, verifiable conditions rather than subjective loss assessments — felt like exactly the right tool for exactly the right problem. You don't file a claim. The weather files it for you.

> _"The best insurance is one you never have to think about."_

We were also inspired by how parametric models have worked in agriculture (crop insurance triggered by rainfall data) and aviation (flight delay insurance triggered by air traffic data) — and realized nobody had applied this elegantly to the urban gig economy. That gap was our starting point.

---

## What it does

GigShield is a **weekly income protection platform** for gig delivery workers. It does four things, end to end:

**1. Monitors environmental disruption in real time**
GigShield computes a custom **Weather Impact Index (WII)** — a single 0–100 score derived from rainfall, AQI, temperature, and wind speed — updated continuously for each worker's delivery zone.

$$WII = \underbrace{\frac{R}{150} \times 40}_{\text{Rainfall}} + \underbrace{\max\!\left(0,\, \frac{A - 100}{300}\right) \times 25}_{\text{AQI}} + \underbrace{\max\!\left(0,\, \frac{T - 38}{10}\right) \times 15}_{\text{Extreme Heat}} + \underbrace{\frac{W}{80} \times 20}_{\text{Wind}}$$

where \\( R \\) = rainfall in mm, \\( A \\) = AQI value, \\( T \\) = temperature in °C, \\( W \\) = wind speed in km/h, and the total is capped at **100**.

**2. Predicts what the worker should have earned**
An AI earnings predictor computes the expected weekly income using historical averages, weather penalties, and zone-level demand multipliers:

$$\hat{E} = \max\!\left(500,\; \bar{E}_{\text{base}} - \underbrace{\bar{E}_{\text{base}} \cdot \frac{WII}{100} \cdot 0.35}_{\text{weather penalty}} + \underbrace{D_{\text{zone}}}_{\text{demand bonus}}\right)$$

**3. Pays the difference automatically**
If \\( WII \geq 40 \\) and the worker earned less than predicted, the income gap is transferred to their UPI within minutes — no forms, no calls, no waiting:

$$\text{Payout} = \max\!\left(0,\; \hat{E} - E_{\text{actual}}\right)$$

**4. Prices risk dynamically every week**
Premium is never fixed. It updates each Sunday based on a composite risk score:

$$\rho = \min(100,\; 0.5 \cdot WII + 0.3 \cdot Z + 0.2 \cdot S)$$

$$P_{\text{weekly}} = \min\!\left(50,\; 20 + \left\lfloor\frac{\rho}{100} \times 30\right\rfloor\right) \quad \text{(in ₹)}$$

where \\( Z \\) = zone risk score and \\( S \\) = seasonal risk factor. Plans range from **₹20 to ₹50/week**.

---

## How we built it

We made a deliberate choice early: **keep the stack ruthlessly simple**. A hackathon prototype that works beats an over-engineered one that doesn't.

### Frontend — Pure HTML + CSS + Vanilla JS

No React. No Vue. No build tools. Just three files that open in any browser, anywhere, instantly.

The UI was designed around a **warm saffron + cream + ink** palette — intentionally avoiding the cold blues and purples of generic fintech UIs. We wanted something that felt _Indian_, trustworthy, and approachable for a delivery worker checking their payout on a phone.

```
index.html      ← Login page + Demo Mode entry
dashboard.html  ← Full interactive dashboard
style.css       ← 500 lines of hand-written CSS
app.js          ← All logic: WII, AI, fraud, payout, slideshow
```

The **demo slideshow** was the most important frontend decision. Judges at a hackathon have 3 minutes per project. We built a 7-slide auto-advancing overlay that explains every feature — with the real live dashboard running underneath it, ready the moment they click "Enter Dashboard."

### Backend — Node.js + Express

```javascript
// The WII formula in code — clean, testable, explainable
function calculateWII({ rainfall = 0, aqi = 80, temp = 30, wind = 10 }) {
  const rainScore = Math.min(40, (rainfall / 150) * 40);
  const aqiScore  = Math.min(25, Math.max(0, (aqi - 100) / 300) * 25);
  const tempScore = Math.min(15, Math.max(0, (temp - 38) / 10) * 15);
  const windScore = Math.min(20, (wind / 80) * 20);
  return Math.round(rainScore + aqiScore + tempScore + windScore);
}
```

Seven REST endpoints handle auth, subscriptions, earnings prediction, weather checks, payout requests, and claims history. The fraud detection system runs entirely server-side on every `/payout` call — five independent rule checks that produce a fraud score before any money moves.

### AI — Rule-Based, Explainable Intelligence

We made a conscious decision **not** to use a black-box ML model. For insurance — a domain where regulators and workers both need to understand _why_ a payout was or wasn't issued — explainability is more valuable than marginal accuracy. Every number GigShield produces can be traced back to a formula. Every decision has a reason.

The fraud detection layer runs five checks in parallel:

| Layer | Logic |
|-------|-------|
| Location | GPS zone match vs registered zone |
| Movement | Motion activity during claim window |
| Group Fraud | Claim volume per zone per hour |
| Environmental | WII must confirm real disruption |
| Amount Sanity | Claim ≤ 85% of weekly expected |

A weighted fraud score \\( F = \sum_{i} w_i \cdot \mathbb{1}[\text{check}_i \text{ fails}] \\) determines verdict: **Clean** (< 30), **Review** (30–69), or **Flagged** (≥ 70).

---

## Challenges we ran into

**1. Designing the WII formula from scratch**
There's no standard "weather impact on delivery earnings" index. We had to reason from first principles: which variables matter, how much do they interact, and how do we normalize them into a single actionable number? Getting the weights right — so that a moderate rainstorm scores ~45 and a cyclone scores ~80 — took several iterations of manual calibration and sanity-checking against real Chennai weather events.

**2. The cold start problem for earnings prediction**
A new worker has no earnings history. Our predictor uses a 4-week rolling average, which means week 1 through week 4 return unreliable predictions. We solved this with a city-level and platform-level fallback average — if the worker has fewer than 2 weeks of history, we use the median earnings for their platform + city combination as the baseline.

**3. Fraud detection without real GPS**
In production, fraud detection relies on verified GPS data, platform API call logs, and real-time order data. In a hackathon prototype, none of that exists. We had to design a system that was _structurally_ correct — five real checks that would work with real data — while acknowledging the demo uses mocked inputs. The challenge was making it feel real and rigorous even when the underlying signals are simulated.

**4. Making the demo work for judges who aren't technical**
Early versions of the dashboard required understanding what WII meant before you could appreciate the payout flow. We restructured the entire demo experience around the slideshow: concepts first, then live interaction. This meant building essentially two UX layers — the educational overlay and the functional dashboard — and making the transition between them seamless.

**5. Keeping the UI both beautiful and fast**
We set ourselves the constraint of _no CSS frameworks, no JS libraries_. Every animation, every gradient, every responsive breakpoint is hand-written. The saffron theme looks deceptively simple — but the warm palette required careful contrast ratios to remain accessible, and the SVG risk meter arc required manual trigonometry to animate correctly.

---

## Accomplishments that we're proud of

- **A complete, working prototype in under 48 hours** — login, dashboard, AI predictions, fraud detection, payout simulation, and a 7-slide demo mode. Open `index.html` and it just _works_.

- **The WII formula** — a novel, domain-specific index that compresses four environmental variables into one actionable insurance trigger. Simple enough for a worker to understand ("your rain score is 38/40"), rigorous enough for an actuary to audit.

- **Zero-dependency frontend** — no npm, no build step, no framework. A delivery worker on a ₹8,000 Android phone with a slow 4G connection can use this. That constraint forced us to write better, leaner code.

- **The demo slideshow architecture** — a self-contained educational layer that teaches the product _while running the real product underneath it_. We're genuinely proud of this UX pattern.

- **Explainable AI by design** — every number on the dashboard can be traced to a formula. The fraud score, the premium, the payout amount — all derivable, all auditable. In a regulated industry like insurance, this matters enormously.

- **The pricing model stays affordable under stress** — even in a worst-case scenario (WII = 100, flood zone, peak monsoon), the premium caps at ₹50/week. We made sure the model never price-gouges the people it's supposed to protect.

---

## What we learned

**Parametric insurance is underleveraged in emerging markets.** The concept has been applied to crops and flights, but the urban gig economy — where disruption is frequent, measurable, and localized — is a perfect fit that nobody has seriously productized in India yet.

**Explainability is a feature, not a fallback.** We initially considered using a proper ML regression model for earnings prediction. We abandoned it not because it wouldn't work, but because it would produce a number without a story. When a worker asks "why did I get ₹480 instead of ₹600?", they deserve an answer. Rule-based systems, designed carefully, give you that.

**Demo design is product design.** The best product in the world loses a hackathon if judges don't understand it in 90 seconds. Building the slideshow wasn't a nice-to-have — it was as important as building the payout engine. The experience of understanding the product _is_ the product, at this stage.

**The cold start problem is everywhere.** Any data-driven system that depends on user history faces it. We encountered it in earnings prediction (no history = no baseline), fraud detection (no past behavior = no behavioral anomaly), and risk pricing (no claims history = no zone calibration). Designing graceful fallbacks — city medians, platform averages, conservative defaults — is unglamorous but essential work.

**Simplicity compounds.** Pure HTML + CSS + JS felt like a constraint. It turned out to be a superpower. No build pipeline meant no build failures. No dependencies meant nothing to break. Every hour we saved _not_ fighting tooling was an hour we spent making the product better.

---

## What's next for GigShield

The prototype proves the concept. Here's the path to a real product:

**Near-term (0–6 months)**

- **Live weather integration** — Replace simulated weather with OpenWeatherMap + IMD (India Meteorological Department) real-time feeds, updated hourly per micro-zone.
- **UPI payment integration** — Integrate Razorpay or NPCI's UPI APIs for actual money movement. The payout flow is already designed for it — it's a one-line API swap.
- **IRDAI sandbox registration** — Apply for the Insurance Regulatory and Development Authority of India's regulatory sandbox to legally offer parametric insurance products.

**Medium-term (6–18 months)**

- **Platform partnerships** — Negotiate data-sharing agreements with Zomato, Swiggy, and Zepto to auto-pull earnings data, eliminating manual logging entirely.
- **ML earnings model** — Train a proper gradient boosting model on anonymised, aggregated worker earnings data segmented by city, zone, platform, and weather conditions. The formula becomes the fallback; the model becomes the primary predictor.
- **Mobile app** — A lightweight React Native app with push notifications: _"Heavy rain detected in Anna Nagar. Your coverage is active."_

**Long-term (18+ months)**

$$\text{TAM} = \underbrace{15M}_{\text{gig workers}} \times \underbrace{₹35}_{\text{avg weekly premium}} \times \underbrace{52}_{\text{weeks}} \approx \textbf{₹27{,}300 \text{ Cr/year}}$$

- **Expand coverage triggers** — Beyond weather: traffic disruptions, city-wide events, platform outages.
- **Expand geographies** — Southeast Asia (Indonesia, Philippines) has similar gig economy structures and weather volatility profiles.
- **Reinsurance layer** — Partner with global reinsurers (Swiss Re, Munich Re) to back catastrophic events like cyclones, where claim volumes spike simultaneously across an entire city.
- **B2B distribution** — Let Zomato and Swiggy offer GigShield as a benefit in their partner onboarding. Worker pays ₹35. Platform subsidizes ₹15. Everyone wins.

---

_GigShield — Because every delivery hero deserves a safety net._ ⚡
