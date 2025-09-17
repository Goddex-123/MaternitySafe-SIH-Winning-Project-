# MaternitySafe Demo Scenarios

## Scenario A: Early Detection (Anemia) - MEDIUM Risk
**Duration: 45 seconds**
**Outcome: Educational intervention + monitoring**

### Patient Profile
- **Name:** Priya Sharma (optional for demo)
- **Age:** 25
- **Gestational Age:** 32 weeks
- **Location:** Rural Clinic, Rajasthan

### Assessment Data
```json
{
  "gestationalAge": 32,
  "bloodPressure": {
    "systolic": 118,
    "diastolic": 78
  },
  "bleeding": "none",
  "symptoms": ["dizziness", "back_pain"],
  "labResults": {
    "hemoglobin": "8.5",
    "proteinuria": "negative"
  },
  "location": {
    "lat": 27.0238,
    "lng": 74.2179
  }
}
```

### Expected Risk Assessment
- **Risk Score:** 8
- **Risk Level:** MEDIUM
- **Risk Factors:** 
  - Moderate anemia: Hb 8.5 g/dL
  - Dizziness
  - Back pain
- **Recommendations:**
  - Iron supplementation required
  - Increase monitoring frequency
  - Schedule follow-up within 1-2 weeks

### Demo Flow
1. ASHA opens app → "New Assessment"
2. Fills form with patient data
3. Submits assessment → MEDIUM risk appears
4. Shows recommendation for iron supplements
5. No hospital referral needed
6. Educational materials provided

---

## Scenario B: Pre-eclampsia Emergency - HIGH Risk  
**Duration: 60 seconds**
**Outcome: Urgent hospital referral + real-time tracking**

### Patient Profile
- **Name:** Sunita Devi
- **Age:** 28
- **Gestational Age:** 36 weeks
- **Location:** PHC, Maharashtra

### Assessment Data
```json
{
  "gestationalAge": 36,
  "bloodPressure": {
    "systolic": 165,
    "diastolic": 105
  },
  "bleeding": "none",
  "symptoms": ["severe_headache", "vision_changes", "swelling"],
  "labResults": {
    "hemoglobin": "11.2",
    "proteinuria": "moderate"
  },
  "location": {
    "lat": 19.7515,
    "lng": 75.7139
  }
}
```

### Expected Risk Assessment
- **Risk Score:** 18
- **Risk Level:** HIGH
- **Risk Factors:**
  - Hypertension (high): 165/105 mmHg
  - Severe headache
  - Vision changes
  - Swelling
  - Proteinuria: moderate
- **Required Capabilities:** 
  - emergency_department
  - obgyn_specialist
  - operating_theater
- **Urgency:** < 24 hours

### Demo Flow
1. ASHA enters high-risk data
2. System shows HIGH RISK alert
3. Auto-recommends District Hospital (15 km away)
4. ASHA clicks "Create Referral"
5. SMS + QR code generated instantly
6. Hospital dashboard receives real-time notification
7. Hospital accepts referral
8. Ambulance dispatch simulated
9. Real-time tracking shows ETA: 35 minutes

---

## Scenario C: Obstructed Labor Emergency - EMERGENCY Risk
**Duration: 90 seconds** 
**Outcome: Emergency transfer + tertiary care redirect**

### Patient Profile
- **Name:** Kavita Kumari  
- **Age:** 19
- **Gestational Age:** 39 weeks
- **Location:** Remote Village, Uttar Pradesh

### Assessment Data
```json
{
  "gestationalAge": 39,
  "bloodPressure": {
    "systolic": 145,
    "diastolic": 95
  },
  "bleeding": "moderate",
  "symptoms": ["severe_abdominal_pain", "contractions", "reduced_fetal_movement"],
  "labResults": {
    "hemoglobin": "9.8",
    "proteinuria": "trace"
  },
  "location": {
    "lat": 26.8467,
    "lng": 80.9462
  }
}
```

### Expected Risk Assessment
- **Risk Score:** 28
- **Risk Level:** EMERGENCY  
- **Risk Factors:**
  - Hypertension (high): 145/95 mmHg
  - Bleeding: moderate
  - Severe abdominal pain
  - Contractions
  - Reduced fetal movement
- **Required Capabilities:**
  - emergency_department
  - obgyn_specialist  
  - operating_theater
  - blood_bank
  - emergency_surgery
- **Urgency:** < 1 hour

### Demo Flow
1. ASHA enters critical symptoms
2. EMERGENCY ALERT appears immediately
3. System recommends Medical College Hospital (45 km)
4. Shows "CALL AMBULANCE NOW" button
5. Creates priority referral with QR code
6. Hospital dashboard shows red-priority alert
7. First hospital (CHC) redirects to tertiary center
8. Tertiary hospital accepts
9. Emergency ambulance with ETA tracking
10. Family notification SMS sent
11. Continuous monitoring dashboard active

---

## Technical Demo Features

### Real-time Capabilities
- **Live Updates:** Hospital dashboard updates instantly via Socket.IO
- **Multi-device:** Show ASHA phone + hospital dashboard simultaneously  
- **Offline Support:** Demonstrate form saving when "offline"
- **Sync:** Show data syncing when connection restored

### Smart Routing Features
- **Capability Matching:** System only shows hospitals with required facilities
- **Distance Calculation:** Real-time ETA based on location
- **Availability Check:** Mock bed/OT availability status
- **Redirect Logic:** If primary hospital full, auto-suggests alternatives

### Notification System
- **SMS Generation:** Show actual SMS format with referral details
- **QR Codes:** Scannable codes with patient data
- **Family Alerts:** Automated family notification system
- **Status Updates:** Progress tracking for ASHA

## Demo Setup Instructions

### Prerequisites
```bash
# Backend running on port 5000
cd backend && npm run dev

# Frontend running on port 3000  
cd frontend && npm start

# Seed demo data
npm run seed
```

### Demo Data
- **3 Hospitals:** PHC, District Hospital, Medical College
- **Mock ASHAs:** Pre-configured ASHA profiles
- **Test Coordinates:** Real locations in India
- **Ambulance Simulation:** Animated movement on map

### Demo Script (4 minutes total)

**0:00-0:20** - Problem Statement
- Show maternal mortality statistics
- Explain referral delays in rural areas

**0:20-1:00** - Scenario A (Anemia)
- Low-complexity case, educational focus

**1:00-2:00** - Scenario B (Pre-eclampsia) 
- High-risk emergency with successful referral

**2:00-3:30** - Scenario C (Obstructed Labor)
- Critical emergency with hospital coordination

**3:30-4:00** - Impact & Roadmap
- Show analytics: time saved, lives potentially saved
- Future integrations and scaling plans

### Judging Criteria Alignment

✅ **Innovation:** AI-driven risk assessment + smart referrals  
✅ **Technical Excellence:** PWA, offline-first, real-time updates  
✅ **Social Impact:** Direct maternal health improvement  
✅ **Scalability:** Works with existing infrastructure  
✅ **Feasibility:** Built with proven technologies  
✅ **User Experience:** Simple forms, clear recommendations

### Demo Tips

1. **Practice Transitions:** Smooth flow between scenarios
2. **Backup Plans:** Screenshots if live demo fails
3. **Real Data:** Use actual Indian locations and statistics
4. **Emotional Connection:** Start with real patient stories
5. **Technical Depth:** Be ready to explain risk algorithms
6. **Impact Focus:** End with potential lives saved

### Demo Resources

- **Slides:** 5-slide deck in `/docs/presentation.pptx`
- **Video Backup:** 3-minute recorded demo in `/demo/video/`
- **Screenshots:** Key screens in `/demo/screenshots/`
- **Test Data:** JSON files in `/demo/data/`
