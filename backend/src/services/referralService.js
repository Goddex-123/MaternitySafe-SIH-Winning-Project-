/**
 * Referral Service - Managing patient referrals and tracking
 */

const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

let db = null;

/**
 * Initialize referral service
 */
async function init() {
  return new Promise((resolve, reject) => {
    const dbPath = process.env.DB_PATH || './referral.sqlite';
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Create referrals table
      db.run(`
        CREATE TABLE IF NOT EXISTS referrals (
          id TEXT PRIMARY KEY,
          patient_data TEXT NOT NULL,
          risk_assessment TEXT NOT NULL,
          asha_id TEXT NOT NULL,
          source_location TEXT NOT NULL,
          target_hospital_id TEXT NOT NULL,
          referral_code TEXT UNIQUE NOT NULL,
          qr_code TEXT,
          status TEXT DEFAULT 'pending',
          priority TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          accepted_at TEXT,
          completed_at TEXT,
          notes TEXT
        )
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  });
}

/**
 * Create new referral
 */
async function createReferral(referralData) {
  const referralId = uuidv4();
  const referralCode = generateReferralCode();
  const now = new Date().toISOString();
  
  // Generate QR code data
  const qrData = {
    referralId,
    referralCode,
    patientName: referralData.patientData?.name || 'Anonymous',
    riskLevel: referralData.riskAssessment.riskLevel,
    timestamp: now,
    targetHospital: referralData.targetHospitalId
  };
  
  const qrCodeDataUrl = await generateQRCode(qrData);
  
  const referral = {
    id: referralId,
    patientData: referralData.patientData,
    riskAssessment: referralData.riskAssessment,
    ashaId: referralData.ashaId,
    sourceLocation: referralData.sourceLocation,
    targetHospitalId: referralData.targetHospitalId,
    referralCode,
    qrCode: qrCodeDataUrl,
    status: 'pending',
    priority: mapRiskToPriority(referralData.riskAssessment.riskLevel),
    createdAt: now,
    updatedAt: now,
    notes: referralData.notes || ''
  };
  
  return new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO referrals 
      (id, patient_data, risk_assessment, asha_id, source_location, target_hospital_id, 
       referral_code, qr_code, status, priority, created_at, updated_at, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      referral.id,
      JSON.stringify(referral.patientData),
      JSON.stringify(referral.riskAssessment), 
      referral.ashaId,
      JSON.stringify(referral.sourceLocation),
      referral.targetHospitalId,
      referral.referralCode,
      referral.qrCode,
      referral.status,
      referral.priority,
      referral.createdAt,
      referral.updatedAt,
      referral.notes
    ], function(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(referral);
    });
  });
}

/**
 * Get referrals for a hospital
 */
async function getHospitalReferrals(hospitalId, status = null) {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM referrals WHERE target_hospital_id = ?';
    let params = [hospitalId];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      const referrals = rows.map(row => ({
        id: row.id,
        patientData: JSON.parse(row.patient_data),
        riskAssessment: JSON.parse(row.risk_assessment),
        ashaId: row.asha_id,
        sourceLocation: JSON.parse(row.source_location),
        targetHospitalId: row.target_hospital_id,
        referralCode: row.referral_code,
        qrCode: row.qr_code,
        status: row.status,
        priority: row.priority,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        acceptedAt: row.accepted_at,
        completedAt: row.completed_at,
        notes: row.notes
      }));
      
      resolve(referrals);
    });
  });
}

/**
 * Update referral status
 */
async function updateReferralStatus(referralId, status, notes = '') {
  const now = new Date().toISOString();
  let updateFields = 'status = ?, updated_at = ?, notes = ?';
  let params = [status, now, notes];
  
  // Add timestamp for specific status changes
  if (status === 'accepted') {
    updateFields += ', accepted_at = ?';
    params.push(now);
  } else if (status === 'completed') {
    updateFields += ', completed_at = ?';
    params.push(now);
  }
  
  params.push(referralId);
  
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE referrals SET ${updateFields} WHERE id = ?`,
      params,
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        // Return updated referral
        getReferralById(referralId)
          .then(resolve)
          .catch(reject);
      }
    );
  });
}

/**
 * Get referral by ID
 */
async function getReferralById(referralId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM referrals WHERE id = ?',
      [referralId],
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          resolve(null);
          return;
        }
        
        const referral = {
          id: row.id,
          patientData: JSON.parse(row.patient_data),
          riskAssessment: JSON.parse(row.risk_assessment),
          ashaId: row.asha_id,
          sourceLocation: JSON.parse(row.source_location),
          targetHospitalId: row.target_hospital_id,
          referralCode: row.referral_code,
          qrCode: row.qr_code,
          status: row.status,
          priority: row.priority,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          acceptedAt: row.accepted_at,
          completedAt: row.completed_at,
          notes: row.notes
        };
        
        resolve(referral);
      }
    );
  });
}

/**
 * Generate referral code (8-character alphanumeric)
 */
function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'REF';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate QR code
 */
async function generateQRCode(data) {
  try {
    const qrString = JSON.stringify(data);
    const qrCodeDataUrl = await QRCode.toDataURL(qrString, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('QR Code generation error:', error);
    return null;
  }
}

/**
 * Map risk level to priority
 */
function mapRiskToPriority(riskLevel) {
  const priorityMap = {
    'LOW': 'routine',
    'MEDIUM': 'standard',
    'HIGH': 'urgent',
    'EMERGENCY': 'critical'
  };
  return priorityMap[riskLevel] || 'standard';
}

/**
 * Get referral statistics
 */
async function getReferralStats(hospitalId = null) {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT 
        status,
        priority,
        COUNT(*) as count,
        AVG(
          CASE 
            WHEN accepted_at IS NOT NULL 
            THEN (julianday(accepted_at) - julianday(created_at)) * 24 * 60 
            ELSE NULL 
          END
        ) as avg_response_time
      FROM referrals
    `;
    
    let params = [];
    
    if (hospitalId) {
      query += ' WHERE target_hospital_id = ?';
      params.push(hospitalId);
    }
    
    query += ' GROUP BY status, priority';
    
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      const stats = {
        total: 0,
        byStatus: {},
        byPriority: {},
        avgResponseTime: 0
      };
      
      let totalResponseTime = 0;
      let responseTimeCount = 0;
      
      rows.forEach(row => {
        stats.total += row.count;
        stats.byStatus[row.status] = (stats.byStatus[row.status] || 0) + row.count;
        stats.byPriority[row.priority] = (stats.byPriority[row.priority] || 0) + row.count;
        
        if (row.avg_response_time) {
          totalResponseTime += row.avg_response_time * row.count;
          responseTimeCount += row.count;
        }
      });
      
      if (responseTimeCount > 0) {
        stats.avgResponseTime = Math.round(totalResponseTime / responseTimeCount);
      }
      
      resolve(stats);
    });
  });
}

/**
 * Get pending referrals count by priority for dashboard
 */
async function getPendingReferralsSummary(hospitalId) {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT priority, COUNT(*) as count 
      FROM referrals 
      WHERE target_hospital_id = ? AND status = 'pending'
      GROUP BY priority
      ORDER BY 
        CASE priority
          WHEN 'critical' THEN 1
          WHEN 'urgent' THEN 2
          WHEN 'standard' THEN 3
          WHEN 'routine' THEN 4
        END
    `, [hospitalId], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      const summary = {
        total: 0,
        critical: 0,
        urgent: 0,
        standard: 0,
        routine: 0
      };
      
      rows.forEach(row => {
        summary[row.priority] = row.count;
        summary.total += row.count;
      });
      
      resolve(summary);
    });
  });
}

module.exports = {
  init,
  createReferral,
  getHospitalReferrals,
  updateReferralStatus,
  getReferralById,
  getReferralStats,
  getPendingReferralsSummary
};
