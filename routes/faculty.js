const express = require("express");
const router = express.Router();
const db = require("../db");

//middleware -> check that the login is a student
router.use((req, res, next) => {
  if (!req.session.user || req.session.user.role !== "faculty") {
    return res.redirect("/");
  }
  next();
});

router.get("/", (req, res) => {
  res.redirect("/faculty/dashboard");
});

router.get("/dashboard", async (req, res) => {
  try {
    const facultyId = req.session.user.id;
    const name = req.session.user.name;

    const [subjects] = await db.query(
      "SELECT subjects.id AS 'subject_id', exams.id as 'exam_id', COUNT(results.id) FROM subjects JOIN exams ON subjects.id=exams.subject_id JOIN results ON exams.id=results.exam_id WHERE subjects.faculty_id = ? GROUP BY subjects.id, exams.id",
      [facultyId],
    );
    const [exams] = await db.query(
      "SELECT subjects.id AS 'subject_id', exams.id AS 'exam_id' FROM subjects JOIN exams ON subjects.id=exams.subject_id WHERE exams.exam_date >= CURDATE() AND subjects.faculty_id = ?",
      [facultyId],
    );

    res.render("faculty/dashboard", {
      name: name,
      subjects: subjects,
      exams: exams,
    });
  } catch (err) {
    console.error(err);
    res.send("Database error");
  }
});

router.get("/subjects", async (req, res) => {
  try {
    const name = req.session.user.name;
    const facultyId = req.session.user.id;

    const [subjects] = await db.query(
      "SELECT * FROM subjects WHERE faculty_id = ?",
      [facultyId],
    );

    res.render("faculty/subjects", {
      name: name,
      subjects: subjects,
    });
  } catch (err) {
    console.error(err);
    res.send("Database Error");
  }
});

router.get("/subjects/:id/students", async (req, res) => {
  try {
    const name = req.session.user.name;
    const subjectId = req.params.id;

    const [studentSubjects] = await db.query(
      "SELECT users.* FROM users JOIN registrations ON users.id=registrations.student_id JOIN subjects ON registrations.subject_id=subjects.id WHERE registrations.subject_id=?",
      [subjectId],
    );
    const [subjects] = await db.query(
      "SELECT name FROM subjects WHERE id = ?",
      [subjectId],
    );

    res.render("faculty/student_subject", {
      name: name,
      subjects: subjects,
      students: studentSubjects,
    });
  } catch (err) {
    console.error(err);
    res.send("Database error");
  }
});

router.get("/exams", async (req, res) => {
  try {
    const name = req.session.user.name;
    const examId = req.params.id;
    const facultyId = req.session.user.id;

    const [exams] = await db.query(
      "SELECT exams.*, subjects.name AS 'subject_name' FROM exams JOIN subjects ON exams.subject_id=subjects.id WHERE subjects.faculty_id=?",
      [facultyId],
    );

    res.render("faculty/exams", {
      name: name,
      exams: exams,
    });
  } catch (err) {
    console.error(err);
    res.send("Database error");
  }
});

router.post("/exams/:id/delete", (req, res) => {
  try {
    const examId = req.params.id;
    const facultyId = req.session.user.id;

    db.query(
      "DELETE exams FROM exams JOIN subjects ON exams.subject_id=subjects.id WHERE subjects.faculty_id=? AND exams.id=?",
      [facultyId, examId],
    );

    res.redirect("/faculty/exams");
  } catch (err) {
    console.error(err);
    res.send("Database error");
  }
});

router.get("/exams/create", async (req, res) => {
  try {
    const name = req.session.user.name;
    const facultyId = req.session.user.id;

    const [subjects] = await db.query(
      "SELECT id, name FROM subjects WHERE faculty_id=?",
      [facultyId],
    );

    res.render("faculty/create_exam", {
      name: name,
      subjects: subjects,
    });
  } catch (err) {
    console.error(err);
    res.send("Database error");
  }
});

router.post("/exams/create/submit", async (req, res) => {
  try {
    const { selectedSubjects, examDate, examType } = req.body;

    if (Array.isArray(selectedSubjects)) {
      for (let subId of selectedSubjects) {
        await db.query(
          "INSERT INTO exams (subject_id, exam_date, type) VALUES (?, ?, ?)",
          [subId, examDate, examType],
        );
      }
    } else {
      await db.query(
        "INSERT INTO exams (subject_id, exam_date, exam_type) VALUES (?, ?, ?)",
        [selectedSubjects, examDate, examType],
      );
    }

    res.redirect("/faculty/exams");
  } catch (err) {
    console.error(err);
    res.send("Database error");
  }
});

router.get("/results/:examId", async (req, res) => {});

module.exports = router;
