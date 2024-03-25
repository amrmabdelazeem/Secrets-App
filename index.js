import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import "dotenv/config";
import bcrypt from "bcrypt";
import session from "express-session";

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
app.use(session({
  secret: 'TopSecret',
  resave: false,
  saveUninitialized: true
}
))

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkEmail = await db.query("SELECT * FROM  users WHERE email=$1", [email]);
    if (checkEmail.rowCount > 0) {
      res.render("register.ejs", { error });
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
          console.log(result.rows[0].email);
          const registeredEmail = result.rows[0].email;
          res.render("register.ejs", { registeredEmail });
        }
      });
    }
  } catch (error) {
    console.log(error.message);
    res.render("register.ejs", { error });
  }
});
const errorMessage = "Login credintials are wrong, Try again!";

app.post("/login", async (req, res) => {
  const email = req.body.username;
  const loginPassword = req.body.password;
  try {
    const result = await db.query("SELECT * FROM users where  email=$1", [email]);

    if (result.rowCount === 0) {
      res.render("login.ejs", { message: "Email is not registered. Please Register first." });
    } else {
      const storedHashedPassword = result.rows[0].password;
      bcrypt.compare(loginPassword, storedHashedPassword, (err, result) => {
        if (err) {
          console.log("Error comparing passwords", err);
          res.render("login.ejs", { message: errorMessage });
        } else {
          if (!result) {
            res.render("login.ejs", { message: errorMessage });
            console.log(result);
          } else {
            console.log("Sucessfully Logged In!");
            console.log(result);
            res.render("secrets.ejs");
          }
        }
      });
    }
  } catch (error) {
    console.log(error.message);
    res.render("login.ejs", { error });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`http://localhost:${port}`);
});
