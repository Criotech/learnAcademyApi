var express = require('express');
const path = require('path');
var router = express.Router();
const mongoose = require("mongoose");

//middleware 
const checkAuth = require('../middleware/check-auth')

let Class = require("../models/class");
let User = require("../models/users");
let Profile = require("../models/profile")

router.post('/:classId', checkAuth, (req, res, next) => {
    Profile.find({ classId: req.body.classId, studentId: req.body.studentId })
        .exec()
        .then((result) => {
            if (result.length === 0) {
                let data = {
                    _id: new mongoose.Types.ObjectId(),
                    studentName: req.body.studentName,
                    score: req.body.correct,
                    total: req.body.total,
                    classId: req.body.classId,
                    studentId: req.body.studentId,
                    total: req.body.total
                }

                Profile.create(data)
                    .then((result) => {
                        res.status(201).json({ message: 'You have successfully submitted your test' })
                    })
            } else {
                res.status(500).json({ message: 'test has been submitted already' })
            }
        })

})

router.get('/teacher/:classId', checkAuth, (
    req, res, next) => {
    Profile.find({ classId: req.params.classId })
        .exec()
        .then((result) => {
            console.log(result)
            res.status(200).json(result)
        })
})


module.exports = router;
