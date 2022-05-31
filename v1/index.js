const {Router} = require('express');

const router = Router();
const routes = [
    require('./automate'),
    require('./register'),
    require('./weather'),
];

module.exports = (ctx, app) => {
    routes.forEach((c) => c(ctx, router));
    app.use('/v1', router);
};
