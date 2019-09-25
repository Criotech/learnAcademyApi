var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

let User = require("../models/users");

/* GET users listing. */
router.post('/signup', async function (req, res, next) {
  let user = User.find({ email: req.body.user })

  if (user >= 1) {
    return res.status(409).json({
      message: "user already exist"
    })
  } else {
    bcrypt.hash(req.body.password, 10, (err, hash) => {
      if (err) {
        res.status(500).json({
          error: err
        })
      } else {
        const user = new User({
          _id: new mongoose.Types.ObjectId(),
          email: req.body.email,
          password: hash,
          fullName: req.body.fullName,
          role: req.body.role
        })
        user.save()
          .then(result => {
            console.log(result);
            res.status(201).json({
              message: 'user has been created'
            })
          })
          .catch(err => {
            res.status(500).json({
              error: err
            })
          })
      }
    })
  }
});

router.post('/login', (req, res, next) => {
  User.find({ email: req.body.email })
    .exec()
    .then((user) => {
      if (user.length < 1) {
        return res.status(401).json({
          messsage: 'Auth failed'
        })
      }
      bcrypt.compare(req.body.password, user[0].password, (err, result) => {
        if (err) {
          return res.status(401).json({
            message: 'Auth failed'
          })
        }
        if (result) {
        const token = jwt.sign({
            userEmail: user[0].email,
            userId: user[0]._id,
            userRole: user[0].role,
            userFullName: user[0].fullName
          },
        process.env.JWT_KEY,
      {
        expiresIn: '1hr'
      })
          return res.status(201).json({
            message: 'Auth Successful',
            token: token
          })
        }
        res.status(401).json({
          message: 'Auth failed'
        })
      })
    })
    .catch(err => {
      res.status(500).json({
        error: err
      })
    })
})

router.get('/', (req, res, next) => {
  User.find()
  .select("_id fullName role email")
  .exec()
  .then(result => {
    let response = {
        count: result.length,
        userInfo: result.map(doc => {
          return {
            fullName: doc.fullName,
            email: doc.email,
            _id: doc._id,
            role: doc.role,
            request: {
                type: "GET",
                url: 'http://localhost:3000/users/' + doc._id
            }
          }
        })
      }
      res.status(200).json(response)
  })
  .catch(err => {
    res.status(404).json({
      error: err
    })
  })
})

router.get('/:userId', (req, res, next) => {
  User.find({ _id: req.params.userId })
  .select("_id fullName role email")
  .exec()
  .then(result => {
      res.status(200).json(result)
  })
  .catch(err => {
    res.status(404).json({
      error: err
    })
  })
})


  router.delete('/:userId', (req, res, next) => {
    User.remove({ _id: req.params.userId })
      .exec()
      .then(result => {
        res.status(200).json({
          message: 'user deleted'
        })
      })
      .catch(err => {
        res.status(500).json({
          error: err
        })
      })
  })

  module.exports = router;
