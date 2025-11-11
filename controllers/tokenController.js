// controllers/tokenController.js
import db from "../config/db.js";

/**
 * API: /api/register_token
 * Purpose: Save the FCM token of Device A or Device B after pairing.
 */

//previous working code

// export const registerToken = (req, res) => {
//   const { otp, device_role, fcm_token } = req.body;

//   if (!otp || !device_role || !fcm_token) {
//     return res.status(400).json({ message: "otp, device_role and fcm_token required" });
//   }

//   // Choose which column to update
//   const column = device_role === "A" ? "device_a_token" : "device_b_token";

//   const sql = `UPDATE pairing_device_table SET ${column}=? WHERE otp=?`;
//   db.query(sql, [fcm_token, otp], (err, result) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).json({ message: "Database error" });
//     }

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ message: "Invalid OTP or pairing not found" });
//     }

//     return res.json({ message: `FCM token registered for Device ${device_role}` });
//   });
// };

export const registerToken = (req, res) => {
  const { otp, device_role, fcm_token } = req.body;

  if (!otp || !device_role || !fcm_token) {
    return res.status(400).json({ message: "otp, device_role and fcm_token required" });
  }

  // Choose column based on role
  const column = device_role === "A" ? "device_a_token" : "device_b_token";

  // 1️⃣ Find the pairing by OTP
  const checkSql = "SELECT phone_number, device_a_token, device_b_token FROM pairing_device_table WHERE otp=? LIMIT 1";
  db.query(checkSql, [otp], (err, rows) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (!rows.length) {
      return res.status(404).json({ message: "Invalid OTP or pairing not found" });
    }

    const phone_number = rows[0].phone_number;
    const existingToken = rows[0][column];

    // 2️⃣ If same token already exists, skip re-registration
    if (existingToken === fcm_token) {
      return res.json({ message: "FCM token already registered for this device" });
    }

    // 3️⃣ Update token for this device
    const updateSql = `UPDATE pairing_device_table SET ${column}=? WHERE phone_number=?`;
    db.query(updateSql, [fcm_token, phone_number], (updateErr) => {
      if (updateErr) {
        console.error("Update Error:", updateErr);
        return res.status(500).json({ message: "Failed to register FCM token" });
      }

      return res.json({
        message: `FCM token registered successfully for Device ${device_role}`,
        phone_number,
      });
    });
  });
};

