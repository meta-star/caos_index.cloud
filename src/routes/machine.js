"use strict";

// Import useApp, express
const {useApp, express} = require("../init/express");

const {v4: uuidV4} = require("uuid");

// Create router
const {Router: newRouter} = express;
const router = newRouter();

// Request body parser middleware
router.use(express.urlencoded({extended: true}));

router.get("/register", (_, res) => {
    const machineId = uuidV4();
    const secret = "issueAuthToken()";
    res.send({machineId, secret});
});

// Export routes mapper (function)
module.exports = () => {
    // Use application
    const app = useApp();

    // Mount the router
    app.use("/machine", router);
};
