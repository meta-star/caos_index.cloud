"use strict";

require('dotenv').config();

const
    {StatusCodes} = require('http-status-codes');

const
    constant = require('./src/init/const'),
    ctx = {
        now: () => Math.floor(new Date().getTime() / 1000),
        cache: require('./src/init/cache'),
        database: require('./src/init/database'),
        jwt_secret: require('./src/init/jwt_secret')
    };

const app = require('./src/init/express')(ctx);

const controllers = [
    require('./src/controllers/v1/index')
];

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
app.get('/robots.txt', (_, res) => res.type('txt').send("User-agent: *\nDisallow: /"));

controllers.forEach((c) => c(ctx, app));

console.log(`${constant.APP_NAME} (runtime: ${process.env.RUNTIME_ENV || "native"})\n====`);
require('./src/execute')(app, ({type, hostname, port}) => {
    const protocol = type === 'general' ? 'http' : 'https';
    console.log(`Protocol "${protocol}" is listening at`);
    console.log(`${protocol}://${hostname}:${port}`);
});
