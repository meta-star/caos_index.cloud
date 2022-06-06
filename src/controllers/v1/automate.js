const Validator = require('express-validator');

const {StatusCodes} = require("http-status-codes");
const {Router} = require("express");

const access = require("../../middlewares/access");
const inspector = require("../../middlewares/inspector");
const AutomateItemSchema = require("../../schemas/AutomateItem");

const feature_router = Router();

module.exports = (ctx, router) => {
    feature_router.get("/devices", access, (req, res) => {
        const AutomateItem = ctx.database.model("AutomateItem", AutomateItemSchema);
        AutomateItem.find({
            commander: {
                id: req.authenticated.sub,
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
    feature_router.get("/device/:id", (req, res) => {
        const AutomateItem = ctx.database.model("AutomateItem", AutomateItemSchema);
        AutomateItem.findOne({
            id: req.params.id,
            commander: {
                id: req.authenticated.sub,
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
    feature_router.post("/device", (_, res) => {

    });
    feature_router.delete("/device", (_, res) => {

    });
    feature_router.get("/state", (req, res) => {
        const AutomateItem = ctx.database.model("AutomateItem", AutomateItemSchema);
        AutomateItem.findOne({id: req.authenticated.sub})
            .then((i) => res.send(i))
            .catch((e) => {
                console.log(e);
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            });
    });
    feature_router.put("/state", (req, res) => {
        const AutomateItem = ctx.database.model("AutomateItem", AutomateItemSchema);
        req.body._id = req.authenticated.sub;
        AutomateItem.findOneAndUpdate({_id: req.body._id}, req.body, {upsert: true})
            .then(() => res.sendStatus(StatusCodes.NO_CONTENT))
            .catch((e) => {
                console.error(e);
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            });
    });
    feature_router.delete("/state", (req, res) => {
        const AutomateItem = ctx.database.model("AutomateItem", AutomateItemSchema);
        AutomateItem.findOne({id: req.authenticated.sub})
            .then((item) => {
                if (!item) {
                    res.sendStatus(StatusCodes.NOT_FOUND);
                } else {
                    item.delete()
                        .then(() => res.sendStatus(StatusCodes.OK))
                        .catch((e) => {
                            console.error(e);
                            res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
                        });
                }
            })
            .catch((e) => {
                console.error(e);
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            })
    });
    router.use("/automate", feature_router);
};
