/**
 * Notification Service - SMS and family alerts
 */

// Mock Twilio for demo - in production, use real Twilio
const isDemoMode = process.env.DEMO_MODE === 'true';

let twilioClient = null;

if (!isDemoMode && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  const twilio = require('twilio');
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

/**
 * Notify hospital about new referral
 */
async function notifyHospital(referral) {
  const message = formatHospitalNotification(referral);
  
  if (isDemoMode) {
    console.log('\n📱 [DEMO SMS] Hospital Notification:');
    console.log(`To: ${getHospitalPhone(referral.targetHospitalId)}`);
    console.log(`Message: ${message}`);
    console.log('---');
    return { success: true, messageId: 'demo_msg_' + Date.now() };
  }
  
  if (!twilioClient) {
    console.log('Twilio not configured, skipping SMS');
    return { success: false, error: 'SMS service not configured' };
  }
  
  try {
    const response = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: getHospitalPhone(referral.targetHospitalId)
    });
    
    return { success: true, messageId: response.sid };
  } catch (error) {
    console.error('SMS sending error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Notify family about referral status
 */
async function notifyFamily(referral, status, additionalInfo = '') {
  if (!referral.patientData?.familyPhone) {
    console.log('No family phone number provided');
    return { success: false, error: 'No family contact' };
  }
  
  const message = formatFamilyNotification(referral, status, additionalInfo);
  
  if (isDemoMode) {
    console.log('\n📱 [DEMO SMS] Family Notification:');
    console.log(`To: ${referral.patientData.familyPhone}`);
    console.log(`Message: ${message}`);
    console.log('---');
    return { success: true, messageId: 'demo_family_' + Date.now() };
  }
  
  if (!twilioClient) {
    console.log('Twilio not configured, skipping family SMS');
    return { success: false, error: 'SMS service not configured' };
  }
  
  try {
    const response = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: referral.patientData.familyPhone
    });
    
    return { success: true, messageId: response.sid };
  } catch (error) {
    console.error('Family SMS error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send ambulance dispatch notification
 */
async function notifyAmbulanceDispatch(referral, hospitalDetails, eta) {
  const message = formatAmbulanceNotification(referral, hospitalDetails, eta);
  
  // Notify both hospital and family
  const hospitalNotification = await sendSMS(
    getHospitalPhone(referral.targetHospitalId),
    `🚑 AMBULANCE DISPATCHED\nRef: ${referral.referralCode}\nETA: ${eta} mins\nPatient: ${referral.patientData?.name || 'Anonymous'}\nPriority: ${referral.priority.toUpperCase()}`
  );
  
  let familyNotification = { success: false };
  if (referral.patientData?.familyPhone) {
    familyNotification = await sendSMS(
      referral.patientData.familyPhone,
      `🚑 Ambulance dispatched for ${referral.patientData?.name || 'patient'}.\nGoing to: ${hospitalDetails.name}\nRef: ${referral.referralCode}\nETA: ${eta} minutes.\nPlease be ready.`
    );
  }
  
  return {
    hospital: hospitalNotification,
    family: familyNotification
  };
}

/**
 * Format hospital notification message
 */
function formatHospitalNotification(referral) {
  const patientName = referral.patientData?.name || 'Anonymous Patient';
  const riskLevel = referral.riskAssessment.riskLevel;
  const gestationalAge = referral.riskAssessment.clinicalNotes?.gestationalAge || 'Unknown';
  const riskFactors = referral.riskAssessment.riskFactors.slice(0, 2).join('; ');
  
  return `🏥 URGENT REFERRAL
Ref: ${referral.referralCode}
Patient: ${patientName}
Risk: ${riskLevel}
GA: ${gestationalAge}w
Issues: ${riskFactors}
From: ASHA ${referral.ashaId}
Action: Accept/Redirect required
Time: ${new Date().toLocaleTimeString()}`;
}

/**
 * Format family notification message
 */
function formatFamilyNotification(referral, status, additionalInfo) {
  const patientName = referral.patientData?.name || 'Patient';
  
  let message = '';
  
  switch (status) {
    case 'created':
      message = `📋 Medical referral created for ${patientName}.\nRef: ${referral.referralCode}\nHospital will respond shortly.\nKeep this number for updates.`;
      break;
    case 'accepted':
      message = `✅ Hospital accepted referral for ${patientName}.\nRef: ${referral.referralCode}\n${additionalInfo}\nPrepare for departure.`;
      break;
    case 'ambulance_dispatched':
      message = `🚑 Ambulance dispatched for ${patientName}.\nRef: ${referral.referralCode}\n${additionalInfo}\nPlease be ready for pickup.`;
      break;
    case 'completed':
      message = `✅ ${patientName} admitted successfully.\nRef: ${referral.referralCode}\nHospital will provide further updates.`;
      break;
    default:
      message = `📋 Update for ${patientName}: ${status}\nRef: ${referral.referralCode}\n${additionalInfo}`;
  }
  
  return message;
}

/**
 * Format ambulance notification
 */
function formatAmbulanceNotification(referral, hospitalDetails, eta) {
  return `🚑 AMBULANCE DISPATCH
Ref: ${referral.referralCode}
Patient: ${referral.patientData?.name || 'Anonymous'}
Priority: ${referral.priority.toUpperCase()}
To: ${hospitalDetails.name}
ETA: ${eta} minutes
Status: En route`;
}

/**
 * Send SMS (generic function)
 */
async function sendSMS(phoneNumber, message) {
  if (isDemoMode) {
    console.log(`\n📱 [DEMO SMS] To: ${phoneNumber}`);
    console.log(`Message: ${message}`);
    console.log('---');
    return { success: true, messageId: 'demo_sms_' + Date.now() };
  }
  
  if (!twilioClient) {
    return { success: false, error: 'SMS service not configured' };
  }
  
  try {
    const response = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    
    return { success: true, messageId: response.sid };
  } catch (error) {
    console.error('SMS error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get hospital phone number (mock data)
 */
function getHospitalPhone(hospitalId) {
  const hospitalPhones = {
    'hosp_001': '+91-1472-234567',
    'hosp_002': '+91-144-2334455',
    'hosp_003': '+91-141-2518121'
  };
  
  return hospitalPhones[hospitalId] || '+91-1234567890';
}

/**
 * Send referral summary via SMS
 */
async function sendReferralSummary(referral) {
  const summaryMessage = `📋 REFERRAL SUMMARY
Ref: ${referral.referralCode}
Patient: ${referral.patientData?.name || 'Anonymous'}
Risk: ${referral.riskAssessment.riskLevel}
Status: ${referral.status}
Created: ${new Date(referral.createdAt).toLocaleString()}
Hospital: ${referral.targetHospitalId}

Next steps: ${referral.riskAssessment.nextSteps.slice(0, 2).join('; ')}`;

  // Send to multiple recipients if needed
  const notifications = [];
  
  // Hospital notification
  notifications.push(await sendSMS(
    getHospitalPhone(referral.targetHospitalId),
    summaryMessage
  ));
  
  // Family notification (if phone provided)
  if (referral.patientData?.familyPhone) {
    notifications.push(await sendSMS(
      referral.patientData.familyPhone,
      summaryMessage.replace('REFERRAL SUMMARY', 'MEDICAL UPDATE')
    ));
  }
  
  return notifications;
}

/**
 * Emergency alert for critical cases
 */
async function sendEmergencyAlert(referral, hospitalDetails) {
  const alertMessage = `🚨 EMERGENCY ALERT
Critical maternal case incoming!

Ref: ${referral.referralCode}
Patient: ${referral.patientData?.name || 'Emergency Patient'}
Risk Factors: ${referral.riskAssessment.riskFactors.join('; ')}

Required: ${referral.riskAssessment.requiredCapabilities.join(', ')}

PREPARE:
- Emergency team ready
- OT availability
- Blood bank standby

From: ASHA ${referral.ashaId}
Time: ${new Date().toLocaleTimeString()}`;

  return await sendSMS(getHospitalPhone(referral.targetHospitalId), alertMessage);
}

module.exports = {
  notifyHospital,
  notifyFamily,
  notifyAmbulanceDispatch,
  sendReferralSummary,
  sendEmergencyAlert,
  sendSMS
};
