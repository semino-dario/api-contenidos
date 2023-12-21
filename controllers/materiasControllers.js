const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const Materia = require('../models/materias');
const ErrorHandler = require('../utils/errorHandler');
const AWS = require("aws-sdk");
const bucketName = process.env.BUCKET;

const s3 = new AWS.S3

// Get all materias => api/v1/articulos

exports.getMaterias = catchAsyncErrors(async (req, res, next) => {

    try {
        const materias = await Materia.find()

        // Fetch object URLs for each materia
        const materiasWithUrls = await Promise.all(
            materias.map((materia) => {
                // Fetch the object URL from S3 using the object key stored in the database
                const objectKey = materia.image;
                const params = {
                    Bucket: bucketName,
                    Key: objectKey,
                };

                const signedUrl = s3.getSignedUrl('getObject', params);

                // Preserve line breaks in the content
                const formattedContent = materia.content.replace(/\n/g, '<br>');

                // Append the signed URL to the materia data
                return { ...materia.toObject(), imageUrl: signedUrl, content: formattedContent };
            })
        );

        res.status(200).json({
            success: true,
            results: materiasWithUrls.length,
            data: materiasWithUrls
        })

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }

})

// Create new materia

exports.newMateria = catchAsyncErrors(async (req, res, next) => {

    const materia = await Materia.create(req.body);

    res.status(200).json({
        success: true,
        message: 'la materia ha sido publicada.',
        data: materia
    })

})

// Get a single materia by ID and slug api/v1/articulo/:id/:slug

exports.getOneMateria = catchAsyncErrors(async (req, res, next) => {

    const materia = await Materia.find({ $and: [{ _id: req.params.id }, { slug: req.params.slug }] });

    if (!materia || materia.length === 0) {
        return next(new ErrorHandler('Materia no encontrado', 404))
    }

    res.status(200).json({
        success: true,
        data: materia
    })
})

// Update an materia /api/v1/materia/:id

exports.updateMateria = catchAsyncErrors(async (req, res, next) => {

    let materia = await Materia.findById(req.params.id);

    if (!materia) {
        return next(new ErrorHandler('Materia no encontrado', 404))

    }

    materia = await Materia.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    });

    res.status(200).json({
        success: true,
        message: "Materia modificada correctamente",
        data: materia
    })
})

// Delete an materia /api/v1/materia/:id

exports.deleteMateria = catchAsyncErrors(async (req, res, next) => {

    try {
        let materia = await Materia.findById(req.params.id);

        if (!materia) {
            return next(new ErrorHandler('Materia no encontrada', 404))
        }

        // Delete the image from the S3 bucket using the object key stored in the materia
        const objectKey = materia.image;

        const deleteParams = {
            Bucket: bucketName,
            Key: objectKey,
        };

        // Delete the object from S3
        await s3.deleteObject(deleteParams).promise();

        materia = await Materia.findByIdAndDelete(req.params.id);

        // Respond with success message or other data
        res.status(200).json({
            success: true,
            message: "Materia e imagen eliminados",
        });
    }
    catch (error) {
        console.log(error)
        return next(new ErrorHandler("Error al eliminar la materia", 500))
    }
});


