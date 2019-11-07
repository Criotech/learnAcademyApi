var express = require('express');
var router = express.Router();
const path = require('path');
const mongoose = require("mongoose");
const CSVToJSON = require('csvtojson');
const fs = require("fs")
const multer = require("multer");

const  storage = multer.diskStorage({
  destination: './public/uploads',
  filename: function(req, file, cb){
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  }
})

//file type validation
function checkFileType(file, cb) {
  console.log(file)
  //Allowed ext
  const filetypes = /pdf|csv|ms-excel/;
  // check ext
  const extname = filetypes.test(path.extname
    (file.originalname).toLowerCase());
  //check mime
  const mimetype = filetypes.test(file.mimetype)

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: .csv file types Only!'))
  }
}

//multer configuration 
const upload = multer({
  storage: storage,
//   limits: {
//     fileSize: 30 * 1024 * 1024,  // 30 MB upload limit
//     files: 1                    // 1 file
//   },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
}).single("questions");


//middleware 
const checkAuth = require('../middleware/check-auth')

const Class = require("../models/class");
const Test = require("../models/test");

router.post('/teacher/:classId', checkAuth, upload, async function(req, res, next) {
    console.log(req.file)
    let questionsData = await CSVToJSON().fromFile(`./public/uploads/${req.file.filename}`)
    
    console.log(questionsData)
    if (req.userData.userRole === 'teacher') {
    let questionsData = await CSVToJSON().fromFile(`./public/uploads/${req.file.filename}`)
        Class.findOne({ _id: req.params.classId })
            .select("students")
            .exec()
            .then((result) => {
                let studentsId = result.students
                let candidates = studentsId.map((data) => {
                    return { studentId: data.studentId, status: false }
                })

                let testData = questionsData.map((data) => {
                    return {
                        _id: new mongoose.Types.ObjectId(),
                        classId: req.params.classId,
                        question: data.question,
                        options: [data.A, data.B, data.C, data.D],
                        answer: parseInt(data.answer),
                        candidates: candidates,
                    }
                })
                // console.log(testData)
                
                Test.create(testData)
                    .then(result => {
                        console.log(result)
                        res.status(201).json({
                            message: "Test uploaded successfully"
                        })
                    })
                    .catch(err => {
                        res.status(404).json({
                            message: "Error in uploading test",
                            error: err
                        })
                    })
            })
    } else {
        res.status(500).json({
            message: 'Access Denied',
        })
    }
})

//teacher add timer 
router.post('/teacher/timer/:classId', checkAuth, (req, res, next)=>{
    console.log(req.body.timer)
   
    Test.findOneAndUpdate({ classId: req.params.classId }, { timer: req.body.timer  }, { upsert: true })
                .then((result) => {
                    console.log(result)
                    res.status(201).json({ message: "timer updated successfully" })
    })
})

//teacher get the list of all created class
router.get('/teacher/:classId', checkAuth, (req, res, next) => {
    Test.find({ classId: req.params.classId })
        .populate("classId", "className students")
        .select("_id question options answer")
        .exec()
        .then((result) => {
            let response = {
                count: result.length,
                topic: (result[0])?result[0].classId.className:null,
                testData: result.map((doc) => {
                    return {
                        questionId: doc._id,
                        question: doc.question,
                        options: doc.options,
                        answer: doc.answer
                    }
                })
            }
            res.status(200).json(response)
        })
        .catch((error) => {
            res.status(404).json({
            message: 'no result gotten',
        })
        })
})

router.post('/teacher/:classId/:questionId', checkAuth, (req, res, next) => {
    Class.findOne({ _id: req.params.classId }).then(doc => {
        if (doc) {
            let data = {
                question: req.body.question,
                options: req.body.options,
                answer: req.body.answer
            }
            Test.findOneAndUpdate({ _id: req.params.questionId }, { data }, { upsert: true })
                .then((result) => {
                    res.status(201).json({ message: "Test updated successfully" })
                })
        }
        else {
            res.status(404).json({ message: "Test not found" })
        }
    })
})

router.delete('/teacher/:classId/:questionId', checkAuth, (req, res, next) => {
    Class.findOne({ _id: req.params.classId }).then(doc => {
        if (doc) {
            Test.remove({ _id: req.params.questionId })
                .then((result) => {
                    res.status(201).json({
                        message: "Question has been deleted succeessfully"
                    })
                })
                .catch(err => {
                    res.status(404).json('unable to delete question')
                })
        }
    })
})

//students section
router.post('/student/:classId', checkAuth, (req, res, next) => {
    Test.find({ classId: req.params.classId, candidates: { $elemMatch: { studentId: req.body.studentId , status: false } } })
    .select("_id question options answer timer")
    .populate("classId", "className")    
    .exec()
    .then((result)=>{
        if (result) {
             let response = {
                count: result.length,
                topic: result[0].classId.className,
                timer: result[0].timer,
                testData: result.map((doc) => {
                    return {
                        questionId: doc._id,
                        question: doc.question,
                        options: doc.options,
                        answer: doc.answer,
                        userAns: ''
                    }
                })
            }
            res.status(200).json(response)
        }
    })
    .catch((err)=>{
        console.log(err)
    })
})

//update candidate status to true after test has been taking 
router.post('/student/status/:classId', checkAuth, (eq, res, next) => {

})

router.get('/student/:classId', checkAuth, (req, res, next) => {
    Test.find({ classId: req.params.classId })
        .populate("classId", "className students")
        .select("_id question options answer")
        .exec()
        .then((result) => {
            let response = {
                count: result.length,
                topic: result[0].classId.className,
                testData: result.map((doc) => {
                    return {
                        questionId: doc._id,
                        question: doc.question,
                        options: doc.options,
                        answer: doc.answer,
                        candidates: candidates                        
                    }
                })
            }
            res.status(200).json(response)
        })
        .catch((error) => {
            res.status(500).json(error)
        })
})

module.exports = router;
