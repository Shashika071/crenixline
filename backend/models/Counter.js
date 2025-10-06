// models/Counter.js

import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  sequence: {
    type: Number,
    default: 1
  }
});

export default mongoose.model("Counter", counterSchema);