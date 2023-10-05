const express = require('express');
const router = express.Router();
const cors = require('cors');


//Importing articule controllers
const { getArticles,
    getOneArticle,
    newArticle,
    updateArticle,
    deleteArticle,
    uploadImage
} = require('../controllers/articlesControllers');

const corsOptions = {
    origin: "*",
    optionsSuccessStatus: 200,
};
//Importing authorization middlewares
const { isAuthenticatedUser,
    authorizeRoles
} = require('../middlewares/auth');

router.route('/articulos').get(getArticles);
router.route('/articulo/:id/:slug').get(getOneArticle);
router.route('/articulo/nuevo').post(isAuthenticatedUser, authorizeRoles('admin', 'usuario'), newArticle);
router.route('/articulo/:id').put(isAuthenticatedUser, authorizeRoles('admin', 'usuario'), updateArticle);
router.route('/articulo/:id').delete(isAuthenticatedUser, authorizeRoles('admin', 'usuario'), deleteArticle);
router.route('/articulo/image').post(isAuthenticatedUser, authorizeRoles('admin', 'usuario'), uploadImage);

module.exports = router;