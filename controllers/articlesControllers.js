const fs = require('fs');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const Article = require('../models/articles');
const ErrorHandler = require('../utils/errorHandler');
const path = require('path');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET // 
});

exports.getArticles = catchAsyncErrors(async (req, res, next) => {

    try {
        const articles = await Article.find()

        // Fetch object URLs for each article
        const articlesWithUrls = await Promise.all(
            articles.map((article) => {
                // Fetch the object URL from S3 using the object key stored in the database
                const objectKey = article.image;

                const formattedContent = article.content.replace(/\n/g, '<br>');

                // Append the signed URL to the article data
                return { ...article.toObject(), imageUrl: objectKey, content: formattedContent };
            })
        );

        res.status(200).json({
            success: true,
            results: articlesWithUrls.length,
            data: articlesWithUrls
        })

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }

})

// Create new article

exports.newArticle = catchAsyncErrors(async (req, res, next) => {

    const article = await Article.create(req.body);

    res.status(200).json({
        success: true,
        message: 'el Artículo ha sido publicado.',
        data: article
    })

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

    try {
        let article = await Article.findById(req.params.id);

        if (!article) {
            return next(new ErrorHandler('Artículo no encontrado', 404))
        }

        article = await Article.findByIdAndDelete(req.params.id);

        // Respond with success message or other data
        res.status(200).json({
            success: true,
            message: "Artículo eliminado",
        });
    }
    catch (error) {
        console.log(error)
        return next(new ErrorHandler("Error al eliminar el artículo", 500))
    }
});


//Upload image / api / v1 / articule / image

exports.uploadImage = catchAsyncErrors(async (req, res, next) => {

    //Check the files
    if (!req.files) {
        return next(new ErrorHandler('Por favor subir una imagen', 400))
    }

    const file = req.files.File;

    console.log(req.files.File)

    const supportedFiles = /.jpg|.jpeg|.png|.webp/;

    if (!supportedFiles.test(path.extname(file.name))) {
        return next(new ErrorHandler('Sólo archivos jpg, jpeg, png o webp', 400))
    }

    //Check document size
    if (file.size > process.env.MAX_FILE_SIZE) {
        return next(new ErrorHandler("Máximo 2MB.", 400))

    }

    // Ruta temporal en la carpeta public/images para guardar el archivo
    const publicImagesPath = path.join(__dirname, '..', 'public', 'images');
    const tempFilePath = path.join(publicImagesPath, file.name);

    // Mover el archivo a la carpeta public/images
    await file.mv(tempFilePath);

    try {
        // Subir el archivo a Cloudinary
        const uploadResult = await cloudinary.uploader.upload(tempFilePath);

        // Eliminar el archivo temporal después de subirlo
        await unlinkAsync(tempFilePath);

        // Responder con un mensaje de éxito
        res.status(200).json({
            success: true,
            message: "Image uploaded and stored",
            imageUrl: uploadResult.secure_url,
            objectKey: file.name
        });
    } catch (error) {
        // Eliminar el archivo temporal si hubo un error
        await unlinkAsync(tempFilePath);
        console.error('Error al subir la imagen a Cloudinary:', error);
        return next(new ErrorHandler('Error al subir la imagen a Cloudinary', 500));
    }




    // const path = `./public/images/${file.name}`;


    // const uploadResult = await cloudinary.uploader.upload(path).catch((error) => { console.log(error) });

    // console.log(uploadResult);

    // // Respond with success message or other data
    // res.status(200).json({
    //     success: true,
    //     message: "Image uploaded and stored",
    //     imageUrl: uploadResult.url,
    // });
    // ;



})


