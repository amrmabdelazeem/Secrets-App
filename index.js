import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import "dotenv/config";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth20";

const db = new pg.Client({
  user: process.env.DB_USER,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  host: process.env.DB_HOST,
});

db.connect();

const app = express();
const port = 3000;
const saltRounds = 10;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: process.env.SECRET_SESSION,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/secrets", async (req, res) => {
  if (req.isAuthenticated()) {
    console.log("user:--->");
    console.log(req.user);
    console.log("User is authenticated!");
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1", [req.user.email]);
      const secrets = result.rows[0].secrets;
      console.log(secrets);
      if(secrets){
        res.render("secrets.ejs", { secrets: secrets });
      }else{
        res.render("secrets.ejs", { secrets: "Jack Baur is my hero"});
      }
      
    } catch (error) {
      console.log(error);
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) console.log(err);
    res.redirect("/");
  });
});

app.get("/submit", (req, res) => {
  console.log(req.user);
  if (req.isAuthenticated()) {
    res.render("submit.ejs");
  } else {
    res.redirect("/login");
  }
});

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", {
    successRedirect: "/secrets",
    failureRedirect: "/login",
  })
);

app.post("/submit", async (req, res) => {
  const secret = req.body.secret;
  const email = req.user.email;
  console.log(email);
  try {
    const newSecret = await db.query("UPDATE users SET secrets = $1 WHERE email = $2", [
      secret,
      email,
    ]);
    res.redirect("/secrets");
  } catch (error) {
    console.log(error);
  }
});

app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkEmail = await db.query("SELECT * FROM  users WHERE email=$1", [email]);
    if (checkEmail.rowCount > 0) {
      res.render("register.ejs");
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          res.send("Error on hashing the password!");
        } else {
          const result = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING email",
            [email, hash]
          );
          console.log("Successfully Added new user to DATABASE!");
          const user = result.rows[0];
          req.login(user, (err) => {
            console.log("Sucess");
            res.redirect("/secrets");
          });
        }
      });
    }
  } catch (error) {
    console.log(error.message);
    res.render("register.ejs");
  }
});

app.post(
  "/login",
  passport.authenticate("local", { successRedirect: "/secrets", failureRedirect: "/login" })
);

passport.use(
  "local",
  new Strategy(async function verify(username, password, cb) {
    try {
      const result = await db.query("SELECT * FROM users where  email=$1", [username]);

      if (result.rowCount === 0) {
        res.render("login.ejs", { message: "Email is not registered. Please Register first." });
      } else {
        const storedHashedPassword = result.rows[0].password;
        bcrypt.compare(password, storedHashedPassword, (err, result) => {
          if (err) {
            return cb(err);
          } else {
            if (!result) {
              return cb(null, false);
            } else {
              console.log("Sucessfully Logged In!");
              return cb(null, username);
            }
          }
        });
      }
    } catch (error) {
      return cb("user not found");
    }
  })
);

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      console.log(profile);
      console.log(profile.emails[0].value);
      try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [
          profile.emails[0].value,
        ]);
        if (result.rows.length === 0) {
          const newUser = await db.query("INSERT INTO users (email, password) VALUES ($1, $2)", [
            profile.emails[0].value,
            "google",
          ]);
          return cb(null, newUser.rows[0]);
        } else {
          return cb(null, result.rows[0]);
        }
      } catch (error) {
        return cb(error);
      }
    }
  )
);

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`http://localhost:${port}`);
});
