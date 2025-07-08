import { cleanupExpiredLocks } from '../backoffice/functions/cleanupExpiredLocks';

export default async function handler(req, res) {
  const { funcionId } = req.query;

  if (!funcionId) {
    res.status(400).json({ error: 'Missing funcionId query parameter' });
    return;
  }

  try {
    await cleanupExpiredLocks(funcionId);
    res.status(200).json({ message: `Expired locks cleaned for funcionId ${funcionId}` });
  } catch (error) {
    console.error('Error in cleanupExpiredLocks API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
