export const validatePhone = (req, res, next) => {
  const { phone_number } = req.body;
  if (!phone_number || !/^\d{10}$/.test(phone_number)) {
    return res.status(400).json({ message: "Invalid phone number" });
  }
  next();
};
