const {StatusCodes} = require("http-status-codes");
const {Router} = require("express");

const access = require("../../middlewares/access");
const AutomateItemSchema = require("../../schemas/AutomateItem");

module.exports = (ctx, r) => {
    const router = Router();
    const polling = require("express-longpoll")(router);

    // Manage device (for active device)

    router.get("/devices", access, (req, res) => {
        const AutomateItem = ctx.database.model("AutomateItem", AutomateItemSchema);
        AutomateItem.find({
            commander: {
                _id: req.authenticated.sub,
            },
        })
            .then((i) =>
                res.send(
                    i.map((j) => {
                        if (j.assign_code) {
                            delete j.assign_code;
                        }
                        return j;
                    })
                )
            )
            .catch((e) => {
                console.log(e);
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
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
            .then((i) => {
                if (i.assign_code) {
                    delete i.assign_code;
                }
                res.send(i);
            })
            .catch((e) => {
                console.log(e);
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
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
            .then(() => {
                res.sendStatus(StatusCodes.NO_CONTENT);
            })
            .catch((e) => {
                console.log(e);
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            });
    });

    router.delete("/device", access, async (req, res) => {
        const AutomateItem = ctx.database.model("AutomateItem", AutomateItemSchema);
        const automate_item = await AutomateItem.findById(req.body._id).exec();
        if (automate_item.commander.id !== req.authenticated.sub) {
            res.sendStatus(StatusCodes.FORBIDDEN);
            return;
        }
        automate_item.commander = null;
        automate_item.save()
            .then(() => {
                res.sendStatus(StatusCodes.NO_CONTENT);
            })
            .catch((e) => {
                console.log(e);
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            });
    });

    // Manage state (for passive device)

    router.get("/state", access, async (req, res) => {
        const AutomateItem = ctx.database.model("AutomateItem", AutomateItemSchema);
        const automate_item = await AutomateItem.findById(req.authenticated.sub).exec();
        if (!automate_item) {
            res.status(StatusCodes.NOT_FOUND).send("Unregistered Device");
            return;
        }
        res.send(automate_item.state);
    });

    polling.create("/state/poll", async (req, res, next) => {
        await new Promise((resolve) => access(req, res, resolve));
        const AutomateItem = ctx.database.model("AutomateItem", AutomateItemSchema);
        if (!await AutomateItem.findById(req.authenticated.sub)) {
            res.status(StatusCodes.NOT_FOUND).send("Unregistered Device");
            return;
        }
        next();
    }, (req, res, next) => {
        req.id = req.authenticated.sub;
        next();
    });

    router.put("/state", access, async (req, res) => {
        const AutomateItem = ctx.database.model("AutomateItem", AutomateItemSchema);
        const automate_item = await AutomateItem.findById(req.authenticated.sub).exec();
        if (!automate_item) {
            res.status(StatusCodes.NOT_FOUND).send("Unregistered Device");
            return;
        }
        automate_item.state = req.body;
        automate_item.save()
            .then(() => {
                polling.publishToId("/state/poll", req.authenticated.sub, automate_item);
                res.sendStatus(StatusCodes.NO_CONTENT);
            })
            .catch((e) => {
                console.log(e);
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            });
    });

    // Mount

    r.use("/automate", router);
};
