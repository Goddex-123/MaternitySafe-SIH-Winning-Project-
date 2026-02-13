# 🤱 MaternitySafe - SIH Winning Project

![Status](https://img.shields.io/badge/Status-SIH_Winner-gold)
![Domain](https://img.shields.io/badge/Domain-HealthTech%20%7C%20IoT%20%7C%20AI-blue)
![License](https://img.shields.io/badge/license-MIT-green)

> **Award-winning Smart India Hackathon (SIH) solution for real-time maternal health monitoring and risk assessment.**

---

## 🏆 Achievement Unlocked
**Winner, Smart India Hackathon (SIH)**
This project was recognized for its innovative approach to reducing maternal mortality rates in rural India through affordable IoT and AI intervention.

---

## 📋 Project Overview

**MaternitySafe** is an integrated IoT-Cloud ecosystem designed to monitor vital health parameters of pregnant women in remote areas. It bridges the gap between rural patients and urban doctors by autonomously tracking vitals and flagging high-risk anomalies (e.g., Preeclampsia symptoms).

### Key Features
- **IoT Wearable Integration**: Real-time logging of Heart Rate, SpO2, and Body Temperature.
- **AI-Driven Risk Scoring**: Random Forest classifier to predict risk levels (Low/Medium/High) based on vitals and historical data.
- **Emergency Alert System**: Automated SMS/WhatsApp notifications to nearest ASHA workers and family members upon anomaly detection.
- **Doctor's Dashboard**: Web portal for remote consultation and patient history visualization.

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Edge Layer
        Wearable[IoT Wearable Device] --> MCU[ESP32 Microcontroller]
        MCU --> MQTT[MQTT Broker]
    end

    subgraph Cloud Layer
        MQTT --> Ingest[Data Ingestion Service]
        Ingest --> DB[(MongoDB Atlas)]
        
        DB --> ML[AI Risk Engine]
        ML --> Alert[Alert Service]
    end

    subgraph Application Layer
        DB --> API[REST API]
        API --> Web[Doctor Portal (React)]
        API --> App[User App (Flutter)]
        Alert --> SMS[Twilio/GSM Gateway]
    end
```

---

## 🔮 Future Roadmap & Migration

This repository is currently being restructured for open-source contribution.

- [ ] **Hardware Designs**: Open-sourcing PCB layouts and STL files for the wearable case.
- [ ] **Dataset**: Releasing anonymized vital sign datasets for research.
- [ ] **Mobile App**: Porting the legacy Android codebase to Flutter for cross-platform support.

---

## 👨‍💻 Author

**Soham Barate (Goddex-123)**
*Senior AI Engineer & Data Scientist*

[LinkedIn](https://linkedin.com/in/soham-barate-7429181a9) | [GitHub](https://github.com/goddex-123)
