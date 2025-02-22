const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const valid = require('validator')


//Create Schema
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'User name is required'],
            trim: true,
            minlength: [3, 'Too short user name'],
            maxlength: [20, 'Too long user name']
        },
        slug: {
            type: String,
            lowercase: true
        },
        email: {
            type: String,
            required: [true, 'email is required'],
            unique: true,
            lowercase: true,
            validate: {
                validator: (val) => {
                    return valid.isEmail(val);
                },
                message: 'Please enter a valid email address'
            }
        },
        password: {
            type: String,
            required: [true, 'password is required'],
            minlength: [8, 'Too short password'],
            validate: {
                validator: (val) => {
                    return /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(val);
                },
                message: "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character"
            }
        },
        passwordChangedAt: Date,
        passwordResetCode: String,
        passwordResetExpires: Date,
        passwordResetVerified: Boolean,
        phone: {
            type: String,
            unique: true,
            sparse: true,
            validate: {
                validator: (val) => {
                    return valid.isMobilePhone(val, ['ar-EG', 'ar-SA', 'ar-AE', 'en-US']);
                },
                message: 'Please enter a valid mobile phone'
            }
        },
        profileImage: {
            type: String,
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user'
        },
        active: {
            type: Boolean,
            default: true
        }
    }, 
    {timestamps: true}
);


// Pre-save middleware to hash the password, but only on document creation
userSchema.pre('save', async function(next) {
    if(!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});


// Function to append the full URL to the image field if it exists
const setProfileImageUrl = (doc) => {
    if(doc.profileImage) {
        const profileImageUrl = `${process.env.BASE_URL}/users/${doc.profileImage}`;
        doc.profileImage = profileImageUrl;
    }
};

/**
 * Post 'init' middleware: Runs after retrieving a document from the database
 * This applies when using findOne, findAll, or update operations
 */
userSchema.post('init', function(doc) {
    setProfileImageUrl(doc);
});

/**
 * Post 'save' middleware: Runs after creating a new document
 * This applies when using create operations
 */
userSchema.post('save', function(doc){
    setProfileImageUrl(doc)
});


//Create model
const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;