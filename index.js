import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import otpRoutes from "./routes/otpRoutes.js";
import commandRoutes from "./routes/commandRoutes.js";
import tokenRoutes from "./routes/tokenRoutes.js";
import registerRoutes from './routes/registerRoutes.js';

dotenv.config();
const app = express();

app.use(bodyParser.json());

// Routes
app.use('/api', registerRoutes);
app.use("/api", otpRoutes);
app.use("/api", commandRoutes);
app.use("/api", tokenRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

