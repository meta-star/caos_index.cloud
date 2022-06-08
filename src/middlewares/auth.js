"use strict";
// Validate "CAOS" header, but it will not interrupt the request.
// To interrupt the request which without the request, please use "access.js" middleware.

// Export (function)
module.exports = (ctx) => function (req, _, next) {
    const auth_code = req.header('CAOS');
    if (auth_code) {
        req.authenticated = require('../utils/caos_token')
            .validateAuthToken(ctx, req.auth_secret);
    }
    next();
};
