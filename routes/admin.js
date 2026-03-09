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

router.get("/manage/faculty", async (req, res) => {
  try {
    const name = req.session.user.name;

    const [faculty] = await db.query(
      "SELECT users.id, users.name, users.email, subjects.department, subjects.name AS 'subjects' FROM users LEFT JOIN subjects ON users.id = subjects.faculty_id WHERE users.role = 'faculty' ORDER BY users.name ASC",
    );

    const [subjects] = await db.query("SELECT subjects.* FROM subjects");

    res.render("admin/manage_faculty", {
      name: name,
      facultyList: faculty,
      subjects: subjects,
    });
  } catch (err) {
    console.error(err);
    res.send("Database error");
  }
});

router.get("/faculty/create", async (req, res) => {
  const adminName = req.session.user.name;

  const [subjects] = await db.query("SELECT subjects.* FROM subjects");

  res.render("admin/add_faculty", {
    name: adminName,
    subjects: subjects,
  });
});

router.post("/faculty/create", async (req, res) => {
  try {
    const { name, email, password, department, subjectName } = req.body;
    const deptUpper = department.toUpperCase().trim();
    const subjTrim = subjectName.trim();

    const [facultyResult] = await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'faculty')",
      [name, email, password],
    );
    const facultyId = facultyResult.insertId;

    const [existingSubj] = await db.query(
      "SELECT id FROM subjects WHERE name = ? AND department = ?",
      [subjTrim, deptUpper],
    );

    let targetSubjectId;

    if (existingSubj.length > 0) {
      targetSubjectId = existingSubj[0].id;
    } else {
      const generatedCode =
        deptUpper.substring(0, 3) + Math.floor(100 + Math.random() * 900);

      const [newSubj] = await db.query(
        "INSERT INTO subjects (name, department, semester, credits, code) VALUES (?, ?, 1, 4, ?)",
        [subjTrim, deptUpper, generatedCode],
      );
      targetSubjectId = newSubj.insertId;
    }

    await db.query("UPDATE subjects SET faculty_id = ? WHERE id = ?", [
      facultyId,
      targetSubjectId,
    ]);

    res.redirect("/admin/manage/faculty");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating faculty/subject assignment.");
  }
});

router.post("/faculty/:faculty_id/delete", async (req, res) => {
  try {
    const name = req.session.user.name;
    const facultyId = req.params.faculty_id;

    await db.query("DELETE FROM subjects WHERE faculty_id = ?", [facultyId]);

    await db.query("DELETE FROM users WHERE id = ? AND role = 'faculty'", [
      facultyId,
    ]);

    res.redirect("/admin/manage/faculty");
  } catch (err) {
    console.error(err);
    res.send("Error in deleting records");
  }
});

router.get("/:faculty_id/edit-faculty", async (req, res) => {
  try {
    const name = req.session.user.name;
    const facultyId = req.params.faculty_id;

    const [faculty] = await db.query(
      "SELECT id, name, email FROM users WHERE id = ?",
      [facultyId],
    );

    const [allSubjects] = await db.query(
      `
      SELECT id, name, department, 
      IF(faculty_id = ?, 1, 0) AS is_assigned 
      FROM subjects`,
      [facultyId],
    );

    res.render("admin/edit_faculty", {
      name: name,
      faculties: faculty,
      subjects: allSubjects,
    });
  } catch (err) {
    console.error(err);
    res.send("Database error");
  }
});

router.post("/faculty/:faculty_id/edit", async (req, res) => {
  try {
    const facultyId = req.params.faculty_id;
    const { name, email, subjectIds } = req.body;

    await db.query("UPDATE users SET name = ?, email = ? WHERE id = ?", [
      name,
      email,
      facultyId,
    ]);

    await db.query(
      "UPDATE subjects SET faculty_id = NULL WHERE faculty_id = ?",
      [facultyId],
    );

    if (subjectIds && subjectIds.length > 0) {
      const idsToUpdate = Array.isArray(subjectIds) ? subjectIds : [subjectIds];

      await db.query("UPDATE subjects SET faculty_id = ? WHERE id IN (?)", [
        facultyId,
        idsToUpdate,
      ]);
    }

    res.redirect("/admin/manage/faculty");
  } catch (err) {
    console.error(err);
    res.send("Error updating faculty assignments.");
  }
});

router.get("/manage/subjects", async (req, res) => {
  try {
    const name = req.session.user.name;

    const query = `
            SELECT 
                subjects.id,
                subjects.code,
                subjects.name,
                subjects.credits,
                users.name AS faculty_name
            FROM subjects
            LEFT JOIN users ON subjects.faculty_id = users.id
            ORDER BY subjects.code ASC
        `;
    const [subjects] = await db.query(query);
    res.render("admin/manage_subjects", {
      name: name,
      subjects: subjects,
    });
  } catch (err) {
    console.error(err);
    res.send("Database Error");
  }
});

//add student
//edit subjects
router.post("/subjects/:subjectId/delete", async (req, res) => {
  try {
    const subjectId = req.params.subjectId;

    await db.query("DELETE FROM registrations WHERE subject_id = ?",[subjectId]);
    const [examIds] = await db.query("SELECT exam_id FROM exams WHERE subject_id = ?",[subjectId]);
    
    examIds.forEach(examId => {
      await db.query("DELETE FROM results WHERE exam_id = ?",[examId]);
    });

    await db.query("DELETE FROM exams WHERE subject_id = ?", [subjectId]);

    await db.query("DELETE FROM subjects WHERE id = ?",[subjectId]);

    res.redirect("/admin/manage/subjects");
  } catch (err) {
    console.error(err);
    res.send("Error in deleting the record");
  }
});

router.get("/exams/overview", async (req, res) => {
  try {
    const name = req.session.user.name;

    const [exams] = await db.query(
      "SELECT subjects.name, exams.exam_type, DATE_FORMAT(exams.exam_date, '%d %b') AS 'exam_date', users.name AS 'faculty', COUNT(registrations.student_id) AS 'studentCount' FROM exams JOIN subjects ON exams.subject_id = subjects.id JOIN users ON subjects.faculty_id = users.id LEFT JOIN registrations ON subjects.id = registrations.subject_id GROUP BY exams.id, subjects.name, exams.exam_type, exams.exam_date, users.name ORDER BY exams.exam_date ASC",
    );

    res.render("admin/exams_overview", {
      name: name,
      exams: exams,
    });
  } catch (err) {
    console.error(err);
    res.send("Database error");
  }
});

router.get("/results/overview", async (req, res) => {
  try {
    const name = req.session.user.name;

    const [results] = await db.query(
      "SELECT users.name AS 'students', subjects.name AS 'subject_name', exams.exam_type, results.marks, results.grade FROM users JOIN registrations ON users.id = registrations.student_id JOIN subjects ON registrations.subject_id = subjects.id LEFT JOIN exams ON subjects.id = exams.subject_id LEFT JOIN results ON (exams.id = results.exam_id AND users.id = results.student_id) ORDER BY users.name ASC;",
    );

    res.render("admin/results_overview", {
      name: name,
      results: results,
    });
  } catch (err) {
    console.error(err);
    res.send("Database error");
  }
});

module.exports = router;
