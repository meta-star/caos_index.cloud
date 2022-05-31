const {StatusCodes} = require('http-status-codes');
const {Router} = require('express');

const feature_router = Router();

module.exports = (ctx, router) => {
    feature_router.get('/', (_, res) => {
        res.sendStatus(StatusCodes.SERVICE_UNAVAILABLE);
    });
    router.use('/register', feature_router);
};
