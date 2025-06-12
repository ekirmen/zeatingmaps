import EmailTemplate from '../models/EmailTemplate.js';

export const getTemplates = async (req, res) => {
  const templates = await EmailTemplate.find();
  res.json(templates);
};

export const getTemplate = async (req, res) => {
  const { type } = req.params;
  const template = await EmailTemplate.findOne({ type });
  if (!template) return res.status(404).json({ message: 'Template not found' });
  res.json(template);
};

export const updateTemplate = async (req, res) => {
  const { type } = req.params;
  const { subject, body } = req.body;
  let template = await EmailTemplate.findOne({ type });
  if (!template) {
    template = new EmailTemplate({ type, subject, body });
  } else {
    template.subject = subject;
    template.body = body;
  }
  await template.save();
  res.json(template);
};
