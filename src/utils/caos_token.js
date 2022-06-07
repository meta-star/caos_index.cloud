"use strict";
// Token utils of Sara.

// Import jsonwebtoken
const jwt = require('jsonwebtoken');

// Import SHA256 Generator
const {sha256} = require('js-sha256');

// Import UUID Generator
const {v4: uuidV4} = require('uuid');

// Define general_issue_options Generator
const general_issue_options = (metadata) => ({
    algorithm: "HS256",
    notBefore: "500ms",
    audience: process.env.WEBSITE_URL,
    issuer: sha256(metadata.ctx.jwt_secret),
    noTimestamp: false,
    mutatePayload: false
});

// Define general_validate_options Generator
const general_validate_options = (metadata) => ({
    algorithms: ["HS256"],
    audience: process.env.WEBSITE_URL,
    issuer: sha256(metadata.ctx.jwt_secret),
    complete: false
});

// Issue Function
function issueAuthToken(ctx, uuid, data = null) {
    const issue_options = general_issue_options({ctx});
    const payload = {sub: uuid, jti: uuidV4(null, null, null)};
    if (data) {
        payload.data = data;
    }
    return jwt.sign(payload, ctx.jwt_secret, issue_options, null);
}

// Validate Function
function validateAuthToken(ctx, token) {
    try {
        const validate_options = general_validate_options({ctx});
        return jwt.verify(token, ctx.jwt_secret, validate_options, null);
    } catch (e) {
        console.error(e);
        return false;
    }
}

// Export (object)
module.exports = {
    issueAuthToken,
    validateAuthToken,
};
