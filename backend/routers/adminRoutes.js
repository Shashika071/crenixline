import express from "express";
import { login } from "../controllers/adminController.js";

const AdminRouter = express.Router();

 
AdminRouter.post("/login", login);

export default AdminRouter;
