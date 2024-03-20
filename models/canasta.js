const mongoose = require('mongoose');

const canastaSchema = new mongoose.Schema({
    numero: {
        type: Number,
        // required: [true, ' Por favor ingrese número de canasta']
    },
    periodo: {
        type: String,
        required: [true, ' Por favor ingrese período.']
    },
    canasta: {
        type: Number,
        required: [true, ' Por favor ingrese total canasta.']
    },
    minima: {
        type: Number,
        required: [true, ' Por favor ingrese jubilación mínima del período.']
    },
    categorias: {
        vivienda: {
            type: Number,
            required: [true, 'Completar vivienda']
        },
        transporte: {
            type: Number,
            required: [true, 'Completar transporte']
        },
        vestimenta: {
            type: Number,
            required: [true, 'Completar vestimenta']
        },
        recreacion: {
            type: Number,
            required: [true, 'Completar recreación']
        },
        servicios: {
            type: Number,
            required: [true, 'Complertar servicios']
        },
        alimentos: {
            type: Number,
            required: [true, 'Complertar alimentos']
        },
        limpieza: {
            type: Number,
            required: [true, 'Complertar limpieza']
        },
        medicamentos: {
            type: Number,
            required: [true, 'Complertar medicamentos']
        },
        farmacia: {
            type: Number,
        }
    },
    pdf: {
        type: String,
        required: [true, ' Por favor subir archivo pdf.']

    },
    publishedDate: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Canasta', canastaSchema);
