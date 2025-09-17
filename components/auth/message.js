import transporter from "@/lib/transporter"
export async function sendmessage(email, name) {
      const mailOptions = {
  from: `"Flowline" <${process.env.EMAIL_ADMIN}>`,
  to: email,
  subject: 'Welcome to Flowline!',
  text: `Hi ${name || 'friend'}, welcome to Flowline!`,
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #4f46e5;">Hi ${name || 'friend'}, 👋</h2>
      
      <p>Welcome to <strong>Flowline</strong> — your new space to share thoughts, connect with people, and discover what’s happening.</p>
      
      <p>Here’s what you can do right away:</p>
      <ul>
        <li>✍️ Create your first post and share what’s on your mind.</li>
        <li>🤝 Connect with others who share your interests.</li>
        <li>🔔 Stay updated with the latest conversations.</li>
      </ul>

      <p>We’re excited to see the stories you’ll share and the connections you’ll make.</p>

      <p>Cheers,<br><strong>The Flowline Team</strong></p>

      <hr style="margin-top:20px; border:none; border-top:1px solid #ddd;" />
      <p style="font-size:12px; color:#888;">You’re receiving this email because you signed up for Flowline.</p>
    </div>
  `,
};

        try {
          await transporter.sendMail(mailOptions);
          console.log('Email notification sent');
        } catch (error) {
            console.error('Failed to send email:', error);
        }
}
export async function sendcode(email, code) {
  const mailOptions = {
    from: `"Flowline" <${process.env.EMAIL_ADMIN}>`,
    to: email,
    subject: 'Your Password Reset Code',
    text: `Your password reset code is: ${code}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #4f46e5;">Hi there,</h2>
        <p>Your password reset code is: <strong>${code}</strong></p>
        <p>Please use this code to reset your password.</p>
        <p>Cheers,<br><strong>The Flowline Team</strong></p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email notification sent');
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}