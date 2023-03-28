"use strict";

const mongoose = require("mongoose");

const Schema = mongoose.Schema;

module.exports = new Schema({
    _id: String,
    assign_code: Number,
    features: Array,
    state: {
        direction: Boolean,
        message: String,
        update_at: Number,
    },
    commander: {
        _id: String,
        assign_at: Number,
    },
});
