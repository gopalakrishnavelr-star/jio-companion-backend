// routes/tokenRoutes.js
import express from "express";
import { registerToken } from "../controllers/tokenController.js";

const router = express.Router();

router.post("/register_token", registerToken);

export default router;
