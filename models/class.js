let mongoose = require("mongoose");

let Schema = mongoose.Schema;

let classSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    className: {type: String, required: true},
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'USER', required: true },
    students: {type: Array}
 });


module.exports = mongoose.model("CLASS", classSchema);