import { sendEmail } from '../_lib/emailService.js';
import { getRecoveryEmailHtml } from '../_lib/templates.js';
import { getSupabaseAdmin, getSupabase } from '../_lib/supabase.js';

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
    return res.status(200).json({ status: 'online', service: 'ALEM Auth Forgot Password API' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const { email } = req.body || {};

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Por favor, forneça um endereço de e-mail válido.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || 'alem.mz';
    const origin = `${proto}://${host}`;
    const redirectUrl = `${origin}/admin/recuperar-senha`;

    let directResetUrl = null;
    let otpCode = null;

    // 1. Tenta gerar link e código OTP via Supabase Admin
    try {
      const supabaseAdmin = getSupabaseAdmin();
      if (supabaseAdmin) {
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: cleanEmail
        });

        if (!error && data?.properties) {
          const { hashed_token, email_otp } = data.properties;
          otpCode = email_otp;
          directResetUrl = `${redirectUrl}?token_hash=${hashed_token}&email=${encodeURIComponent(cleanEmail)}`;
          console.log(`🔑 [Vercel Auth] Link gerado com sucesso para ${cleanEmail} (OTP: ${otpCode})`);
        } else if (error) {
          console.warn('⚠️ [Vercel Auth] generateLink aviso:', error.message);
        }
      }
    } catch (adminErr) {
      console.warn('⚠️ [Vercel Auth] Exceção ao gerar link admin:', adminErr.message);
    }

    // Fallback: se não conseguiu via admin, solicita reset padrão do Supabase
    if (!directResetUrl) {
      try {
        const supabase = getSupabase();
        if (supabase) {
          await supabase.auth.resetPasswordForEmail(cleanEmail, {
            redirectTo: redirectUrl
          });
          directResetUrl = redirectUrl;
        }
      } catch (fallbackErr) {
        console.warn('⚠️ [Vercel Auth] resetPasswordForEmail aviso:', fallbackErr.message);
      }
    }

    // 2. Disparar e-mail de recuperação institucional via Nodemailer (Gmail da ALEM)
    const emailHtml = getRecoveryEmailHtml({
      email: cleanEmail,
      resetUrl: directResetUrl || redirectUrl,
      otpCode
    });

    const mailResult = await sendEmail({
      to: cleanEmail,
      subject: 'Recuperação de Palavra-passe - ALEM',
      html: emailHtml
    });

    return res.status(200).json({
      success: true,
      message: 'Link e código de recuperação enviados com sucesso para o seu e-mail!',
      emailSent: mailResult.success,
      mocked: mailResult.mocked || false
    });

  } catch (error) {
    console.error('❌ [Vercel Auth] Erro ao recuperar palavra-passe:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno ao processar recuperação de palavra-passe.'
    });
  }
}
