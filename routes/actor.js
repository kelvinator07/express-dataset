var express = require('express');
var router = express.Router();

const { updateActor, getAllActors, getStreak } = require('../controllers/actors');

// Routes related to actor.
router.get('/', getAllActors);
router.put('/', updateActor);
router.get('/streak', getStreak);

module.exports = router;