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
    resource_type: 'raw',
    folder: 'learnAcademy'
  },
  allowedFormats: ["mp4", "pdf", "txt", "ppt", "docx"],
});

//file type validation
function checkFileType(file, cb){
  //Allowed ext
  const filetypes = /pdf|docx|mp4|txt|ppt/;
  // check ext
  const extname = filetypes.test(path.extname
  (file.originalname).toLowerCase());
  //check mime
  const mimetype = filetypes.test(file.mimetype)

  if(mimetype && extname){
    return cb(null, true);
  }else {
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
   fileFilter: function(req, file, cb){
    checkFileType(file, cb);
  }
}).single("lecture");


//teacher post Announcemrnt of a particular class
router.post('/teacher/:classId', checkAuth, upload, (req, res, next) => {
     var p = progress()
    var upload = multer().single('file')
    
    console.log(req.body)
    console.log(req.file)
    // if (req.userData.userRole === 'teacher') {
    //      let newLecture = new Lecture({
    //                 _id: new mongoose.Types.ObjectId(),
    //                 class: req.params.classId,
    //                 title: req.body.title,
    //                 lecture: req.body.content,
    //                 teacher: req.userData.userId
    //             })
    //             newLecture.save()
    //             .then(result => {
    //                 res.status(201).json({
    //                     message: "Announcement uploaded successfully"
    //                 })
    //             })
    //             .catch(err => { 
    //                 res.status(404).json({
    //                 message: "Error in uploading announcement",
    //                 error: err
    //                 })        
    //             })
    // } else {
    //     res.status(500).json({
    //         message: 'Access Denied',
    //     })
    // }
})

module.exports = router;
