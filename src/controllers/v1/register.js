const {Router} = require('express');
const {v4: uuidV4} = require('uuid');

const {issueAuthToken} = require("../../utils/caos_token");

const feature_router = Router();

module.exports = (ctx, router) => {
    feature_router.get('/', (_, res) => {
        const machine_id = uuidV4(null, null, null);
        const secret = issueAuthToken(ctx, machine_id);
        res.send({machine_id, secret});
    });
    router.use('/register', feature_router);
};
