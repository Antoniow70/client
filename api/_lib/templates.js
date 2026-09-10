/**
 * Layout base e templates HTML para e-mails institucionais da ALEM.
 */
export function getEmailLayout(contentHtml, previewText = 'Associacao ALEM') {
  const currentYear = new Date().getFullYear();
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ALEM</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F4F6F8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    img { max-width: 100%; height: auto; display: block; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 10px !important; }
      .content-padding { padding: 24px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F6F8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  
  <span style="display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; font-size: 0px; line-height: 0px;">
    ${previewText}
  </span>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4F6F8; padding: 20px 0;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td align="center" style="background-color: #1B314C; padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: 2px;">ALEM</h1>
              <p style="margin: 4px 0 0 0; color: #789ACA; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">Associacao Lacos Especiais de Mocambique</p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td class="content-padding" style="padding: 40px; color: #334155; font-size: 15px; line-height: 1.6;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #1B314C; padding: 32px 24px; color: #9FB3C8; font-size: 12px; line-height: 1.5; text-align: center; border-top: 1px solid #E2E8F0;">
              <p style="margin: 0 0 8px 0; color: #ffffff; font-weight: bold; font-size: 14px;">ALEM</p>
              <p style="margin: 0 0 16px 0;">
                Bairro de Macuti, Beira, Mocambique<br>
                Telefones: +258 84 000 0000 | +258 87 000 0000<br>
                E-mails: info@alem.mz | apoio@alem.mz
              </p>
              <div style="margin-bottom: 16px; border-top: 1px solid #3C5E82; width: 60px; height: 1px; display: inline-block;"></div>
              <p style="margin: 0; font-size: 11px; color: #9FB3C8;">
                Esta e uma mensagem automatica de confirmacao de envio. Por favor, nao responda diretamente a este e-mail.
              </p>
              <p style="margin: 12px 0 0 0; font-size: 11px; color: #789ACA;">
                &copy; ${currentYear} ALEM. Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

export function getSupportEmailHtml(data) {
  const formattedDate = data.data_nascimento 
    ? new Date(data.data_nascimento).toLocaleDateString('pt-PT') 
    : 'Nao fornecida';

  const contentHtml = `
    <h2 style="color: #1B314C; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">Recebemos o seu pedido de apoio</h2>
    <p style="margin-bottom: 24px;">Ola <strong>${data.name || data.nome || 'Amigo(a)'}</strong>,</p>
    <p style="margin-bottom: 24px;">Confirmamos que a ALEM recebeu o seu pedido de apoio com sucesso. A nossa equipa ira analisar a informacao partilhada com o maximo cuidado e atencao.</p>
    
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 24px; margin-bottom: 28px;">
      <h3 style="color: #3C5E82; font-size: 14px; font-weight: 700; text-transform: uppercase; margin-top: 0; margin-bottom: 16px; letter-spacing: 0.5px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">Detalhes do Pedido</h3>
      
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #64748B; width: 140px; font-weight: 600; vertical-align: top;">Tipo de Apoio:</td>
          <td style="padding: 6px 0; color: #1E293B; font-weight: bold;">${data.tipo_necessidade || data.subject || data.assunto || 'Nao especificado'}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748B; font-weight: 600; vertical-align: top;">Contacto:</td>
          <td style="padding: 6px 0; color: #1E293B;">${data.phone || data.telefone || 'Nao fornecido'}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748B; font-weight: 600; vertical-align: top;">Data Nascimento:</td>
          <td style="padding: 6px 0; color: #1E293B;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748B; font-weight: 600; vertical-align: top;">Endereco / Bairro:</td>
          <td style="padding: 6px 0; color: #1E293B;">${data.endereco || data.bairro || 'Nao fornecido'}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding-top: 16px; border-top: 1px solid #E2E8F0; color: #64748B; font-weight: 600; padding-bottom: 6px;">Descricao do Pedido:</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 8px 12px; background-color: #ffffff; border: 1px solid #E2E8F0; border-radius: 6px; color: #334155; line-height: 1.5; font-style: italic;">
            ${(data.message || data.mensagem || 'Sem descricao adicional.').replace(/\n/g, '<br>')}
          </td>
        </tr>
      </table>
    </div>

    <p style="margin-bottom: 24px;">O nosso tempo medio de resposta e de 3 a 5 dias uteis. Entraremos em contacto atraves dos meios fornecidos assim que a analise for concluida.</p>
    
    <div style="text-align: center; margin-top: 32px; margin-bottom: 32px;">
      <a href="https://alem.mz" target="_blank" style="background-color: #5E82AC; color: #ffffff; text-decoration: none; padding: 12px 28px; font-weight: bold; border-radius: 6px; font-size: 14px; display: inline-block; box-shadow: 0 2px 4px rgba(94, 130, 172, 0.3);">Visitar o nosso Website</a>
    </div>

    <p style="margin-top: 24px; border-top: 1px solid #E2E8F0; padding-top: 16px; color: #64748B; font-size: 14px;">
      Com os melhores cumprimentos,<br>
      <strong>Equipa de Apoio Social ALEM</strong>
    </p>
  `;

  return getEmailLayout(contentHtml, 'Recebemos o seu pedido de apoio - ALEM');
}

export function getAdminNotificationHtml(data) {
  const contentHtml = `
    <h2 style="color: #1B314C; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">Novo Pedido de Apoio Recebido</h2>
    <p style="margin-bottom: 24px;">Um novo contacto/pedido de apoio foi submetido atraves do website da ALEM:</p>
    
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 24px; margin-bottom: 28px;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #64748B; width: 140px; font-weight: 600;">Nome:</td>
          <td style="padding: 6px 0; color: #1E293B; font-weight: bold;">${data.name || data.nome || 'Nao informado'}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748B; font-weight: 600;">E-mail:</td>
          <td style="padding: 6px 0; color: #1E293B;">${data.email || 'Nao informado'}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748B; font-weight: 600;">Telefone:</td>
          <td style="padding: 6px 0; color: #1E293B;">${data.phone || data.telefone || 'Nao informado'}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748B; font-weight: 600;">Tipo de Apoio:</td>
          <td style="padding: 6px 0; color: #1E293B;">${data.tipo_necessidade || data.subject || data.assunto || 'Geral'}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748B; font-weight: 600;">Endereco:</td>
          <td style="padding: 6px 0; color: #1E293B;">${data.endereco || data.bairro || 'Nao informado'}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding-top: 14px; font-weight: 600; color: #64748B;">Mensagem:</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 10px; background: #fff; border: 1px solid #E2E8F0; border-radius: 6px; margin-top: 4px;">
            ${(data.message || data.mensagem || 'Sem mensagem').replace(/\n/g, '<br>')}
          </td>
        </tr>
      </table>
    </div>
  `;
  return getEmailLayout(contentHtml, 'Novo Pedido de Apoio - Painel ALEM');
}

export function getRecoveryEmailHtml({ email, resetUrl, otpCode }) {
  const contentHtml = `
    <h2 style="color: #1B314C; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">Recuperação de Palavra-passe</h2>
    <p style="margin-bottom: 16px;">Olá,</p>
    <p style="margin-bottom: 24px;">Recebemos um pedido para redefinir a palavra-passe da conta de administrador associada ao e-mail <strong>${email}</strong>.</p>
    
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 24px; margin-bottom: 24px; text-align: center;">
      <p style="margin-top: 0; margin-bottom: 20px; color: #475569; font-size: 14px;">
        Clique no botão abaixo para definir a sua nova palavra-passe diretamente:
      </p>
      
      <a href="${resetUrl}" target="_blank" style="background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 14px 32px; font-weight: bold; border-radius: 8px; font-size: 15px; display: inline-block; box-shadow: 0 2px 4px rgba(22, 163, 74, 0.3);">
        Redefinir Palavra-passe
      </a>

      ${otpCode ? `
      <div style="margin-top: 24px; padding-top: 18px; border-top: 1px dashed #CBD5E1;">
        <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
          Ou utilize o código de verificação:
        </p>
        <span style="font-family: monospace; font-size: 24px; font-weight: 800; letter-spacing: 6px; color: #1E293B; background-color: #E2E8F0; padding: 6px 16px; border-radius: 6px; display: inline-block;">
          ${otpCode}
        </span>
      </div>
      ` : ''}

      <p style="margin-top: 20px; margin-bottom: 0; color: #94a3b8; font-size: 12px;">
        Se o botão não funcionar, copie e cole o seguinte link no seu navegador:<br>
        <span style="word-break: break-all; color: #2563eb;">${resetUrl}</span>
      </p>
    </div>

    <p style="margin-bottom: 16px; color: #64748b; font-size: 13px;">
      <strong>Nota de Segurança:</strong> Este link é válido por tempo limitado. Se não solicitou a recuperação da sua palavra-passe, por favor ignore esta mensagem. A sua conta permanecerá segura e a senha atual não será alterada.
    </p>
  `;

  return getEmailLayout(contentHtml, 'Recuperação de Palavra-passe - ALEM');
}

