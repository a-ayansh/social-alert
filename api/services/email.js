const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
                return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false, 
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      this.isConfigured = true;
      
    } catch (error) {
      console.error('🚨 Email service configuration error:', error);
      this.isConfigured = false;
    }
  }

  async verifyConnection() {
    try {
      if (!this.isConfigured) {
        return { success: false, error: 'Email service not configured' };
      }

      await this.transporter.verify();
            return { success: true, message: 'Email service is ready' };

    } catch (error) {
      console.error('🚨 Email service verification error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendEmail(to, subject, htmlContent, textContent = null) {
    try {
      if (!this.isConfigured) {
                return { success: false, error: 'Email service not configured' };
      }

      const mailOptions = {
        from: `"Missing Alert System" <${process.env.SMTP_USER}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: subject,
        html: htmlContent,
        text: textContent || this.stripHtml(htmlContent)
      };

      const info = await this.transporter.sendMail(mailOptions);
      
            return { 
        success: true, 
        messageId: info.messageId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('🚨 Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmail(userEmail, userName) {
    const subject = '🚨 Welcome to Missing Alert System - Together We Find';
    
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Missing Alert System</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .logo { width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 15px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; margin-bottom: 15px; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .feature { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #2563eb; }
            .feature h3 { margin: 0 0 10px 0; color: #2563eb; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat { text-align: center; }
            .stat-number { font-size: 24px; font-weight: bold; color: #2563eb; }
            .cta { background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">MA</div>
            <h1>Welcome to Missing Alert System</h1>
            <p>Community-Powered Missing Persons & Pets Platform</p>
        </div>
        
        <div class="content">
            <h2>Hello ${userName}! 👋</h2>
            
            <p>Welcome to our community of heroes. You've just joined a network of thousands of volunteers dedicated to bringing missing persons home safely.</p>
            
            <div class="stats">
                <div class="stat">
                    <div class="stat-number">1,247</div>
                    <div>People Found</div>
                </div>
                <div class="stat">
                    <div class="stat-number">5,439</div>
                    <div>Active Volunteers</div>
                </div>
                <div class="stat">
                    <div class="stat-number">98.2%</div>
                    <div>Success Rate</div>
                </div>
            </div>
            
            <div class="feature">
                <h3>🚨 Report Missing Persons</h3>
                <p>Quickly report missing persons with detailed information, photos, and last known location. Our system immediately alerts the community in the area.</p>
            </div>
            
            <div class="feature">
                <h3>👁️ Report Sightings</h3>
                <p>Help families reunite by reporting sightings. Every report is valuable and could be the key to bringing someone home.</p>
            </div>
            
            <div class="feature">
                <h3>🗺️ Live Map View</h3>
                <p>See active cases in your area on our interactive map. Get notified about cases near you and join coordinated search efforts.</p>
            </div>
            
            <div class="feature">
                <h3>📱 Mobile Alerts</h3>
                <p>Receive instant notifications about critical cases, especially those involving children or vulnerable individuals.</p>
            </div>
            
            <a href="${process.env.FRONTEND_URL}/dashboard" class="cta">Access Your Dashboard</a>
            
            <h3>What You Can Do Right Now:</h3>
            <ul>
                <li>Complete your profile with contact information</li>
                <li>Set your notification preferences</li>
                <li>Browse active cases in your area</li>
                <li>Join our community of volunteers</li>
            </ul>
            
            <p><strong>Remember:</strong> Every second counts when someone goes missing. Your vigilance could save a life.</p>
            
            <p>If you have any questions, feel free to reach out to our support team.</p>
            
            <p>Thank you for joining our mission,<br>
            <strong>The Missing Alert Team</strong></p>
        </div>
        
        <div class="footer">
            <p>🏠 Built with community compassion by Aayansh03<br>
            📧 <a href="mailto:${process.env.ADMIN_EMAIL}">Contact Support</a> | 
            🌐 <a href="${process.env.FRONTEND_URL}">Visit Website</a></p>
            <p>Missing Alert System © 2025 | Built on 2025-07-07 17:33:05 UTC</p>
        </div>
    </body>
    </html>
    `;

    return await this.sendEmail(userEmail, subject, htmlContent);
  }

  async sendNewCaseAlert(recipients, caseData) {
    const subject = `🚨 URGENT: Missing Person Alert - ${caseData.personalInfo.name}`;
    
    const priority = caseData.priority === 'critical' ? '🔴 CRITICAL' : 
                    caseData.priority === 'high' ? '🟠 HIGH' : 
                    caseData.priority === 'medium' ? '🟡 MEDIUM' : '🔵 LOW';
    
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Missing Person Alert</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .alert-header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .priority { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .case-info { background: #fef2f2; padding: 20px; border: 2px solid #fecaca; border-radius: 0 0 10px 10px; }
            .info-row { margin: 10px 0; }
            .label { font-weight: bold; color: #dc2626; }
            .actions { background: #f8fafc; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
            .btn { background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 5px; }
            .photo { max-width: 200px; border-radius: 8px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="alert-header">
            <div class="priority">${priority} PRIORITY</div>
            <h1>🚨 MISSING PERSON ALERT</h1>
            <p>Immediate Community Response Needed</p>
        </div>
        
        <div class="case-info">
            <h2>${caseData.personalInfo.name}</h2>
            
            <div class="info-row">
                <span class="label">Age:</span> ${caseData.personalInfo.age} years old
            </div>
            
            <div class="info-row">
                <span class="label">Last Seen:</span> ${new Date(caseData.lastSeen.date).toLocaleDateString()} at ${caseData.lastSeen.address}
            </div>
            
            <div class="info-row">
                <span class="label">Description:</span> ${caseData.personalInfo.description}
            </div>
            
            ${caseData.personalInfo.clothing ? `
            <div class="info-row">
                <span class="label">Clothing:</span> ${caseData.personalInfo.clothing}
            </div>
            ` : ''}
            
            <div class="info-row">
                <span class="label">Case Number:</span> ${caseData.caseNumber}
            </div>
            
            ${caseData.lastSeen.circumstances ? `
            <div class="info-row">
                <span class="label">Circumstances:</span> ${caseData.lastSeen.circumstances}
            </div>
            ` : ''}
        </div>
        
        <div class="actions">
            <h3>How You Can Help:</h3>
            <a href="${process.env.FRONTEND_URL}/case/${caseData._id}" class="btn">View Full Details</a>
            <a href="${process.env.FRONTEND_URL}/report-sighting/${caseData._id}" class="btn">Report Sighting</a>
            <a href="${process.env.FRONTEND_URL}/map?case=${caseData._id}" class="btn">View on Map</a>
            
            <p style="margin-top: 20px;">
                <strong>If you see this person, immediately call 911 and report a sighting through our platform.</strong>
            </p>
        </div>
        
        <div style="background: #fffbeb; border: 1px solid #fed7aa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #ea580c;">⚡ Time is Critical</h4>
            <p style="margin: 0;">The first 24-48 hours are crucial in missing person cases. Please share this alert with your network and stay vigilant in your area.</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
            <p>Missing Alert System | Community-Powered Search Network<br>
            Built by Aayansh03 | Alert sent: ${new Date().toISOString()}</p>
        </div>
    </body>
    </html>
    `;

    return await this.sendEmail(recipients, subject, htmlContent);
  }

  async sendSightingVerificationEmail(userEmail, sightingData, caseData, isVerified = true) {
    const subject = isVerified ? 
      `✅ Sighting Verified - Thank you for helping find ${caseData.personalInfo.name}` :
      `❌ Sighting Update - Case ${caseData.caseNumber}`;
    
    const statusColor = isVerified ? '#16a34a' : '#dc2626';
    const statusIcon = isVerified ? '✅' : '❌';
    const statusText = isVerified ? 'VERIFIED' : 'REQUIRES REVIEW';
    
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sighting ${isVerified ? 'Verified' : 'Update'}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${statusColor}; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 20px; border-radius: 0 0 10px 10px; }
            .status { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .info-box { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid ${statusColor}; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="status">${statusIcon} SIGHTING ${statusText}</div>
            <h1>Thank You for Your Report</h1>
        </div>
        
        <div class="content">
            <p>Dear Community Hero,</p>
            
            ${isVerified ? `
            <p>🎉 <strong>Excellent news!</strong> Your sighting report for <strong>${caseData.personalInfo.name}</strong> has been verified by our team and is helping direct search efforts.</p>
            
            <div class="info-box">
                <h3>Your Verified Sighting:</h3>
                <p><strong>Location:</strong> ${sightingData.address}</p>
                <p><strong>Date/Time:</strong> ${new Date(sightingData.sightingDate).toLocaleString()}</p>
                <p><strong>Description:</strong> ${sightingData.description}</p>
            </div>
            
            <p>✨ <strong>You've earned recognition as a helpful community member!</strong> Your quick action and attention to detail could be the key to bringing ${caseData.personalInfo.name} home safely.</p>
            ` : `
            <p>Thank you for your sighting report regarding <strong>${caseData.personalInfo.name}</strong>. Our team is currently reviewing your submission.</p>
            
            <div class="info-box">
                <h3>Your Sighting Report:</h3>
                <p><strong>Location:</strong> ${sightingData.address}</p>
                <p><strong>Date/Time:</strong> ${new Date(sightingData.sightingDate).toLocaleString()}</p>
                <p><strong>Status:</strong> Under Review</p>
            </div>
            
            <p>We appreciate every report from our community. Even if this particular sighting doesn't match, your vigilance helps create a safer community for everyone.</p>
            `}
            
            <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #2563eb;">🤝 Keep Making a Difference</h4>
                <p style="margin: 0;">Continue to be our eyes and ears in the community. Every report matters, and together we're creating a network that brings people home.</p>
            </div>
            
            <p>Stay vigilant, stay safe, and thank you for being part of our mission.</p>
            
            <p>With gratitude,<br>
            <strong>The Missing Alert Team</strong></p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
            <p>Missing Alert System | Built by Aayansh03<br>
            📧 <a href="mailto:${process.env.ADMIN_EMAIL}">Contact Support</a> | 
            🌐 <a href="${process.env.FRONTEND_URL}">Visit Website</a></p>
        </div>
    </body>
    </html>
    `;

    return await this.sendEmail(userEmail, subject, htmlContent);
  }

  async sendCaseFoundNotification(recipients, caseData) {
    const subject = `🎉 FOUND: ${caseData.personalInfo.name} has been located safely!`;
    
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Person Found - Success!</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .success-header { background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 10px 10px; border: 2px solid #bbf7d0; }
            .celebration { font-size: 48px; margin-bottom: 15px; }
            .success-info { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #16a34a; }
        </style>
    </head>
    <body>
        <div class="success-header">
            <div class="celebration">🎉✨🏠</div>
            <h1>MISSION ACCOMPLISHED!</h1>
            <h2>${caseData.personalInfo.name} Found Safe</h2>
            <p>Community Power Brings Another Person Home</p>
        </div>
        
        <div class="content">
            <p><strong>🎊 Incredible news, community heroes!</strong></p>
            
            <div class="success-info">
                <h3>✅ Case Resolved Successfully</h3>
                <p><strong>Name:</strong> ${caseData.personalInfo.name}</p>
                <p><strong>Case Number:</strong> ${caseData.caseNumber}</p>
                <p><strong>Found Date:</strong> ${new Date(caseData.resolution?.foundDate || new Date()).toLocaleDateString()}</p>
                ${caseData.resolution?.condition ? `<p><strong>Condition:</strong> ${caseData.resolution.condition}</p>` : ''}
                ${caseData.resolution?.foundAddress ? `<p><strong>Found Location:</strong> ${caseData.resolution.foundAddress}</p>` : ''}
            </div>
            
            <p>🙏 <strong>Thank you to everyone who helped:</strong></p>
            <ul>
                <li>Community members who shared the alert</li>
                <li>Volunteers who reported sightings</li>
                <li>Local businesses who displayed flyers</li>
                <li>Everyone who kept their eyes open</li>
            </ul>
            
            <div style="background: #fef3c7; border: 1px solid #fcd34d; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #d97706;">🌟 Community Impact</h4>
                <p style="margin: 0;">This success story is proof that when communities come together, miracles happen. Your vigilance, compassion, and quick action made the difference between heartbreak and joy.</p>
            </div>
            
            <p><strong>Our Mission Continues...</strong><br>
            While we celebrate this victory, our work isn't done. There are still families waiting to be reunited. Stay engaged, stay vigilant, and continue being the heroes our community needs.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <p style="font-size: 18px; color: #16a34a;"><strong>Another family is whole again thanks to YOU! 💚</strong></p>
            </div>
            
            <p>With immense gratitude and pride,<br>
            <strong>The Missing Alert Team</strong><br>
            <em>Aayansh03 & Community</em></p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
            <p>🏠 Missing Alert System | Building safer communities together<br>
            Success notification sent: ${new Date().toISOString()}</p>
        </div>
    </body>
    </html>
    `;

    return await this.sendEmail(recipients, subject, htmlContent);
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  getServiceStats() {
    return {
      configured: this.isConfigured,
      service: 'NodeMailer with SMTP',
      host: process.env.SMTP_HOST || 'Not configured',
      port: process.env.SMTP_PORT || 'Not configured',
      secure: false,
      last_check: new Date().toISOString(),
      built_by: 'Aayansh03'
    };
  }
}

module.exports = new EmailService();