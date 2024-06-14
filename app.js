const express = require('express');
const dotenv = require('dotenv')
const app = express();
const connectDB = require('./config/db')
const errorMiddleware = require('./middlewares/errorMiddleware')
const ErrorHandler = require('./utils/errorHandler')
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload')
//Securty mesures
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const cors = require('cors');
const hpp = require('hpp');



// const serverless = require('serverless-http')


// Serve static files from the 'public' directory
app.use(express.static('public'));

//Setting up config.env file variables
dotenv.config({ path: './config/config.env' });


//Handlling uncaught exception
process.on('uncaughtException', err => {
    console.log(`ERROR ${err.message}`);
    console.log('Shutting down due to uncaught exception')
    process.exit(1);
})

//Connecting with db
connectDB();

//Setup Security headers
app.use(helmet());

//Setup body parser to read json from request body
app.use(express.json());

//Setup cookie parser
app.use(cookieParser());

//Handle fileuploads
app.use(fileUpload())

//Sanitize data
app.use(mongoSanitize());

//Prevent XSS attacks
app.use(xssClean());

//Prevent parameter pollution
app.use(hpp());

// Limite rate of request
const limiter = rateLimit({
    window: 10 * 60 * 1000, //10 mins
    max: 100
})

app.use(limiter);


//Setup cors // Enable access by other domains
const LOCAL = process.env.LOCAL_URL //Localhost
const FRONT = process.env.FRONT_URL // Netlifly
const GERONTO = process.env.GERONTO_URL // Gerontovida site
const LOCAL_DASHBOARD = process.env.LOCAL_DASHBOARD // Dasboard local

const corsOptions = {
    //origin: [FRONT, GERONTO, LOCAL_DASHBOARD],
    origin: '*',
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

//Importing routes
const articulos = require('./routes/articles');
const canasta = require('./routes/canasta');
const auth = require('./routes/auth');
const user = require('./routes/user');

app.use('/api/v1', articulos);
app.use('/api/v1', canasta)
app.use('/api/v1', auth);
app.use('/api/v1', user);

// Handle unhandled routes
app.all('*', (req, res, next) => {
    next(new ErrorHandler(`${req.originalUrl} route not found`, 404))
}
)


//Middleware to habdle errors
app.use(errorMiddleware);

const PORT = process.env.PORT;

const server = app.listen(PORT, () => {
    console.log(`Server started on port ${process.env.PORT} in ${process.env.NODE_ENV} mode.`)
});

//Handling unhandled promise rejection

process.on('unhandledRejection', err => {
    console.log(`Error: ${err.message}`);
    console.log('Shutting down the server due to unhandled promise rejection')
    server.close(() => {
        process.exit(1);
    })
});


