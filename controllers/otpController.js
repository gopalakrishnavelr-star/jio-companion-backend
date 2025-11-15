import db from "../config/db.js";
import { generateOtp } from "../utils/generateOtp.js";
import admin from '../config/firebase.js';
import { v4 as uuidv4 } from "uuid";


export const sendOtp = (req, res) => {
  const { phone_number } = req.body;

  if (!phone_number) {
    return res.status(400).json({ message: "phone_number required" });
  }

  // Check if phone_number exists in child device table
  const checkSql = "SELECT child_dev_id, child_fcm_token FROM child_devices WHERE phone_number=? LIMIT 1";
  db.query(checkSql, [phone_number], (err, rows) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (!rows.length) {
      return res.status(404).json({ message: "Child device not found" });
    }

    const { child_dev_id, child_fcm_token } = rows[0];
    const otp = generateOtp();

    // Insert or update OTP
    const upsertSql = `
      INSERT INTO otp_table (phone_number, otp)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE otp=?, created_at=CURRENT_TIMESTAMP
    `;

    db.query(upsertSql, [phone_number, otp, otp], (err2) => {
      if (err2) {
        console.error("OTP Insert Error:", err2);
        return res.status(500).json({ message: "Failed to save OTP" });
      }

      // Send OTP via push notification
      const payload = {
        notification: {
          title: "Your Verification OTP",
          body: `Your OTP is ${otp}`,
        },
        data: { otp },
      };

      admin
        .messaging()
        .send({
          token: child_fcm_token,
          notification: payload.notification,
          data: payload.data,
        })
        .then(() => {
          res.json({
            message: "OTP sent successfully",
            otp, // optional; can hide in production
            child_dev_id,
          });
        })
        .catch((error) => {
          console.error("FCM error:", error);
          res.status(500).json({ message: "OTP saved, but push failed" });
        });
    });
  });
};


export const pairDevice = (req, res) => {
  const { otp } = req.body;
  if (!otp) return res.status(400).json({ message: "OTP required" });

  // ✅ Step 1: Verify OTP
  const sqlOtp = "SELECT phone_number FROM otp_table WHERE otp=? LIMIT 1";
  db.query(sqlOtp, [otp], (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (!rows.length) return res.status(404).json({ message: "Invalid or expired OTP" });

    const phone_number = rows[0].phone_number;

    // ✅ Step 2: Get child device details
    const childSql = `
      SELECT child_dev_id, child_fcm_token 
      FROM child_devices 
      WHERE phone_number=? LIMIT 1
    `;
    db.query(childSql, [phone_number], (err2, childRows) => {
      if (err2) return res.status(500).json({ message: "Child lookup failed" });
      if (!childRows.length) return res.status(404).json({ message: "Child device not found" });

      const { child_dev_id, child_fcm_token } = childRows[0];

      // ✅ Step 3: Get latest parent device (active)
      const parentSql = `
        SELECT parent_dev_id 
        FROM parent_devices 
        WHERE is_active = 1 
        ORDER BY created_at DESC LIMIT 1
      `;
      db.query(parentSql, (err3, parentRows) => {
        if (err3) return res.status(500).json({ message: "Parent lookup failed" });
        if (!parentRows.length) return res.status(404).json({ message: "No active parent device found" });

        const parent_dev_id = parentRows[0].parent_dev_id;

        // ✅ Step 4: Store pairing record
        const insertSql = `
          INSERT INTO pairing_device_table (parent_dev_id, child_dev_id, otp, response_message)
          VALUES (?, ?, ?, 'Device paired successfully')
          ON DUPLICATE KEY UPDATE otp=?, response_message='Device re-paired successfully'
        `;
        db.query(insertSql, [parent_dev_id, child_dev_id, otp, otp], (err4) => {
          if (err4) return res.status(500).json({ message: "Failed to pair device" });

          // ✅ Step 5: Send FCM Notification to Child
          if (child_fcm_token) {
            const payload = {
              notification: {
                title: "Device Paired Successfully",
                body: `Your device is now paired with parent ID: ${parent_dev_id}`,
              },
              data: {
                parent_dev_id,
                message: "Device paired successfully",
              },
            };

            admin
              .messaging()
              .send({
                token: child_fcm_token,
                notification: payload.notification,
                data: payload.data,
              })
              .then(() => console.log("✅ Pairing notification sent to child"))
              .catch((err) => console.error("❌ FCM send error:", err));
          }

          res.json({
            message: "Device paired successfully",
            parent_dev_id,
          });
        });
      });
    });
  });
};
