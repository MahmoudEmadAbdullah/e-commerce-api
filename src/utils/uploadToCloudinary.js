const cloudinary = require('../config/cloudinaryConfig');
const ApiError = require('./apiError');

const uploadToCloudinary = (fileBuffer, folder, publicId) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'image',
                folder,
                public_id: publicId,
                format: 'jpg',
                transformation: [
                    { width: 2000, height: 1333, crop: 'limit', quality: 95 }
                ]
            },
            (error, result) => {
                if(error) {
                    console.error('Error uploading image to Cloudinary:', error); // Debugging
                    return reject(new ApiError('Failed to upload image to Cloudinary', 500));
                }
                resolve(result.secure_url);
            }
        );
        stream.end(fileBuffer)
    });
};

module.exports = uploadToCloudinary;