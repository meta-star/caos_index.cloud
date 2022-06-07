"use strict";

// Load configs from .env
require('dotenv').config();

// Import StatusCodes
const
    {StatusCodes} = require('http-status-codes');

// Import modules
const
    constant = require('./src/init/const'),
    ctx = {
        now: () => Math.floor(new Date().getTime() / 1000),
        cache: require('./src/init/cache'),
        database: require('./src/init/database'),
        jwt_secret: require('./src/init/jwt_secret')
    };

// Import controllers
const controllers = [
    require('./src/controllers/v1/index')
];

// Initialize application
const app = require('./src/init/express')(ctx);

// General API Response
app.get('/', (_, res) => {
    res.send({
        status: StatusCodes.OK,
        data: {
            description: "caOS Cloud API Service",
            information: "https://caos.startw.cf/",
            copyright: "(c)2022 Star Inc."
        }
    });
});

// The handler for robots.txt (deny all friendly robots)
app.get('/robots.txt', (_, res) => res.type('txt').send("User-agent: *\nDisallow: /"));

// Register controllers
controllers.forEach((c) => c(ctx, app));

// Show status message
console.log(
    constant.APP_NAME,
    `(runtime: ${process.env.NODE_ENV}, ${process.env.RUNTIME_ENV || "native"})`,
    '\n===='
);
// Mount application and execute it
require('./src/execute')(app, ({type, hostname, port}) => {
    const protocol = type === 'general' ? 'http' : 'https';
    console.log(`Protocol "${protocol}" is listening at`);
    console.log(`${protocol}://${hostname}:${port}`);
});
