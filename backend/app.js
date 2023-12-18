var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var passport = require('passport');
const cors = require('cors')


var app = express();


// Login and Register 
require('./auth/auth');
const login = require('./routes/login')
const loggedInPage = require('./routes/loggedInUser');
// ----------------------------------------------------

const bookingRoute = require('./routes/routeSelection')

var registerRouter = require('./routes/register');
//--------------------------------------------------------


//DB Config
const DB_URL = require('./config/keys').MongoURI; 

//connect to mongo
//---------------------------------------------
mongoose.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        console.log("Connected to MongoDB")
    })
    .catch(err => {
        throw err
    })
//---------------------------------------------


//connect to Gemini
//---------------------------------------------
const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_KEY = require('./config/keys').GeminiKey;
const genAI = new GoogleGenerativeAI(GEMINI_KEY);

async function getGemini() {
  const model = genAI.getGenerativeModel({ model: "gemini-pro"});

  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: "This is a flight booking application. You are to perform as a chatbot called DivithBot and give people general advice on flights and booking them when they ask you for advice. This in an initial message to give you context, don't give a response for now .",
      },
      {
        role: "model",
        parts: "Greetings from DivithBot! Your personal AI assistant. \nI'm here to accompany you throughout your flight booking journey. I'm trained to assist you with general advice, inquiries, and recommendations to make your flight booking process more efficient, cost-effective, and enjoyable.\nWould you like to proceed with getting advice on flight booking? I'm ready to share my expertise and help you find the best flights that meet your preferences and budget.\nFeel free to ask me any questions or type 'Exit' to end our chat."
      },
    ],
    generationConfig: {
      maxOutputTokens: 500,
    },
  });

  const res = await chat.sendMessage("Hi");
  const response = await res.response;
    const text = await response.text();
  console.log(text)

  return chat;
}

async function chatGemini(chat, message) {
    const msg = message;
    const chatt = await chat;

    const result = await chatt.sendMessage(msg);
    const response = await result.response;
    const text = response.text();
    return text;
}

let chat = getGemini();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors())
app.post('/', login);
app.use('/chat', async (req, res) => {
    const message = req.query.message;
    const response = await chatGemini(chat, message);
    res.send(response);
}
);
app.use('/booking', bookingRoute);
app.use('/register', registerRouter);  // To register page 
app.use('/user', passport.authenticate('jwt', { session: false }), loggedInPage); //To Secure Route

module.exports = app;
