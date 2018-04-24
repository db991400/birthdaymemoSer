var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var expressJwt = require('express-jwt');




var index = require('./routes/index');
var users = require('./routes/users');
var friends = require('./routes/friends');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//跨域访问
var allowCrossDomain = function (req, res, next) {
   res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
  //bulid时用下面的跨域访问语句
  //res.header('Access-Control-Allow-Origin', 'http://localhost');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
};
app.use(allowCrossDomain);


app.use('/', index);
app.use('/users', users);

//使用jwt拦截
app.use(expressJwt({
  secret: 'secret'
}));
//处置jwt异常
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).send({
      'code': 401,
      'msg': 'invalid token'
    });
  }
});

app.use('/friends', friends);
/* 测试跨域访问
app.get('/test',function(req,res,next){
  console.log(req.query);
  res.send({
    "result":"ok!"
  })
}); */


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;