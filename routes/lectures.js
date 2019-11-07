var express = require('express');
var router = express.Router();
const path = require('path');
const mongoose = require("mongoose");
const multer = require("multer");
const cloudinary = require('cloudinary');
const cloudinaryStorage = require("multer-storage-cloudinary");

//middleware 
const checkAuth = require('../middleware/check-auth')

const Class = require("../models/class");
const Lecture = require("../models/lecture");

//cloudinary configuration
cloudinary.config({
  cloud_name: "duzzzi1rq",
  api_key: "749226333871598",
  api_secret: "9qzGvKWsS8QHn5kKgF9Li2kZXOk"
});

const storage = cloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    resource_type: 'video',
    folder: 'learnAcademy'
  },
  allowedFormats: ["mp4", "pdf", "txt", "ppt", "docx"],
});

//file type validation
function checkFileType(file, cb) {
  console.log(file)
  //Allowed ext
  const filetypes = /pdf|docx|mp4|txt|ppt/;
  // check ext
  const extname = filetypes.test(path.extname
    (file.originalname).toLowerCase());
  //check mime
  const mimetype = filetypes.test(file.mimetype)

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: .mp4, .txt, .docx .ppt and .pdf file types Only!'))
  }
}

//multer configuration 
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 30 * 1024 * 1024,  // 30 MB upload limit
    files: 1                    // 1 file
  },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
}).single("lecture");


//teacher post lecture of a particular class
router.post('/teacher/:classId', checkAuth, upload, (req, res, next) => {
  if (req.userData.userRole === 'teacher') {
    let newLecture = new Lecture({
      _id: new mongoose.Types.ObjectId(),
      class: req.params.classId,
      title: req.body.title,
      publicid: req.file.public_id,
      lecture: req.file.secure_url,
      teacher: req.userData.userId
    })
    newLecture.save()
      .then(result => {
        console.log(result)
        res.status(201).json({
          message: "Lecture uploaded successfully"
        })
      })
      .catch(err => {
        res.status(404).json({
          message: "Error in uploading lecture",
          error: err
        })
      })
  } else {
    res.status(500).json({
      message: 'Access Denied',
    })
  }
})

//teacher gets the list of all lectures in  a  particular class
router.get('/teacher/:classId', checkAuth, (req, res, next) => {
  Class.findOne({ _id: req.params.classId, teacher: req.userData.userId }).exec()
    .then(result => {
      if (result) {
        Lecture.find({ class: req.params.classId }).exec()
          .then(result => {
            let response = {
              count: result.length,
              lecturesData: result.map(doc => {
                return {
                  id: doc._id,
                  lecture: doc.lecture,
                  title: doc.title,
                  class: doc.class,
                  publicid: doc.publicid,
                  request: {
                    type: "GET",
                    url: `http://localhost:3000/lectures/teacher/${doc._id}`,
                  }
                }
              })
            }
            res.status(200).json(response)
          })
          .catch(err => {
            res.status(404).json({ message: 'error getting data' })
          })
      } else {
        res.status(500).json({ message: 'Access Denied' })
      }
    })
})

//teacher gets the lecture data of a single lecture in a particular class
router.get('/teacher/:classId/:lectureId', checkAuth, (req, res, next) => {
  Class.findOne({ _id: req.params.classId, teacher: req.userData.userId }).exec()
    .then(result => {
      if (result) {
        Lecture.findOne({ _id: req.params.lectureId }).exec()
          .then(result => {
            res.status(200).json({
              id: result._id,
              lecture: result.lecture,
              publicid: result.publicid
            })
          })
          .catch(err => {
            res.status(404).json({ message: 'error getting data' })
          })
      } else {
        res.status(500).json({ message: 'Access Denied' })
      }
    })
})


//teacher deletes a particular lecture 
router.delete('/teacher/:classId/:lectureId', checkAuth, (req, res, next) => {
  if (req.userData.userRole === 'teacher') {
    Class.findOne({ _id: req.params.classId, teacher: req.userData.userId }).exec()
      .then(result => {
        if (result) {
          Lecture.findOne({ _id: req.params.lectureId }).exec()
            .then(doc => {
              let publicId = doc.publicid
              cloudinary.v2.uploader.destroy(publicId, {invalidate: true, resource_type: "video"}, function () {
                  Lecture.remove({ _id: req.params.lectureId })
                    .exec()
                    .then(result => {
                      res.status(201).json({
                        message: "Lecture has been deleted",
                        request: {
                          type: "GET",
                          url: "http://localhost:3000/lectures/teacher",
                        }
                      })
                    })
                    .catch(err => {
                      res.status(404).json({
                        message: "Error in deleing lecture",
                        error: err
                      })
                    })
              });
            })
        }
      })
  } else {
    res.status(500).json({
      message: 'Access Denied',
    })
  }
})

//student gets the lectures of a particular class which he is registered to
router.get('/student/:classId', checkAuth, (req, res, next)=>{
  Class.findOne({ _id: req.params.classId, students: { $all: [ { "$elemMatch": {"studentEmail": req.userData.userEmail }} ] } }).exec()
    .then(result => {
      if (result) {
        Lecture.find({ class: req.params.classId }).exec()
          .then(result => {
            let response = {
              count: result.length,
              lecturesData: result.map(doc => {
                return {
                  id: doc._id,
                  title: doc.title,
                  lecture: doc.lecture,
                  publicid: doc.publicid,
                  request: {
                    type: "GET",
                    url: `http://localhost:3000/lectures/teacher/${doc._id}`,
                  }
                }
              })
            }
            res.status(200).json(response)
          })
          .catch(err => {
            res.status(404).json({ message: 'error getting data' })
          })
      } else {
        res.status(500).json({ message: 'Access Denied' })
      }
    })
})

//teacher gets the lecture data of a particular class
router.get('/student/:classId/:lectureId', checkAuth, (req, res, next) => {
  Class.findOne({ _id: req.params.classId, students: { $all: [req.userData.userEmail] } }).exec()
    .then(result => {
      if (result) {
        Lecture.findOne({ _id: req.params.lectureId }).exec()
          .then(result => {
            res.status(200).json({
              id: result._id,
              lecture: result.lecture,
              publicid: result.publicid
            })
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
