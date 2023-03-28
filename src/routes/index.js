"use strict";

// Routes
const routes = [
    require("./automate"),
    require("./machine"),
    require("./weather"),
];

// Load routes
module.exports = () => {
    routes.forEach((c) => c());
};
