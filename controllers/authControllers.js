const User = require('../models/user');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const ErrorHandler = require('../utils/errorHandler');
const sendToken = require('../utils/jwtToken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

//Register a new user => /api/v1/register

exports.registerUser = catchAsyncErrors(async (req, res, next) => {
    const { name, email, password, role } = req.body;
    try {
        const user = await User.create({
            name,
            email,
            password,
            role
        })

        sendToken(user, 200, res)
    }

    catch (error) {
        const customError = {
            message: 'Error registering user',
            originalError: error.message,
            stack: error.stack,
        };

        res.status(400).json({
            error: customError
        })
    }

})

// Login user => api/v1/ogin

exports.loginUser = catchAsyncErrors(async (req, res, next) => {

    const { email, password } = req.body;

    //Check if email or password is entered by user

    if (!email || !password) {

        return next(new ErrorHandler('Por favor ingresar email y contraseña', 400))
    }

    //Finding user in database
    const user = await User.findOne({ email }).select('+password')

    if (!user) {
        return next(new ErrorHandler('Email o contraseña inválidos', 401))
    }

    //Check if password is correct

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
        return next(new ErrorHandler('Email o contraseña inválidos', 401))
    }

    sendToken(user, 200, res)
})

// Forgot password => api/v1/password/forgot

exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {

    const user = await User.findOne({ email: req.body.email });

    //Check user email in database

    if (!user) {
        return next(new ErrorHandler('Email no registrado.', 404))
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    console.log(resetToken)
    await user.save({ validateBeforeSave: false })

    // Create reset password url 

    const resetUrl = `${req.protocol}://localhost:3001/new-password/${resetToken}`;
    //const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/password/reset/${resetToken}`;

    const message = `Ingresar al siguiente link para recuperar la contraseña: \n\n${resetUrl}\n\n`

    const link = `\n\n${resetUrl}\n\n`
    try {
        await sendEmail({

            email: user.email,
            subject: 'Password recovery',
            message
        })

        res.status(200).json({
            success: true,
            message: `Email enviado con éxito a ${user.email}`,
            link: link
        })
    }

    catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false });

        return next(new ErrorHandler('Email is not sent', 500))

    }
})

// Reset password => api/v1/password/reset/:token

exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
    // Hash url token
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    })

    if (!user) {
        return next(new ErrorHandler('Password reset token inválido o ha expirado', 400))
    }

    //Setup new password
    user.password = req.body.password;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendToken(user, 200, res);
})

// Logout user => /api/v1/logout

exports.logout = catchAsyncErrors(async (req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now()),
        httpOnly: true
    })

    res.status(200).json({
        success: true,
        message: 'Salió sin problemas'
    })

})