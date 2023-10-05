const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: [true, 'Ingresar nombre, por favor.']
    },

    email: {
        type: String,
        required: [true, 'Ingrese su email, por favor.'],
        unique: true,
        validate: [validator.isEmail, 'Inválido']
    },
    role: {
        type: String,
        enum: {
            values: ['admin', 'usuario', 'estudiante'],
            message: 'Por favor seleccione el rol correcto'
        },
        default: 'usuario'
    },
    password: {
        type: String,
        required: [true, 'Ingrese una contraseña, por favor.'],
        minLength: [8, 'Mínimo de 8 caracteres'],
        select: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
})

// Encrypting password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    this.password = await bcrypt.hash(this.password, 10)
})

//Return Json Web Token
userSchema.methods.getJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_TIME }

    )
}

// Compare user password with database password
userSchema.methods.comparePassword = async function (enterPassword) {
    return await bcrypt.compare(enterPassword, this.password);
}

// Generate password reset token 

userSchema.methods.getResetPasswordToken = function () {
    //Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash and set to resetPasswordToken

    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    //Set token expire time

    this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

    return resetToken;

}

module.exports = mongoose.model('User', userSchema);