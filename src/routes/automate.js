"use strict";

// Import modules
const {StatusCodes} = require("http-status-codes");

const {randomInt} = require("node:crypto");

// Import useApp, express
const {useApp, express} = require("../init/express");
const expressLongPoll = require("express-longpoll");

const {useDatabase} = require("../init/database");

const utilNative = require("../utils/native");

const middlewareValidator = require("express-validator");
const middlewareAccess = require("../middleware/access");
const middlewareInspector = require("../middleware/inspector");

const schemaAutomateItem = require("../schemas/AutomateItem");

// Create router
const {Router: newRouter} = express;
const router = newRouter();

const polling = expressLongPoll(router);
const database = useDatabase();

// Request body parser middleware
router.use(express.urlencoded({extended: true}));

const sensitiveEraser = (j) => {
    if (j.assign_code) {
        j.assign_code = null;
    }
    return j;
};

const middlewareDeviceParam = async (req, res, next) => {
    const commanderId = req.authenticated.sub;
    const AutomateItem = database.model("AutomateItem", schemaAutomateItem);
    const automateItem = await AutomateItem.findOne({
        "_id": req.params.id,
        "commander._id": commanderId,
    }).exec();
    if (!automateItem) {
        res.sendStatus(StatusCodes.NOT_FOUND);
        return;
    }
    req.device = automateItem;
    next();
};

const middlewareDeviceAuth = async (req, res, next) => {
    const deviceId = req.authenticated.sub;
    const AutomateItem = database.model("AutomateItem", schemaAutomateItem);
    const automateItem = await AutomateItem.findById(deviceId).exec();
    if (!automateItem) {
        res.status(StatusCodes.NOT_FOUND).send("Unregistered Device");
        return;
    }
    req.device = automateItem;
    next();
};

// Register/Update Item
router.put("/item",
    middlewareAccess(),
    middlewareValidator.body("features").isArray(),
    middlewareInspector,
    (req, res) => {
        const deviceId = req.authenticated.sub;
        const assignCode = randomInt(1000000000, 9999999999);
        const AutomateItem = database.model("AutomateItem", schemaAutomateItem);
        AutomateItem.findOneAndUpdate({_id: deviceId}, {
            features: req.body.features,
            assignCode,
        }, {upsert: true})
            .then(() => res.status(StatusCodes.CREATED).send({
                machine_id: deviceId,
                assign_code: assignCode,
                updated_features: req.body.features,
            }))
            .catch((e) => {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
                console.error(e);
            });
    },
);

// Manage device (for Commander)

router.get("/devices",
    middlewareAccess(),
    (req, res) => {
        const commanderId = req.authenticated.sub;
        const AutomateItem = database.model("AutomateItem", schemaAutomateItem);
        AutomateItem.find({"commander._id": commanderId})
            .then((i) => res.send(i.map(sensitiveEraser)))
            .catch((e) => {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
                console.error(e);
            });
    },
);

router.post("/device",
    middlewareAccess(),
    middlewareValidator.body("machine_id").isString(),
    middlewareValidator.body("assign_code").isNumeric(),
    middlewareInspector,
    async (req, res) => {
        const commanderId = req.authenticated.sub;
        const AutomateItem = database.model("AutomateItem", schemaAutomateItem);
        const automateItem = await AutomateItem.
            findById(req.body.machine_id).exec();
        if (!automateItem) {
            res.sendStatus(StatusCodes.NOT_FOUND);
            return;
        }
        if (automateItem.assign_code !== req.body.assign_code) {
            res.sendStatus(StatusCodes.FORBIDDEN);
            return;
        }
        automateItem.commander = {
            _id: commanderId,
            assign_at: utilNative.getPosixTimestamp(),
        };
        automateItem.assign_code = null;
        automateItem.save()
            .then(() => res.sendStatus(StatusCodes.NO_CONTENT))
            .catch((e) => {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
                console.error(e);
            });
    },
);

router.get("/device/:id",
    middlewareAccess(),
    middlewareDeviceParam,
    (req, res) => {
        res.send(sensitiveEraser(req.device));
    },
);

router.put("/device/:id",
    middlewareAccess(),
    middlewareDeviceParam,
    (req, res) => {
        req.device.state = req.device.state || {};
        req.device.state.direction = true;
        req.device.state.message = req.body.message;
        req.device.state.update_at = utilNative.getPosixTimestamp();
        req.device.save()
            .then(() => {
                res.sendStatus(StatusCodes.NO_CONTENT);
                polling.publishToId(
                    "/state/poll",
                    req.device._id,
                    req.device.state,
                );
            })
            .catch((e) => {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
                console.error(e);
            });
    },
);

polling.create("/device/:id/poll",
    [
        middlewareAccess(),
        middlewareDeviceParam,
        (req, res, next) => {
            req.id = req.params.id;
            next();
        },
    ],
);

router.delete("/device/:id",
    middlewareAccess(),
    middlewareDeviceParam,
    (req, res) => {
        req.device.commander = null;
        req.device.save()
            .then(() => res.sendStatus(StatusCodes.NO_CONTENT))
            .catch((e) => {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
                console.error(e);
            });
    },
);

// Manage state (for Items)

router.get("/state",
    middlewareAccess(),
    middlewareDeviceAuth,
    (req, res) => {
        res.send(req.device.state);
    },
);

router.put("/state",
    middlewareAccess(),
    middlewareDeviceAuth,
    (req, res) => {
        req.device.state = req.device.state || {};
        req.device.state.direction = false;
        req.device.state.message = req.body.message;
        req.device.state.update_at = utilNative.getPosixTimestamp();
        req.device.save()
            .then(() => {
                res.sendStatus(StatusCodes.NO_CONTENT);
                polling.publishToId(
                    "/device/:id/poll",
                    req.device._id,
                    req.device.state,
                );
            })
            .catch((e) => {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
                console.error(e);
            });
    },
);

polling.create(
    "/state/poll",
    [
        middlewareAccess(),
        middlewareDeviceAuth,
        (req, res, next) => {
            req.id = req.device._id;
            next();
        },
    ],
);

// Export routes mapper (function)
module.exports = () => {
    // Use application
    const app = useApp();

    // Mount the router
    app.use("/automate", router);
};
