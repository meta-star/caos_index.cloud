const {StatusCodes} = require("http-status-codes");
const {Router} = require("express");

const access = require("../../middlewares/access");
const AutomateItemSchema = require("../../schemas/AutomateItem");

const {issueAuthToken} = require("../../utils/caos_token");

const validator = require("express-validator");
const inspector = require("../../middlewares/inspector");

const sensitive_eraser = (j) => {
    if (j.assign_code) {
        delete j.assign_code;
    }
    return j;
};

module.exports = (ctx, r) => {
    const router = Router();
    const polling = require("express-longpoll")(router);

    const device_middleware = async (req, res, next) => {
        const AutomateItem = ctx.database.model("AutomateItem", AutomateItemSchema);
        const automate_item = await AutomateItem.findById(req.authenticated.sub).exec();
        if (!automate_item) {
            res.status(StatusCodes.NOT_FOUND).send("Unregistered Device");
            return;
        }
        req.device = automate_item;
        next();
    };

    router.post('/item',
        access,
        validator.body('features').isArray(),
        inspector,
        (req, res) => {
            const machine_id = req.authenticated.sub;
            const proto_data = req.authenticated?.data || {};
            proto_data.automate = proto_data.automate || {};
            proto_data.automate.features = req.body.features;
            const AutomateItem = ctx.database.model("AutomateItem", AutomateItemSchema);
            AutomateItem.findOneAndUpdate({_id: machine_id}, req.body, {upsert: true})
                .then(() => {
                    const secret = issueAuthToken(ctx, machine_id, proto_data);
                    res.send({machine_id, secret});
                })
                .catch((e) => {
                    console.error(e);
                    res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
                });
        }
    );

    // Manage device (for Commander)

    router.get("/devices", access, (req, res) => {
        const AutomateItem = ctx.database.model("AutomateItem", AutomateItemSchema);
        AutomateItem.find({
            commander: {
                _id: req.authenticated.sub,
            },
        })
            .then((i) => res.send(i.map(sensitive_eraser)))
            .catch((e) => {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
                console.error(e);
            });
    });

    router.post("/device", access, async (req, res) => {
        const AutomateItem = ctx.database.model("AutomateItem", AutomateItemSchema);
        const automate_item = await AutomateItem.findById(req.body._id).exec();
        if (automate_item.assign_code !== res.body.assign_code) {
            res.sendStatus(StatusCodes.FORBIDDEN);
            return;
        }
        automate_item.commander = {
            id: req.authenticated.sub,
            assign_at: ctx.now(),
        };
        automate_item.save()
            .then(() => res.sendStatus(StatusCodes.NO_CONTENT))
            .catch((e) => {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
                console.error(e);
            });
    });

    router.get("/device/:id", access, (req, res) => {
        const AutomateItem = ctx.database.model("AutomateItem", AutomateItemSchema);
        AutomateItem.findOne({
            _id: req.params.id,
            commander: {
                _id: req.authenticated.sub,
            },
        })
            .then((i) => res.send(i.map(sensitive_eraser)))
            .catch((e) => {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
                console.error(e);
            });
    });

    router.delete("/device/:id", access, async (req, res) => {
        const AutomateItem = ctx.database.model("AutomateItem", AutomateItemSchema);
        const automate_item = await AutomateItem.findById(req.params.id).exec();
        if (automate_item.commander.id !== req.authenticated.sub) {
            res.sendStatus(StatusCodes.FORBIDDEN);
            return;
        }
        automate_item.commander = null;
        automate_item.save()
            .then(() => res.sendStatus(StatusCodes.NO_CONTENT))
            .catch((e) => {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
                console.error(e);
            });
    });

    // Manage state (for Items)

    router.get("/state", access, device_middleware, (req, res) => {
        res.send(req.device.state);
    });

    router.put("/state", access, device_middleware, (req, res) => {
        req.device.state = req.body;
        req.device.state.update_at = ctx.now();
        req.device.save()
            .then(() => {
                res.sendStatus(StatusCodes.NO_CONTENT);
                polling.publishToId("/state/poll", req.authenticated.sub, req.device.state);
            })
            .catch((e) => {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
                console.error(e);
            });
    });

    polling.create("/state/poll",
        (req, res, next) => access(req, res, () => device_middleware(req, res, next)),
        (req, res, next) => {
            req.id = req.authenticated.sub;
            next();
        }
    );

    // Mount

    r.use("/automate", router);
};
