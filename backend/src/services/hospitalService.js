/**
 * Hospital Service - Smart routing and capability matching
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let db = null;

// Mock hospital data for demo - in production, this would come from government APIs
const DEMO_HOSPITALS = [
  {
    id: 'hosp_001',
    name: 'Primary Health Centre - Rajgadh',
    type: 'PHC',
    level: 'primary',
    location: {
      lat: 27.0238,
      lng: 74.2179,
      address: 'Rajgadh Village, Alwar District, Rajasthan'
    },
    capabilities: ['maternity_ward', 'basic_emergency', 'ambulance'],
    capacity: {
      beds: 15,
      maternity_beds: 4,
      available_beds: 2,
      staff_on_duty: true
    },
    contact: {
      phone: '+91-1472-234567',
      emergency: '+91-1472-234567'
    },
    operationalHours: '24/7',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'hosp_002', 
    name: 'District Hospital - Alwar',
    type: 'District',
    level: 'secondary',
    location: {
      lat: 27.5678,
      lng: 76.6252,
      address: 'Civil Lines, Alwar, Rajasthan - 301001'
    },
    capabilities: [
      'maternity_ward',
      'emergency_department', 
      'obgyn_specialist',
      'operating_theater',
      'blood_bank',
      'ambulance',
      'icu',
      'nicu'
    ],
    capacity: {
      beds: 150,
      maternity_beds: 25,
      icu_beds: 8,
      available_beds: 12,
      ot_available: 2,
      staff_on_duty: true,
      obgyn_available: true
    },
    contact: {
      phone: '+91-144-2334455',
      emergency: '+91-144-2334400'
    },
    operationalHours: '24/7',
    distance: 15.2, // km from current location
    eta: 35, // minutes
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'hosp_003',
    name: 'SMS Medical College & Hospital - Jaipur',
    type: 'Medical College',
    level: 'tertiary',
    location: {
      lat: 26.9124,
      lng: 75.7873,
      address: 'JLN Marg, Jaipur, Rajasthan - 302004'
    },
    capabilities: [
      'maternity_ward',
      'emergency_department',
      'obgyn_specialist', 
      'operating_theater',
      'blood_bank',
      'ambulance',
      'icu',
      'nicu',
      'emergency_surgery',
      'blood_transfusion',
      'pediatric_care',
      'high_risk_pregnancy',
      'fetal_medicine'
    ],
    capacity: {
      beds: 1200,
      maternity_beds: 100,
      icu_beds: 50,
      available_beds: 45,
      ot_available: 4,
      staff_on_duty: true,
      obgyn_available: true,
      specialists_available: 3
    },
    contact: {
      phone: '+91-141-2518121',
      emergency: '+91-141-2518000'
    },
    operationalHours: '24/7',
    distance: 45.8, // km
    eta: 65, // minutes via ambulance
    lastUpdated: new Date().toISOString()
  }
];

/**
 * Initialize hospital service and database
 */
async function init() {
  return new Promise((resolve, reject) => {
    const dbPath = process.env.DB_PATH || './hospital.sqlite';
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Create hospitals table
      db.run(`
        CREATE TABLE IF NOT EXISTS hospitals (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          level TEXT NOT NULL,
          location TEXT NOT NULL,
          capabilities TEXT NOT NULL,
          capacity TEXT NOT NULL,
          contact TEXT NOT NULL,
          operational_hours TEXT,
          last_updated TEXT,
          is_active BOOLEAN DEFAULT 1
        )
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Seed demo data
        seedDemoData()
          .then(() => resolve())
          .catch(reject);
      });
    });
  });
}

/**
 * Seed demo hospital data
 */
async function seedDemoData() {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO hospitals 
      (id, name, type, level, location, capabilities, capacity, contact, operational_hours, last_updated, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    DEMO_HOSPITALS.forEach(hospital => {
      stmt.run([
        hospital.id,
        hospital.name,
        hospital.type,
        hospital.level,
        JSON.stringify(hospital.location),
        JSON.stringify(hospital.capabilities),
        JSON.stringify(hospital.capacity),
        JSON.stringify(hospital.contact),
        hospital.operationalHours,
        hospital.lastUpdated,
        1
      ]);
    });
    
    stmt.finalize((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/**
 * Get all hospitals
 */
async function getAllHospitals() {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM hospitals WHERE is_active = 1',
      (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        const hospitals = rows.map(row => ({
          id: row.id,
          name: row.name,
          type: row.type,
          level: row.level,
          location: JSON.parse(row.location),
          capabilities: JSON.parse(row.capabilities),
          capacity: JSON.parse(row.capacity),
          contact: JSON.parse(row.contact),
          operationalHours: row.operational_hours,
          lastUpdated: row.last_updated
        }));
        
        resolve(hospitals);
      }
    );
  });
}

/**
 * Get hospital by ID
 */
async function getHospitalById(hospitalId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM hospitals WHERE id = ? AND is_active = 1',
      [hospitalId],
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          resolve(null);
          return;
        }
        
        const hospital = {
          id: row.id,
          name: row.name,
          type: row.type,
          level: row.level,
          location: JSON.parse(row.location),
          capabilities: JSON.parse(row.capabilities),
          capacity: JSON.parse(row.capacity),
          contact: JSON.parse(row.contact),
          operationalHours: row.operational_hours,
          lastUpdated: row.last_updated
        };
        
        resolve(hospital);
      }
    );
  });
}

/**
 * Find nearest hospitals with required capabilities
 */
async function findNearestHospitals(currentLocation, requiredCapabilities = []) {
  const allHospitals = await getAllHospitals();
  
  // Filter hospitals by capabilities
  let eligibleHospitals = allHospitals.filter(hospital => {
    if (requiredCapabilities.length === 0) return true;
    
    return requiredCapabilities.every(capability => 
      hospital.capabilities.includes(capability)
    );
  });
  
  // Calculate distances and ETAs
  eligibleHospitals = eligibleHospitals.map(hospital => {
    const distance = calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      hospital.location.lat,
      hospital.location.lng
    );
    
    const eta = calculateETA(distance, hospital.level);
    
    return {
      ...hospital,
      distance: Math.round(distance * 10) / 10,
      eta: Math.round(eta),
      matchScore: calculateMatchScore(hospital, requiredCapabilities, distance)
    };
  });
  
  // Sort by match score (capability match + proximity + availability)
  eligibleHospitals.sort((a, b) => b.matchScore - a.matchScore);
  
  // Return top 3 recommendations
  return eligibleHospitals.slice(0, 3);
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate ETA based on distance and hospital level
 */
function calculateETA(distance, hospitalLevel) {
  // Base speeds (km/h) - accounting for rural roads, traffic, ambulance priority
  const speeds = {
    primary: 35,    // Local roads to PHC
    secondary: 45,  // Better roads to District Hospital
    tertiary: 50    // Highway access to Medical Colleges
  };
  
  const speed = speeds[hospitalLevel] || 40;
  const baseTime = (distance / speed) * 60; // Convert to minutes
  
  // Add preparation time (ambulance dispatch, patient handover)
  const preparationTime = hospitalLevel === 'primary' ? 10 : 15;
  
  return baseTime + preparationTime;
}

/**
 * Calculate match score for hospital recommendation
 */
function calculateMatchScore(hospital, requiredCapabilities, distance) {
  let score = 0;
  
  // Capability match score (0-50 points)
  const capabilityMatch = requiredCapabilities.length === 0 ? 50 : 
    (hospital.capabilities.filter(cap => requiredCapabilities.includes(cap)).length / requiredCapabilities.length) * 50;
  
  score += capabilityMatch;
  
  // Distance score (0-25 points, closer is better)
  const distanceScore = Math.max(0, 25 - distance);
  score += distanceScore;
  
  // Availability score (0-15 points)
  const capacity = hospital.capacity;
  let availabilityScore = 0;
  
  if (capacity.available_beds > 0) availabilityScore += 5;
  if (capacity.staff_on_duty) availabilityScore += 5;
  if (capacity.obgyn_available) availabilityScore += 5;
  
  score += availabilityScore;
  
  // Hospital level bonus (0-10 points)
  const levelBonus = {
    'tertiary': 10,
    'secondary': 7,
    'primary': 3
  };
  score += levelBonus[hospital.level] || 0;
  
  return score;
}

/**
 * Update hospital availability
 */
async function updateAvailability(hospitalId, availabilityData) {
  const hospital = await getHospitalById(hospitalId);
  if (!hospital) {
    throw new Error('Hospital not found');
  }
  
  // Update capacity data
  const updatedCapacity = {
    ...hospital.capacity,
    ...availabilityData,
    last_updated: new Date().toISOString()
  };
  
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE hospitals SET capacity = ?, last_updated = ? WHERE id = ?',
      [JSON.stringify(updatedCapacity), new Date().toISOString(), hospitalId],
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        resolve({
          ...hospital,
          capacity: updatedCapacity,
          lastUpdated: new Date().toISOString()
        });
      }
    );
  });
}

/**
 * Get hospital statistics for dashboard
 */
async function getHospitalStats(hospitalId) {
  // This would integrate with real hospital management systems
  // For demo, return mock data
  return {
    totalReferrals: 45,
    pendingReferrals: 3,
    acceptedReferrals: 38,
    redirectedReferrals: 4,
    avgResponseTime: 8.5, // minutes
    currentOccupancy: 78, // percentage
    availableBeds: 12,
    emergency: {
      currentEmergencies: 2,
      avgHandlingTime: 15 // minutes
    }
  };
}

module.exports = {
  init,
  getAllHospitals,
  getHospitalById,
  findNearestHospitals,
  updateAvailability,
  getHospitalStats,
  calculateDistance,
  calculateETA
};
