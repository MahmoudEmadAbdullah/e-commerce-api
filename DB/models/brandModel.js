const mongoose = require('mongoose');


//Create Schema
const brandSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'brnad required'],
            minlength: [2, 'Too short brand'],
            maxlength: [25, 'Too long brand'],
            unique: true
        },
        slug: {
            type: String,
            lowercase: true,
            unique: true
        },
        image:{
            type: String
        },
    }, 
    {timestamps: true, collection:'brands'}
);


//Create model
const BrandModel = mongoose.model('Brand', brandSchema);

module.exports = BrandModel;