import sgMail from '@sendgrid/mail';

const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL;

if (apiKey) {
  sgMail.setApiKey(apiKey);
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  if (!apiKey || !fromEmail) {
    // Dev mock: log email to console so you can test the flow without a real key
    if (process.env.NODE_ENV !== 'production' && process.env.SENDGRID_DEV_MOCK === 'true') {
      console.log('[DEV MOCK] Email would have been sent:', {
        to: options.to,
        subject: options.subject,
        textPreview: options.text.slice(0, 100) + (options.text.length > 100 ? '...' : ''),
      });
      return { success: true, messageId: 'dev-mock-' + Date.now() };
    }
    console.warn('SendGrid not configured, email not sent');
    return {
      success: false,
      error: 'Email service not configured',
    };
  }

  try {
    const msg = {
      to: options.to,
      from: fromEmail,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text.replace(/\n/g, '<br>'),
    };

    const [response] = await sgMail.send(msg);

    return {
      success: true,
      messageId: response.headers['x-message-id'] as string,
    };
  } catch (error: any) {
    const sendgridMsg = error.response?.body?.errors?.[0]?.message || error.response?.body?.errors?.[0];
    const errDetail = sendgridMsg
      ? `${error.message} — ${typeof sendgridMsg === 'string' ? sendgridMsg : JSON.stringify(sendgridMsg)}`
      : error.message;
    console.error('Error sending email:', errDetail);
    if (error.response?.body?.errors) {
      console.error('SendGrid details:', error.response.body.errors);
    }
    return {
      success: false,
      error: errDetail || 'Failed to send email',
    };
  }
}

export function isEmailConfigured(): boolean {
  return !!(apiKey && fromEmail);
}
