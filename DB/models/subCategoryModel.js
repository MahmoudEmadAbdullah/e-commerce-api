
const mongoose = require('mongoose');

//Create Schema
const subCategorySchema = new mongoose.Schema(
    {
        name : {
            type: String,
            trim: true,
            unique: true,
            minlength: [2, 'Too short subCategory'],
            maxlength: [25, 'Too long subCategory']
        },
        slug: {
            type: String,
            lowercase: true,
            unique: true
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'SubCategory must be belong to parent category']
        },
    }, 
    {timestamps: true}
);


//Mongoose query middleware
subCategorySchema.pre(/^find/, function(next){
    const options = this.getOptions();
    if(options.disableCategoryPopulation) {
        return next();
    }
    this.populate({path: 'category', select: 'name -_id'});
    next();
});


//Create model
const SubCategoryModel = mongoose.model('SubCategory', subCategorySchema);

module.exports = SubCategoryModel;