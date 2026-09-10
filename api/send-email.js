import { sendEmail } from './_lib/emailService.js';
import { getEmailLayout } from './_lib/templates.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ status: 'online', service: 'ALEM Nodemailer Generic Sender' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const { to, subject, html, text, content } = req.body || {};

    if (!to || (!subject && !html && !text && !content)) {
      return res.status(400).json({
        success: false,
        error: 'Parametros obrigatorios ausentes: "to" e ("subject" ou "html" ou "text").'
      });
    }

    const emailSubject = subject || 'Notificacao da ALEM';
    let finalHtml = html;

    if (!finalHtml && content) {
      finalHtml = getEmailLayout(`<p>${content.replace(/\n/g, '<br>')}</p>`, emailSubject);
    }

    const result = await sendEmail({
      to,
      subject: emailSubject,
      html: finalHtml,
      text
    });

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(500).json(result);
    }
  } catch (error) {
    console.error('❌ [send-email] Erro:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
