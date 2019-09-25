let mongoose = require("mongoose");

let Schema = mongoose.Schema;

let curriculumSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    content: { type: String, required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'CLASS', required: true },    
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'USER', required: true }        
 });

module.exports = mongoose.model("CURRICULUM", curriculumSchema);