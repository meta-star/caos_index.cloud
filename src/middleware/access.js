"use strict";
// Check the role for the request required, and interrupt if the requirement is not satisfied.

// Import StatusCodes
const {StatusCodes} = require('http-status-codes');

// Export (function)
module.exports = (req, res, next) => {
    if (!req?.authenticated) {
        res.sendStatus(StatusCodes.UNAUTHORIZED);
        return;
    }
    next();
};
