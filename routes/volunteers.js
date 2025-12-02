const express = require('express');
const Volunteer = require('../models/Volunteer');
// If you need to verify users for these routes, import middleware:
// const { authenticateToken } = require('./auth');

const router = express.Router();

// GET /api/volunteers - Get all volunteers
router.get('/', async (req, res) => {
  try {
    const volunteers = await Volunteer.find({ status: 'active' }).sort({ joined_at: -1 });
    res.json(volunteers);
  } catch (error) {
    console.error('Error fetching volunteers:', error);
    res.status(500).json({ error: 'Failed to fetch volunteers' });
  }
});

// POST /api/volunteers - Register a new volunteer
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, skills, location_preference, availability, experience_level } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const newVolunteer = new Volunteer({
      name,
      email,
      phone,
      skills,
      location_preference,
      availability,
      experience_level,
      status: 'active'
    });

    const result = await newVolunteer.save();

    res.status(201).json({
      message: 'Volunteer registered successfully',
      volunteerId: result._id
    });
  } catch (error) {
    console.error('Error registering volunteer:', error);
    res.status(500).json({ error: 'Failed to register volunteer' });
  }
});

module.exports = router;