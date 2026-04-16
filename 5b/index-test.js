require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI);

async function testIndex() {
  await User.insertMany([
    {
      name: "Alice",
      email: "alice@gmail.com",
      age: 25,
      hobbies: ["coding", "music"],
      bio: "I love coding",
      userId: "u1"
    },
    {
      name: "Bob",
      email: "bob@gmail.com",
      age: 30,
      hobbies: ["sports"],
      bio: "Football player",
      userId: "u2"
    }
  ]);

  const result = await User.find({ name: "Alice" })
    .explain("executionStats");

  console.log(result.executionStats);
}

testIndex();