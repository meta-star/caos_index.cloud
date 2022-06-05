const { StatusCodes } = require("http-status-codes");
const { Router } = require("express");

const access = require("../../middlewares/access");
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
  feature_router.get("/device/:id", (_, res) => {
    const AutomateItem = ctx.database.model("AutomateItem", AutomateItemSchema);
    AutomateItem.find({
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
    res.sendStatus(StatusCodes.SERVICE_UNAVAILABLE);
  });
  feature_router.delete("/device", (_, res) => {
    res.sendStatus(StatusCodes.SERVICE_UNAVAILABLE);
  });
  feature_router.get("/state", (req, res) => {
    const AutomateItem = ctx.database.model("AutomateItem", AutomateItemSchema);
    AutomateItem.findById(req.authenticated.sub)
      .then((i) => res.send(i))
      .catch((e) => {
        console.log(e);
        res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
      });
  });
  feature_router.put("/state", (_, res) => {
    res.sendStatus(StatusCodes.SERVICE_UNAVAILABLE);
  });
  feature_router.delete("/state", (_, res) => {
    res.sendStatus(StatusCodes.SERVICE_UNAVAILABLE);
  });
  router.use("/automate", feature_router);
};
