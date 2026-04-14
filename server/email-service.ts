import { Resend } from 'resend';
import type { ContactFormData } from '@shared/schema';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

async function getUncachableResendClient() {
  const credentials = await getCredentials();
  return {
    client: new Resend(credentials.apiKey),
    fromEmail: credentials.fromEmail
  };
}

export async function sendContactNotification(
  formData: ContactFormData,
  notificationEmail: string
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const htmlContent = `
      <h2>New Contact Form Submission</h2>
      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr style="background-color: #f5f5f5;">
          <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Name</td>
          <td style="padding: 12px; border: 1px solid #ddd;">${formData.firstName} ${formData.lastName}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Email</td>
          <td style="padding: 12px; border: 1px solid #ddd;"><a href="mailto:${formData.email}">${formData.email}</a></td>
        </tr>
        <tr style="background-color: #f5f5f5;">
          <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Company</td>
          <td style="padding: 12px; border: 1px solid #ddd;">${formData.company || 'Not provided'}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Service Interest</td>
          <td style="padding: 12px; border: 1px solid #ddd;">${formData.serviceInterest}</td>
        </tr>
        <tr style="background-color: #f5f5f5;">
          <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Message</td>
          <td style="padding: 12px; border: 1px solid #ddd;">${formData.message}</td>
        </tr>
      </table>
      <p style="margin-top: 20px; color: #666;">This message was sent from the Up Arrow Inc website contact form.</p>
    `;

    const textContent = `
New Contact Form Submission

Name: ${formData.firstName} ${formData.lastName}
Email: ${formData.email}
Company: ${formData.company || 'Not provided'}
Service Interest: ${formData.serviceInterest}
Message: ${formData.message}

This message was sent from the Up Arrow Inc website contact form.
    `;

    await client.emails.send({
      from: fromEmail,
      to: notificationEmail,
      subject: `New Contact: ${formData.firstName} ${formData.lastName} - ${formData.serviceInterest}`,
      html: htmlContent,
      text: textContent,
    });

    console.log('✅ Contact notification email sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to send contact notification email:', error);
    return false;
  }
}
