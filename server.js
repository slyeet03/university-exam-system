const cors = require("cors");
const express = require("express");
const session = require("express-session");
require("dotenv").config();

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  }),
);

//middleware --> loads first
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public")); //use css
app.set("view engine", "ejs");

//session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false, //save only when smthing is modified
    saveUninitialized: false,
  }),
);

//routes
const authRoutes = require("./routes/auth");
app.use("/", authRoutes);
const studentRoutes = require("./routes/student");
app.use("/student", studentRoutes);
const facultyRoutes = require("./routes/faculty");
app.use("/faculty", facultyRoutes);
const adminRoutes = require("./routes/admin.js");
app.use("/admin", adminRoutes);

//start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
