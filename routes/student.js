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
  res.redirect("/student/dashboard");
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
      "SELECT results.marks, results.grade, exams.exam_type, exams.exam_date, subjects.name AS subject_name FROM results JOIN exams ON results.exam_id = exams.id JOIN subjects ON exams.subject_id = subjects.id WHERE results.student_id = ?",
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

//subjects
router.get("/subjects", async (req, res) => {
  try {
    const studentId = req.session.user.id;
    const name = req.session.user.name;

    const [subjects] = await db.query(
      "SELECT subjects.*, users.name as 'faculty' FROM subjects JOIN registrations JOIN users ON subjects.id=registrations.subject_id AND subjects.faculty_id=users.id WHERE registrations.student_id = ? and users.id = subjects.faculty_id",
      [studentId],
    );

    res.render("student/subjects", {
      name: name,
      subjects: subjects,
    });
  } catch (err) {
    console.error(err);
    res.send("Database error");
  }
});

//exams
router.get("/exams", async (req, res) => {
  try {
    const studentId = req.session.user.id;
    const name = req.session.user.name;

    const [exams] = await db.query(
      "SELECT exams.*, subjects.name AS 'subject_name' FROM exams JOIN subjects JOIN registrations ON exams.subject_id = subjects.id AND subjects.id=registrations.subject_id WHERE registrations.student_id = ? AND exams.exam_date >= CURDATE()",
      [studentId],
    );

    res.render("student/exams", {
      name: name,
      exams: exams,
    });
  } catch (err) {
    console.error(err);
    res.send("Database error");
  }
});

//results
router.get("/results", async (req, res) => {
  try {
    const studentId = req.session.user.id;
    const name = req.session.user.name;

    const [results] = await db.query(
      "SELECT results.marks, results.grade, exams.exam_type, exams.exam_date, subjects.name AS subject_name FROM results JOIN exams ON results.exam_id = exams.id JOIN subjects ON exams.subject_id = subjects.id WHERE results.student_id = ?",
      [studentId],
    );

    res.render("student/results", {
      name: name,
      results: results,
    });
  } catch (err) {
    console.error(err);
    res.send("Database error");
  }
});

module.exports = router;
