function resetPasswordEmailTamplate(appName, header_logo_url, code, first_name, support_email, company_name, support_address, year) {
  return `
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email verified successfully</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; }
    .email-container { max-width: 640px; margin: 0 auto; }
    .content-cell { padding: 20px; } /* Added padding here */
    .footer-cell { color:#717171; font-size:13px; line-height:18px; text-align:center; padding-top: 25px; }
    .social-icon { width: 24px; height: 24px; margin: 0 8px; }
  </style>
</head>
<body style="margin: 20px 0; padding: 0; background-color:#f2f2f2;"> <!-- Added margin to the body -->
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
            <td class="content-cell"> <!-- Added class to apply padding -->
              <h2>Welcome to ${appName} - Let’s Get Started!</h2>
              <p>Dear ${first_name},</p>
              <p>Welcome to ${appName} – the exciting world of connections and possibilities! We’re thrilled to have you join our community and embark on this journey with us.</p>
              <p>At ${appName}, we believe in the power of meaningful connections and the joy of discovering new relationships. Whether you’re here to find love, make new friends, or expand your social circle, you’ve come to the right place.</p>
              <p>Here are a few things to help you get started:</p>
              <ol>
                  <li><strong>Complete Your Profile:</strong> Your profile is your digital identity on ${appName}. Upload your best photos, share a bit about yourself, and let others know what you’re looking for. The more information you provide, the better the matches we can find for you.</li>
                  <li><strong>Explore Our Features:</strong> Dive into our intuitive interface and discover all the features designed to enhance your experience. From advanced search filters to interactive messaging, we’ve got everything you need to connect with others seamlessly.</li>
                  <li><strong>Live Streaming:</strong> Join our Live Streaming feature for fun and money-making opportunities! Share your talents, engage with your audience, and earn rewards while having a great time. Whether you’re a performer, a gamer, or just want to connect with others in real-time, our Live Streaming feature is for you.</li>
                  <li><strong>Stay Safe & Secure:</strong> Your safety is our top priority. We employ state-of-the-art security measures to keep your information protected and ensure a safe environment for everyone. Remember to never share personal information with strangers and report any suspicious activity.</li>
                  <li><strong>Join the Community:</strong> Connect with like-minded individuals from around the world in our vibrant community. Participate in discussions, share your experiences, and make lasting connections that enrich your life.</li>
                  <li><strong>Keep Exploring:</strong> With millions of users and endless possibilities, there’s always something new to discover on ${appName}. So, don’t hesitate to explore, experiment, and have fun along the way!</li>
              </ol>
              <p>If you ever have any questions or need assistance, our dedicated support team is here to help. Just drop us a message, and we’ll be happy to assist you.</p>
              <p>Once again, welcome to ${appName}! We can’t wait to see what amazing connections you’ll make.</p>
              <p>Best Regards,<br>${appName} Team</p>
              <p>P.S. Don’t forget to follow us on social media for updates, tips, and exclusive offers!</p>
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