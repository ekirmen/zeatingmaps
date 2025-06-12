import mongoose from 'mongoose';

const emailTemplateSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true },
  subject: { type: String, required: true },
  body: { type: String, required: true }
});

const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);

export default EmailTemplate;
