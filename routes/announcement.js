var express = require('express');
var router = express.Router();
const mongoose = require("mongoose");

//middleware 
const checkAuth = require('../middleware/check-auth')

const Class = require("../models/class");
const Announcement = require("../models/announcement");

//teacher post Announcement of a particular class
router.post('/teacher/:classId', checkAuth, (req, res, next) => {
    if (req.userData.userRole === 'teacher') {
         let newAnnouncement = new Announcement({
                    _id: new mongoose.Types.ObjectId(),
                    class: req.params.classId,
                    content: req.body.content,
                    teacher: req.userData.userId
                })
                newAnnouncement.save()
                .then(result => {
                    res.status(201).json({
                        message: "Announcement uploaded successfully"
                    })
                })
                .catch(err => { 
                    res.status(404).json({
                    message: "Error in uploading announcement",
                    error: err
                    })        
                })
    } else {
        res.status(500).json({
            message: 'Access Denied',
        })
    }
})

//teacher gets the list of all announcement
router.get('/teacher/:classId', checkAuth, (req, res, next) => {
    Class.findOne({ _id: req.params.classId, teacher: req.userData.userId }).exec()
        .then(result => {
            if (result) {
                Announcement.find().exec()
                    .then(result => {
                        let response = result.map(doc=> {
                            return {
                                announcementId: doc._id,
                                content: doc.content,
                                request: {
                                    type: "GET",
                                    url: `http://localhost:3000/announcement/teacher/${doc._id}`,
                                }
                            }
                        })
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

//teacher gets the data of a particular class
router.get('/teacher/:classId/:announcementId', checkAuth, (req, res, next) => {
    Class.findOne({ _id: req.params.classId, teacher: req.userData.userId }).exec()
        .then(result => {
            if (result) {
                Announcement.findOne({ _id: req.params.announcementId }).exec()
                    .then(result => {
                        res.status(200).json({
                            announcementId: result._id,
                            content: result.content,
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

//teacher deletes a particular announcement 
router.delete('/teacher/:classId/:announcementId', checkAuth, (req, res, next) => {
    if (req.userData.userRole === 'teacher') {
        Announcement.remove({ _id: req.params.announcementId })
        .exec()
        .then(result => {
            res.status(200).json({
                message: "Announcement deleted",
                request: {
                    type: "GET",
                    url: "http://localhost:3000/announcement/teacher",
                }
            })
        })
                .catch(err => { 
                    res.status(404).json({
                    message: "Error in deleing announcement",
                    error: err
                    })        
                })
    } else {
        res.status(500).json({
            message: 'Access Denied',
        })
    }
})

//Stududent gets all announcements realted to his class
router.get('/student/:classId', checkAuth, (req, res, next) => {
    Class.findOne({ _id: req.params.classId, students: { $all: [req.userData.userEmail] } }).exec()
        .then(result => {
            if (result) {
                Announcement.find().exec()
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
