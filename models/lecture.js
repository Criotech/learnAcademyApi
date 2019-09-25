let mongoose = require("mongoose");

let Schema = mongoose.Schema;

let lectureSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    title: { type: String, required: true },
    lecture: {type: String, required: true},
    publicid: {type: String, required: true},
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'CLASS', required: true },    
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'USER', required: true }        
 });

module.exports = mongoose.model("LECTURE", lectureSchema);