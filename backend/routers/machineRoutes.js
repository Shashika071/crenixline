import {
  createMachine,
  deleteMachine,
  getMachineById,
  getMachines,
  getMachinesNeedingMaintenance,
  getMaintenanceSchedule,
  updateMachine,
  updateMachineMaintenance
} from "../controllers/machineController.js";

import express from "express";

const MachineRoutes  = express.Router();

 

// CRUD operations
MachineRoutes.post("/", createMachine);
MachineRoutes.get("/", getMachines);
MachineRoutes.get("/:id", getMachineById);
MachineRoutes.put("/:id", updateMachine);
MachineRoutes.delete("/:id", deleteMachine);

// Maintenance operations
MachineRoutes.patch("/:id/maintenance", updateMachineMaintenance);

// Special queries
MachineRoutes.get("/maintenance/schedule", getMaintenanceSchedule);
MachineRoutes.get("/maintenance/needed", getMachinesNeedingMaintenance);

export default MachineRoutes;