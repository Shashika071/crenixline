import mongoose from "mongoose";

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    default: 0
  },
  reorderLevel: {
    type: Number,
    default: 5
  },
  location: {
    type: String
  },
  purchaseDate: {
    type: Date
  },
  cost: {
    type: Number
  },
  notes: {
    type: String
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model('Equipment', equipmentSchema);
