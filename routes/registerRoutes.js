import express from 'express';
import { parentRegisterAccount, childRegisterAccount } from '../controllers/registerController.js';

const router = express.Router();

router.post('/register/parent', parentRegisterAccount);
router.post('/register/child', childRegisterAccount);

export default router;
