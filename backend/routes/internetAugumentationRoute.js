const express = require ('express');
const router = express.Router();
const { ensureServicesInitialized } = require('../middlewear/initialise');

const {
    internetStatus,
    internetSearch,
} = require('../controllers/internetAugumentationController');

// Apply middleware to all routes
router.use(ensureServicesInitialized);

// Internet augmentation routes
router.get('/status', internetStatus);
router.post('/search', internetSearch);

module.exports = router;