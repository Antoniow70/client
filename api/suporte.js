import { sendEmail } from './_lib/emailService.js';
import { getSupportEmailHtml, getAdminNotificationHtml } from './_lib/templates.js';
import { getSupabase } from './_lib/supabase.js';

export default async function handler(req, res) {
  // Configuração de headers CORS (para compatibilidade caso chamado de outros subdomínios)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Health check ou listagem de mensagens do Supabase
  if (req.method === 'GET') {
    const supabase = getSupabase();
    const isListRequest = req.query?.status || req.query?.page || req.query?.search || req.headers?.authorization;

    if (supabase && isListRequest) {
      try {
        let query = supabase.from('messages').select('*', { count: 'exact' });
        if (req.query.status && req.query.status !== 'Todos') {
          query = query.eq('status', req.query.status);
        }
        if (req.query.search) {
          query = query.or(`name.ilike.%${req.query.search}%,email.ilike.%${req.query.search}%`);
        }
        query = query.order('created_at', { ascending: false });

        if (req.query.page && req.query.pageSize) {
          const from = (parseInt(req.query.page) - 1) * parseInt(req.query.pageSize);
          const to = from + parseInt(req.query.pageSize) - 1;
          query = query.range(from, to);
        }

        const { data, count, error } = await query;
        if (!error) {
          return res.status(200).json({ data, count });
        }
      } catch (err) {
        console.warn('⚠️ [Vercel API] Erro ao listar do Supabase:', err.message);
      }
    }

    return res.status(200).json({
      status: 'online',
      message: 'ALEM Vercel Serverless Email & Support API',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const payload = req.body || {};
    const {
      name, nome,
      email,
      phone, telefone,
      genero,
      data_nascimento,
      endereco, bairro,
      subject, assunto, tipo_necessidade,
      message, mensagem
    } = payload;

    const applicantName = (name || nome || '').trim();
    const applicantEmail = (email || '').trim();
    const applicantPhone = (phone || telefone || '').trim();
    const applicantAddress = (endereco || bairro || '').trim();
    const supportType = (tipo_necessidade || subject || assunto || 'Apoio Geral').trim();
    const applicantMessage = (message || mensagem || '').trim();

    if (!applicantEmail && !applicantPhone) {
      return res.status(400).json({
        success: false,
        error: 'E-mail ou telefone de contacto e obrigatorio.'
      });
    }

    // 1. Salvar no Supabase (se disponível)
    let savedRecord = null;
    try {
      const supabase = getSupabase();
      if (supabase) {
        const dbPayload = {
          name: applicantName || 'Anonimo',
          email: applicantEmail || null,
          phone: applicantPhone || null,
          genero: genero || null,
          data_nascimento: data_nascimento || null,
          bairro: applicantAddress || null,
          tipo_necessidade: supportType,
          status: 'Novo',
          read_status: 'Nao Lido'
        };

        if (payload.origem_deficiencia) dbPayload.origem_deficiencia = payload.origem_deficiencia;
        if (payload.nivel_escolar) dbPayload.nivel_escolar = payload.nivel_escolar;
        if (payload.provincia) dbPayload.provincia = payload.provincia;

        const { data, error } = await supabase
          .from('messages')
          .insert([dbPayload])
          .select()
          .single();

        if (!error && data) {
          savedRecord = data;
        } else if (error) {
          console.warn('⚠️ [Vercel API] Aviso ao salvar no Supabase:', error.message);
        }
      }
    } catch (dbErr) {
      console.warn('⚠️ [Vercel API] Exceção ao gravar no banco de dados:', dbErr.message);
    }

    // 2. Enviar e-mail de confirmação ao solicitante via Nodemailer
    let emailResult = null;
    if (applicantEmail) {
      const emailHtml = getSupportEmailHtml({
        name: applicantName,
        email: applicantEmail,
        phone: applicantPhone,
        genero,
        data_nascimento,
        endereco: applicantAddress,
        tipo_necessidade: supportType,
        message: applicantMessage
      });

      emailResult = await sendEmail({
        to: applicantEmail,
        subject: 'Recebemos o seu pedido de apoio - ALEM',
        html: emailHtml
      });
    }

    // 3. Notificar administrador se ADMIN_EMAIL estiver configurado
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    if (adminEmail && adminEmail !== applicantEmail) {
      const adminHtml = getAdminNotificationHtml({
        name: applicantName,
        email: applicantEmail,
        phone: applicantPhone,
        endereco: applicantAddress,
        tipo_necessidade: supportType,
        message: applicantMessage
      });

      // Dispara em background sem travar resposta
      sendEmail({
        to: adminEmail,
        subject: `[ALEM] Novo Pedido de Apoio: ${applicantName || supportType}`,
        html: adminHtml
      }).catch(err => console.error('Erro ao alertar admin:', err));
    }

    return res.status(200).json({
      success: true,
      message: 'Mensagem enviada com sucesso! O e-mail de confirmacao foi processado.',
      data: savedRecord || {
        name: applicantName,
        email: applicantEmail,
        tipo_necessidade: supportType
      },
      emailSent: emailResult?.success ?? false,
      mocked: emailResult?.mocked ?? false
    });

  } catch (error) {
    console.error('❌ [Vercel API] Erro ao processar pedido de suporte:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno no servidor Vercel ao enviar e-mail.'
    });
  }
}
