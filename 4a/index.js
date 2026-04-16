import express from "express";
import morgan  from "morgan";
import path    from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = 3000;

const student = {
  name    : "Swar Churi",
  rollNo  : "10713",
  course  : "Computer Engineering",
  email   : "swarchuri@gmail.com",
  phone   : "+91 97674 56822",
};

app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.get("/", (req, res) => {
  res.send(`
    <h1>Welcome to the Student Information Server!</h1>
    <p>Use the routes below to explore:</p>
    <ul>
      <li><a href="/about">GET /about</a> – Student details</li>
      <li><a href="/contact">GET /contact</a> – Contact info</li>
      <li><a href="/form.html">GET /form</a> – HTML form (Post-Lab 1)</li>
      <li><a href="/profile">GET /profile</a> – EJS profile (Post-Lab 2)</li>
    </ul>
  `);
});
app.get("/about", (req, res) => {
  res.send(`
    <h2>About</h2>
    <p><strong>Name:</strong> ${student.name}</p>
    <p><strong>Roll No:</strong> ${student.rollNo}</p>
    <p><strong>Course:</strong> ${student.course}</p>
  `);
});
app.get("/contact", (req, res) => {
  res.send(`
    <h2>Contact</h2>
    <p><strong>Email:</strong> ${student.email}</p>
    <p><strong>Phone:</strong> ${student.phone}</p>
  `);
});
app.post("/register", (req, res) => {
  res.status(201).json({
    status  : 201,
    message : "Student registered successfully!",
    data    : req.body,
  });
});
app.put("/update", (req, res) => {
  res.status(200).json({
    status  : 200,
    message : "Student record updated successfully!",
    data    : req.body,
  });
});
app.post("/submit", (req, res) => {
  const { name, branch, year } = req.body;
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Form Submitted</title>
    </head>
    <body>
      <div class="card">
        <h2>✅ Form Submitted Successfully</h2>
        <p>Student Name: <span>${name}</span></p>
        <p>Branch: <span>${branch}</span></p>
        <p>Year: <span>${year}</span></p>
        <a href="/form.html">← Back to Form</a>
      </div>
    </body>
    </html>
  `);
});
app.get("/profile", (req, res) => {
  res.render("profile", {
    name  : "Swar Churi",
    branch: "Computer Engineering",
    year  : "SE",
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀  Server running at http://localhost:${PORT}`);
  console.log(`   GET  /          → Welcome page`);
  console.log(`   GET  /about     → Student info`);
  console.log(`   GET  /contact   → Contact info`);
  console.log(`   POST /register  → 201 Created`);
  console.log(`   PUT  /update    → 200 Updated`);
  console.log(`   GET  /form.html → HTML form (Post-Lab 1)`);
  console.log(`   GET  /profile   → EJS profile (Post-Lab 2)\n`);
});
