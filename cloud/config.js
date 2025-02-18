// App Info
const AppName = "Live Two"; //  App Name
const LogoUrl = "https://dative.me/ic_logo_boom.png"; // App logo url, used in emails header
const SupportEmail = "support@livetwo.info"; // Support email, used in emails footer
const CompanyName = "Live Two"; //Company name, used in emails footer
const Address = "Alampur, Suti, Murshidabad, Pin-742223, West Bengal, IN"; //  Comapany address, used in emails footer

// Mailgun Keys
const MailgunFromEmail= "Live Two <noreply@livetwo.info>";
const MailgunDomain = process.env.MAILGUN_DOMAIN;
const MailgunApiKey = process.env.MAILGUN_API_KEY;

// Zegocloud Keys
const ZegocloudAppId = process.env.ZEGO_APP_ID;
const ZegoclouServerSecret = process.env.ZEGO_SERVER_SECRET;
const ZegocloudGameServer = process.env.ZEGO_HOST_URL;

// Stripe Keys
const StripeSecretKey = process.env.STRIPE_SECRET_KEY;
const StripePublicKey = process.env.STRIPE_PUBLIC_KEY;
const StripeWebhookKey = process.env.STRIPE_WEBHOOK_KEY;

// RevenueCat Webhook Keys
const RevenueCatWebhookKey = process.env.PARSE_SERVER_WEBHOOK_KEY;

// Open AI API key
const OpenAiKey = process.env.OPENAI_API_KEY;

// One Signal
const OneSignalApiKey = process.env.ONE_SIGNAL_APP_ID;
const OneSignalRestApiKey = process.env.ONE_SIGNAL_REST_KEY;

// Push notiications templates
const pushTemplatePostComment = "xxxxxxxxxxxxxx";
const pushTemplatePostLike = "xxxxxxxxxxxxxx";
const pushTemplatePostMenstion = "xxxxxxxxxxxxxx";

const pushTemplateGift = "xxxxxxxxxxxxxx";
const pushTemplateChat = "xxxxxxxxxxxxxx";
const pushTemplateLive = "xxxxxxxxxxxxxx";
const pushTemplateObjtainedItem = "xxxxxxxxxxxxxx";

const pushTemplateSpecial = "xxxxxxxxxxxxxx";
const pushTemplateFollow = "xxxxxxxxxxxxxx";
const pushTemplateVisitor = "xxxxxxxxxxxxxx";
const pushTemplateFriend = "xxxxxxxxxxxxxx";

const pushTemplatePayrollOrderNew = "xxxxxxxxxxxxxx";
const pushTemplatePayrollOrderPaymentSent = "xxxxxxxxxxxxxx";
const pushTemplatePayrollOrderPaymentReceived = "xxxxxxxxxxxxxx";
const pushTemplatePayrollOrderPaymentProblem = "xxxxxxxxxxxxxx";
const pushTemplatePayrollOrderPaymentProblemUpdated = "xxxxxxxxxxxxxx";


////////////////////////////////////////////////
//////////////// Propagate config //////////////
////////////////////////////////////////////////
const config = {
  one_s_app_id: OneSignalApiKey,
  one_s_rest_api_key: OneSignalRestApiKey,
  sk_key: StripeSecretKey,
  pk_key: StripePublicKey,
  sw_key: StripeWebhookKey,
  zc_id: ZegocloudAppId,
  zc_secret: ZegoclouServerSecret,
  zc_host: ZegocloudGameServer,
  rc_wh_key: RevenueCatWebhookKey, 
  mg_domain: MailgunDomain,
  mg_api_key: MailgunApiKey,
  mg_from_email: MailgunFromEmail,
  oa_api_key: OpenAiKey,
  app_name: AppName,
  header_logo_url: LogoUrl,
  support_email: SupportEmail,
  company_name: CompanyName,
  support_address: Address,
  pushTemplatePostComment: pushTemplatePostComment,
  pushTemplatePostLike: pushTemplatePostLike,
  pushTemplateGift: pushTemplateGift,
  pushTemplateSpecial: pushTemplateSpecial,
  pushTemplateFollow: pushTemplateFollow,
  pushTemplateVisitor: pushTemplateVisitor,
  pushTemplateFriend: pushTemplateFriend,
  pushTemplateChat: pushTemplateChat,
  pushTemplateLive: pushTemplateLive,
  pushTemplateObjtainedItem: pushTemplateObjtainedItem,
  pushTemplatePostMenstion: pushTemplatePostMenstion,
  pushTemplatePayrollOrderNew: pushTemplatePayrollOrderNew,
  pushTemplatePayrollOrderPaymentSent: pushTemplatePayrollOrderPaymentSent,
  pushTemplatePayrollOrderPaymentReceived: pushTemplatePayrollOrderPaymentReceived,
  pushTemplatePayrollOrderPaymentProblem: pushTemplatePayrollOrderPaymentProblem,
  pushTemplatePayrollOrderPaymentProblemUpdated: pushTemplatePayrollOrderPaymentProblemUpdated,

};

module.exports = config;
