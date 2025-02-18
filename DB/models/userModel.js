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
        phone: {
            type: String,
            unique: true,
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
        }
    }, 
    {timestamps: true}
);


//Using pre middleware to hash the password before saving
userSchema.pre('save', async function(next) {
    if(!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});


//Create model
const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;