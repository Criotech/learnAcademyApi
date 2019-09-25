var express = require('express');
var router = express.Router();
const mongoose = require("mongoose");

//middleware 
const checkAuth = require('../middleware/check-auth')

let Class = require("../models/class");
let User = require("../models/users");

//teacher creates a new class
router.post('/teacher', checkAuth, (req, res, next) => {
    if (req.userData.userRole === 'teacher') {
        let newClass = new Class({
            _id: new mongoose.Types.ObjectId(),
            className: req.body.className,
            teacher: req.userData.userId,
        })
        newClass.save().then(result => {
            console.log(result)
            res.status(201).json({
                message: 'class created successfully'
            })
        })
        .catch(err => {
            res.status(404).json({
                message: 'there is an error in creating class',                
                error: err
            })
        })
    }else{
        res.status(500).json({
                message: 'Access Denied',                
        })
    }
})

//teacher get the list of all created class
router.get('/teacher', checkAuth, (req, res, next) => {
    Class.find({ teacher: req.userData.userId })
    .populate("teacher", "fullName role _id")
    .select("_id className")
    .exec()
    .then(result => {
        let response = {
            count: result.length,
            classData: result.map(doc => {
                return {
                    classId: doc._id,
                    className: doc.className,
                    teacherName: doc.teacher.fullName,
                    role: doc.teacher.role,
                    request: {
                        type: "GET",
                        url: "http://localhost:3000/class/teacher/" + doc._id
                    }
                }
            })
        }
        res.status(200).json(response)
    })
    .catch(err => {
        error: err
    })
})

//teacher gets data from a single classs
router.get('/teacher/:classId', checkAuth, (req, res, next) => {
    Class.findById(req.params.classId)
    .populate("teacher", "fullName role _id")
    .select("_id className students")
    .exec()
    .then(result => {
        let response = {
            classId: result._id,
            className: result.className,
            studentList: result.students,
            teacherId: result.teacher._id,
            teacherName: result.teacher.fullName,
            role: result.teacher.role
        }
        res.status(200).json(response)
    })
    .catch(err => {
        error: err
    })
})

//teacher deletes the data of a particular class
router.delete('/teacher/:classId', checkAuth, (req, res, next) => {
    if (req.userData.userRole === 'teacher') {    
        Class.remove({ _id: req.params.classId })
        .exec()
        .then(result => {
            res.status(200).json({
                message: "Class deleted",
                request: {
                    type: "GET",
                    url: "http://localhost:3000/class/teacher",
                }
            })
            .catch(err => {
                error: err
            })
        })
    } else {
        res.status(500).json({
            message: 'Access Denied',                
        })
    }
})

//student
//student gets a list of all the classes he is registered to
router.get('/student', checkAuth, (req, res, next) => {
    Class.find({ students: { $all : [req.userData.userEmail]} })
    .populate("teacher", "fullName role")
    .select("_id className")
    .exec()
    .then(result => {
       let response = {
            count: result.length,
            classData: result.map(doc => {
                return {
                    classId: doc._id,
                    className: doc.className,
                    teacherName: doc.teacher.fullName,
                    request: {
                        type: "GET",
                        url: "http://localhost:3000/class/student/" + doc._id
                    }
                }
            })
        }
        res.status(200).json(response)
    })
    .catch(err => {
        error: err
    })
})

//student gets the data of a particular class he is registered to
router.get('/student/:classId', checkAuth, (req, res, next) => {
    let classId = req.params.classId;
    Class.findById(classId)
    .populate("teacher", "fullName role")
    .select("_id className")
    .exec()
    .then(result => {
        res.status(200).json({
            classId: result._id,
            className: result.className,
            teacherName: result.teacher.fullName
        })
    })
    .catch(err => {
        error: err
    })
})

module.exports = router;
