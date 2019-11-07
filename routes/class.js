var express = require('express');
const path = require('path');
var router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const cloudinary = require('cloudinary');
const cloudinaryStorage = require("multer-storage-cloudinary");

//middleware 
const checkAuth = require('../middleware/check-auth')

let Class = require("../models/class");
let User = require("../models/users");


//cloudinary configuration
cloudinary.config({
    cloud_name: "duzzzi1rq",
    api_key: "749226333871598",
    api_secret: "9qzGvKWsS8QHn5kKgF9Li2kZXOk"
});

const storage = cloudinaryStorage({
    cloudinary: cloudinary,
    folder: "learnAcademy",
});

// FILE CHECK
function checkFileType(type) {
    return function (req, file, cb) {
        // Allowed ext
        const filetypes = /jpeg|jpg|png|gif/;

        // Get ext
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        // Check mime
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error(`Error Occured: Upload Image file Only!`));
        }
    };
}

//multer configuration 
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024,  // 2 MB upload limit
        files: 1                    // 1 file
    },
    fileFilter: checkFileType("images")
}).single("classImage");

//teacher creates a new class
router.post('/teacher', checkAuth, upload, (req, res, next) => {
    if (req.userData.userRole === 'teacher') {
        let newClass = new Class({
            _id: new mongoose.Types.ObjectId(),
            className: req.body.className,
            teacher: req.userData.userId,
            publicid: req.file.public_id,
            classImage: req.file.secure_url
        })
        newClass.save().then(result => {
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
    } else {
        res.status(500).json({
            message: 'Access Denied',
        })
    }
})

//teacher get the list of all created class
router.get('/teacher', checkAuth, (req, res, next) => {
    Class.find({ teacher: req.userData.userId })
        .populate("teacher", "fullName role _id")
        .select("_id className classImage students")
        .exec()
        .then(result => {
            let response = {
                count: result.length,
                classData: result.map(doc => {
                    return {
                        classId: doc._id,
                        className: doc.className,
                        students: doc.students,
                        classImage: doc.classImage,
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

//teacher gets class members from a single classs
router.get('/teacher/members/:classId', checkAuth, (req, res, next) => {
    Class.findById(req.params.classId)
        .select("_id students")
        .exec()
        .then(result => {
            let response = {
                classId: result._id,
                studentList: result.students
            }
            res.status(200).json(response)
        })
        .catch(err => {
            console.log(err)
            error: err
        })
})

//teacher deletes a particular lecture 
router.delete('/teacher/:classId', checkAuth, (req, res, next) => {
    if (req.userData.userRole === 'teacher') {
        Class.findOne({ _id: req.params.classId }).exec()
            .then(doc => {
                let publicId = doc.publicid
                cloudinary.v2.uploader.destroy(publicId, function (result) {
                    console.log(result)
                    Class.remove({ _id: req.params.classId })
                        .exec()
                        .then(result => {
                            res.status(201).json({
                                message: "Class has deleted successfully",
                                request: {
                                    type: "GET",
                                    url: "http://localhost:3000/class/teacher",
                                }
                            })
                        })
                        .catch(err => {
                            res.status(404).json({
                                message: "Error in deleing class",
                                error: err
                            })
                        })
                });
            })
    } else {
        res.status(500).json({
            message: 'Access Denied',
        })
    }
})


//teacher register student to a particular class 
router.post('/teacher/:classId/addStudent', checkAuth, (req, res, next) => {
    if (req.userData.userRole === "teacher") {
        User.findOne({ email: req.body.studentMail }).then(doc => {
            if (doc) {
                Class.findOneAndUpdate({ _id: req.params.classId }, {
                    $push: {
                        students: {
                            "studentName": doc.fullName,
                            "studentId": doc._id.toString(),
                            "studentEmail": doc.email
                        }
                    }
                }, { upsert: true })
                    .then(result => {
                        res.status(201).json({
                            message: "Student Enrolled Successfully"
                        })
                    })
                    .catch(err => {
                        res.status(404).json({
                            message: 'error occured during enrollment',
                            error: err
                        })
                    })
            } else {
                res.status(500).json({
                    message: 'Access Denied',
                })
            }
        })
    } else {
        res.status(500).json({
            message: 'Access Denied',
        })
    }
})
// students: [req.userData.userEmail] }
//student class section 
//student register for a particular class 
router.post('/student', checkAuth, (req, res, next) => {
    if (req.userData.userRole === "student") {
        Class.findOneAndUpdate({ _id: req.body.classId }, {
            $push: {
                students: {
                    "studentName": req.userData.userFullName,
                    "studentId": req.userData.userId,
                    "studentEmail": req.userData.userEmail
                }
            }
        }, { upsert: true })
            .then(result => {
                res.status(201).json({
                    message: "Class Enrollement Successful"
                })
            })
            .catch(err => {
                res.status(404).json({
                    message: 'error occured during enrollment',
                    error: err
                })
            })
    } else {
        res.status(500).json({
            message: 'Access Denied',
        })
    }
})

//student gets a list of all the classes he is registered to
router.get('/student', checkAuth, (req, res, next) => {
    Class.find({ students: { $all: [ { "$elemMatch": {"studentEmail": req.userData.userEmail }} ] } })
        .populate("teacher", "fullName role")
        .select("_id className classImage")
        .exec()
        .then(result => {
            console.log(result)
            let response = {
                count: result.length,
                classData: result.map(doc => {
                    return {
                        classId: doc._id,
                        className: doc.className,
                        classImage: doc.classImage,                        
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
        .select("_id classImage className")
        .exec()
        .then(result => {
            console.log(result)
            res.status(200).json({
                classId: result._id,
                className: result.className,
                classImage: doc.classImage,
                teacherName: result.teacher.fullName
            })
        })
        .catch(err => {
            error: err
        })
})

module.exports = router;
