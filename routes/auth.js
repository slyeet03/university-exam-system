const express = require("express");
const router = express.Router();
const db = require("../db");

//show login page
router.get("/", (req, res) => {
  res.render("login");
});

//handle login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";

    const [results] = await db.query(sql, [email, password]);

    if (results.length > 0) {
      const user = results[0];

      // store session
      req.session.user = {
        id: user.id,
        name: user.name,
        role: user.role,
      };

      // redirect based on role
      if (user.role === "admin") {
        return res.send("admin dashboard");
      }
      if (user.role === "faculty") {
        return res.send("faculty dashboard");
      }
      if (user.role === "student") {
        return res.send("student dashboard");
      }
    } else {
      return res.send("Invalid credentials");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

//logout
router.get("/logout", (req, res) => {
  req.sesion.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;
