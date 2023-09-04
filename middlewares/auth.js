const jwt = require('jsonwebtoken');
const User = require('../models/user');
const catchAsyncErrors = require('./catchAsyncErrors');
const ErrorHandler = require('../utils/errorHandler');

//Check if the user is authenticated or not

exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {

    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
        return next(new ErrorHandler('Ingresar primero para acceder a este elemento', 401))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id)

    next();
})

//Handling authorized roles

exports.authorizeRoles = (...roles) => {

    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new ErrorHandler(`El rol ${req.user.role} no está atorizado para acceder a este recurso`, 403))
        }
        next();
    }
}