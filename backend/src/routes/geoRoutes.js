const express = require('express');
const router = express.Router();
const geoController = require('../controllers/geoController');

router.get('/search', geoController.searchPlaces);
router.get('/reverse', geoController.reverseGeocode);

module.exports = router;

