const config = require('../config');

const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);

const currentYear = new Date().getFullYear();

const mg = mailgun.client({username: 'api', key: config.mg_api_key});

// Email types are better defined here if used also within this file
var emailTypeResetPassword = "reset_password";
var emailTypeVerification = "verification";
var emailTypeAddEmail = "addEmail";

// Not done yet
var emailTypeAddEmailVerified = "emailVerified";
var emailTypeWelcome = "emailWelcome";

// Templates
const resetPasswordTamplate = require('./templates/password_reset');
const verificationCodeTamplate = require('./templates/verification_code');
const addEmailTamplate = require('./templates/add_email');
const verifiedEmailTamplate = require('./templates/verified_email');
const welcomeEmailTamplate = require('./templates/welcome_email');

// Company and app setup
const appName = config.app_name;
const header_logo_url = config.header_logo_url;
const support_email = config.support_email;
const company_name = config.company_name;
const support_address = config.support_address;
const year = currentYear.toString();

async function sendEmails(emailType, email, firstname, verificationCode) {
  var emailContent = null;
  var subjectContent = null;

  switch(emailType) {
    case emailTypeResetPassword:
      emailContent = resetPasswordTamplate(appName, header_logo_url, verificationCode, firstname, support_email, company_name, support_address, year);
      subjectContent = "Reset your password";
      break;
    case emailTypeVerification:
      emailContent = verificationCodeTamplate(appName, header_logo_url, verificationCode, firstname, support_email, company_name, support_address, year);
      subjectContent = "Register new account";
      break;
    case emailTypeAddEmail:
      emailContent = addEmailTamplate(appName, header_logo_url, verificationCode, firstname, support_email, company_name, support_address, year);
      subjectContent = "Add email to your account";
      break;
    case emailTypeAddEmailVerified:
      emailContent = verifiedEmailTamplate(appName, header_logo_url, verificationCode, firstname, support_email, company_name, support_address, year);
      subjectContent = "Email verified successfully";
      break;
    case emailTypeWelcome:
      emailContent = welcomeEmailTamplate(appName, header_logo_url, verificationCode, firstname, support_email, company_name, support_address, year);
      subjectContent = "Welcome to " + appName;
      break;
  }

  mg.messages.create(config.mg_domain, {
    from: config.mg_from_email,
    to: [email],
    subject: subjectContent,
    html: emailContent
  })
  .then(msg => console.info("Email sent", msg)) // logs response data
  .catch(err => console.error("Email not send with error:", err)); // logs any error
};

module.exports = {
  sendEmails,
  emailTypes: {
    resetPassword: emailTypeResetPassword,
    verification: emailTypeVerification,
    addEmail: emailTypeAddEmail,
    welcomeEmail: emailTypeWelcome,
    emailVerifed: emailTypeAddEmailVerified,
  }
};
