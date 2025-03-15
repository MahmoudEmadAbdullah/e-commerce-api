const mongoose = require('mongoose');


//Create Schema
const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Category required'],
            unique: true,
            minlength: [3, 'Too short category name'],
            maxlength: [25, 'Too long category']
        },
        slug: {
            type: String,
            lowercase: true,
            unique: true
        },
        image: {
            type: String,
        },
    },
    {timestamps: true, collection: 'categories'}
);


//Create model
const CategoryModel = mongoose.model("Category", categorySchema);

module.exports = CategoryModel;