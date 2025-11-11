import express from "express";
import { sendCommand, deviceResponse } from "../controllers/commandController.js";

const router = express.Router();

router.post("/send_command", sendCommand);
router.post("/device_response", deviceResponse);
export default router;
