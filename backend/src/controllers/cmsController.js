import CmsPage from '../models/CmsPage.js';

export const getPageData = async (req, res) => {
  try {
    const { pageId } = req.params;
    const page = await CmsPage.findOne({ pageId });
    if (!page) return res.status(404).json({ message: 'Page not found' });
    res.json(page);
  } catch (error) {
    res.status(500).json({ message: 'Error getting page', error: error.message });
  }
};

export const savePageData = async (req, res) => {
  try {
    const { pageId } = req.params;
    const { widgets } = req.body;
    const page = await CmsPage.findOneAndUpdate(
      { pageId },
      { widgets },
      { upsert: true, new: true }
    );
    res.json(page);
  } catch (error) {
    res.status(500).json({ message: 'Error saving page', error: error.message });
  }
};
