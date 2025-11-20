import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';

function normalizePhone(number) {
  return number.replace(/\D/g, "").slice(-10);
}

export const parentRegisterAccount = (req, res) => {
  const { phone_number, fcm_token } = req.body;

  if (!phone_number || !fcm_token) {
    return res.status(400).json({ message: "phone_number and fcm_token are required" });
  }

  phone_number = normalizePhone(phone_number);

  // Does this parent already exist?
  const checkSql = "SELECT parent_dev_id FROM parent_devices WHERE phone_number=? LIMIT 1";

  db.query(checkSql, [phone_number], (err, rows) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ message: "Database lookup error" });
    }

    // ✔ Existing parent device → update FCM token
    if (rows.length > 0) {
      const parent_dev_id = rows[0].parent_dev_id;

      const updateSql = `
        UPDATE parent_devices 
        SET parent_fcm_token=?,
        WHERE phone_number=?
      `;

      db.query(updateSql, [fcm_token, phone_number], (err2) => {
        if (err2) {
          console.error("DB Error:", err2);
          return res.status(500).json({ message: "Update error" });
        }

        return res.json({
          message: "Parent device updated successfully",
          parent_dev_id,
          phone_number,
        });
      });
    }

    // ✔ New parent device → create new ID
    else {
      const parent_dev_id = uuidv4();

      const insertSql = `
        INSERT INTO parent_devices (parent_dev_id, phone_number, parent_fcm_token)
        VALUES (?, ?, ?)
      `;

      db.query(insertSql, [parent_dev_id, phone_number, fcm_token], (err3) => {
        if (err3) {
          console.error("DB Error:", err3);
          return res.status(500).json({ message: "Insert error" });
        }

        return res.json({
          message: "Parent device registered successfully",
          parent_dev_id,
          phone_number,
        });
      });
    }
  });
};




export const childRegisterAccount = (req, res) => {
  const { phone_number, fcm_token } = req.body;

  if (!phone_number || !fcm_token) {
    return res.status(400).json({ message: "phone_number and fcm_token are required" });
  }


  phone_number = normalizePhone(phone_number);

  const checkSql = "SELECT child_dev_id FROM child_devices WHERE phone_number=? LIMIT 1";

  db.query(checkSql, [phone_number], (err, rows) => {
    if (err) return res.status(500).json({ message: "Database lookup error" });

    if (rows.length > 0) {
      const child_dev_id = rows[0].child_dev_id;

      const updateSql = `
        UPDATE child_devices 
        SET child_fcm_token=?,
        WHERE phone_number=?
      `;

      db.query(updateSql, [fcm_token, phone_number], () => {
        return res.json({
          message: "Child device updated successfully",
          child_dev_id,
          phone_number,
        });
      });
    } else {
      const child_dev_id = uuidv4();

      const insertSql = `
        INSERT INTO child_devices (child_dev_id, phone_number, child_fcm_token)
        VALUES (?, ?, ?)
      `;

      db.query(insertSql, [child_dev_id, phone_number, fcm_token], () => {
        return res.json({
          message: "Child device registered successfully",
          child_dev_id,
          phone_number,
        });
      });
    }
  });
};
