const express = require('express');
const router = express.Router();

//Importing articule controllers
const { getArticles,
    getOneArticle,
    newArticle,
    updateArticle,
    deleteArticle,
    uploadImage
} = require('../controllers/articlesControllers');

//Importing authorization middlewares
const { isAuthenticatedUser,
    authorizeRoles
} = require('../middlewares/auth');

router.route('/articulos').get(getArticles);
router.route('/articulo/:id/:slug').get(getOneArticle);
router.route('/articulo/nuevo').post(isAuthenticatedUser, authorizeRoles('admin'), newArticle);
router.route('/articulo/:id').put(isAuthenticatedUser, authorizeRoles('admin'), updateArticle);
router.route('/articulo/:id').delete(isAuthenticatedUser, authorizeRoles('admin'), deleteArticle);
router.route('/articulo/image').post(isAuthenticatedUser, authorizeRoles('admin'), uploadImage);

module.exports = router;