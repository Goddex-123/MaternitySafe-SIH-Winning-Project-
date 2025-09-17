/**
 * Seed Demo Data - MaternitySafe SIH 2024
 * This script populates the database with realistic demo data for judges
 */

const hospitalService = require('../services/hospitalService');
const referralService = require('../services/referralService');
const riskEngine = require('../services/riskEngine');

/**
 * Seed all demo data
 */
async function seedAll() {
  console.log('🌱 Seeding demo data for SIH presentation...');
  
  try {
    // Initialize services
    await hospitalService.init();
    await referralService.init();
    
    // Seed demo referrals
    await seedDemoReferrals();
    
    console.log('✅ Demo data seeded successfully!');
    console.log('📊 Ready for judge demonstration');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

/**
 * Create realistic demo referrals
 */
async function seedDemoReferrals() {
  console.log('Creating demo referrals...');
  
  const demoReferrals = [
    {
      scenario: 'Anemia Case',
      patientData: {
        name: 'Priya Sharma',
        age: 25,
        familyPhone: '+91-9876543210'
      },
      assessment: {
        gestationalAge: 32,
        bloodPressure: { systolic: 118, diastolic: 78 },
        bleeding: 'none',
        symptoms: ['dizziness', 'back_pain'],
        labResults: { hemoglobin: '8.5', proteinuria: 'negative' },
        location: { lat: 27.0238, lng: 74.2179 }
      },
      ashaId: 'ASHA_001_RAJGADH',
      sourceLocation: {
        lat: 27.0238,
        lng: 74.2179,
        address: 'Rajgadh Village Health Center, Rajasthan'
      },
      targetHospitalId: 'hosp_001',
      notes: 'Moderate anemia case - routine follow-up recommended'
    },
    
    {
      scenario: 'Pre-eclampsia Emergency',
      patientData: {
        name: 'Sunita Devi',
        age: 28,
        familyPhone: '+91-8765432109'
      },
      assessment: {
        gestationalAge: 36,
        bloodPressure: { systolic: 165, diastolic: 105 },
        bleeding: 'none',
        symptoms: ['severe_headache', 'vision_changes', 'swelling'],
        labResults: { hemoglobin: '11.2', proteinuria: 'moderate' },
        location: { lat: 19.7515, lng: 75.7139 }
      },
      ashaId: 'ASHA_002_ALWAR',
      sourceLocation: {
        lat: 19.7515,
        lng: 75.7139,
        address: 'Primary Health Center, Maharashtra'
      },
      targetHospitalId: 'hosp_002',
      notes: 'HIGH RISK: Pre-eclampsia symptoms - urgent referral needed'
    },
    
    {
      scenario: 'Obstructed Labor Emergency',
      patientData: {
        name: 'Kavita Kumari',
        age: 19,
        familyPhone: '+91-7654321098'
      },
      assessment: {
        gestationalAge: 39,
        bloodPressure: { systolic: 145, diastolic: 95 },
        bleeding: 'moderate',
        symptoms: ['severe_abdominal_pain', 'contractions', 'reduced_fetal_movement'],
        labResults: { hemoglobin: '9.8', proteinuria: 'trace' },
        location: { lat: 26.8467, lng: 80.9462 }
      },
      ashaId: 'ASHA_003_UTTAR_PRADESH',
      sourceLocation: {
        lat: 26.8467,
        lng: 80.9462,
        address: 'Rural Health Sub-Center, Uttar Pradesh'
      },
      targetHospitalId: 'hosp_003',
      notes: 'EMERGENCY: Possible obstructed labor - immediate tertiary care required'
    }
  ];
  
  for (const demo of demoReferrals) {
    try {
      // Calculate risk assessment
      const riskAssessment = riskEngine.calculateRisk(demo.assessment);
      
      // Create referral
      const referralData = {
        patientData: demo.patientData,
        riskAssessment,
        ashaId: demo.ashaId,
        sourceLocation: demo.sourceLocation,
        targetHospitalId: demo.targetHospitalId,
        notes: demo.notes
      };
      
      const referral = await referralService.createReferral(referralData);
      
      console.log(`✅ Created demo referral: ${demo.scenario}`);
      console.log(`   Referral Code: ${referral.referralCode}`);
      console.log(`   Risk Level: ${riskAssessment.riskLevel}`);
      console.log(`   Priority: ${referral.priority}`);
      console.log('');
      
    } catch (error) {
      console.error(`❌ Failed to create ${demo.scenario}:`, error);
    }
  }
}

/**
 * Create demo ASHA profiles
 */
function createDemoASHAs() {
  return [
    {
      id: 'ASHA_001_RAJGADH',
      name: 'Meera Devi',
      phone: '+91-9876543210',
      location: {
        lat: 27.0238,
        lng: 74.2179,
        address: 'Rajgadh Village, Alwar District, Rajasthan'
      },
      experience: '5 years',
      patients: 245,
      certifications: ['Basic Maternal Care', 'Emergency Response'],
      language: 'Hindi, Rajasthani'
    },
    
    {
      id: 'ASHA_002_ALWAR',
      name: 'Kamala Sharma',
      phone: '+91-8765432109',
      location: {
        lat: 27.5678,
        lng: 76.6252,
        address: 'Alwar Rural Block, Rajasthan'
      },
      experience: '3 years',
      patients: 189,
      certifications: ['Maternal Health', 'Child Care'],
      language: 'Hindi, English'
    },
    
    {
      id: 'ASHA_003_UTTAR_PRADESH',
      name: 'Sushila Singh',
      phone: '+91-7654321098',
      location: {
        lat: 26.8467,
        lng: 80.9462,
        address: 'Rural Block, Uttar Pradesh'
      },
      experience: '7 years',
      patients: 312,
      certifications: ['Advanced Maternal Care', 'Community Health'],
      language: 'Hindi, Awadhi'
    }
  ];
}

/**
 * Get demo statistics for presentation
 */
function getDemoStatistics() {
  return {
    totalAssessments: 1247,
    highRiskCases: 89,
    emergencyReferrals: 23,
    successfulReferrals: 1198,
    avgResponseTime: 2.3, // minutes
    livesImpacted: 1247,
    hospitalsConnected: 3,
    ashasActive: 3,
    timesSaved: {
      totalMinutesSaved: 52635, // (45-3) * 1247 assessments
      avgTimeSavedPerCase: 42, // minutes
      productivityGain: '87.6%'
    },
    impactMetrics: {
      inappropriateReferralsReduced: '39%',
      emergencyResponseImproved: '84%',
      maternalSatisfactionScore: 4.7,
      hospitalEfficiencyGain: '23%'
    }
  };
}

// Export functions for use in other modules
module.exports = {
  seedAll,
  seedDemoReferrals,
  createDemoASHAs,
  getDemoStatistics
};

// Run seeding if called directly
if (require.main === module) {
  seedAll()
    .then(() => {
      console.log('🎯 Demo data ready for SIH presentation!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}
