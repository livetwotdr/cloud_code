
function resetPasswordEmailTamplate(appName, header_logo_url, code, first_name, support_email, company_name, support_address, year) {
    return `
    <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Verification Code</title>
    <style>
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      img { -ms-interpolation-mode: bicubic; }
      .email-container { max-width: 640px; margin: 0 auto; }
      .content-cell { padding: 2% 5% 3%; }
      .footer-cell { color:#717171; font-size:13px; line-height:18px; text-align:center; padding-top: 25px; }
      .social-icon { width: 24px; height: 24px; margin: 0 8px; }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color:#f2f2f2;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f2f2f2" class="email-container">
      <tr>
        <td align="center" valign="top" style="padding:10px 0;">
          <!-- Header -->
          <img src="${header_logo_url}" width="165" alt="${appName}" style="margin-bottom: 20px;">
        </td>
      </tr>
      <tr>
        <td align="center" valign="top" style="padding:0 20px;">
          <!-- Body -->
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 20px;">
            <tr>
              <td class="content-cell">
                Hi ${first_name},<br><br>
                Your verification code to reset your password is <b>${code}</b>. Don’t share this with anyone. If you didn’t ask to reset your password, you can ignore this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td align="center" valign="top" style="padding-top: 20px; padding-bottom: 20px;">
          <!-- Footer -->
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="center" class="footer-cell">
                Follow us:
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 20px 0;">
                <a href="https://www.facebook.com/dative/" style="display:inline-block;padding:8px;border-radius:8px;border:1px solid #d9d9d9" target="_blank"><img src="https://i.imgur.com/X0DC7Qm.png" width="24" height="24" alt="Facebook" style="vertical-align:middle" border="0" class="CToWUd" data-bit="iit"></a>
                <a href="https://twitter.com/dative/" style="display:inline-block;padding:8px;border-radius:8px;border:1px solid #d9d9d9" target="_blank"><img src="https://i.imgur.com/p2dM1Bi.png" width="24" height="24" alt="Twitter" style="vertical-align:middle" border="0" class="CToWUd" data-bit="iit"></a>
                <a href="https://instagram.com/dative/" style="display:inline-block;padding:8px;border-radius:8px;border:1px solid #d9d9d9" target="_blank"><img src="https://i.imgur.com/PmhTQqf.png" width="24" height="24" alt="Instagram" style="vertical-align:middle" border="0" class="CToWUd" data-bit="iit"></a>
              </td>
            </tr>
            <tr>
              <td class="footer-cell">
                You have received this email from ${company_name}. that is a company registered and located at ${support_address}.
              </td>
            </tr>
            <tr>
            <td class="footer-cell">
              &copy; ${company_name} - ${year} | ${support_email}  &nbsp;|&nbsp;  All rights reserved.
            </td>
          </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
    `;
  }
  
  module.exports = resetPasswordEmailTamplate;  