let mongoose = require("mongoose");

let Schema = mongoose.Schema;

let userSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: {type: String, 
        required: true, 
        unique: true,
        match: /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/
    },
    password: {type: String, required: true},
    fullName: {type: String, required: true},
    role: {type: String, required: true}
 });


module.exports = mongoose.model("USER", userSchema);