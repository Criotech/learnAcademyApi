let mongoose = require("mongoose");

let Schema = mongoose.Schema;

let testSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    question: { type: String, required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'CLASS', required: true },
    options: { type: Array, required: true, default: true },
    answer: { type: Number, required: true },
    candidates: { type: Array, default: [] },
    timer: { type: String, default: '5' },
    status: { type: Boolean, default: true }
 });

module.exports = mongoose.model("TEST", testSchema);