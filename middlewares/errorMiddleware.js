const ErrorHandler = require('../utils/errorHandler')

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;

    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            success: false,
            error: err,
            errMessage: err.message,
            stack: err.stack
        });
    }

    if (process.env.NODE_ENV === 'production') {
        let error = { ...err };

        error.message = err.message;

        //Wrong mongoose Object ID error
        if (err.name === 'CastError') {
            const message = `Resource not found, invalid: ${err.path}`;

            error = new ErrorHandler(message, 404)
        }

        // Handling mongoose validation error
        if (err.name === 'ValidationError') {
            const message = Object.values(err.errors).map(values => values.message);

            error = new ErrorHandler(message, 400)
        }

        // Handle mongoose duplicate key error
        if (err.code === 11000) {
            const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
            error = new ErrorHandler(message, 400);
        }

        //Handle Wrong JWT token error
        if (err.name === 'JsonWebTokenError') {
            const message = 'JSON Web Token inválido. Inténtelo nuevamente';
            error = new ErrorHandler(message, 500);
        }

        // Handle JWT Token expired
        if (err.name === 'TokenExpiredError') {
            const message = 'JSON Web Token ha expirado. Ingresar nuevamente.'
            error = new ErrorHandler(message, 500);
        }

        res.status(error.statusCode).json({
            success: false,
            message: error.message || 'Internal Server Error.'
        });
    }
}