const express = require("express");
const router = express.Router();
const db = require("../db");

//middleware -> check that the login is a student
router.use((req, res, next) => {
  if (!req.session.user || req.session.user.role !== "student") {
    return res.redirect("/");
  }
  next();
});

router.get("/", (req, res) => {
  res.render("studentDashboard");
});

//dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const studentId = req.session.user.id;
    const name = req.session.user.name;

    const [subjects] = await db.query("SELECT name FROM subjects");
    const [exams] = await db.query(
      "SELECT exams.*, subjects.name AS 'subject_name' FROM exams JOIN subjects ON exams.subject_id = subjects.id",
    );
    const [results] = await db.query(
      "SELECT results.*, subjects.name AS 'subject_name' FROM results JOIN subjects on results.subject_id = subjects.id WHERE student_id = ?",
      [studentId],
    );

    res.render("student/dashboard", {
      name: name,
      subjects: subjects,
      exams: exams,
      results: results,
    });
  } catch (err) {
    console.error(err);
    res.send("Database error");
  }
});

/* OTHER ROUTES AND THEIR FEATURES
  SUBJECTS SECTION
    - VIEW ALL REGISTERED SUBJECTS
    - SEE SUBJECT NAME CODE FACULTY NAME CREDITS
  EXAM SECTION
    - VIEW UPCOMING EXAMS
    - SEE SUBJECT DATE TYPE
    - FILTER BY SUBJECT
  RESULTS SECTION
    - SEE SUBJECT MARKS GRADE EXAM TYPE GPA
  PROFILE SECTION
    - NAME EMAIL ROLL COURSE SEMESTER 
*/

module.exports = router;
