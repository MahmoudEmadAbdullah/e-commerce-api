const path = require('path');

const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

dotenv.config({path: './config.env'});
const { connectRedis } = require('./src/config/redisConfig');
const ApiError = require('./src/utils/apiError');
const globalError = require('./src/middlewares/errorMiddleware');
const dbConnection = require('./DB/database');

//Routes
const mountRoute = require('./src/routes/index');


//Cnnect with db
dbConnection();

//express app
const app = express();

// Connect to Redis
(async () => {
    await connectRedis();
})();

//Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

if(process.env.NODE_ENV === 'development') {
    app.use(morgan("dev"));
    console.log(`mode: ${process.env.NODE_ENV}`);
};

//Mount Routes
mountRoute(app);

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
