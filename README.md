# MaternitySafe — Community Prenatal Risk Detection & Smart Referral

**Tagline:** Early detection + fast referrals to reduce maternal & neonatal risks in resource-limited areas.

## 🚀 Quick Start

```bash
# Backend
cd backend
npm install
npm start

# Frontend
cd frontend
npm install
npm start
```

## Problem Statement

In many parts of India pregnant women miss early detection of dangerous signs (pre-eclampsia, hemorrhage risk, anemia, fetal distress) because community health workers (ASHAs/ANMs) and small clinics lack quick screening tools, risk-triaging, and a smooth referral path to the nearest capable facility. That causes preventable maternal & neonatal morbidity and mortality.

## Solution Overview

A lightweight PWA + offline-capable mobile app for ASHAs/ANMs that: collects simple structured data + measurements, computes an evidence-based risk score, recommends next steps (home care / urgent referral), finds the nearest capable facility (beds/OT/OBGYN on-call), generates a referral packet (SMS/IVR + QR), and gives a dispatcher/hospital dashboard to accept/refuse referrals — reducing referral delays and inappropriate transfers.

## Why This Wins SIH

- ✅ Clear public health impact (maternal mortality)
- ✅ Feasible to build in a hackathon (rule-based triage + simple inventory mock)
- ✅ Demoable, emotional, and reproducible
- ✅ Scalable & privacy-minded: store minimal PII, encrypt transport, offline-first

## MVP Features

### 1. ASHA App (PWA/Mobile)
- Simple form (gestational age, BP, urine test results, fetal movement, bleeding, symptoms)
- Offline-first + local storage
- Progressive Web App capabilities

### 2. Risk Engine
- Rule-based scoring (e.g., BP >140/90 = high risk; bleeding = emergency)
- Produces Low / Medium / High risk levels
- Evidence-based clinical rules

### 3. Referral Generator
- Recommends nearest hospital with maternity capability
- Generates SMS + QR referral code containing minimal case info
- Smart routing based on hospital capabilities

### 4. Hospital Dashboard
- Shows incoming referrals
- Bed/OT/OB availability (mock)
- Accept / Redirect functionality

### 5. Dispatcher Flow
- One-click ambulance request (simulated)
- Family notification system

### 6. Demo Mode
- Seed multiple ASHA devices and hospitals
- Run "saved mother" scenarios

## Tech Stack

- **Frontend:** React PWA (offline-capable)
- **Backend:** Node.js + Express
- **Database:** SQLite/Postgres (Firebase for rapid prototyping)
- **Real-time:** Socket.IO
- **Maps:** OpenStreetMap + simple distance calculations
- **Notifications:** Twilio SMS
- **Deployment:** Vercel/Render + GitHub Pages

## Architecture

```
ASHA PWA (offline) ↔ sync → Backend (Triage + Referral engine) ↔ Hospital Dashboard + Dispatcher → Notifications (SMS/IVR) + Simulated Ambulance
```

## 48-Hour Hackathon Plan

### Team Roles (3 people recommended)
1. **Frontend Developer:** PWA + UI/UX
2. **Backend Developer:** API + business logic  
3. **Demo/Data Specialist:** scenarios + documentation + slides

### Timeline

**Hours 0-6: Foundation**
- Core data model + UI skeleton
- Firebase project setup
- Basic ASHA form UI

**Hours 6-12: Core Logic**
- Risk engine implementation
- Hospital database seeding
- Referral creation API

**Hours 12-18: Integration**
- Hospital dashboard
- SMS notifications
- QR code generation

**Hours 18-24: Offline & Routing**
- PWA offline capabilities
- Nearest hospital logic
- ETA calculations

**Hours 24-32: Real-time Features**
- Socket.IO implementation
- Live referral updates
- Ambulance simulation

**Hours 32-40: Demo Scenarios**
- Create 3 test scenarios
- Automated playthrough scripts
- Demo data seeding

**Hours 40-46: Polish**
- Documentation
- Architecture diagrams
- Presentation materials

**Hours 46-48: Final Testing**
- Demo dry runs
- Bug fixes
- Pitch preparation

## Demo Script (2-4 minutes)

1. **20s:** Problem + emotional statistic
2. **30s:** ASHA app demo - high-risk detection
3. **30s:** Smart referral generation + SMS/QR
4. **30s:** Hospital dashboard - real-time acceptance
5. **20s:** Analytics and impact metrics
6. **10s:** Roadmap and scaling potential

## Deliverables

- [ ] GitHub repository with complete code
- [ ] Live demo deployment OR video walkthrough
- [ ] 5-slide pitch deck
- [ ] Technical documentation
- [ ] Demo scenarios and test data

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- Git

### Installation

1. Clone the repository
```bash
git clone <repo-url>
cd SIH_Winning_Project
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

4. Set up environment variables
```bash
cp backend/.env.example backend/.env
# Edit .env with your configuration
```

5. Run the application
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm start
```

## Demo Scenarios

### Scenario A: Early Detection (Anemia)
- Moderate risk case
- Educational intervention
- Home care recommendations

### Scenario B: Pre-eclampsia Emergency
- High-risk referral
- Urgent hospital transfer
- Real-time tracking

### Scenario C: Obstructed Labor
- Emergency case
- Tertiary care redirect
- Ambulance coordination

## Impact Metrics

- **Primary:** Reduction in referral decision time
- **Secondary:** Appropriate referral rate
- **Tertiary:** Simulated maternal outcome improvements

## Future Roadmap

- Integration with government health APIs
- Predictive ML models for complications
- IVR support for low-literacy users
- Advanced analytics dashboard
- Multi-language support

## Team

- **Frontend Lead:** [Your Name]
- **Backend Lead:** [Team Member]
- **Product/Demo:** [Team Member]

## Contact

- **GitHub:** [Your GitHub Link]
- **Demo:** [Deployed Link]
- **Email:** [Contact Email]

---

*Built for Smart India Hackathon 2024 - Transforming maternal healthcare through technology*
