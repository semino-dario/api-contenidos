const mongoose = require('mongoose');
const slugify = require('slugify');

const articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, ' Por favor ingrese un título.']
    },
    content: {
        type: String,
        required: [true, ' Por favor ingrese contenido.']
    },
    author: {
        type: String,
        required: [true, ' Por favor ingrese autor.']
    },
    image: {
        type: String,
        //  required: [true, ' Por favor subir una imagen.']
    },
    slug: String,
    tags: {
        type: String,
        trim: true
    },
    publishedDate: {
        type: Date,
        default: Date.now
    }
})

// Creating the Article slug before saving
articleSchema.pre('save', function (next) {
    this.slug = slugify(this.title, { lower: true })

    next();
})

module.exports = mongoose.model('Article', articleSchema);



