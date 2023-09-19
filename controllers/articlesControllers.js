const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const Article = require('../models/articles');
const ErrorHandler = require('../utils/errorHandler');
const path = require('path');


// Get all articles => api/v1/articulos

exports.getArticles = catchAsyncErrors(async (req, res, next) => {

    const articles = await Article.find()

    res.status(200).json({
        success: true,
        results: articles.length,
        data: articles
    })
})

// Create new article

exports.newArticle = catchAsyncErrors(async (req, res, next) => {

    const article = await Article.create(req.body);

    res.status(200).json({
        success: true,
        message: 'el Artículo ha sido publicado.',
        data: article
    })

    // TO BE ADDED IN THE FUTURE: functionality to upload a file wtith the image of the article
})

// Get a single article by ID and slug api/v1/articulo/:id/:slug

exports.getOneArticle = catchAsyncErrors(async (req, res, next) => {

    const article = await Article.find({ $and: [{ _id: req.params.id }, { slug: req.params.slug }] });

    if (!article || article.length === 0) {
        return next(new ErrorHandler('Artículo no encontrado', 404))
    }

    res.status(200).json({
        success: true,
        data: article
    })
})

// Update an article /api/v1/article/:id

exports.updateArticle = catchAsyncErrors(async (req, res, next) => {

    let article = await Article.findById(req.params.id);

    if (!article) {
        return next(new ErrorHandler('Artículo no encontrado', 404))

    }

    article = await Article.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    });

    res.status(200).json({
        success: true,
        message: "Artículo modificado correctamente",
        data: article
    })
})

// Delete an article /api/v1/article/:id

exports.deleteArticle = catchAsyncErrors(async (req, res, next) => {

    let article = await Article.findById(req.params.id);

    if (!article) {
        return next(new ErrorHandler('Artículo no encontrado', 404))

    }

    article = await Article.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        message: "El artículo ha sido borrado"
    })
}
)

// Upload image /api/v1/articule/image

exports.uploadImage = catchAsyncErrors(async (req, res, next) => {

    //Check the files
    if (!req.files) {
        return next(new ErrorHandler('Por favor subir una imagen', 400))
    }

    const file = req.files.file;

    //Check file type

    const supportedFiles = /.jpg|.png|.webp/;

    if (!supportedFiles.test(path.extname(file.name))) {
        return next(new ErrorHandler('Por favor subir un archivo de imagen jpg, png o webp', 400))
    }

    //Check document size
    if (file.size > process.env.MAX_FILE_SIZE) {
        return next(new ErrorHandler("No se admiten arcivhos mayores a 2MB.", 400))

    }


    file.mv(`${process.env.UPLOAD_PATH}/${file.name}`, async err => {
        if (err) {
            console.log(err)
            return next(new ErrorHandler('Carga de la imagen falló', 500))
        }

        const imagePath = `${process.env.UPLOAD_PATH}/${file.name}`;

        res.status(200).json({
            success: true,
            message: 'Imagen subida correctamente',
            data: imagePath
        })
    })
})