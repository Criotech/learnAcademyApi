var express = require('express');
var router = express.Router();
const mongoose = require("mongoose");

//middleware 
const checkAuth = require('../middleware/check-auth')

const Class = require("../models/class");
const Curriculum = require("../models/curriculum");

//teacher post curriculum of a particular class
router.post('/teacher/:classId', checkAuth, (req, res, next) => {
    if (req.userData.userRole === 'teacher') {
        Curriculum.findOne({ _id: req.params.classId, teacher: req.userData.userId }).exec().then(result => {
            Curriculum.findOneAndUpdate({ class: req.params.classId, teacher: req.userData.userId }, { content: req.body.content }, { upsert: true })
                .then(result => {
                    res.status(201).json({
                        message: 'Curriculum updated successfully'
                    })
                })
        })
    } else {
        res.status(500).json({
            message: 'Access Denied',
        })
    }
})

router.get('/teacher/:classId', checkAuth, (req, res, next) => {
    Class.findOne({ _id: req.params.classId, teacher: req.userData.userId }).exec()
        .then(result => {
            if (result) {
                Curriculum.find({ class: req.params.classId }).exec()
                    .then(result => {
                        res.status(200).json(result)
                    })
                    .catch(err => {
                        res.status(404).json({ message: 'error getting data' })
                    })
            } else {
                res.status(500).json({ message: 'Access Denied' })
            }
        })
})

router.get('/student/:classId', checkAuth, (req, res, next) => {
    Class.findOne({ _id: req.params.classId, students: { $all: [ { "$elemMatch": {"studentEmail": req.userData.userEmail }} ] } }).exec()
        .then(result => {
            console.log(result)
            if (result) {
                Curriculum.find({ class: req.params.classId }).exec()
                    .then(result => {
                        res.status(200).json(result)
                    })
                    .catch(err => {
                        res.status(404).json({ message: 'error getting data' })
                    })
            } else {
                res.status(500).json({ message: 'Access Denied' })
            }
        })
})

module.exports = router;
