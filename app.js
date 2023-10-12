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
const hpp = require('hpp');
const cors = require('cors');

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

//Limite rate of request
const limiter = rateLimit({
    windows: 10 * 60 * 1000, //10 mins
    max: 100
})

app.use(limiter);

//Setup cors // Enable access by other domains
const corsOptions = {
    origin: ['http://localhost:3001', 'https://gerontovida-muestra.netlify.app'],
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
// app.use(cors({
//     origin: 'http://localhost:3000',
//     methods: 'GET,POST,PUT,DELETE',
//     credentials: true,
// }));
//Importing routes
const articulos = require('./routes/articles');
const auth = require('./routes/auth');
const user = require('./routes/user');

app.use('/api/v1', articulos);
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