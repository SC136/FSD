const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    index: true // single field index
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /.+\@.+\..+/
  },
  age: {
    type: Number,
    min: 0,
    max: 120
  },
  hobbies: {
    type: [String],
    index: true // multikey index
  },
  bio: {
    type: String,
    text: true // text index
  },
  userId: {
    type: String,
    unique: true,
    index: "hashed" // hashed index
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: { expires: "1d" } // TTL index (auto delete after 1 day)
  }
});

// Compound index
userSchema.index({ email: 1, age: -1 });

module.exports = mongoose.model("User", userSchema);