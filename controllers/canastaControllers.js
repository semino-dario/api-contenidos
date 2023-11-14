const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const ErrorHandler = require('../utils/errorHandler');
const Canasta = require('../models/canasta')
const path = require('path');
const AWS = require("aws-sdk");
const bucketName = process.env.BUCKET;
// const s3 = new AWS.S3({
//     accessKeyId: process.env.CLAVE_AWS,
//     secretAccessKey: process.env.CLAVE_AWS_SECRETA,
//     region: process.env.BUCKET_REGION,

// });
const s3 = new AWS.S3()
// Create new Canasta

exports.newCanasta = catchAsyncErrors(async (req, res, next) => {

    const canasta = await Canasta.create(req.body)

    res.status(200).json({
        success: true,
        message: 'La canasta ha sido publicada',
        data: canasta
    })

})

// Get all canastas

exports.getAllCanastas = catchAsyncErrors(async (req, res, next) => {

    const canastas = await Canasta.find()

    res.status(200).json({
        success: true,
        results: canastas.length,
        data: canastas
    })

})

//Get a single Canasta

exports.getCanasta = catchAsyncErrors(async (req, res, next) => {

    const canasta = await Canasta.findById(req.params.id)

    if (!canasta) {
        return next(new ErrorHandler('Canasta no encontrada', 404))
    }

    res.status(200).json({
        sucess: true,
        data: canasta
    })
}

)

//Updata Canasta

exports.updateCanasta = catchAsyncErrors(async (req, res, next) => {

    let canasta = await Canasta.findById(req.params.id)

    if (!canasta) {
        return next(new ErrorHandler('Canasta no encontrada', 404))
    }

    canasta = await Canasta.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success: true,
        message: "Canasta modificada correctamente",
        data: canasta
    })
})

//Delete Canasta


exports.deleteCanasta = catchAsyncErrors(async (req, res, next) => {

    try {
        let canasta = await Canasta.findById(req.params.id);

        if (!canasta) {
            return next(new ErrorHandler('Canasta no encontrada', 404))
        }


        // Delete the image from the S3 bucket using the object key stored in the article
        const objectKey = canasta.pdf;

        const deleteParams = {
            Bucket: bucketName,
            Key: objectKey,
        };

        // Delete the object from S3
        await s3.deleteObject(deleteParams).promise();

        canasta = await Canasta.findByIdAndDelete(req.params.id);

        // Respond with success message or other data
        res.status(200).json({
            success: true,
            message: "Canasta y PDF eliminados",
        });
    }
    catch (error) {
        console.log(error)
        return next(new ErrorHandler("Error al eliminar canasta", 500))
    }
});


//Upload pdf / api / v1 / canastas / pdf

exports.uploadPdf = catchAsyncErrors(async (req, res, next) => {

    //Check the files
    if (!req.files) {
        return next(new ErrorHandler('Por favor subir un archivo.', 400))
    }

    const file = req.files.File;
    //const imagePath = `${process.env.UPLOAD_PATH}/${file.name}`;

    // console.log(req.files.File)
    //Check file type

    const supportedFiles = /.pdf/;

    if (!supportedFiles.test(path.extname(file.name))) {
        return next(new ErrorHandler('Sólo archivos pdf', 400))
    }

    //Check document size
    if (file.size > process.env.MAX_FILE_SIZE) {
        return next(new ErrorHandler("Máximo 2MB.", 400))

    }

    // Specify your bucket name and object key
    const objectKey = `canastas/${file.name}`;


    // Generate the URL for the file
    const imageUrl = s3.getSignedUrl("getObject", {
        Bucket: bucketName,
        Key: objectKey,
    });

    // Upload the file to the S3 bucket
    const s3Params = {
        Body: file.data, // Use file.data to get the file content
        Bucket: bucketName,
        Key: `canastas/${file.name}`, // Specify the desired path in your S3 bucket
    };

    s3.putObject(s3Params, (err, data) => {
        if (err) {
            console.error("Error uploading to S3:", err);
            return next(new ErrorHandler("Failed to upload file to S3", 500));
        }

        // Respond with success message or other data
        res.status(200).json({
            success: true,
            message: "File uploaded and stored in S3",
            s3Data: data,
            imageUrl: imageUrl,
            objectKey: objectKey
        });
    });
})

// Download file from the S3 bucket /canastas/download:id

exports.downloadFile = catchAsyncErrors(async (req, res, next) => {

    const canasta = await Canasta.findById(req.params.id)

    const file = canasta.pdf

    const s3Params = {
        Bucket: bucketName,
        Key: file, // Specify the desired path in your S3 bucket
    };


    // Set the Content-Type header to application/pdf
    res.setHeader('Content-Type', 'application/pdf');

    s3.getObject(s3Params, (err, data) => {
        if (err) {
            return next(new ErrorHandler("Hubo un problema con el archivo", 500))
        }

        res.status(200).send(data.Body);

    }

    )

})



