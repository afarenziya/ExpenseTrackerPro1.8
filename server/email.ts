import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    await mailService.send({
      to: params.to,
      from: 'noreply@ajayfarenziya.com', // Replace with your verified sender
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendRegistrationEmail(email: string, name: string): Promise<boolean> {
  const subject = 'Registration Successful - AjayFarenziya Expense Manager';
  const text = `
    Hello ${name},
    
    Thank you for registering with AjayFarenziya Expense Manager! 
    
    Your account is currently pending approval from an administrator. 
    You will receive an email once your account is approved.
    
    If you have any questions, please contact the administrator.
    
    Best regards,
    AjayFarenziya Team
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a73e8;">AjayFarenziya Expense Manager</h2>
      <p>Hello ${name},</p>
      <p>Thank you for registering with <strong>AjayFarenziya Expense Manager</strong>!</p>
      <p>Your account is currently <span style="color: #ffa000; font-weight: bold;">pending approval</span> from an administrator.</p>
      <p>You will receive an email once your account is approved.</p>
      <p>If you have any questions, please contact the administrator.</p>
      <p>Best regards,<br>AjayFarenziya Team</p>
    </div>
  `;
  
  return sendEmail({ to: email, subject, text, html });
}

export async function sendApprovalEmail(email: string, name: string): Promise<boolean> {
  const subject = 'Account Approved - AjayFarenziya Expense Manager';
  const text = `
    Hello ${name},
    
    Your account for AjayFarenziya Expense Manager has been approved! 
    
    You can now log in and access the dashboard.
    
    Best regards,
    AjayFarenziya Team
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a73e8;">AjayFarenziya Expense Manager</h2>
      <p>Hello ${name},</p>
      <p>Your account for <strong>AjayFarenziya Expense Manager</strong> has been <span style="color: #0f9d58; font-weight: bold;">approved</span>!</p>
      <p>You can now log in and access the dashboard.</p>
      <p>Best regards,<br>AjayFarenziya Team</p>
    </div>
  `;
  
  return sendEmail({ to: email, subject, text, html });
}

export async function sendRejectionEmail(email: string, name: string): Promise<boolean> {
  const subject = 'Account Registration Status - AjayFarenziya Expense Manager';
  const text = `
    Hello ${name},
    
    We regret to inform you that your account registration for AjayFarenziya Expense Manager has been rejected.
    
    If you believe this is an error, please contact the administrator.
    
    Best regards,
    AjayFarenziya Team
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a73e8;">AjayFarenziya Expense Manager</h2>
      <p>Hello ${name},</p>
      <p>We regret to inform you that your account registration for <strong>AjayFarenziya Expense Manager</strong> has been <span style="color: #d93025; font-weight: bold;">rejected</span>.</p>
      <p>If you believe this is an error, please contact the administrator.</p>
      <p>Best regards,<br>AjayFarenziya Team</p>
    </div>
  `;
  
  return sendEmail({ to: email, subject, text, html });
}