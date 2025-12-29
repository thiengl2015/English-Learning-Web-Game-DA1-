const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    console.log("Đang cấu hình Email Service với User:", process.env.EMAIL_USER);

    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      
      tls: {
        rejectUnauthorized: false
      }
    });

    this.transporter.verify((error, success) => {
      if (error) {
        console.error("Lỗi cấu hình Email:", error.message);
      } else {
        console.log("Server đã sẵn sàng gửi Email");
      }
    });
  }
  async sendPasswordResetOTP(email, otp, username) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: "Reset Your Password - English Learning",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .otp-code { background: #667eea; color: white; font-size: 32px; font-weight: bold; padding: 15px; text-align: center; border-radius: 8px; letter-spacing: 8px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Reset Your Password</h1>
              </div>
              <div class="content">
                <p>Hi <strong>${username}</strong>,</p>
                <p>We received a request to reset your password for your English Learning account.</p>
                <p>Your OTP code is:</p>
                <div class="otp-code">${otp}</div>
                <div class="warning">
                  <strong>⚠️ Important:</strong> This code will expire in <strong>10 minutes</strong>. 
                  Do not share this code with anyone.
                </div>
                <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
                <p>Best regards,<br>English Learning Team</p>
              </div>
              <div class="footer">
                <p>This is an automated email. Please do not reply.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Email sent:", info.messageId);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  async sendWelcomeEmail(email, username) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: "Welcome to English Learning! 🎉",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .bonus { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Welcome Aboard!</h1>
              </div>
              <div class="content">
                <p>Hi <strong>${username}</strong>,</p>
                <p>Welcome to <strong>English Learning</strong>! We're excited to have you join our community of language learners.</p>
                <div class="bonus">
                  <strong>🎁 Welcome Bonus:</strong> You've received <strong>100 Crystals</strong> to get started!
                </div>
                <p>Here's what you can do now:</p>
                <ul>
                  <li>🎮 Play interactive learning games</li>
                  <li>📚 Learn new vocabulary</li>
                  <li>🤖 Practice with AI chatbot</li>
                  <li>🏆 Complete daily tasks and earn rewards</li>
                </ul>
                <p>Ready to start learning?</p>
                <a href="#" class="cta-button">Start Learning Now</a>
                <p>If you have any questions, feel free to reach out to our support team.</p>
                <p>Happy learning!<br>English Learning Team</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error("Error sending welcome email:", error);
      return false;
    }
  }
}

module.exports = new EmailService();
