const express = require('express');
const router = express.Router();


//Importing articule controllers
const { getMaterias,
    getOneMateria,
    newMateria,
    updateMateria,
    deleteMateria,
} = require('../controllers/materiasControllers');

//Importing authorization middlewares
const { isAuthenticatedUser,
    authorizeRoles
} = require('../middlewares/auth');

router.route('/materias').get(getMaterias);
router.route('/materia/:id/:slug').get(getOneMateria);
router.route('/materia/nueva').post(isAuthenticatedUser, authorizeRoles('admin', 'usuario'), newMateria);
router.route('/materia/:id').put(isAuthenticatedUser, authorizeRoles('admin', 'usuario'), updateMateria);
router.route('/materia/:id').delete(isAuthenticatedUser, authorizeRoles('admin', 'usuario'), deleteMateria);

module.exports = router;