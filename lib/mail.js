import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.turkticaret.net',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_PORT === '465' || !process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

export async function sendMail({ to, subject, html }) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("⚠️ SMTP_USER or SMTP_PASS not set. Skipping email.");
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: `"The Lost Label" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html
        });
        console.log("📧 Email sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("❌ Error sending email:", error);
    }
}
