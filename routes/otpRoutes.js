import express from "express";
import { sendOtp, pairDevice } from "../controllers/otpController.js";
import { validatePhone } from "../middleware/validatePhone.js";

const router = express.Router();

// router.post("/get_otp", validatePhone, getOtp);
router.post("/send_otp", sendOtp);
router.post("/pairing_device",  pairDevice);

export default router;
