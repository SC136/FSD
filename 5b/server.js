require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/User");

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

/* ---------------- CRUD ---------------- */

// CREATE
app.post("/users", async (req, res) => {
  try {
    const user = new User(req.body);
    const saved = await user.save();
    res.json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// READ ALL
app.get("/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// UPDATE
app.put("/users/:id", async (req, res) => {
  const updated = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updated);
});

// DELETE
app.delete("/users/:id", async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
});

/* ---------------- QUERYING ---------------- */

// Search by name
app.get("/search", async (req, res) => {
  const { name } = req.query;
  const users = await User.find({ name: new RegExp(name, "i") });
  res.json(users);
});

// Filter by email & age
app.get("/filter", async (req, res) => {
  const { email, age } = req.query;
  const users = await User.find({
    email,
    age: Number(age)
  });
  res.json(users);
});

// Find by hobbies
app.get("/hobbies", async (req, res) => {
  const { hobby } = req.query;
  const users = await User.find({
    hobbies: hobby
  });
  res.json(users);
});

// Text search on bio
app.get("/bio-search", async (req, res) => {
  const { text } = req.query;
  const users = await User.find({
    $text: { $search: text }
  });
  res.json(users);
});

/* ---------------- PAGINATION ---------------- */

app.get("/paginate", async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = 5;

  const users = await User.find()
    .skip((page - 1) * limit)
    .limit(limit);

  res.json(users);
});

app.get("/explain", async (req, res) => {
  const result = await User.find({ name: req.query.name })
    .explain("executionStats");

  res.json(result);
});

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);