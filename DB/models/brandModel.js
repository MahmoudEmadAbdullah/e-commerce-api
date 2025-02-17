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
    {timestamps: true}
);


// Function to append the full URL to the image field if it exists
const setImageURL = (doc) => {
    if(doc.image) {
        const imageUrl = `${process.env.BASE_URL}/brands/${doc.image}`;
        doc.image = imageUrl; // Update the image field with the full URL
    }
};

/**
 * Post 'init' middleware: Runs after retrieving a document from the database
 * This applies when using findOne, findAll, or update operations
 */
brandSchema.post('init', function(doc) {
    setImageURL(doc);
});

/**
 * Post 'save' middleware: Runs after creating a new document
 * This applies when using create operations
 */
brandSchema.post('save', function(doc) {
    setImageURL(doc);
});


//Create model
const BrandModel = mongoose.model('Brand', brandSchema);

module.exports = BrandModel;