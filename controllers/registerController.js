import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';

export const parentRegisterAccount = (req, res) => {
    const { fcm_token, email } = req.body;

    if (!fcm_token || !email) {
        return res.status(400).json({ message: "fcm_token and email is required" });
    }

    const parent_dev_id = uuidv4(); // Generate unique UUID

    //   const sql = `
    //     INSERT INTO device_accounts (parent_dev_id, parent_fcm_token, is_active)
    //     VALUES (?, ?, 1)
    //   `;

    //   db.query(sql, [parent_dev_id, fcm_token], (err) => {
    //     if (err) {
    //       console.error("DB Error:", err);
    //       return res.status(500).json({ message: "Database error" });
    //     }

    const sql = `INSERT INTO parent_devices (parent_dev_id, parent_fcm_token, email) VALUES (?, ?, ?)`;
    db.query(sql, [parent_dev_id, fcm_token, email], (err) => {
        if (err) {
            console.error("DB Error:", err);
            return res.status(500).json({ message: "Database error" });
        }

        res.json({
            message: "Parent device registered successfully",
            parent_dev_id,
            email,
        });
    });
};



export const childRegisterAccount = (req, res) => {
    const { phone_number, fcm_token } = req.body;

    if (!phone_number || !fcm_token) {
        return res.status(400).json({ message: "phone_number and fcm_token are required" });
    }

    const child_dev_id = uuidv4(); // Generate unique UUID

    //   const sql = `
    //     INSERT INTO device_accounts (child_dev_id, phone_number, child_fcm_token)
    //     VALUES (?, ?, ?)
    //   `;

    //   db.query(sql, [child_dev_id, phone_number, fcm_token], (err) => {
    //     if (err) {
    //       console.error("DB Error:", err);
    //       return res.status(500).json({ message: "Database error" });
    //     }
    const sql = `INSERT INTO child_devices (child_dev_id, phone_number, child_fcm_token)
               VALUES (?, ?, ?)`;
    db.query(sql, [child_dev_id, phone_number, fcm_token], (err) => {
        if (err) {
            console.error("DB Error:", err);
            return res.status(500).json({ message: "Database error" });
        }

        res.json({
            message: "Child device registered successfully",
            child_dev_id,
        });
    });
};
