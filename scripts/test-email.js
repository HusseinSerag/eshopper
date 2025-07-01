require('dotenv').config();
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

// Test configuration - replace with your actual values
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  user: process.env.EMAIL_USER || 'husseinserag2014@gmail.com',
  pass: process.env.EMAIL_PASS || 'mjdx oerl arjg bpew',
  from: process.env.EMAIL_FROM || 'husseinserag2014@gmail.com',
  fromName: process.env.EMAIL_FROM_NAME || 'eShopper',
  service: process.env.EMAIL_SERVICE || 'gmail',
};

console.log('Testing email configuration:', {
  host: emailConfig.host,
  port: emailConfig.port,
  user: emailConfig.user,
  from: emailConfig.from,
  fromName: emailConfig.fromName,
});

async function testEmailSending() {
  try {
    // 1. Test SMTP connection
    console.log('\n1. Testing SMTP connection...');
    const transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.port === 465,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass,
      },
      service: emailConfig.service,
    });

    await transporter.verify();
    console.log('✅ SMTP connection successful');

    // 2. Test template loading
    console.log('\n2. Testing template loading...');
    // Test both possible template paths
    const assetsTemplatesDir = path.join(
      __dirname,
      '..',
      'apps',
      'notification-service',
      'assets',
      'templates',
      'emails'
    );
    const srcTemplatesDir = path.join(
      __dirname,
      '..',
      'apps',
      'notification-service',
      'src',
      'templates',
      'emails'
    );
    const distTemplatesDir = path.join(
      __dirname,
      '..',
      'dist',
      'apps',
      'notification-service',
      'templates',
      'emails'
    );

    console.log('Assets templates directory:', assetsTemplatesDir);
    console.log('Src templates directory:', srcTemplatesDir);
    console.log('Dist templates directory:', distTemplatesDir);

    console.log(
      'Assets OTP template exists:',
      fs.existsSync(path.join(assetsTemplatesDir, 'otp-verification.ejs'))
    );
    console.log(
      'Assets Welcome template exists:',
      fs.existsSync(path.join(assetsTemplatesDir, 'welcome.ejs'))
    );
    console.log(
      'Src OTP template exists:',
      fs.existsSync(path.join(srcTemplatesDir, 'otp-verification.ejs'))
    );
    console.log(
      'Src Welcome template exists:',
      fs.existsSync(path.join(srcTemplatesDir, 'welcome.ejs'))
    );
    console.log(
      'Dist OTP template exists:',
      fs.existsSync(path.join(distTemplatesDir, 'otp-verification.ejs'))
    );
    console.log(
      'Dist Welcome template exists:',
      fs.existsSync(path.join(distTemplatesDir, 'welcome.ejs'))
    );

    // Use the assets path since that's where the templates actually are
    const otpTemplatePath = path.join(
      assetsTemplatesDir,
      'otp-verification.ejs'
    );
    const welcomeTemplatePath = path.join(assetsTemplatesDir, 'welcome.ejs');

    if (!fs.existsSync(otpTemplatePath)) {
      throw new Error('OTP template not found in assets directory');
    }

    // 3. Test template compilation
    console.log('\n3. Testing template compilation...');
    const templateContent = fs.readFileSync(otpTemplatePath, 'utf-8');
    const html = ejs.render(templateContent, {
      otp: '123456',
      userName: 'Test User',
      appName: 'eShopper',
      supportEmail: emailConfig.from,
    });
    console.log('✅ Template compiled successfully');
    console.log('HTML length:', html.length);

    // 4. Test email sending (only if you provide a real email)
    const testEmail = 'husseinserag2014@gmail.com';
    if (testEmail) {
      console.log('\n4. Testing email sending...');
      const mailOptions = {
        from: `"${emailConfig.fromName}" <${emailConfig.from}>`,
        to: testEmail,
        subject: 'Test Email - eShopper',
        html: html,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully');
      console.log('Message ID:', info.messageId);
    } else {
      console.log(
        '\n4. Skipping email sending (set TEST_EMAIL env var to test)'
      );
    }

    // 5. Test with different SMTP settings
    console.log('\n5. Testing alternative SMTP settings...');

    // Test with secure: false for port 587
    if (emailConfig.port === 587) {
      console.log('Testing with secure: false for port 587...');
      const transporter2 = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: false,
        auth: {
          user: emailConfig.user,
          pass: emailConfig.pass,
        },
      });

      await transporter2.verify();
      console.log('✅ Alternative SMTP settings work');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);

    // Common Gmail issues
    if (error.code === 'EAUTH') {
      console.log('\n💡 Gmail Authentication Tips:');
      console.log(
        "1. Make sure you're using an App Password, not your regular password"
      );
      console.log('2. Enable 2-factor authentication on your Google account');
      console.log(
        '3. Generate an App Password: https://myaccount.google.com/apppasswords'
      );
    }

    if (error.code === 'ECONNECTION') {
      console.log('\n💡 Connection Tips:');
      console.log('1. Check if your firewall is blocking the connection');
      console.log('2. Try different ports: 587 (TLS) or 465 (SSL)');
      console.log('3. Make sure the SMTP host is correct');
    }
  }
}

// Run the test
testEmailSending();
