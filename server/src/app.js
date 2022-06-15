const express = require("express");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");
const api = require("./routes/api");
const helmet = require("helmet");
const passport = require("passport");
const { Strategy } = require("passport-google-oauth20");
const cookieSession = require("cookie-session");

const config = {
  CLIENT_ID: process.env.CLIENT_ID,
  CLIENT_SECRET: process.env.CLIENT_SECRET,
  COOKIE_KEY_1: process.env.COOKIE_KEY_1,
  COOKIE_KEY_2: process.env.COOKIE_KEY_2,
};

passport.use(
  new Strategy(
    {
      clientID: config.CLIENT_ID,
      clientSecret: config.CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      console.log(profile);
      done(null, profile);
    }
  )
);

// save session to cookie
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// read session from cookie
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

const app = express();

app.use(helmet());

app.use(
  cookieSession({
    name: "session",
    maxAge: 60 * 1000 * 24 * 60,
    keys: [config.COOKIE_KEY_1, config.COOKIE_KEY_2],
  })
);

app.use(passport.initialize());
app.use(passport.session());

function checkLoggedIn(req, res, next) {
  console.log("auth", req.isAuthenticated());
  const isLoggedIn = req.isAuthenticated() && req.user;
  if (!isLoggedIn) {
    return res.status(401).json({
      message: "You are not logged in",
    });
  }

  next();
}

app.get("/auth/google", passport.authenticate("google", { scope: ["email"] }));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "/",
    failureRedirect: "/error",
    session: true,
  }),
  (req, res) => {
    console.log("Google Logged us in successfully", req);
  }
);

app.get("/auth/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app.get("/error", (req, res) => {
  return res.send("Failed to Login");
});

app.get("/secret", checkLoggedIn, (req, res) => {
  return res.send("Your personal secret value is 24");
});

app.use(cors({ origin: "https://localhost:3000" }));
app.use(morgan("combined"));
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/v1", api);

app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "..", "public2", "index.html"));
// });

module.exports = app;
