const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const Article = require('../models/articles');
const ErrorHandler = require('../utils/errorHandler');
const path = require('path');
const AWS = require("aws-sdk");
const bucketName = process.env.BUCKET;
// const s3 = new AWS.S3({
//     accessKeyId: process.env.CLAVE_AWS,
//     secretAccessKey: process.env.CLAVE_AWS_SECRETA,
//     region: process.env.BUCKET_REGION,

// });
const s3 = new AWS.S3
// Get all articles => api/v1/articulos

exports.getArticles = catchAsyncErrors(async (req, res, next) => {

    try {
        const articles = await Article.find()

        // Fetch object URLs for each article
        const articlesWithUrls = await Promise.all(
            articles.map((article) => {
                // Fetch the object URL from S3 using the object key stored in the database
                const objectKey = article.image;
                const params = {
                    Bucket: bucketName,
                    Key: objectKey,
                };

                const signedUrl = s3.getSignedUrl('getObject', params);

                // Preserve line breaks in the content
                const formattedContent = article.content.replace(/\n/g, '<br>');

                // Append the signed URL to the article data
                return { ...article.toObject(), imageUrl: signedUrl, content: formattedContent };
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

        // Delete the image from the S3 bucket using the object key stored in the article
        const objectKey = article.image;

        const deleteParams = {
            Bucket: bucketName,
            Key: objectKey,
        };

        // Delete the object from S3
        await s3.deleteObject(deleteParams).promise();

        article = await Article.findByIdAndDelete(req.params.id);

        // Respond with success message or other data
        res.status(200).json({
            success: true,
            message: "Artículo e imagen eliminados",
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
    //const imagePath = `${process.env.UPLOAD_PATH}/${file.name}`;

    console.log(req.files.File)
    //Check file type

    const supportedFiles = /.jpg|.jpeg|.png|.webp/;

    if (!supportedFiles.test(path.extname(file.name))) {
        return next(new ErrorHandler('Sólo archivos jpg, jpeg, png o webp', 400))
    }

    //Check document size
    if (file.size > process.env.MAX_FILE_SIZE) {
        return next(new ErrorHandler("Máximo 2MB.", 400))

    }

    // Specify your bucket name and object key
    const objectKey = `images/${file.name}`;


    // Generate the URL for the image
    const imageUrl = s3.getSignedUrl("getObject", {
        Bucket: bucketName,
        Key: objectKey,
    });

    // Upload the image to the S3 bucket
    const s3Params = {
        Body: file.data, // Use file.data to get the file content
        Bucket: bucketName,
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
            objectKey: objectKey
        });
    });



})


