import db from "../config/db.js";
import { generateOtp } from "../utils/generateOtp.js";
import admin from '../config/firebase.js';
import { v4 as uuidv4 } from "uuid";

//previous working code

// export const getOtp = (req, res) => {
//   const { phone_number } = req.body;
//   if (!phone_number)
//     return res.status(400).json({ message: "phone_number required" });

//   const otp = generateOtp();

//   const sql = `
//     INSERT INTO otp_table (phone_number, otp)
//     VALUES (?, ?)
//     ON DUPLICATE KEY UPDATE otp=?, created_at=CURRENT_TIMESTAMP
//   `;

//   db.query(sql, [phone_number, otp, otp], (err) => {
//     if (err) {
//       console.error("DB Error:", err);
//       return res.status(500).json({ message: "Database error" });
//     }
//     return res.json({
//       status: "OTP generated successfully",
//       otp,
//     });
//   });
// };

//previous working code(otp push notifification)
// export const getOtp = (req, res) => {
//   const { phone_number } = req.body;
//   if (!phone_number)
//     return res.status(400).json({ message: "phone_number required" });

//   const otp = generateOtp();

//   // 1️⃣ Insert or update OTP in DB
//   const sql = `
//     INSERT INTO pairing_device_table (phone_number, otp)
//     VALUES (?, ?)
//     ON DUPLICATE KEY UPDATE otp=?, created_at=CURRENT_TIMESTAMP
//   `;

//   db.query(sql, [phone_number, otp, otp], (err) => {
//     if (err) {
//       console.error("DB Error:", err);
//       return res.status(500).json({ message: "Database error" });
//     }

//     // 2️⃣ Get Device B’s FCM token (if registered)
//     const tokenQuery =
//       "SELECT device_b_token FROM pairing_device_table WHERE phone_number=? LIMIT 1";

//     db.query(tokenQuery, [phone_number], (err2, rows) => {
//       if (err2) {
//         console.error("Token lookup error:", err2);
//         return res.status(500).json({ message: "Token lookup failed" });
//       }

//       if (rows.length && rows[0].device_b_token) {
//         const tokenB = rows[0].device_b_token;

//         // 3️⃣ Build FCM payload
//         const payload = {
//           notification: {
//             title: "New OTP Received",
//             body: `Your pairing code is ${otp}`,
//           },
//           data: { otp },
//         };

//         // 4️⃣ Send the OTP push notification
//         admin
//           .messaging()
//           .send({ token: tokenB, notification: payload.notification, data: payload.data })
//           .then((response) => {
//             console.log("✅ OTP push sent to Device B:", response);
//             return res.json({
//               message: "OTP generated & sent to Device B",
//               otp, // optional: remove in production
//             });
//           })
//           .catch((error) => { 
//             console.error("❌ FCM error:", error);
//             return res.json({
//               message: "OTP generated, but push failed",
//               otp, // still return the OTP for fallback testing
//             });
//           });
//       } else {
//         // Device B not registered yet
//         return res.json({
//           message: "OTP generated successfully (Device B not registered yet)",
//           otp,
//         });
//       }
//     });
//   });
// };


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


// ---------- PAIRING DEVICE ----------
//previous working code
// export const pairDevice = (req, res) => {
//   const { otp } = req.body;

//   if (!otp)
//     return res.status(400).json({ message: "OTP required" });

//   // 1️⃣ Check if OTP exists in otp_table
//   const sqlCheck = `
//     SELECT * FROM otp_table
//     WHERE otp = ?
//     ORDER BY created_at DESC
//     LIMIT 1
//   `;

//   db.query(sqlCheck, [otp], (err, results) => {
//     if (err) {
//       console.error("DB Error:", err);
//       return res.status(500).json({ message: "Database error" });
//     }

//     if (results.length === 0) {
//       return res.status(400).json({ message: "Invalid or expired OTP" });
//     }

//     const phone_number = results[0].phone_number;
//     const successMessage = "Device paired successfully";

//     // 2️⃣ Insert or update pairing_device_table (no duplicate rows)
//     const insertSql = `
//       INSERT INTO pairing_device_table (phone_number, otp, response_message)
//       VALUES (?, ?, ?)
//       ON DUPLICATE KEY UPDATE otp=?, response_message=?
//     `;

//     db.query(
//       insertSql,
//       [phone_number, otp, successMessage, otp, successMessage],
//       (insertErr) => {
//         if (insertErr) {
//           console.error("DB Insert Error:", insertErr);
//           return res.status(500).json({ message: "Error storing pairing data" });
//         }

//         return res.json({
//           message: successMessage,
//         });
//       }
//     );
//   });
// };

// export const pairDevice = (req, res) => {
//   const { otp } = req.body;

//   if (!otp) {
//     return res.status(400).json({ message: "OTP required" });
//   }

//   // Check OTP validity
//   const sql = "SELECT phone_number FROM otp_table WHERE otp=? LIMIT 1";
//   db.query(sql, [otp], (err, rows) => {
//     if (err) {
//       console.error("DB Error:", err);
//       return res.status(500).json({ message: "Database error" });
//     }

//     if (!rows.length) {
//       return res.status(404).json({ message: "Invalid or expired OTP" });
//     }

//     const phone_number = rows[0].phone_number;

//     // Get corresponding child_dev_id and parent_dev_id
//     const findDevices = `
//       SELECT d.child_dev_id, d.parent_dev_id
//       FROM device_accounts d
//       WHERE d.phone_number=? LIMIT 1
//     `;

//     db.query(findDevices, [phone_number], (err2, devices) => {
//       if (err2) {
//         console.error("DB Error:", err2);
//         return res.status(500).json({ message: "Database lookup failed" });
//       }

//       if (!devices.length) {
//         return res.status(404).json({ message: "Devices not found" });
//       }

//       // const { child_dev_id, parent_dev_id } = devices[0];

//       let { child_dev_id, parent_dev_id } = devices[0];

//       if (!parent_dev_id) {
//         parent_dev_id = uuidv4();

//         const updateParentId = `UPDATE device_accounts SET parent_dev_id=? WHERE phone_number=?`;
//         db.query(updateParentId, [parent_dev_id, phone_number], (err4) => {
//           if (err4) console.error("Failed to update parent_dev_id:", err4);
//         });
//       }
//         // Insert or update pairing table
//         const insertSql = `
//         INSERT INTO pairing_device_table (parent_dev_id, child_dev_id, otp, response_message)
//         VALUES (?, ?, ?, 'Device paired successfully')
//         ON DUPLICATE KEY UPDATE otp=?, response_message='Device re-paired successfully'
//       `;

//         db.query(insertSql, [parent_dev_id, child_dev_id, otp, otp], (err3) => {
//           if (err3) {
//             console.error("DB Error:", err3);
//             return res.status(500).json({ message: "Failed to pair device" });
//           }

//           res.json({
//             message: "Device paired successfully",
//             parent_dev_id,
//           });
//         });
//       });
//   });
// };


export const pairDevice = (req, res) => {
  const { otp } = req.body;
  if (!otp) return res.status(400).json({ message: "OTP required" });

  const sqlOtp = "SELECT phone_number FROM otp_table WHERE otp=? LIMIT 1";
  db.query(sqlOtp, [otp], (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (!rows.length) return res.status(404).json({ message: "Invalid or expired OTP" });

    const phone_number = rows[0].phone_number;

    const findChild = "SELECT child_dev_id FROM child_devices WHERE phone_number=? LIMIT 1";
    db.query(findChild, [phone_number], (err2, childRows) => {
      if (err2) return res.status(500).json({ message: "Database error" });
      if (!childRows.length) return res.status(404).json({ message: "Child not found" });

      const child_dev_id = childRows[0].child_dev_id;

      const findParent = "SELECT parent_dev_id FROM parent_devices WHERE is_active=1 ORDER BY created_at DESC LIMIT 1";
      db.query(findParent, (err3, parentRows) => {
        if (err3) return res.status(500).json({ message: "Database error" });
        if (!parentRows.length) return res.status(404).json({ message: "No active parent found" });

        const parent_dev_id = parentRows[0].parent_dev_id;

        const pairSql = `
          INSERT INTO pairing_device_table (parent_dev_id, child_dev_id, otp, response_message)
          VALUES (?, ?, ?, 'Device paired successfully')
          ON DUPLICATE KEY UPDATE otp=?, response_message='Device re-paired successfully'
        `;
        db.query(pairSql, [parent_dev_id, child_dev_id, otp, otp], (err4) => {
          if (err4) return res.status(500).json({ message: "Failed to pair devices" });

          res.json({
            message: "Device paired successfully",
            parent_dev_id,
          });
        });
      });
    });
  });
};
