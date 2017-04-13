var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var fs = require('fs');
var sql = require('mssql');
var credentials = require('./config/credentials') + "PCM";
var pcmModel = require('./config.json').activemodel || 11;
var bodyParser = require('body-parser'); //use busboy instead because of req.body
//var bb = require('express-busboy');
var multer = require('multer');
var session      = require('express-session');
var passport = require('passport');
var flash    = require('connect-flash');
var exphbs = require('express-handlebars');

var convert_pcm_export = require('./routes/convert_pcm_export');
var convert_sap_export = require('./routes/convert_sap_export');
var index = require('./routes/index');
var logout = require('./routes/logout');
var users = require('./routes/users');
var uploadDoc = require('./routes/uploadDoc');
var dataLoad = require('./routes/dataLoad');
var assignments = require('./routes/assignments');
var pcmbridge = require('./routes/pcmbridge');
var pcm = require('./routes/pcm');
var scriptFolder = './script/';

var app = express();
//extend app to use busboy
//bb.extend(app);

// Create `ExpressHandlebars` instance with a default layout.
var hbs = exphbs.create({
    defaultLayout: 'main',
    layoutsDir: 'views/layouts/',
    partialsDir: 'views/partials/',
    compilerOptions: undefined
});

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

// required for passport
app.use(session({ secret: 'npdcpcmcommoncostbeninnnpc' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb'}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(multer({ dest: './uploads/'}).any());

app.use('/', index);
app.use('/users', isAuthenticated, users);
app.use('/logout', isAuthenticated, logout);
app.use('/convert_sap_export', isAuthenticated, convert_sap_export);
app.use('/convert_pcm_export', isAuthenticated, convert_pcm_export);
app.use('/server/uploads', isAuthenticated, uploadDoc);
app.use('/server/dataload', isAuthenticated, dataLoad);
app.use('/assignments', isAuthenticated, assignments);
app.use('/pcmbridge', isAuthenticated, pcmbridge);
app.use('/', isAuthenticated, pcm);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
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

//Initialize Sql scripts will return error if view already exists
sql.connect(credentials).then(function() {
    fs.readdir(scriptFolder, function(err, files){
        //drop all views and recreate them
        var dropQuery = "";

        files.forEach(function(file){
            dropQuery += "DROP VIEW [dbo].[" + file + "];"
        });
        console.log(dropQuery);
        try{
            new sql.Request().query(dropQuery)
                .then(function(recordset) {
                    console.log(recordset);
                    //expect to receive undefined if all goeas well
                    if(recordset == undefined){
                        console.log(file + " Dropping all previous views");
                    } else {
                        console.log(recordset);
                    }
                    initView();
                }).catch(function(err) {
                // ... query error checks
                console.log("Nothing to Drop will proceed to create");
                initView();
                // logger.log(err);
            });
        } catch(e){
            console.log(e);
        }
        function initView(){
            files.forEach(function(file){
                fs.readFile(scriptFolder + file, "utf-8", function(err, data) {
                    //replace all @MODELID with modelId
                    data = data.replace("@MODELID", pcmModel);
                    try{
                        new sql.Request().query(data)
                            .then(function(recordset) {
                                //expect to receive undefined if all goeas well
                                if(recordset == undefined){
                                    console.log(file + " View Succesfully created for modelid " + pcmModel);
                                } else {
                                    console.log(recordset);
                                }
                            }).catch(function(err) {
                            // ... query error checks
                            console.log("Initialization objects alrady exist");
                            // logger.log(err);
                        });
                    } catch(e){
                        console.log(e);
                    }

                })
            });
        }
        console.log("Application started Please visit http://localhost:3000")
    });

    //create the dataBridge table if it does not exist will handle this properly but for now lets roll with this
    try{
        new sql.Request().query("CREATE TABLE [dbo].[PCMADS_BRIDGE](" +
            "[VersionName] [nchar](10) NOT NULL," +
            "[PeriodName] [nchar](10) NOT NULL," +
            "[RespCenterName] [nvarchar](100) NOT NULL," +
            "[LineItemName] [nchar](100) NOT NULL," +
            "[CurrencyName] [nchar](10) NOT NULL," +
            "[LineItemValue] [numeric](38, 10) NOT NULL)"
    )
    } catch (e){
        console.log(e);
    }

}).catch(function(err) {
    // ... connect error checks
    console.log(err);
});

function isAuthenticated(req, res, next) {

// if user is authenticated in the session, carry on
    if ( true) //req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}

module.exports = app;
