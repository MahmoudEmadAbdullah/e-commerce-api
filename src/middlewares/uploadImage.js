const multer = require('multer');
const ApiError = require('../utils/apiError');


const multerOptions = () => {
    const storage = multer.memoryStorage();

    const fileFilter = function(req, file, cb) {
        if(!file.mimetype.startsWith('image/')){
            return cb(new ApiError('Only images allowed', 400), false);
        }
        cb(null, true);
    };

    const upload = multer({storage: storage, fileFilter: fileFilter});
    return upload;
};


exports.uploadSingleImage = (fieldName) => multerOptions().single(fieldName);
exports.uploadMixOfImages = (arrayOfFields) => multerOptions().fields(arrayOfFields);  


