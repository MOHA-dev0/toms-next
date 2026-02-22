import { Resend } from 'resend';

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, text, html }: SendEmailOptions ) {
  try {
    const data = await resend.emails.send({
      from: 'TOMS <onboarding@resend.dev>',
      to,
      subject,
      text,
      html,
    });
    
    console.log('Email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}
