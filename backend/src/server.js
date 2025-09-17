const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes and middleware
const riskEngine = require('./services/riskEngine');
const hospitalService = require('./services/hospitalService');
const referralService = require('./services/referralService');
const notificationService = require('./services/notificationService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join_hospital', (hospitalId) => {
    socket.join(`hospital_${hospitalId}`);
    console.log(`Socket ${socket.id} joined hospital_${hospitalId}`);
  });
  
  socket.on('join_asha', (ashaId) => {
    socket.join(`asha_${ashaId}`);
    console.log(`Socket ${socket.id} joined asha_${ashaId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available to services
app.set('socketio', io);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes

// Assessment and Risk Calculation
app.post('/api/assessment', async (req, res) => {
  try {
    const assessment = req.body;
    
    // Calculate risk score
    const riskResult = riskEngine.calculateRisk(assessment);
    
    // Find appropriate hospitals if high risk
    let recommendedHospitals = [];
    if (riskResult.riskLevel === 'HIGH' || riskResult.riskLevel === 'MEDIUM') {
      recommendedHospitals = await hospitalService.findNearestHospitals(
        assessment.location,
        riskResult.requiredCapabilities
      );
    }
    
    const result = {
      ...riskResult,
      recommendedHospitals,
      assessmentId: `ASSESS_${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    
    res.json(result);
  } catch (error) {
    console.error('Assessment error:', error);
    res.status(500).json({ error: 'Assessment processing failed' });
  }
});

// Create Referral
app.post('/api/referral', async (req, res) => {
  try {
    const referralData = req.body;
    
    // Create referral
    const referral = await referralService.createReferral(referralData);
    
    // Send notification
    if (referral.targetHospitalId) {
      await notificationService.notifyHospital(referral);
      
      // Emit real-time notification
      io.to(`hospital_${referral.targetHospitalId}`).emit('new_referral', referral);
    }
    
    res.json(referral);
  } catch (error) {
    console.error('Referral creation error:', error);
    res.status(500).json({ error: 'Referral creation failed' });
  }
});

// Get referrals for a hospital
app.get('/api/hospital/:hospitalId/referrals', async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const referrals = await referralService.getHospitalReferrals(hospitalId);
    res.json(referrals);
  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
});

// Update referral status
app.put('/api/referral/:referralId/status', async (req, res) => {
  try {
    const { referralId } = req.params;
    const { status, notes } = req.body;
    
    const updatedReferral = await referralService.updateReferralStatus(
      referralId, 
      status, 
      notes
    );
    
    // Notify ASHA about status update
    io.to(`asha_${updatedReferral.ashaId}`).emit('referral_updated', updatedReferral);
    
    res.json(updatedReferral);
  } catch (error) {
    console.error('Update referral error:', error);
    res.status(500).json({ error: 'Failed to update referral' });
  }
});

// Get hospitals list
app.get('/api/hospitals', async (req, res) => {
  try {
    const hospitals = await hospitalService.getAllHospitals();
    res.json(hospitals);
  } catch (error) {
    console.error('Get hospitals error:', error);
    res.status(500).json({ error: 'Failed to fetch hospitals' });
  }
});

// Get hospital details
app.get('/api/hospital/:hospitalId', async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const hospital = await hospitalService.getHospitalById(hospitalId);
    
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    
    res.json(hospital);
  } catch (error) {
    console.error('Get hospital error:', error);
    res.status(500).json({ error: 'Failed to fetch hospital details' });
  }
});

// Update hospital availability
app.put('/api/hospital/:hospitalId/availability', async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const availabilityData = req.body;
    
    const updatedHospital = await hospitalService.updateAvailability(
      hospitalId, 
      availabilityData
    );
    
    res.json(updatedHospital);
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// Demo endpoints for testing
app.post('/api/demo/simulate-emergency', async (req, res) => {
  try {
    const scenario = req.body.scenario || 'preeclampsia';
    const result = await require('./demo/scenarios').runScenario(scenario);
    res.json(result);
  } catch (error) {
    console.error('Demo simulation error:', error);
    res.status(500).json({ error: 'Demo simulation failed' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize services
    await hospitalService.init();
    await referralService.init();
    
    // Seed demo data if in demo mode
    if (process.env.SEED_DATA === 'true') {
      console.log('Seeding demo data...');
      await require('./scripts/seedData').seedAll();
    }
    
    server.listen(PORT, () => {
      console.log(`🏥 MaternitySafe Backend running on port ${PORT}`);
      console.log(`📊 Dashboard: http://localhost:${PORT}/api/health`);
      console.log(`🔄 Socket.IO ready for real-time updates`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, server, io };
