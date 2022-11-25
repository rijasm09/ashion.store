var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const bodyParser = require('body-parser');
var paypal = require('paypal-rest-sdk');
require('dotenv').config()


var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');


var hbs = require('express-handlebars')


var app = express();

// var fileUpload = require('express-fileupload') 

var db = require('./config/connection')
var session = require('express-session')
var flash = require('connect-flash')

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine({ extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layout/', partialsDir: __dirname + '/views/partials/' }))

var Handlebars = require('handlebars');

//for increment in serial numbers
Handlebars.registerHelper("inc", function (value, options) {
  return parseInt(value) + 1;
});

//for if else in hbs file
Handlebars.registerHelper('ifCheck', function (arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
})
Handlebars.registerHelper('if_eq', function (arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
})

Handlebars.registerHelper('ifNotEqTri', function (arg1, arg2,arg3,arg4, options) {
  return (arg1 != arg2 && arg1 != arg3 && arg1 != arg4) ? options.fn(this) : options.inverse(this);
})

Handlebars.registerHelper('ifNotEqBoth', function (arg1, arg2, arg3, options) {
  return (arg1 != arg2 && arg1 != arg3) ? options.fn(this) : options.inverse(this);
})

//setting time for return button
Handlebars.registerHelper('ifDateCheck', function (arg1, options) {
  let date = new Date().toDateString() - 0
  let minusDate = arg1 - (10 * 24 * 60 * 60 * 1000);
  return (date > minusDate) ? options.fn(this) : options.inverse(this);
})



app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


app.use(express.static(path.join(__dirname, 'public')));

// app.use(fileUpload())
app.use(session({ secret: 'Key', cookie: { maxAge: 600000 } }))
app.use(flash());

db.connect((err) => {
  if (err) console.log('Connection Error' + err);
  else console.log('Database Connected to Port 27017');
})



app.use('/', userRouter);
app.use('/admin', adminRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
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

//paypal
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  client_id : process.env.client_id ,
  client_secret : process.env.client_secret
});

module.exports = app;
