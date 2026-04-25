import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface LeadData {
  name: string;
  email: string;
  phone: string;
  propertyInterest: string;
  budget: number;
  priority: string;
  source: string;
}

export async function sendNewLeadEmail(toEmail: string, leadData: LeadData) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>New Lead Alert</title></head>
    <body style="font-family: 'DM Sans', sans-serif; background:#0f172a; color:#e2e8f0; margin:0; padding:0;">
      <div style="max-width:600px; margin:0 auto; background:#1e293b; border-radius:12px; overflow:hidden; margin-top:20px;">
        <div style="background:linear-gradient(135deg,#f0720f,#e15a07); padding:32px; text-align:center;">
          <h1 style="color:white; margin:0; font-size:28px; font-weight:700;">🏠 New Lead Alert</h1>
          <p style="color:rgba(255,255,255,0.85); margin:8px 0 0; font-size:14px;">A new lead has been added to the CRM</p>
        </div>
        <div style="padding:32px;">
          <div style="background:#0f172a; border-radius:8px; padding:24px; margin-bottom:20px;">
            <h2 style="color:#f0720f; margin:0 0 16px; font-size:18px;">Lead Details</h2>
            <table style="width:100%; border-collapse:collapse;">
              <tr><td style="padding:8px 0; color:#94a3b8; width:40%;">Name</td><td style="padding:8px 0; color:#e2e8f0; font-weight:600;">${leadData.name}</td></tr>
              <tr><td style="padding:8px 0; color:#94a3b8;">Email</td><td style="padding:8px 0; color:#e2e8f0;">${leadData.email}</td></tr>
              <tr><td style="padding:8px 0; color:#94a3b8;">Phone</td><td style="padding:8px 0; color:#e2e8f0;">${leadData.phone}</td></tr>
              <tr><td style="padding:8px 0; color:#94a3b8;">Interest</td><td style="padding:8px 0; color:#e2e8f0;">${leadData.propertyInterest}</td></tr>
              <tr><td style="padding:8px 0; color:#94a3b8;">Budget</td><td style="padding:8px 0; color:#e2e8f0;">PKR ${(leadData.budget / 1_000_000).toFixed(1)}M</td></tr>
              <tr><td style="padding:8px 0; color:#94a3b8;">Priority</td><td style="padding:8px 0;">
                <span style="background:${leadData.priority === 'High' ? '#dc2626' : leadData.priority === 'Medium' ? '#d97706' : '#16a34a'}; color:white; padding:2px 10px; border-radius:20px; font-size:12px; font-weight:600;">${leadData.priority}</span>
              </td></tr>
              <tr><td style="padding:8px 0; color:#94a3b8;">Source</td><td style="padding:8px 0; color:#e2e8f0;">${leadData.source}</td></tr>
            </table>
          </div>
          <div style="text-align:center;">
            <a href="${process.env.NEXTAUTH_URL}/leads" style="display:inline-block; background:linear-gradient(135deg,#f0720f,#e15a07); color:white; text-decoration:none; padding:12px 32px; border-radius:8px; font-weight:600; font-size:14px;">View in CRM →</a>
          </div>
        </div>
        <div style="padding:16px 32px; background:#0f172a; text-align:center;">
          <p style="color:#475569; font-size:12px; margin:0;">Property Dealer CRM · Automated Notification</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Property CRM" <noreply@propertycrm.com>',
      to: toEmail,
      subject: `🏠 New ${leadData.priority} Priority Lead: ${leadData.name}`,
      html,
    });
  } catch (error) {
    console.error('Email send error:', error);
  }
}

export async function sendLeadAssignedEmail(
  agentEmail: string,
  agentName: string,
  leadData: LeadData & { id: string }
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Lead Assigned to You</title></head>
    <body style="font-family: 'DM Sans', sans-serif; background:#0f172a; color:#e2e8f0; margin:0; padding:0;">
      <div style="max-width:600px; margin:0 auto; background:#1e293b; border-radius:12px; overflow:hidden; margin-top:20px;">
        <div style="background:linear-gradient(135deg,#3b82f6,#2563eb); padding:32px; text-align:center;">
          <h1 style="color:white; margin:0; font-size:28px; font-weight:700;">📋 Lead Assigned</h1>
          <p style="color:rgba(255,255,255,0.85); margin:8px 0 0; font-size:14px;">Hello ${agentName}, a lead has been assigned to you</p>
        </div>
        <div style="padding:32px;">
          <div style="background:#0f172a; border-radius:8px; padding:24px; margin-bottom:20px;">
            <h2 style="color:#3b82f6; margin:0 0 16px; font-size:18px;">Lead Information</h2>
            <table style="width:100%; border-collapse:collapse;">
              <tr><td style="padding:8px 0; color:#94a3b8; width:40%;">Client Name</td><td style="padding:8px 0; color:#e2e8f0; font-weight:600;">${leadData.name}</td></tr>
              <tr><td style="padding:8px 0; color:#94a3b8;">Phone</td><td style="padding:8px 0; color:#e2e8f0;">${leadData.phone}</td></tr>
              <tr><td style="padding:8px 0; color:#94a3b8;">Property Interest</td><td style="padding:8px 0; color:#e2e8f0;">${leadData.propertyInterest}</td></tr>
              <tr><td style="padding:8px 0; color:#94a3b8;">Budget</td><td style="padding:8px 0; color:#e2e8f0;">PKR ${(leadData.budget / 1_000_000).toFixed(1)}M</td></tr>
              <tr><td style="padding:8px 0; color:#94a3b8;">Priority</td><td style="padding:8px 0;">
                <span style="background:${leadData.priority === 'High' ? '#dc2626' : leadData.priority === 'Medium' ? '#d97706' : '#16a34a'}; color:white; padding:2px 10px; border-radius:20px; font-size:12px;">${leadData.priority}</span>
              </td></tr>
            </table>
          </div>
          <p style="color:#94a3b8; font-size:14px; margin-bottom:20px;">Please contact this lead as soon as possible and update the status in the CRM.</p>
          <div style="text-align:center;">
            <a href="${process.env.NEXTAUTH_URL}/leads/${leadData.id}" style="display:inline-block; background:linear-gradient(135deg,#3b82f6,#2563eb); color:white; text-decoration:none; padding:12px 32px; border-radius:8px; font-weight:600; font-size:14px;">View Lead →</a>
          </div>
        </div>
        <div style="padding:16px 32px; background:#0f172a; text-align:center;">
          <p style="color:#475569; font-size:12px; margin:0;">Property Dealer CRM · Automated Notification</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Property CRM" <noreply@propertycrm.com>',
      to: agentEmail,
      subject: `📋 New Lead Assigned: ${leadData.name} (${leadData.priority} Priority)`,
      html,
    });
  } catch (error) {
    console.error('Email send error:', error);
  }
}
