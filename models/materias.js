const mongoose = require('mongoose');

const materiaSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: [true, ' Por favor ingrese título principal']
    },
    contenido: {
        type: String,
        required: [true, ' Por favor ingrese texto.']
    },
    imgURL: {
        type: String,
    },
    video: {
        type: String,
    },
    pdf: {
        type: String,
    },
    publishedDate: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Materia', materiaSchema);
