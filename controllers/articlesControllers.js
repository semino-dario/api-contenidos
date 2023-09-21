const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const Article = require('../models/articles');
const ErrorHandler = require('../utils/errorHandler');
const path = require('path');
const AWS = require("aws-sdk");
const s3 = new AWS.S3()

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

    // Respond with success message or other data
    res.status(200).json({
        success: true,
        message: "Artículo eliminado",
        data: data,
    });
});




// Upload image /api/v1/articule/image

exports.uploadImage = catchAsyncErrors(async (req, res, next) => {

    //Check the files
    if (!req.files) {
        return next(new ErrorHandler('Por favor subir una imagen', 400))
    }

    const file = req.files.File;
    //const imagePath = `${process.env.UPLOAD_PATH}/${file.name}`;

    console.log(req.files.File)
    //Check file type

    const supportedFiles = /.jpg|.png|.webp/;

    if (!supportedFiles.test(path.extname(file.name))) {
        return next(new ErrorHandler('Por favor subir un archivo de imagen jpg, png o webp', 400))
    }

    //Check document size
    if (file.size > process.env.MAX_FILE_SIZE) {
        return next(new ErrorHandler("No se admiten arcivhos mayores a 2MB.", 400))

    }

    // Specify your bucket name and object key
    const bucketName = "cyclic-lazy-duck-outfit-sa-east-1";
    const objectKey = `images/${file.name}`; // Adjust the key as per your object's location

    // Generate the URL for the image
    const imageUrl = s3.getSignedUrl("getObject", {
        Bucket: bucketName,
        Key: objectKey,
    });

    // Upload the image to the S3 bucket
    const s3Params = {
        Body: file.data, // Use file.data to get the file content
        Bucket: "cyclic-lazy-duck-outfit-sa-east-1",
        Key: `images/${file.name}`, // Specify the desired path in your S3 bucket
    };

    s3.putObject(s3Params, (err, data) => {
        if (err) {
            console.error("Error uploading to S3:", err);
            return next(new ErrorHandler("Failed to upload image to S3", 500));
        }

        // Respond with success message or other data
        res.status(200).json({
            success: true,
            message: "Image uploaded and stored in S3",
            s3Data: data,
            imageUrl: imageUrl,
        });
    });



})