import express from "express";
import axios   from "axios";
import morgan  from "morgan";
import path    from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = 3001;
const SAFE_BLACKLIST = "nsfw,racist,sexist,explicit,religious,political";
const ALLOWED_CATEGORIES = new Set([
  "Any",
  "Programming",
  "Misc",
  "Pun",
  "Spooky",
  "Christmas",
]);
const ALLOWED_TYPES = new Set(["any", "single", "twopart"]);

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

function sanitizeCategory(category) {
  if (!category || !ALLOWED_CATEGORIES.has(category)) {
    return "Any";
  }
  return category;
}

function sanitizeType(type) {
  const normalized = (type || "any").toLowerCase();
  if (!ALLOWED_TYPES.has(normalized)) {
    return "any";
  }
  return normalized;
}

function sanitizeContains(contains) {
  const value = (contains || "").trim();
  if (!value) {
    return "";
  }

  // Keep keyword filters simple and safe for API usage.
  return value.replace(/[^a-zA-Z0-9\s'-]/g, "").slice(0, 30);
}

async function fetchJokeFromApi({ category, type, contains }) {
  const response = await axios.get(`https://v2.jokeapi.dev/joke/${category}`, {
    params: {
      blacklistFlags: SAFE_BLACKLIST,
      lang: "en",
      type: type === "any" ? undefined : type,
      contains: contains || undefined,
    },
  });

  const data = response.data;

  if (data.error) {
    throw new Error(data.message || "JokeAPI returned an error response.");
  }

  return {
    id: data.id,
    category: data.category,
    type: data.type,
    lang: data.lang,
    safe: data.safe,
    flags: data.flags,
    joke: data.type === "single" ? data.joke : null,
    setup: data.type === "twopart" ? data.setup : null,
    delivery: data.type === "twopart" ? data.delivery : null,
  };
}

app.get("/", (req, res) => {
  res.render("index", {
    joke: null,
    name: "",
    error: null,
    formValues: {
      category: "Any",
      type: "any",
      contains: "",
    },
  });
});

app.post("/joke", async (req, res) => {
  const name = req.body.name?.trim() || "Friend";
  const formValues = {
    category: sanitizeCategory(req.body.category),
    type: sanitizeType(req.body.type),
    contains: sanitizeContains(req.body.contains),
  };

  try {
    const joke = await fetchJokeFromApi(formValues);

    res.render("index", { joke, name, error: null, formValues });
  } catch (err) {
    console.error("JokeAPI error:", err.message);
    res.render("index", {
      joke : null,
      name,
      formValues,
      error: "Couldn't fetch a joke right now. Try again!",
    });
  }
});

app.get("/api/joke", async (req, res) => {
  const request = {
    category: sanitizeCategory(req.query.category),
    type: sanitizeType(req.query.type),
    contains: sanitizeContains(req.query.contains),
  };

  try {
    const joke = await fetchJokeFromApi(request);
    res.status(200).json({
      request,
      joke,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("JokeAPI error:", err.message);
    res.status(502).json({
      error: "Joke service unavailable",
      detail: err.message,
    });
  }
});

let students = [
  { id: 1, name: "Rahul Sharma",  branch: "Computer Engineering",     year: "SE" },
  { id: 2, name: "Priya Verma",   branch: "Information Technology",   year: "TE" },
  { id: 3, name: "Aditya Nair",   branch: "Electronics Engineering",  year: "SE" },
  { id: 4, name: "Sneha Patil",   branch: "Computer Engineering",     year: "BE" },
];
let nextId = 5;
app.get("/students", (req, res) => {
  res.status(200).json({
    count   : students.length,
    students,
  });
});
app.get("/students/:id", (req, res) => {
  const id      = parseInt(req.params.id);
  const student = students.find((s) => s.id === id);

  if (!student) {
    return res.status(404).json({ error: `Student with id ${id} not found.` });
  }

  res.status(200).json(student);
});
app.post("/students", (req, res) => {
  const { name, branch, year } = req.body;

  if (!name || !branch || !year) {
    return res
      .status(400)
      .json({ error: "name, branch, and year are all required." });
  }

  const newStudent = { id: nextId++, name, branch, year };
  students.push(newStudent);

  res.status(201).json({
    message : "Student added successfully.",
    student : newStudent,
  });
});
app.patch("/students/:id", (req, res) => {
  const id    = parseInt(req.params.id);
  const index = students.findIndex((s) => s.id === id);

  if (index === -1) {
    return res.status(404).json({ error: `Student with id ${id} not found.` });
  }

  const { name, branch, year } = req.body;
  if (name)   students[index].name   = name;
  if (branch) students[index].branch = branch;
  if (year)   students[index].year   = year;

  res.status(200).json({
    message : "Student updated successfully.",
    student : students[index],
  });
});
app.delete("/students/:id", (req, res) => {
  const id    = parseInt(req.params.id);
  const index = students.findIndex((s) => s.id === id);

  if (index === -1) {
    return res.status(404).json({ error: `Student with id ${id} not found.` });
  }

  const deleted = students.splice(index, 1)[0];

  res.status(200).json({
    message : "Student deleted successfully.",
    student : deleted,
  });
});

app.listen(PORT, () => {
  console.log(`\nServer running at http://localhost:${PORT}`);
  console.log(`\n  ── Joke Website ──`);
  console.log(`   GET  /            → Joke input form`);
  console.log(`   POST /joke        → Fetch joke via Axios + JokeAPI`);
  console.log(`   GET  /api/joke    → JSON joke endpoint with query filters`);
  console.log(`\n  ── Student REST API ──`);
  console.log(`   GET    /students        → All students`);
  console.log(`   GET    /students/:id   → One student`);
  console.log(`   POST   /students       → Add student`);
  console.log(`   PATCH  /students/:id  → Update student`);
  console.log(`   DELETE /students/:id  → Delete student\n`);
});
