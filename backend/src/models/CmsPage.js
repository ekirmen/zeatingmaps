import mongoose from 'mongoose';

const cmsPageSchema = new mongoose.Schema({
  pageId: { type: String, required: true, unique: true },
  widgets: { type: Object, default: {} }
}, { timestamps: true });

const CmsPage = mongoose.model('CmsPage', cmsPageSchema);

export default CmsPage;
