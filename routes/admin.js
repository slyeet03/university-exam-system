const express = require("express");
const router = express.Router();
const db = require("../db");

//middleware -> check that the login is a student
router.use((req, res, next) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/");
  }
  next();
});

router.get("/", (req, res) => {
  res.redirect("/admin/dashboard");
});

router.get("/dashboard", async (req, res) => {
  try {
    const name = req.session.user.name;

    const [students] = await db.query(
      "SELECT DISTINCT id FROM users WHERE role='student'",
    );
    const [faculty] = await db.query(
      "SELECT DISTINCT faculty_id FROM subjects",
    );
    const [subjects] = await db.query("SELECT DISTINCT id FROM subjects");
    const [exams] = await db.query("SELECT id FROM exams");
    const [results] = await db.query("SELECT DISTINCT id FROM results");

    res.render("admin/dashboard", {
      name: name,
      students: students,
      faculty: faculty,
      subjects: subjects,
      exams: exams,
      results: results,
    });
  } catch (err) {
    console.error(err);
    res.send("Database error");
  }
});

router.get("/manage/students", async (req, res) => {
  try {
    const name = req.session.user.name;

    const [students] = await db.query(
      "SELECT users.id,users.name, users.registration_no, MAX(subjects.department) AS 'course',MAX(subjects.semester) AS 'semester' FROM users LEFT JOIN registrations ON users.id = registrations.student_id LEFT JOIN subjects ON registrations.subject_id = subjects.id WHERE users.role = 'student' GROUP BY users.id, users.name, users.registration_no;",
    );

    res.render("admin/manage_students", {
      name: name,
      students: students,
    });
  } catch (err) {
    console.error(err);
    res.send("Database error");
  }
});

router.get("/student/create", (req, res) => {
  const adminName = req.session.user.name;

  res.render("admin/add_student", {
    name: adminName,
  });
});

router.post("/student/create", async (req, res) => {
  try {
    const { name, email, roll, course, semester, password } = req.body;

    const [userResult] = await db.query(
      "INSERT INTO users (name, email, registration_no, password, role) VALUES (?, ?, ?, ?, 'student')",
      [name, email, roll, password],
    );

    const studentId = userResult.insertId;

    const [matchingSubjects] = await db.query(
      "SELECT id FROM subjects WHERE department = ? AND semester = ?",
      [course, semester],
    );

    if (matchingSubjects.length > 0) {
      for (const subject of matchingSubjects) {
        await db.query(
          "INSERT INTO registrations (student_id, subject_id) VALUES (?, ?)",
          [studentId, subject.id],
        );
      }
    }

    res.redirect("/admin/manage/students");
  } catch (err) {
    console.error(err);
    res.send("Database error occurred during creation.");
  }
});

router.post("/:student_id/delete", async (req, res) => {
  try {
    const name = req.session.user.name;
    const studentId = req.params.student_id;

    await db.query("DELETE FROM results WHERE student_id = ?", [studentId]);
    await db.query("DELETE FROM registrations WHERE student_id = ?", [
      studentId,
    ]);
    await db.query("DELETE FROM users WHERE id = ? AND role = 'student'", [
      studentId,
    ]);

    res.redirect("/admin/manage/students");
  } catch (err) {
    console.error(err);
    res.send("Error in deleting records");
  }
});

router.get("/:student_id/edit", async (req, res) => {
  try {
    const name = req.session.user.name;
    const studentId = req.params.student_id;

    const [user] = await db.query(
      "SELECT DISTINCT users.id, users.name, users.email, users.registration_no, subjects.department, subjects.semester FROM users LEFT JOIN registrations ON users.id=registrations.student_id LEFT JOIN subjects ON registrations.subject_id=subjects.id WHERE users.id = ? LIMIT 1",
      [studentId],
    );

    res.render("admin/edit_student", {
      name: name,
      students: user,
    });
  } catch (err) {
    console.error(err);
    res.send("Database error");
  }
});

router.post("/student/:student_id/edit", async (req, res) => {
  try {
    const studentId = req.params.student_id;
    const name = req.body.name;
    const email = req.body.email;
    const roll = req.body.roll;
    const course = req.body.course.toUpperCase().trim(); // Forces "cse" to "CSE"
    const semester = parseInt(req.body.semester);

    await db.query(
      "UPDATE users SET name = ?, email = ?, registration_no = ? WHERE id = ?",
      [name, email, roll, studentId],
    );

    const [newSubjects] = await db.query(
      "SELECT id FROM subjects WHERE department = ? AND semester = ?",
      [course, semester],
    );

    if (newSubjects.length > 0) {
      await db.query("DELETE FROM registrations WHERE student_id = ?", [
        studentId,
      ]);

      const registrationValues = newSubjects.map((s) => [studentId, s.id]);
      await db.query(
        "INSERT INTO registrations (student_id, subject_id) VALUES ?",
        [registrationValues],
      );
      console.log(
        `Success: Registered student ${studentId} for ${newSubjects.length} subjects.`,
      );
    } else {
      console.log(
        `Warning: No subjects found for ${course} Sem ${semester}. Registrations untouched.`,
      );
    }

    res.redirect("/admin/manage/students");
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

module.exports = router;
