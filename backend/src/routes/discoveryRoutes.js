const express = require('express');
const router = express.Router();
const discoveryController = require('../controllers/discoveryController');
const { optionalAuthenticate } = require('../middleware/auth');

// Optional authentication for discovery so visitors can browse near any location
router.get('/chefs', optionalAuthenticate, discoveryController.discoverChefs);
router.get('/chefs/:id', optionalAuthenticate, discoveryController.getChefById);

module.exports = router;
