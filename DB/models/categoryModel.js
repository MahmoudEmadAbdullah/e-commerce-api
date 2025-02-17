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
    {timestamps: true}
);


// Function to append the full URL to the image field if it exists
const setImageURL = (doc) => {
    if(doc.image) {
        const imageUrl = `${process.env.BASE_URL}/categories/${doc.image}`;
        doc.image = imageUrl; // Update the image field with the full URL
    }
};

/**
 * Post 'init' middleware: Runs after retrieving a document from the database
 * This applies when using findOne, findAll, or update operations
 */
categorySchema.post('init', function(doc) {
    setImageURL(doc);
});

/**
 * Post 'save' middleware: Runs after creating a new document
 * This applies when using create operations
 */
categorySchema.post('save', function(doc) {
    setImageURL(doc);
});


//Create model
const CategoryModel = mongoose.model("Category", categorySchema);

module.exports = CategoryModel;