import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export async function sendMail({ to, subject, html }) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("⚠️ EMAIL_USER or EMAIL_PASS not set. Skipping email.");
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: `"LOST. A&R" <${process.env.EMAIL_USER}>`,
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
