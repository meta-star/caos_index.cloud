const {StatusCodes} = require('http-status-codes');
const {Router} = require('express');

const access = require('../../middlewares/access');

const feature_router = Router();

module.exports = (ctx, router) => {
    feature_router.get('/switch', (_, res) => {
        res.sendStatus(StatusCodes.SERVICE_UNAVAILABLE);
    });
    feature_router.post('/switch', (_, res) => {
        res.sendStatus(StatusCodes.SERVICE_UNAVAILABLE);
    });
    feature_router.get('/switch/arduino', access, (req, res) => {
        res.send(req.authenticated);
    });
    router.use('/automate', feature_router);
};
