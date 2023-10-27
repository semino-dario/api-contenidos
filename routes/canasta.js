const express = require('express');
const router = express.Router();

// Import controllers
const { newCanasta, getAllCanastas, updateCanasta, deleteCanasta, getCanasta, uploadPdf, downloadFile } = require('../controllers/canastaControllers')

//Importing authorization middlewares
const { isAuthenticatedUser,
    authorizeRoles
} = require('../middlewares/auth');

router.route('/canastas/nueva').post(isAuthenticatedUser, authorizeRoles('admin', 'usuario'), newCanasta)
router.route('/canastas/:id').put(isAuthenticatedUser, authorizeRoles('admin', 'usuario'), updateCanasta)
router.route('/canastas/borrar/:id').delete(isAuthenticatedUser, authorizeRoles('admin', 'usuario'), deleteCanasta)
router.route('/canastas/').get(getAllCanastas)
router.route('/canastas/:id').get(getCanasta)
router.route('/canastas/pdf').post(uploadPdf)
router.route('/canastas/pdf/download/:id').get(downloadFile)


module.exports = router;