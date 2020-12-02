const path= require('path');
const express=require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const passport = require('passport');
const methodOverride = require('method-override');
const session = require('express-session');
const connectDB = require('./config/db');
const MongoStore  = require('connect-mongo')(session);
//Load config
dotenv.config({path:'./config/config.env'})

//passport config
require('./config/passport')(passport)
connectDB();
const app = express();

//body parser
app.use(express.urlencoded({extended:false}))
app.use(express.json())

//Method override
app.use(methodOverride((req,res)=>{
    if(req.body && typeof req.body === 'object' && '_method' in req.body){
        //look in urlencoded POST bodies and delete it
        let method = req.body._method
        delete req.body_method
        return method
    }
}))

//Logging
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'))
}

//handlebars helpers
const {
    formatDate,
    stripTags,
    truncate,
    select,
    editIcon} = require('./helpers/hbs');

//handlebars
app.engine('.hbs',exphbs({helpers:{
    formatDate,
    stripTags,
    truncate,
    editIcon,
    select
}, defaultLayout:'main',extname:'.hbs'}))
app.set('view engine','.hbs')

//sessions
app.use(session({
    secret:'keyboard cat',
    resave:false,
    saveUninitialized:false,
    store:new MongoStore({mongooseConnection:mongoose.connection})
}))

//passport middleware
app.use(passport.initialize())
app.use(passport.session())

//set global var
app.use((req,res,next)=>{
    res.locals.user = req.user || null
    next();
})

//Static folders
app.use(express.static(path.join(__dirname,'public')))

//Routes
app.use('/',require('./routes/index'))
app.use('/auth',require('./routes/auth'))
app.use('/stories',require('./routes/stories'))

const PORT = 8080
app.listen(
    PORT,
    console.log(`server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);