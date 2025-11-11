// controllers/commandController.js
import db from "../config/db.js";
import admin from "../config/firebase.js";
import { v4 as uuidv4 } from "uuid";



// export const sendCommand = (req, res) => {
//   const { child_dev_id, command_id, command } = req.body;

//   if (!child_dev_id || !command_id || !command) {
//     return res.status(400).json({ message: "child_dev_id, command_id, and command required" });
//   }

//   // 1️⃣ Insert directly into commands_table
//   const insertSql = `
//     INSERT INTO commands_table (command_id, child_dev_id, command, status)
//     VALUES (?, ?, ?, 'sent')
//   `;

//   db.query(insertSql, [command_id, child_dev_id, command], (err) => {
//     if (err) {
//       console.error("DB Insert Error:", err);
//       return res.status(500).json({ message: "Failed to save command" });
//     }

//     // 2️⃣ Get FCM token for child
//     const tokenQuery = "SELECT child_fcm_token FROM child_devices WHERE child_dev_id=? LIMIT 1";
//     db.query(tokenQuery, [child_dev_id], (err2, rows) => {
//       if (err2 || !rows.length || !rows[0].child_fcm_token) {
//         return res.status(404).json({ message: "Child token not found" });
//       }

//       const token = rows[0].child_fcm_token;
//       const payload = {
//         notification: {
//           title: "New Command",
//           body: `Command: ${command}`,
//         },
//         data: { command_id: String(command_id), command },
//       };

//       admin
//         .messaging()
//         .send({ token, notification: payload.notification, data: payload.data })
//         .then(() => {
//           res.json({
//             message: "Command sent successfully",
//             command_id,
//             command,
//           });
//         })
//         .catch((error) => {
//           console.error("❌ FCM error:", error);
//           res.status(500).json({ message: "Command saved, but FCM failed" });
//         });
//     });
//   });
// };

export const sendCommand = (req, res) => {
  const { child_dev_id, command } = req.body;
  if (!child_dev_id || !command)
    return res.status(400).json({ message: "child_dev_id and command required" });

  const transaction_id = uuidv4();

  // 1️⃣ Insert command
  const insertSql = `
    INSERT INTO commands_table (transaction_id, child_dev_id, command, status)
    VALUES (?, ?, ?, 'sent')
  `;
  db.query(insertSql, [transaction_id, child_dev_id, command], (err) => {
    if (err) {
      console.error("DB Insert Error:", err);
      return res.status(500).json({ message: "Failed to save command" });
    }

    // 2️⃣ Get child FCM token
    const sql = "SELECT child_fcm_token FROM child_devices WHERE child_dev_id=? LIMIT 1";
    db.query(sql, [child_dev_id], (err2, rows) => {
      if (err2 || !rows.length) {
        console.error("Token lookup error:", err2);
        return res.status(404).json({ message: "Child device not found" });
      }

      const token = rows[0].child_fcm_token;
      if (!token)
        return res.status(400).json({ message: "Child FCM token missing" });

      // 3️⃣ Send push notification
      const payload = {
        notification: { title: "New Command", body: `Command: ${command} | ID: ${transaction_id}` },
        data: { transaction_id, command },
      };

      admin
        .messaging()
        .send({ token, notification: payload.notification, data: payload.data })
        .then(() => {
          res.json({
            message: "Command sent successfully",
            transaction_id,
            command,
          });
        })
        .catch((error) => {
          console.error("❌ FCM Error:", error);
          res.status(500).json({ message: "Command saved, but push failed" });
        });
    });
  });
};


// export const deviceResponse = (req, res) => {
//   const { parent_dev_id, command_id, response_message } = req.body;

//   if (!parent_dev_id || !command_id || !response_message) {
//     return res
//       .status(400)
//       .json({ message: "parent_dev_id, command_id, and response_message are required" });
//   }

//   // Step 1️⃣: Get parent FCM token
//   const sql = `SELECT parent_fcm_token FROM parent_devices WHERE parent_dev_id=? LIMIT 1`;
//   db.query(sql, [parent_dev_id], (err, rows) => {
//     if (err) {
//       console.error("DB Error:", err);
//       return res.status(500).json({ message: "Database error" });
//     }

//     if (!rows.length || !rows[0].parent_fcm_token) {
//       return res
//         .status(404)
//         .json({ message: "Parent device not found or token missing" });
//     }

//     const token = rows[0].parent_fcm_token;

//     // Step 2️⃣: Update commands_table
//     const updateSql = `
//       UPDATE commands_table
//       SET response_message=?, status='completed'
//       WHERE command_id=?;
//     `;
//     db.query(updateSql, [response_message, command_id], (err2) => {
//       if (err2) {
//         console.error("DB Update Error:", err2);
//         return res.status(500).json({ message: "Failed to update command" });
//       }

//       // Step 3️⃣: Also log into device_commands_table
//       const insertSql = `
//         INSERT INTO device_commands_table (command_id, parent_dev_id, response_message, status)
//         VALUES (?, ?, ?, 'completed');
//       `;
//       db.query(insertSql, [command_id, parent_dev_id, response_message], (err3) => {
//         if (err3) {
//           console.error("DB Insert Error:", err3);
//           return res.status(500).json({ message: "Failed to save response log" });
//         }

//         // Step 4️⃣: Send push notification back to parent
//         const payload = {
//           notification: {
//             title: "Device Response",
//             body: response_message,
//           },
//           data: { command_id: String(command_id), response_message },
//         };

//         admin
//           .messaging()
//           .send({
//             token,
//             notification: payload.notification,
//             data: payload.data,
//           })
//           .then(() => {
//             res.json({
//               message: "Response sent successfully",
//               command_id,
//               response_message,
//             });
//           })
//           .catch((error) => {
//             console.error("❌ FCM error:", error);
//             res.status(500).json({ message: "Response saved, but push failed" });
//           });
//       });
//     });
//   });
// };


// export const deviceResponse = (req, res) => {
//   const { parent_dev_id, command_id, response_message } = req.body;

//   if (!parent_dev_id || !command_id || !response_message) {
//     return res.status(400).json({
//       message: "parent_dev_id, command_id, and response_message are required",
//     });
//   }

//   // 1️⃣ Insert directly into device_commands_table
//   const insertSql = `
//     INSERT INTO device_commands_table (command_id, parent_dev_id, response_message, status)
//     VALUES (?, ?, ?, 'completed')
//   `;

//   db.query(insertSql, [command_id, parent_dev_id, response_message], (err) => {
//     if (err) {
//       console.error("DB Insert Error:", err);
//       return res.status(500).json({ message: "Failed to store device response" });
//     }

//     // 2️⃣ Get Parent FCM token
//     const tokenQuery = "SELECT parent_fcm_token FROM parent_devices WHERE parent_dev_id=? LIMIT 1";
//     db.query(tokenQuery, [parent_dev_id], (err2, rows) => {
//       if (err2 || !rows.length || !rows[0].parent_fcm_token) {
//         return res.status(404).json({ message: "Parent token not found" });
//       }

//       const token = rows[0].parent_fcm_token;
//       const payload = {
//         notification: {
//           title: "Device Response",
//           body: response_message,
//         },
//         data: { command_id: String(command_id), response_message },
//       };

//       // 3️⃣ Send push notification back to parent
//       admin
//         .messaging()
//         .send({ token, notification: payload.notification, data: payload.data })
//         .then(() => {
//           res.json({
//             message: "Response sent successfully",
//             command_id,
//             response_message,
//           });
//         })
//         .catch((error) => {
//           console.error("❌ FCM error:", error);
//           res.status(500).json({ message: "Response saved, but push failed" });
//         });
//     });
//   });
// };

export const deviceResponse = (req, res) => {
  const { parent_dev_id, transaction_id, response_message } = req.body;
  if (!parent_dev_id || !transaction_id || !response_message)
    return res
      .status(400)
      .json({ message: "parent_dev_id, transaction_id, and response_message required" });

  // 1️⃣ Insert child response
  const insertSql = `
    INSERT INTO device_commands_table (transaction_id, parent_dev_id, response_message, status)
    VALUES (?, ?, ?, 'completed')
  `;
  db.query(insertSql, [transaction_id, parent_dev_id, response_message], (err) => {
    if (err) {
      console.error("DB Insert Error:", err);
      return res.status(500).json({ message: "Failed to store response" });
    }

    // 2️⃣ Fetch parent FCM token
    const sql = "SELECT parent_fcm_token FROM parent_devices WHERE parent_dev_id=? LIMIT 1";
    db.query(sql, [parent_dev_id], (err2, rows) => {
      if (err2 || !rows.length) {
        console.error("Parent lookup error:", err2);
        return res.status(404).json({ message: "Parent device not found" });
      }

      const token = rows[0].parent_fcm_token;
      if (!token)
        return res.status(400).json({ message: "Parent FCM token missing" });

      // 3️⃣ Push notification back to parent
      const payload = {
        notification: { title: "Device Response", 
        body: `Response: ${response_message} | Transaction ID: ${transaction_id}`},
        data: { transaction_id, response_message },
      };

      admin
        .messaging()
        .send({ token, notification: payload.notification, data: payload.data })
        .then(() => {
          res.json({
            message: "Response sent successfully",
            transaction_id,
            response_message,
          });
        })
        .catch((error) => {
          console.error("❌ FCM error:", error);
          res
            .status(500)
            .json({ message: "Response saved, but push failed" });
        });
    });
  });
};