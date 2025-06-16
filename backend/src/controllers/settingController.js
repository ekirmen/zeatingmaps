import Setting from '../models/Setting.js';

const DEFAULT_RESERVATION_TIME = parseInt(process.env.DEFAULT_RESERVATION_TIME || '15', 10);

export const getReservationTime = async (req, res) => {
  try {
    const doc = await Setting.findOne({ key: 'reservationTime' });
    const value = doc ? parseInt(doc.value, 10) : DEFAULT_RESERVATION_TIME;
    res.json({ value });
  } catch (err) {
    res.status(500).json({ message: 'Error getting setting' });
  }
};

export const updateReservationTime = async (req, res) => {
  try {
    const { value } = req.body;
    if (!value || isNaN(parseInt(value, 10))) {
      return res.status(400).json({ message: 'Invalid value' });
    }
    const doc = await Setting.findOneAndUpdate(
      { key: 'reservationTime' },
      { value: parseInt(value, 10) },
      { upsert: true, new: true }
    );
    res.json({ value: parseInt(doc.value, 10) });
  } catch (err) {
    res.status(500).json({ message: 'Error updating setting' });
  }
};
