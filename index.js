require("dotenv").config();
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const mongoose = require('mongoose');
const authRoute = require("./routes/auth");
const userRoute = require("./routes/user");
const cookieSession = require("cookie-session");
const passportStrategy = require("./passport");
const app = express();

// Middleware setup
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

mongoose.connect('mongodb://localhost:27017/crud', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log("DB connected...");
})
.catch((err) => {
    console.error('DB connection error:', err);
});

app.use(
    cookieSession({
        name: "session",
        keys: ["cyberwolve"],
        maxAge: 24 * 60 * 60 * 1000, 
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        methods: "GET,POST,PUT,DELETE",
        credentials: true,
    })
);

app.use("/auth", authRoute);
app.use("/user", userRoute);



// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({ message: err.message });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
