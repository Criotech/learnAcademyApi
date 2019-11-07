let mongoose = require("mongoose");

let Schema = mongoose.Schema;

let profileSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    classId: { type: String, required: true },    
    studentName: { type: String, required: true },
    studentId: { type: String, required: true },
    total: { type: String, required: true },    
    score: { type: String, required: true },
    status: { type: Boolean, default: false }
 });


module.exports = mongoose.model("PROFILE", profileSchema);