const path = require('path');
const fs = require('fs');

const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');

dotenv.config({path: './config.env'});
const { connectRedis } = require('./src/config/redisConfig');
const ApiError = require('./src/utils/apiError');
const globalError = require('./src/middlewares/errorMiddleware');
const dbConnection = require('./DB/database');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = JSON.parse(fs.readFileSync(path.join(__dirname, 'swagger.json'), 'utf8'));

//Routes
const mountRoute = require('./src/routes/index');
const { webhookCheckout } = require('./src/services/orderService');


//Cnnect with db
dbConnection();

//express app
const app = express();

// Connect to Redis
(async () => {
    await connectRedis();
})();

// Webhook
app.post(
    '/webhook-checkout',
    express.raw({ type: 'application/json' }),
    webhookCheckout
);

//Middlewares
app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cookieParser());
app.use(cors());
app.use(mongoSanitize()); // to prevent MongoDB Operator Injection.

if(process.env.NODE_ENV === 'development') {
    app.use(morgan("dev"));
    console.log(`mode: ${process.env.NODE_ENV}`);
};

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//Mount Routes
mountRoute(app);

// Define a basic welcome route
app.get('/', (req, res) => {
    res.send("Welcome to My E-Commerce API!");
});

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
