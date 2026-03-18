# University Exam System

A web-based university examination management system built with Node.js, Express, and MySQL. Developed as a project for an RDBMS class.

## Overview

This system supports three user roles: admin, faculty, and student each with their own dashboard and set of features. Admins manage users and subjects, faculty create exams and enter marks, and students view their enrolled subjects, upcoming exams, and results.

## Features

**Admin**
- Dashboard with counts of students, faculty, subjects, exams, and results
- Create, edit, and delete student accounts with automatic subject registration
- Create, edit, and delete faculty accounts with subject assignment
- Manage subjects (add, edit, delete)
- Assign or remove faculty from subjects
- View an overview of all exams and results across the system

**Faculty**
- Dashboard showing assigned subjects and upcoming exams
- View students enrolled in each subject
- Create exams (Midterm, Endterm, Practical) for one or more subjects
- Enter and save student marks

**Student**
- Dashboard showing enrolled subjects, upcoming exams, and recent results
- View subject details including assigned faculty
- View upcoming exam schedule
- View full results with marks and grades

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express 5
- **Database:** MySQL
- **Templating:** EJS
- **Styling:** Vanilla CSS
  
## Project Structure

```
university-exam-system/
  db.js                   # MySQL connection pool
  server.js               # App entry point
  routes/
    auth.js               # Login / logout
    admin.js              # Admin routes
    faculty.js            # Faculty routes
    student.js            # Student routes
  views/
    login.ejs
    admin/                # Admin page templates
    faculty/              # Faculty page templates
    student/              # Student page templates
    partials/             # Shared sidebar components
  public/
    style.css
    script.js
```

## Database Schema (expected tables)

- `users` — id, name, email, password, registration_no, role (admin / faculty / student)
- `subjects` — id, name, code, department, semester, credits, faculty_id
- `registrations` — student_id, subject_id
- `exams` — id, subject_id, exam_date, exam_type
- `results` — id, exam_id, student_id, marks, grade

## Setup

### Prerequisites

- Node.js >= 18
- MySQL server running locally

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/slyeet03/university-exam-system.git
   cd university-exam-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```
   DB_HOST=localhost
   DB_USER=your_mysql_user
   DB_PASS=your_mysql_password
   DB_NAME=your_database_name
   DB_PORT=3306
   SESSION_SECRET=your_secret_key
   PORT=3000
   ```

4. Set up your MySQL database and run the necessary table creation scripts (not included — create tables matching the schema above).

5. Start the development server:
   ```bash
   npm run dev
   ```

   Or for production:
   ```bash
   npm start
   ```

6. Open your browser and go to `http://localhost:3000`.

## License

MIT
