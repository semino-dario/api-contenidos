const express = require('express');
const router = express.Router();

const { registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
    logout
} = require('../controllers/authControllers');

//Importing authorization middlewares
const { isAuthenticatedUser,
} = require('../middlewares/auth');

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/password/forgot').post(forgotPassword);
router.route('/password/reset/:token').put(resetPassword);
router.route('/logout').get(isAuthenticatedUser, logout);


module.exports = router;