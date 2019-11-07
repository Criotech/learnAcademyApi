const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
let curriculumRouter = require('./routes/curriculum')
let announcementRouter = require('./routes/announcement')
let lecturesRouter = require('./routes/lectures')
let classRouter = require('./routes/class')
let profilesRouter = require('./routes/profiles')
let testRouter = require('./routes/test')
const fs = require("fs")


var app = express();

//env config
dotenv.config();

//connect mongodb
mongoose.connect('mongodb://localhost:27017/learnacademyapi', { useNewUrlParser: true, useCreateIndex: true , useUnifiedTopology: true  }).then(console.log("database connected"));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if(req.method == 'OPTIONS'){
    res.header('Access-Control-Allow-Methods', 'DELETE, PUT, GET, POST, PATCH, DELETE');
    return res.status(200).json({})
  }
  next();
});

app.get('/testing', (req, res) => {
  console.log('hello')
  var content
    fs.readFile('./work.csv', function read(err, data) {
    if (err) {
        throw err;
    }
    content = data;
})
})

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/class', classRouter);
app.use(`/curriculum`, curriculumRouter);
app.use('/announcement', announcementRouter);
app.use('/lectures', lecturesRouter);
app.use('/profiles', profilesRouter);
app.use('/test', testRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(5000)

module.exports = app;
