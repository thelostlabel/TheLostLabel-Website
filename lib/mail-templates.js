
import fs from "fs";
import path from "path";

/**
 * Professional HTML Email Templates.
 * Optimized for dark mode and premium aesthetic.
 * Brand names are read from env variables (NEXT_PUBLIC_SITE_NAME, NEXT_PUBLIC_SITE_FULL_NAME).
 */

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "LOST";
const SITE_FULL_NAME = process.env.NEXT_PUBLIC_SITE_FULL_NAME || "THE LOST LABEL";
const SITE_URL = process.env.NEXTAUTH_URL || "https://thelostlabel.com";
const SITE_DOT_NAME = `${SITE_NAME}.`;
const SITE_URL_DISPLAY = SITE_URL.replace(/^https?:\/\//, "").toUpperCase();

const baseStyles = `
    body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6 !important; color: #111111 !important; -webkit-font-smoothing: antialiased; }
    .container { max-width: 640px; margin: 0 auto; padding: 32px 20px; }
    .header { text-align: center; margin-bottom: 24px; }
    .logo { font-size: 28px; font-weight: 800; letter-spacing: 8px; color: #111111; text-decoration: none; }
    .eyebrow { font-size: 11px; letter-spacing: 2px; color: #6b7280; text-transform: uppercase; margin-bottom: 14px; }
    .card { background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 20px; padding: 40px; text-align: center; box-shadow: 0 8px 30px rgba(17, 17, 17, 0.06); }
    .title { font-size: 30px; font-weight: 800; letter-spacing: -0.03em; margin: 0 0 16px 0; color: #111111; text-transform: uppercase; }
    .highlight { color: #6b7280; }
    .text { font-size: 16px; color: #4b5563; line-height: 1.7; margin: 0 0 28px 0; letter-spacing: 0; }
    .footer { text-align: center; margin-top: 18px; font-size: 11px; color: #6b7280; letter-spacing: 0.8px; }
    .footer a { color: #111111; text-decoration: none; }
    .divider { height: 1px; background-color: #e5e7eb; margin: 28px 0; }
`;

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}

function getEmbeddedLogoSrc() {
    try {
        const logoPath = path.join(process.cwd(), "logo.png");
        const logoBuffer = fs.readFileSync(logoPath);
        return `data:image/png;base64,${logoBuffer.toString("base64")}`;
    } catch {
        return null;
    }
}

const embeddedLogoSrc = getEmbeddedLogoSrc();

const primaryButtonStyle = [
    "display:inline-block",
    "background:#111111",
    "color:#ffffff !important",
    "border:1px solid #111111",
    "border-radius:12px",
    "padding:16px 28px",
    "font-size:12px",
    "font-weight:800",
    "letter-spacing:1.6px",
    "text-decoration:none",
    "text-transform:uppercase",
    "font-family:Helvetica Neue, Arial, sans-serif",
].join("; ");

const mutedLinkStyle = [
    "color:#6b7280",
    "text-decoration:none",
    "word-break:break-all",
].join("; ");

function renderAuthEmail({ eyebrow, title, body, ctaLabel, ctaLink, footerNote = "" }) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>${baseStyles}</style>
        </head>
        <body style="margin:0; padding:0; background:#f3f4f6; color:#111111;">
            <div class="container">
                <div class="header">
                    ${embeddedLogoSrc
            ? `<img src="${embeddedLogoSrc}" alt="${SITE_DOT_NAME}" style="width:72px; height:72px; object-fit:contain; display:block; margin:0 auto 14px auto;" />`
            : ""}
                    <div class="logo">${SITE_DOT_NAME}</div>
                </div>
                <div class="card">
                    <div class="eyebrow">${eyebrow}</div>
                    <h1 class="title">${title}</h1>
                    ${body}
                    ${ctaLink && ctaLabel ? `<a href="${ctaLink}" style="${primaryButtonStyle}">${ctaLabel}</a>` : ""}
                    ${footerNote ? `<div class="divider"></div>${footerNote}` : ""}
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} ${SITE_FULL_NAME}. ALL RIGHTS RESERVED.<br/>
                    <a href="${SITE_URL}">thelostlabel.com</a>
                </div>
            </div>
        </body>
        </html>
    `;
}

export function generateVerificationEmail(verificationLink) {
    return renderAuthEmail({
        eyebrow: "Email verification",
        title: `Confirm Your <span class="highlight">Identity</span>`,
        body: `<p class="text">Welcome to ${SITE_DOT_NAME} Please verify your email address to activate your account and continue to the dashboard.</p>`,
        ctaLabel: "Confirm Email",
        ctaLink: verificationLink,
        footerNote: `<p class="text" style="font-size:13px; margin-bottom:0;">If the button does not work, open this link in your browser.</p><p style="margin:12px 0 0 0; font-size:13px; line-height:1.7;"><a href="${verificationLink}" style="${mutedLinkStyle}">${verificationLink}</a></p>`,
    });
}

/**
 * @param {string} loginLink
 * @param {string | null | undefined} verificationLink
 */
export function generateAccountApprovalEmail(loginLink, verificationLink = null) {
    if (verificationLink) {
        return renderAuthEmail({
            eyebrow: "Application approved",
            title: `Your Account Is <span class="highlight">Approved</span>`,
            body: `<p class="text">Your application to join ${SITE_DOT_NAME} has been approved. Before you sign in, please complete email verification.</p>`,
            ctaLabel: "Verify Email",
            ctaLink: verificationLink,
            footerNote: `<p class="text" style="font-size:13px; margin-bottom:0;">If the button does not work, open this link in your browser.</p><p style="margin:12px 0 0 0; font-size:13px; line-height:1.7;"><a href="${verificationLink}" style="${mutedLinkStyle}">${verificationLink}</a></p>`,
        });
    }

    return renderAuthEmail({
        eyebrow: "Application approved",
        title: `Your Account Is <span class="highlight">Ready</span>`,
        body: `<p class="text">Your application to join ${SITE_DOT_NAME} has been approved. You can now sign in and access your dashboard.</p>`,
        ctaLabel: "Sign In",
        ctaLink: loginLink,
    });
}

export function generatePasswordResetEmail(resetLink) {
    return renderAuthEmail({
        eyebrow: "Password reset",
        title: `Reset <span class="highlight">Password</span>`,
        body: `<p class="text">We received a request to reset your password. This link expires in 1 hour.</p>`,
        ctaLabel: "Reset Password",
        ctaLink: resetLink,
        footerNote: `<p class="text" style="font-size:13px; margin-bottom:0;">If you did not request this, you can ignore this email.</p>`,
    });
}
export function generateDemoApprovalEmail(artistName, trackTitle) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>${baseStyles}</style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">${SITE_DOT_NAME}</div>
                </div>
                <div class="card">
                    <h1 class="title">CONGRATULATIONS, <span class="highlight">${artistName.toUpperCase()}.</span></h1>
                    <p class="text">We are excited to inform you that your demo <strong style="color: #fff;">"${trackTitle}"</strong> has been approved! We're ready to move forward with the next steps of your release.</p>
                    <div style="background: #090b07; border: 1px dashed #9ef01a; border-radius: 16px; padding: 20px; margin-bottom: 30px;">
                        <p style="margin: 0; font-size: 13px; color: #9ef01a; font-weight: 900; letter-spacing: 1px;">ACTION REQUIRED</p>
                        <p style="margin: 10px 0 0 0; font-size: 14px; color: #dfdfdf;">Log in to your dashboard to review the contract and finalize your release schedule.</p>
                    </div>
                    <a href="${SITE_URL}/dashboard" class="button">ENTER DASHBOARD</a>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} ${SITE_FULL_NAME}. ALL RIGHTS RESERVED.<br/>
                    <a href="${SITE_URL}">WWW.${SITE_URL_DISPLAY}</a>
                </div>
            </div>
        </body>
        </html>
    `;
}

export function generateEarningsNotificationEmail(artistName, trackTitle, amount, period) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>${baseStyles}</style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">${SITE_DOT_NAME}</div>
                </div>
                <div class="card">
                    <h1 class="title">NEW <span class="highlight">EARNINGS.</span></h1>
                    <p class="text">Hello ${artistName}, new revenue has been generated for your release <strong style="color: #fff;">"${trackTitle}"</strong> for the period of <strong style="color: #fff;">${period}</strong>.</p>
                    
                    <div style="font-size: 32px; font-weight: 900; color: #9ef01a; margin-bottom: 30px;">
                        $${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>

                    <a href="${SITE_URL}/dashboard" class="button">VIEW EARNINGS</a>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} ${SITE_FULL_NAME}. ALL RIGHTS RESERVED.<br/>
                    <a href="${SITE_URL}">WWW.${SITE_URL_DISPLAY}</a>
                </div>
            </div>
        </body>
        </html>
    `;
}
export function generateBroadcastEmail(artistName, subject, message) {
    const safeSubject = String(subject || '').toUpperCase();
    const safeArtistName = String(artistName || 'Artist');
    const safeMessage = String(message || '');
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <meta name="color-scheme" content="dark">
            <meta name="supported-color-schemes" content="dark">
            <style>${baseStyles}</style>
            <style>
                [data-ogsc] .force-black, [data-ogsb] .force-black { background-color: #000000 !important; color: #ffffff !important; }
                [data-ogsc] .force-card, [data-ogsb] .force-card { background-color: #000000 !important; border-color: #2a2a2a !important; }
                [data-ogsc] .force-text, [data-ogsb] .force-text { color: #e6e6e6 !important; }
            </style>
        </head>
        <body bgcolor="#000000" style="margin:0; padding:0; background-color:#000000 !important; color:#ffffff !important;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#000000" style="background-color:#000000 !important;">
                <tr>
                    <td align="center">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#000000 !important;">
                            <tr>
                                <td align="center" style="padding:40px 20px 24px 20px;background:#000000 !important;">
                                    <div style="font-size:40px;line-height:1;font-weight:900;letter-spacing:6px;color:#ffffff !important;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${SITE_DOT_NAME}</div>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:0 20px;background:#000000 !important;">
                                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="force-card" style="background:#000000 !important;border:1px solid #2a2a2a;border-radius:24px;">
                                        <tr>
                                            <td align="center" style="padding:40px 30px 20px 30px;">
                                                <h1 style="margin:0 0 16px 0;font-size:24px;line-height:1.25;font-weight:900;letter-spacing:-0.02em;text-transform:uppercase;color:#ffffff !important;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${safeSubject}</h1>
                                                <p class="force-text" style="margin:0 0 24px 0;font-size:15px;line-height:1.6;font-weight:600;color:#e6e6e6 !important;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Hello ${safeArtistName},</p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding:0 30px 36px 30px;">
                                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0a0a !important;border:1px solid #252525;border-radius:16px;">
                                                    <tr>
                                                        <td class="force-text" style="padding:20px 20px;font-size:15px;line-height:1.65;font-weight:600;color:#ffffff !important;text-align:left;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;word-break:break-word;">
                                                            ${safeMessage}
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding:30px 20px 40px 20px;background:#000000 !important;font-size:11px;line-height:1.5;letter-spacing:1px;color:#c7c7c7 !important;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                                    &copy; ${new Date().getFullYear()} ${SITE_FULL_NAME}. ALL RIGHTS RESERVED.<br/>
                                    <a href="${SITE_URL}" style="color:#e2e2e2 !important;text-decoration:none;">WWW.${SITE_URL_DISPLAY}</a>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;
}

export function generateDemoRejectionEmail(artistName, trackTitle, reason) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>${baseStyles}</style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">${SITE_DOT_NAME}</div>
                </div>
                <div class="card">
                    <h1 class="title">STATUS UPDATE: <span class="highlight">DEMO.</span></h1>
                    <p class="text">Hello ${artistName}, thank you for sharing <strong style="color: #fff;">"${trackTitle}"</strong> with us. After careful consideration, we've decided not to move forward with this particular track at this time.</p>
                    
                    ${reason ? `
                    <div style="background: #120707; border: 1px dashed #ff4444; border-radius: 16px; padding: 20px; margin-bottom: 30px; text-align: left;">
                        <p style="margin: 0; font-size: 13px; color: #ff4444; font-weight: 900; letter-spacing: 1px;">FEEDBACK</p>
                        <p style="margin: 10px 0 0 0; font-size: 14px; color: #dfdfdf; line-height: 1.5;">${reason}</p>
                    </div>
                    ` : ''}

                    <p class="text">Don't be discouraged—our selection process is highly specific to our current release schedule. We encourage you to keep polishing your sound and submit more music in the future.</p>
                    <a href="${SITE_URL}/dashboard" class="button">BACK TO DASHBOARD</a>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} ${SITE_FULL_NAME}. ALL RIGHTS RESERVED.<br/>
                    <a href="${SITE_URL}">WWW.${SITE_URL_DISPLAY}</a>
                </div>
            </div>
        </body>
        </html>
    `;
}

export function generateDemoReceivedEmail(artistName, trackTitle) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>${baseStyles}</style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">${SITE_DOT_NAME}</div>
                </div>
                <div class="card">
                    <h1 class="title">DEMO <span class="highlight">RECEIVED.</span></h1>
                    <p class="text">Hello ${artistName}, we've successfully received your demo <strong style="color: #fff;">"${trackTitle}"</strong>. Our A&R team reviews every submission carefully.</p>
                    
                    <div style="background: #090b07; border: 1px dashed #9ef01a; border-radius: 16px; padding: 20px; margin-bottom: 30px;">
                        <p style="margin: 0; font-size: 14px; color: #dfdfdf;">Evaluation typically takes 3-7 business days. You will receive an email notification once a decision has been made.</p>
                    </div>

                    <p class="text">Thank you for choosing ${SITE_DOT_NAME} for your music.</p>
                    <a href="${SITE_URL}/dashboard" class="button">VIEW SUBMISSION</a>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} ${SITE_FULL_NAME}. ALL RIGHTS RESERVED.<br/>
                    <a href="${SITE_URL}">WWW.${SITE_URL_DISPLAY}</a>
                </div>
            </div>
        </body>
        </html>
    `;
}

export function generateContractCreatedEmail(artistName, releaseTitle) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>${baseStyles}</style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">${SITE_DOT_NAME}</div>
                </div>
                <div class="card">
                    <h1 class="title">NEW <span class="highlight">CONTRACT.</span></h1>
                    <p class="text">Hello ${artistName}, a new contract has been generated for your project <strong style="color: #fff;">"${releaseTitle}"</strong>.</p>
                    
                    <div style="background: #090b07; border: 1px dashed #9ef01a; border-radius: 16px; padding: 20px; margin-bottom: 30px;">
                        <p style="margin: 0; font-size: 13px; color: #9ef01a; font-weight: 900; letter-spacing: 1px;">ACTION REQUIRED</p>
                        <p style="margin: 10px 0 0 0; font-size: 14px; color: #dfdfdf;">Please log in to your dashboard to review the terms and finalize the partnership.</p>
                    </div>

                    <a href="${SITE_URL}/dashboard?view=contracts" class="button">REVIEW CONTRACT</a>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} ${SITE_FULL_NAME}. ALL RIGHTS RESERVED.<br/>
                    <a href="${SITE_URL}">WWW.${SITE_URL_DISPLAY}</a>
                </div>
            </div>
        </body>
        </html>
    `;
}
export function generateSupportUpdateEmail(artistName, requestId, type, content) {
    const cleanType = type.toUpperCase().replace('_', ' ');
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>${baseStyles}</style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">${SITE_DOT_NAME}</div>
                </div>
                <div class="card">
                    <h1 class="title">SUPPORT <span class="highlight">UPDATE.</span></h1>
                    <p class="text">Hello ${artistName}, you have received a new response regarding your <strong>${cleanType}</strong> request.</p>
                    
                    <div style="background: #0a0a0a; border: 1px solid #252525; border-radius: 16px; padding: 25px; margin-bottom: 30px; text-align: left;">
                        <p style="margin: 0; font-size: 11px; color: #8d8d8d; font-weight: 900; letter-spacing: 2px; margin-bottom: 10px;">MESSAGE</p>
                        <p style="margin: 0; font-size: 14px; color: #fff; line-height: 1.6;">${content}</p>
                    </div>

                    <p class="text">You can view the full history and reply through your dashboard.</p>
                    <a href="${SITE_URL}/dashboard?view=support" class="button">VIEW REQUEST</a>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} ${SITE_FULL_NAME}. ALL RIGHTS RESERVED.<br/>
                    <a href="${SITE_URL}">WWW.${SITE_URL_DISPLAY}</a>
                </div>
            </div>
        </body>
        </html>
    `;
}

export function generateSupportStatusEmail(artistName, type, status, adminNote) {
    const safeArtistName = escapeHtml(artistName || 'Artist');
    const cleanType = escapeHtml(String(type || '').toUpperCase().replace(/_/g, ' '));
    const safeStatus = escapeHtml(String(status || '').toUpperCase());
    const safeAdminNote = escapeHtml(adminNote || '').replace(/\n/g, '<br>');
    const statusColor = (status === 'approved' || status === 'completed') ? '#9ef01a' :
        (status === 'rejected') ? '#ff4444' : '#ffaa00';

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>${baseStyles}</style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">${SITE_DOT_NAME}</div>
                </div>
                <div class="card">
                    <h1 class="title">STATUS <span class="highlight">UPDATE.</span></h1>
                    <p class="text">Hello ${safeArtistName}, your <strong>${cleanType}</strong> request status has been updated.</p>
                    
                    <div style="background: #0a0a0a; border: 1px solid #252525; border-radius: 16px; padding: 30px; margin-bottom: 30px; text-align: center;">
                        <p style="margin: 0; font-size: 11px; color: #8d8d8d; font-weight: 900; letter-spacing: 2px; margin-bottom: 10px;">NEW STATUS</p>
                        <div style="font-size: 24px; font-weight: 900; color: ${statusColor}; letter-spacing: 2px;">${safeStatus}</div>
                    </div>

                    ${safeAdminNote ? `
                    <div style="background: #080808; border-left: 4px solid ${statusColor}; padding: 20px; margin-bottom: 30px; text-align: left;">
                        <p style="margin: 0; font-size: 11px; color: #8d8d8d; font-weight: 900; letter-spacing: 2px; margin-bottom: 8px;">ADMIN NOTE</p>
                        <p style="margin: 0; font-size: 14px; color: #e2e2e2; line-height: 1.6;">${safeAdminNote}</p>
                    </div>
                    ` : ''}

                    <p class="text">Log in to the portal for more details.</p>
                    <a href="${SITE_URL}/dashboard?view=support" class="button">ENTER DASHBOARD</a>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} ${SITE_FULL_NAME}. ALL RIGHTS RESERVED.<br/>
                    <a href="${SITE_URL}">WWW.${SITE_URL_DISPLAY}</a>
                </div>
            </div>
        </body>
        </html>
    `;
}

export function generatePayoutStatusEmail(artistName, amount, status, adminNote) {
    const normalizedStatus = status === 'completed' ? 'APPROVED' : (status === 'failed' ? 'REJECTED' : status.toUpperCase());
    const statusColor = status === 'completed' ? '#9ef01a' : (status === 'failed' ? '#ff4444' : '#ffaa00');
    const safeName = escapeHtml(artistName || 'Artist');
    const safeNote = escapeHtml(adminNote || '').replace(/\n/g, '<br>');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>${baseStyles}</style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">${SITE_DOT_NAME}</div>
                </div>
                <div class="card">
                    <h1 class="title">PAYOUT <span class="highlight">UPDATE.</span></h1>
                    <p class="text">Hello ${safeName}, your withdrawal request has been reviewed by our team.</p>

                    <div style="background: #0a0a0a; border: 1px solid #252525; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
                        <p style="margin: 0 0 8px 0; font-size: 11px; color: #8d8d8d; font-weight: 900; letter-spacing: 2px;">REQUESTED AMOUNT</p>
                        <p style="margin: 0; font-size: 28px; color: #ffffff; font-weight: 900;">$${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>

                    <div style="background: #080808; border-left: 4px solid ${statusColor}; padding: 18px; margin-bottom: 24px; text-align: left;">
                        <p style="margin: 0 0 6px 0; font-size: 11px; color: #8d8d8d; font-weight: 900; letter-spacing: 2px;">DECISION</p>
                        <p style="margin: 0; font-size: 16px; color: ${statusColor}; font-weight: 900; letter-spacing: 1px;">${normalizedStatus}</p>
                    </div>

                    ${safeNote ? `
                    <div style="background: #080808; border: 1px solid #252525; border-radius: 12px; padding: 18px; margin-bottom: 24px; text-align: left;">
                        <p style="margin: 0 0 8px 0; font-size: 11px; color: #8d8d8d; font-weight: 900; letter-spacing: 2px;">ADMIN NOTE</p>
                        <p style="margin: 0; font-size: 14px; color: #e2e2e2; line-height: 1.6;">${safeNote}</p>
                    </div>
                    ` : ''}

                    <a href="${SITE_URL}/dashboard?view=my-earnings" class="button">VIEW PAYOUTS</a>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} ${SITE_FULL_NAME}. ALL RIGHTS RESERVED.<br/>
                    <a href="${SITE_URL}">WWW.${SITE_URL_DISPLAY}</a>
                </div>
            </div>
        </body>
        </html>
    `;
}
