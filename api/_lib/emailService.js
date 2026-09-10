import nodemailer from 'nodemailer';

let transporter = null;

/**
 * Cria ou retorna o transportador Nodemailer configurado via variáveis de ambiente da Vercel.
 */
export function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE === 'false' ? false : (port === 465);

  if (!user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure, // true para 465, false para 587
    auth: {
      user: user.trim(),
      pass: pass.trim().replace(/\s+/g, '') // remove espacos comuns em senhas de app do Google
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: false // previne erros de certificado auto-assinado
    }
  });

  return transporter;
}

/**
 * Envia um e-mail através do Nodemailer na Vercel Serverless.
 * @param {object} options
 * @param {string} options.to - E-mail do destinatario
 * @param {string} options.subject - Assunto do e-mail
 * @param {string} options.html - Conteudo HTML
 * @param {string} [options.text] - Versao em texto plano
 * @returns {Promise<{success: boolean, messageId?: string, error?: string, mocked?: boolean}>}
 */
export async function sendEmail({ to, subject, html, text }) {
  const mailTransporter = getTransporter();

  // Se nao configurou credenciais no painel da Vercel, apenas simula para nao quebrar a requisicao
  if (!mailTransporter) {
    console.warn('⚠️ [Vercel Nodemailer] EMAIL_USER ou EMAIL_PASS nao configurados. Email simulado.');
    console.log(`✉️ Destinatario: ${to} | Assunto: ${subject}`);
    return { success: true, mocked: true };
  }

  const senderUser = process.env.EMAIL_USER.trim();
  const fromName = process.env.EMAIL_FROM_NAME || 'ALEM - Apoio Social';

  try {
    const info = await mailTransporter.sendMail({
      from: `"${fromName}" <${senderUser}>`,
      to,
      subject,
      html,
      text: text || undefined
    });

    console.log(`✅ [Vercel Nodemailer] Email enviado com sucesso para ${to}. ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ [Vercel Nodemailer] Falha ao enviar email para ${to}:`, error.message || error);
    return { success: false, error: error.message || String(error) };
  }
}
