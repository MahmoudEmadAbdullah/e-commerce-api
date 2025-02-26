const path = require('path');

const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');

dotenv.config({path: './config.env'});
const ApiError = require('./src/utils/apiError');
const globalError = require('./src/middlewares/errorMiddleware');
const dbConnection = require('./DB/database');

//Routes
const categoryRoute = require('./src/routes/categoryRoute');
const subCategoryRoute = require('./src/routes/subCategoryRoute');
const brandRoute = require('./src/routes/brandRoute');
const productRoute = require('./src/routes/productRoute');
const userRoute = require('./src/routes/userRoute');
const authRoute = require('./src/routes/authRoute');
const reviewRoute = require('./src/routes/reviewRoute');
const wishlistRoute = require('./src/routes/wishlistRoute');
const addressRoute = require('./src/routes/addressRoute');


//Cnnect with db
dbConnection();

//express app
const app = express();

//Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({extended: true}));

if(process.env.NODE_ENV === 'development') {
    app.use(morgan("dev"));
    console.log(`mode: ${process.env.NODE_ENV}`);
};

//Mount Routes
app.use('/api/categories', categoryRoute);
app.use('/api/subCategories', subCategoryRoute);
app.use('/api/brands', brandRoute);
app.use('/api/products', productRoute);
app.use('/api/users', userRoute);
app.use('/api/auth', authRoute);
app.use('/api/reviews', reviewRoute);
app.use('/api/wishlist', wishlistRoute);
app.use('/api/addresses', addressRoute);

app.all('*', (req, res, next) => {
    next(new ApiError(`Can't find this route: ${req.originalUrl}`, 400));
});


//Global error Handler Middleware for express
app.use(globalError);


//Server
const port = process.env.PORT || 4000;
const server = app.listen(port, () => {
    console.log(`Server Running on port ${port}...`);
});


//Handle rejection outside express
process.on('unhandledRejection', (err) => {
    console.error(`UnhandledRejection Errors ${err.name} | ${err.message}`);
    server.close(() => {
        console.log(`Shutting down...`);
        process.exit(1);
    });
});
