import AdminRouter from "./routers/adminRoutes.js";
import EmployeeRouter from "./routers/employeeRoutes.js";
import ExpenseRouter from "./routers/expenseRoutes.js";
import MaterialRouter from "./routers/materialRoutes.js";
import OrderRouter from "./routers/orderRoutes.js";
import PaymentRouter from "./routers/paymentRoutes.js";
import ProductionRouter from "./routers/productionRoutes.js";
import ReportRouter from "./routers/reportRoutes.js";
import SupplierRouter from "./routers/supplierRoutes.js";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  }
};

connectDB();

// Health check
app.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  let dbStatus = "disconnected";
  if (dbState === 1) dbStatus = "connected";
  if (dbState === 2) dbStatus = "connecting";
  if (dbState === 3) dbStatus = "disconnecting";

  res.json({
    success: true,
    message: "Server is running",
    dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/admin", AdminRouter);
app.use("/api/employees", EmployeeRouter);
app.use("/api/orders", OrderRouter);
app.use("/api/materials", MaterialRouter);
app.use("/api/suppliers", SupplierRouter);
app.use("/api/expenses", ExpenseRouter);
app.use("/api/production", ProductionRouter);
app.use("/api/payments", PaymentRouter);
app.use("/api/reports", ReportRouter);

// 404 Handler
// Correct 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found"
  });
});


// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});