const {Router} = require('express');
const {v4: uuidV4} = require('uuid');

const {issueAuthToken} = require("../../utils/caos_token");

module.exports = (ctx, r) => {
    const router = Router();

    router.get('/register', (_, res) => {
        const machine_id = uuidV4(null, null, null);
        const secret = issueAuthToken(ctx, machine_id, null);
        res.send({machine_id, secret});
    });

    r.use('/machine', router);
};
