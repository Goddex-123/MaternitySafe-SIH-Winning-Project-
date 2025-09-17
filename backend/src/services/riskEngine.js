/**
 * MaternitySafe Risk Engine
 * Evidence-based maternal health risk assessment
 */

// Risk scoring weights and thresholds
const RISK_FACTORS = {
  // Vital signs (high priority)
  bloodPressure: {
    weight: 3,
    thresholds: {
      systolic: { normal: 120, elevated: 130, high: 140, severe: 180 },
      diastolic: { normal: 80, elevated: 85, high: 90, severe: 110 }
    }
  },
  
  // Bleeding (emergency indicator)
  bleeding: {
    weight: 5,
    types: {
      none: 0,
      spotting: 1,
      light: 2,
      moderate: 3,
      heavy: 4,
      severe: 5
    }
  },
  
  // Gestational age risks
  gestationalAge: {
    weight: 2,
    risks: {
      veryEarly: { min: 0, max: 20, score: 3 },    // < 20 weeks
      early: { min: 20, max: 28, score: 2 },       // 20-28 weeks  
      preterm: { min: 28, max: 37, score: 1 },     // 28-37 weeks
      term: { min: 37, max: 42, score: 0 },        // 37-42 weeks
      overdue: { min: 42, max: 50, score: 2 }      // > 42 weeks
    }
  },
  
  // Symptoms
  symptoms: {
    severe_headache: { weight: 2, score: 3 },
    vision_changes: { weight: 2, score: 3 },
    severe_nausea: { weight: 1, score: 2 },
    dizziness: { weight: 1, score: 1 },
    abdominal_pain: { weight: 2, score: 3 },
    back_pain: { weight: 1, score: 1 },
    swelling: { weight: 1, score: 2 },
    reduced_fetal_movement: { weight: 3, score: 4 },
    contractions: { weight: 2, score: 3 },
    fever: { weight: 2, score: 2 }
  },
  
  // Lab results
  labResults: {
    proteinuria: {
      weight: 2,
      levels: { trace: 1, mild: 2, moderate: 3, severe: 4 }
    },
    hemoglobin: {
      weight: 2,
      thresholds: { severe: 7, moderate: 9, mild: 11, normal: 12 }
    }
  }
};

// Risk level thresholds
const RISK_THRESHOLDS = {
  LOW: { min: 0, max: 5 },
  MEDIUM: { min: 6, max: 12 },
  HIGH: { min: 13, max: 25 },
  EMERGENCY: { min: 26, max: 100 }
};

/**
 * Calculate comprehensive risk score
 */
function calculateRisk(assessment) {
  let totalScore = 0;
  const riskFactors = [];
  const recommendations = [];
  
  // 1. Blood Pressure Assessment
  if (assessment.bloodPressure) {
    const bpScore = assessBloodPressure(assessment.bloodPressure);
    totalScore += bpScore.score;
    if (bpScore.score > 0) {
      riskFactors.push(bpScore.factor);
      recommendations.push(bpScore.recommendation);
    }
  }
  
  // 2. Bleeding Assessment
  if (assessment.bleeding && assessment.bleeding !== 'none') {
    const bleedingScore = assessBleeding(assessment.bleeding);
    totalScore += bleedingScore.score;
    riskFactors.push(bleedingScore.factor);
    recommendations.push(bleedingScore.recommendation);
  }
  
  // 3. Gestational Age Risk
  if (assessment.gestationalAge) {
    const gaScore = assessGestationalAge(assessment.gestationalAge);
    totalScore += gaScore.score;
    if (gaScore.score > 0) {
      riskFactors.push(gaScore.factor);
    }
  }
  
  // 4. Symptoms Assessment
  if (assessment.symptoms && assessment.symptoms.length > 0) {
    const symptomsScore = assessSymptoms(assessment.symptoms);
    totalScore += symptomsScore.score;
    riskFactors.push(...symptomsScore.factors);
    recommendations.push(...symptomsScore.recommendations);
  }
  
  // 5. Lab Results
  if (assessment.labResults) {
    const labScore = assessLabResults(assessment.labResults);
    totalScore += labScore.score;
    if (labScore.score > 0) {
      riskFactors.push(...labScore.factors);
      recommendations.push(...labScore.recommendations);
    }
  }
  
  // Determine risk level
  const riskLevel = determineRiskLevel(totalScore);
  
  // Generate required hospital capabilities
  const requiredCapabilities = determineRequiredCapabilities(riskLevel, riskFactors);
  
  return {
    riskScore: totalScore,
    riskLevel: riskLevel.level,
    riskFactors,
    recommendations,
    requiredCapabilities,
    urgency: riskLevel.urgency,
    nextSteps: generateNextSteps(riskLevel, riskFactors),
    clinicalNotes: generateClinicalNotes(assessment, riskFactors)
  };
}

/**
 * Assess blood pressure risk
 */
function assessBloodPressure(bp) {
  const { systolic, diastolic } = bp;
  const thresholds = RISK_FACTORS.bloodPressure.thresholds;
  
  let score = 0;
  let severity = 'normal';
  
  // Check systolic
  if (systolic >= thresholds.systolic.severe || diastolic >= thresholds.diastolic.severe) {
    score = 8;
    severity = 'severe';
  } else if (systolic >= thresholds.systolic.high || diastolic >= thresholds.diastolic.high) {
    score = 5;
    severity = 'high';
  } else if (systolic >= thresholds.systolic.elevated || diastolic >= thresholds.diastolic.elevated) {
    score = 2;
    severity = 'elevated';
  }
  
  return {
    score: score * RISK_FACTORS.bloodPressure.weight,
    factor: `Hypertension (${severity}): ${systolic}/${diastolic} mmHg`,
    recommendation: getBloodPressureRecommendation(severity),
    severity
  };
}

/**
 * Assess bleeding risk
 */
function assessBleeding(bleedingType) {
  const baseScore = RISK_FACTORS.bleeding.types[bleedingType] || 0;
  const score = baseScore * RISK_FACTORS.bleeding.weight;
  
  return {
    score,
    factor: `Bleeding: ${bleedingType}`,
    recommendation: getBleedingRecommendation(bleedingType),
    severity: bleedingType
  };
}

/**
 * Assess gestational age risk
 */
function assessGestationalAge(weeks) {
  const risks = RISK_FACTORS.gestationalAge.risks;
  let riskCategory = 'term';
  let score = 0;
  
  for (const [category, range] of Object.entries(risks)) {
    if (weeks >= range.min && weeks < range.max) {
      riskCategory = category;
      score = range.score;
      break;
    }
  }
  
  return {
    score: score * RISK_FACTORS.gestationalAge.weight,
    factor: `Gestational age: ${weeks} weeks (${riskCategory})`,
    category: riskCategory
  };
}

/**
 * Assess symptoms
 */
function assessSymptoms(symptoms) {
  let totalScore = 0;
  const factors = [];
  const recommendations = [];
  
  symptoms.forEach(symptom => {
    const symptomData = RISK_FACTORS.symptoms[symptom];
    if (symptomData) {
      const score = symptomData.score * symptomData.weight;
      totalScore += score;
      factors.push(`${symptom.replace('_', ' ')}`);
      recommendations.push(getSymptomRecommendation(symptom));
    }
  });
  
  return {
    score: totalScore,
    factors,
    recommendations: recommendations.filter(r => r) // Remove null recommendations
  };
}

/**
 * Assess lab results
 */
function assessLabResults(labResults) {
  let totalScore = 0;
  const factors = [];
  const recommendations = [];
  
  // Proteinuria
  if (labResults.proteinuria && labResults.proteinuria !== 'negative') {
    const level = RISK_FACTORS.labResults.proteinuria.levels[labResults.proteinuria] || 0;
    const score = level * RISK_FACTORS.labResults.proteinuria.weight;
    totalScore += score;
    factors.push(`Proteinuria: ${labResults.proteinuria}`);
    if (level >= 3) {
      recommendations.push('Monitor for preeclampsia signs');
    }
  }
  
  // Hemoglobin
  if (labResults.hemoglobin) {
    const hb = parseFloat(labResults.hemoglobin);
    const thresholds = RISK_FACTORS.labResults.hemoglobin.thresholds;
    let anemiaScore = 0;
    
    if (hb < thresholds.severe) {
      anemiaScore = 6;
      factors.push(`Severe anemia: Hb ${hb} g/dL`);
      recommendations.push('Immediate iron supplementation and monitoring');
    } else if (hb < thresholds.moderate) {
      anemiaScore = 3;
      factors.push(`Moderate anemia: Hb ${hb} g/dL`);
      recommendations.push('Iron supplementation required');
    } else if (hb < thresholds.mild) {
      anemiaScore = 1;
      factors.push(`Mild anemia: Hb ${hb} g/dL`);
    }
    
    totalScore += anemiaScore * RISK_FACTORS.labResults.hemoglobin.weight;
  }
  
  return {
    score: totalScore,
    factors,
    recommendations
  };
}

/**
 * Determine overall risk level
 */
function determineRiskLevel(score) {
  for (const [level, range] of Object.entries(RISK_THRESHOLDS)) {
    if (score >= range.min && score <= range.max) {
      return {
        level,
        urgency: getUrgencyLevel(level),
        timeframe: getTimeframe(level)
      };
    }
  }
  return { level: 'EMERGENCY', urgency: 'immediate', timeframe: '< 1 hour' };
}

/**
 * Determine required hospital capabilities
 */
function determineRequiredCapabilities(riskLevel, riskFactors) {
  const capabilities = [];
  
  // Base capabilities by risk level
  switch (riskLevel.level) {
    case 'HIGH':
    case 'EMERGENCY':
      capabilities.push('emergency_department', 'obgyn_specialist', 'operating_theater');
      break;
    case 'MEDIUM':
      capabilities.push('maternity_ward', 'obgyn_availability');
      break;
  }
  
  // Additional capabilities based on risk factors
  const riskFactorsText = riskFactors.join(' ').toLowerCase();
  
  if (riskFactorsText.includes('bleeding') || riskFactorsText.includes('severe')) {
    capabilities.push('blood_bank', 'emergency_surgery');
  }
  
  if (riskFactorsText.includes('preterm') || riskFactorsText.includes('early')) {
    capabilities.push('nicu', 'pediatric_care');
  }
  
  if (riskFactorsText.includes('anemia') && riskFactorsText.includes('severe')) {
    capabilities.push('blood_transfusion');
  }
  
  return [...new Set(capabilities)]; // Remove duplicates
}

/**
 * Generate next steps based on risk assessment
 */
function generateNextSteps(riskLevel, riskFactors) {
  const steps = [];
  
  switch (riskLevel.level) {
    case 'LOW':
      steps.push('Continue routine prenatal care');
      steps.push('Schedule next appointment as planned');
      steps.push('Provide health education materials');
      break;
      
    case 'MEDIUM':
      steps.push('Increase monitoring frequency');
      steps.push('Consider referral to specialist');
      steps.push('Provide detailed care instructions');
      steps.push('Schedule follow-up within 1-2 weeks');
      break;
      
    case 'HIGH':
      steps.push('URGENT: Refer to hospital immediately');
      steps.push('Arrange transportation');
      steps.push('Notify receiving hospital');
      steps.push('Provide referral documentation');
      break;
      
    case 'EMERGENCY':
      steps.push('EMERGENCY: Call ambulance immediately');
      steps.push('Contact emergency services');
      steps.push('Prepare for immediate transfer');
      steps.push('Continuous monitoring during transport');
      break;
  }
  
  return steps;
}

/**
 * Generate clinical notes
 */
function generateClinicalNotes(assessment, riskFactors) {
  return {
    summary: `Risk assessment completed for ${assessment.gestationalAge || 'unknown'} week pregnancy`,
    riskFactors: riskFactors.join('; '),
    assessedBy: 'MaternitySafe Risk Engine v1.0',
    timestamp: new Date().toISOString(),
    followUpRequired: riskFactors.length > 0
  };
}

// Helper functions for recommendations
function getBloodPressureRecommendation(severity) {
  const recommendations = {
    elevated: 'Monitor BP closely, lifestyle modifications',
    high: 'Immediate medical evaluation required',
    severe: 'EMERGENCY - immediate hospitalization required'
  };
  return recommendations[severity];
}

function getBleedingRecommendation(type) {
  if (['heavy', 'severe'].includes(type)) {
    return 'EMERGENCY - immediate medical attention required';
  } else if (['moderate'].includes(type)) {
    return 'Urgent medical evaluation within 24 hours';
  } else if (['light'].includes(type)) {
    return 'Medical consultation recommended within 48 hours';
  }
  return 'Monitor and report if worsens';
}

function getSymptomRecommendation(symptom) {
  const recommendations = {
    severe_headache: 'Evaluate for preeclampsia',
    vision_changes: 'Immediate ophthalmologic assessment',
    reduced_fetal_movement: 'Fetal monitoring required',
    abdominal_pain: 'Rule out complications',
    contractions: 'Assess for preterm labor'
  };
  return recommendations[symptom];
}

function getUrgencyLevel(riskLevel) {
  const urgencyMap = {
    LOW: 'routine',
    MEDIUM: 'priority',
    HIGH: 'urgent',
    EMERGENCY: 'immediate'
  };
  return urgencyMap[riskLevel] || 'immediate';
}

function getTimeframe(riskLevel) {
  const timeframes = {
    LOW: '1-2 weeks',
    MEDIUM: '2-3 days',
    HIGH: '< 24 hours',
    EMERGENCY: '< 1 hour'
  };
  return timeframes[riskLevel] || '< 1 hour';
}

module.exports = {
  calculateRisk,
  RISK_FACTORS,
  RISK_THRESHOLDS
};
