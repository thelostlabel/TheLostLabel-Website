
/**
 * Professional HTML Email Templates for LOST.
 * Optimized for dark mode and premium aesthetic.
 */

const baseStyles = `
    body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #000000 !important; color: #ffffff !important; -webkit-font-smoothing: antialiased; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #000000 !important; }
    .header { text-align: center; margin-bottom: 40px; }
    .logo { font-size: 28px; font-weight: 900; letter-spacing: 6px; color: #ffffff; text-decoration: none; }
    .card { background-color: #000000 !important; border: 1px solid #2a2a2a; border-radius: 24px; padding: 40px; text-align: center; }
    .title { font-size: 24px; font-weight: 900; letter-spacing: -0.02em; margin-bottom: 16px; color: #ffffff; text-transform: uppercase; }
    .highlight { color: #9ef01a; }
    .text { font-size: 15px; color: #d8d8d8; line-height: 1.6; margin-bottom: 30px; letter-spacing: 0.2px; }
    .button { display: inline-block; background-color: #9ef01a; color: #000000; padding: 18px 36px; border-radius: 14px; font-size: 13px; font-weight: 900; letter-spacing: 1px; text-decoration: none; text-transform: uppercase; transition: transform 0.2s; }
    .footer { text-align: center; margin-top: 40px; font-size: 11px; color: #c7c7c7; letter-spacing: 1px; }
    .footer a { color: #e2e2e2; text-decoration: none; }
    .divider { height: 1px; background-color: #2a2a2a; margin: 30px 0; }
`;

export function generateVerificationEmail(verificationLink) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>${baseStyles}</style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">LOST.</div>
                </div>
                <div class="card">
                    <h1 class="title">CONFIRM YOUR <span class="highlight">IDENTITY.</span></h1>
                    <p class="text">Welcome to the collective. To finalize your artist profile and access the dashboard, we need to verify your email address.</p>
                    <a href="${verificationLink}" class="button">CONFIRM EMAIL</a>
                    <div class="divider"></div>
                    <p class="text" style="font-size: 12px;">If the button doesn't work, copy and paste this link into your browser:<br/>
                    <span style="color: #bdbdbd; word-break: break-all;">${verificationLink}</span></p>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} THE LOST LABEL. ALL RIGHTS RESERVED.<br/>
                    <a href="https://thelostlabel.com">WWW.THELOSTLABEL.COM</a>
                </div>
            </div>
        </body>
        </html>
    `;
}

export function generatePasswordResetEmail(resetLink) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>${baseStyles}</style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">LOST.</div>
                </div>
                <div class="card">
                    <h1 class="title">RESET <span class="highlight">PASSWORD.</span></h1>
                    <p class="text">You requested to reset your password. Click the button below to secure your account and set a new one. This link expires in 1 hour.</p>
                    <a href="${resetLink}" class="button">RESET PASSWORD</a>
                    <div class="divider"></div>
                    <p class="text" style="font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} THE LOST LABEL. ALL RIGHTS RESERVED.<br/>
                    <a href="https://thelostlabel.com">WWW.THELOSTLABEL.COM</a>
                </div>
            </div>
        </body>
        </html>
    `;
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
                    <div class="logo">LOST.</div>
                </div>
                <div class="card">
                    <h1 class="title">CONGRATULATIONS, <span class="highlight">${artistName.toUpperCase()}.</span></h1>
                    <p class="text">We are excited to inform you that your demo <strong style="color: #fff;">"${trackTitle}"</strong> has been approved! We're ready to move forward with the next steps of your release.</p>
                    <div style="background: #090b07; border: 1px dashed #9ef01a; border-radius: 16px; padding: 20px; margin-bottom: 30px;">
                        <p style="margin: 0; font-size: 13px; color: #9ef01a; font-weight: 900; letter-spacing: 1px;">ACTION REQUIRED</p>
                        <p style="margin: 10px 0 0 0; font-size: 14px; color: #dfdfdf;">Log in to your dashboard to review the contract and finalize your release schedule.</p>
                    </div>
                    <a href="https://thelostlabel.com/dashboard" class="button">ENTER DASHBOARD</a>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} THE LOST LABEL. ALL RIGHTS RESERVED.<br/>
                    <a href="https://thelostlabel.com">WWW.THELOSTLABEL.COM</a>
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
                    <div class="logo">LOST.</div>
                </div>
                <div class="card">
                    <h1 class="title">NEW <span class="highlight">EARNINGS.</span></h1>
                    <p class="text">Hello ${artistName}, new revenue has been generated for your release <strong style="color: #fff;">"${trackTitle}"</strong> for the period of <strong style="color: #fff;">${period}</strong>.</p>
                    
                    <div style="font-size: 32px; font-weight: 900; color: #9ef01a; margin-bottom: 30px;">
                        $${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>

                    <a href="https://thelostlabel.com/dashboard" class="button">VIEW EARNINGS</a>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} THE LOST LABEL. ALL RIGHTS RESERVED.<br/>
                    <a href="https://thelostlabel.com">WWW.THELOSTLABEL.COM</a>
                </div>
            </div>
        </body>
        </html>
    `;
}
export function generateBroadcastEmail(artistName, subject, message) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="color-scheme" content="dark">
            <meta name="supported-color-schemes" content="dark">
            <style>${baseStyles}</style>
            <style>
                [data-ogsc] .force-black, [data-ogsb] .force-black { background-color: #000000 !important; color: #ffffff !important; }
                [data-ogsc] .force-card, [data-ogsb] .force-card { background-color: #000000 !important; border-color: #2a2a2a !important; }
            </style>
        </head>
        <body bgcolor="#000000" style="margin:0; padding:0; background-color:#000000 !important; color:#ffffff !important;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#000000" style="background-color:#000000 !important;">
                <tr>
                    <td align="center">
            <div class="container force-black" style="background-color:#000000 !important;">
                <div class="header">
                    <div class="logo">LOST.</div>
                </div>
                <div class="card force-card" style="background-color:#000000 !important; border:1px solid #2a2a2a !important;">
                    <h1 class="title">${subject.toUpperCase()}</h1>
                    <p class="text" style="color:#e6e6e6 !important;">Hello ${artistName},</p>
                    <div class="text" style="text-align: left; background: #0a0a0a; padding: 25px; border-radius: 16px; border: 1px solid #252525; color: #ffffff;">
                        ${message}
                    </div>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} THE LOST LABEL. ALL RIGHTS RESERVED.<br/>
                    <a href="https://thelostlabel.com">WWW.THELOSTLABEL.COM</a>
                </div>
            </div>
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
                    <div class="logo">LOST.</div>
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
                    <a href="https://thelostlabel.com/dashboard" class="button">BACK TO DASHBOARD</a>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} THE LOST LABEL. ALL RIGHTS RESERVED.<br/>
                    <a href="https://thelostlabel.com">WWW.THELOSTLABEL.COM</a>
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
                    <div class="logo">LOST.</div>
                </div>
                <div class="card">
                    <h1 class="title">DEMO <span class="highlight">RECEIVED.</span></h1>
                    <p class="text">Hello ${artistName}, we've successfully received your demo <strong style="color: #fff;">"${trackTitle}"</strong>. Our A&R team reviews every submission carefully.</p>
                    
                    <div style="background: #090b07; border: 1px dashed #9ef01a; border-radius: 16px; padding: 20px; margin-bottom: 30px;">
                        <p style="margin: 0; font-size: 14px; color: #dfdfdf;">Evaluation typically takes 3-7 business days. You will receive an email notification once a decision has been made.</p>
                    </div>

                    <p class="text">Thank you for choosing LOST. for your music.</p>
                    <a href="https://thelostlabel.com/dashboard" class="button">VIEW SUBMISSION</a>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} THE LOST LABEL. ALL RIGHTS RESERVED.<br/>
                    <a href="https://thelostlabel.com">WWW.THELOSTLABEL.COM</a>
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
                    <div class="logo">LOST.</div>
                </div>
                <div class="card">
                    <h1 class="title">NEW <span class="highlight">CONTRACT.</span></h1>
                    <p class="text">Hello ${artistName}, a new contract has been generated for your project <strong style="color: #fff;">"${releaseTitle}"</strong>.</p>
                    
                    <div style="background: #090b07; border: 1px dashed #9ef01a; border-radius: 16px; padding: 20px; margin-bottom: 30px;">
                        <p style="margin: 0; font-size: 13px; color: #9ef01a; font-weight: 900; letter-spacing: 1px;">ACTION REQUIRED</p>
                        <p style="margin: 10px 0 0 0; font-size: 14px; color: #dfdfdf;">Please log in to your dashboard to review the terms and finalize the partnership.</p>
                    </div>

                    <a href="https://thelostlabel.com/dashboard?view=contracts" class="button">REVIEW CONTRACT</a>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} THE LOST LABEL. ALL RIGHTS RESERVED.<br/>
                    <a href="https://thelostlabel.com">WWW.THELOSTLABEL.COM</a>
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
                    <div class="logo">LOST.</div>
                </div>
                <div class="card">
                    <h1 class="title">SUPPORT <span class="highlight">UPDATE.</span></h1>
                    <p class="text">Hello ${artistName}, you have received a new response regarding your <strong>${cleanType}</strong> request.</p>
                    
                    <div style="background: #0a0a0a; border: 1px solid #252525; border-radius: 16px; padding: 25px; margin-bottom: 30px; text-align: left;">
                        <p style="margin: 0; font-size: 11px; color: #8d8d8d; font-weight: 900; letter-spacing: 2px; margin-bottom: 10px;">MESSAGE</p>
                        <p style="margin: 0; font-size: 14px; color: #fff; line-height: 1.6;">${content}</p>
                    </div>

                    <p class="text">You can view the full history and reply through your dashboard.</p>
                    <a href="https://thelostlabel.com/dashboard?view=support" class="button">VIEW REQUEST</a>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} THE LOST LABEL. ALL RIGHTS RESERVED.<br/>
                    <a href="https://thelostlabel.com">WWW.THELOSTLABEL.COM</a>
                </div>
            </div>
        </body>
        </html>
    `;
}

export function generateSupportStatusEmail(artistName, type, status, adminNote) {
    const cleanType = type.toUpperCase().replace('_', ' ');
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
                    <div class="logo">LOST.</div>
                </div>
                <div class="card">
                    <h1 class="title">STATUS <span class="highlight">UPDATE.</span></h1>
                    <p class="text">Hello ${artistName}, your <strong>${cleanType}</strong> request status has been updated.</p>
                    
                    <div style="background: #0a0a0a; border: 1px solid #252525; border-radius: 16px; padding: 30px; margin-bottom: 30px; text-align: center;">
                        <p style="margin: 0; font-size: 11px; color: #8d8d8d; font-weight: 900; letter-spacing: 2px; margin-bottom: 10px;">NEW STATUS</p>
                        <div style="font-size: 24px; font-weight: 900; color: ${statusColor}; letter-spacing: 2px;">${status.toUpperCase()}</div>
                    </div>

                    ${adminNote ? `
                    <div style="background: #080808; border-left: 4px solid ${statusColor}; padding: 20px; margin-bottom: 30px; text-align: left;">
                        <p style="margin: 0; font-size: 11px; color: #8d8d8d; font-weight: 900; letter-spacing: 2px; margin-bottom: 8px;">ADMIN NOTE</p>
                        <p style="margin: 0; font-size: 14px; color: #e2e2e2; line-height: 1.6;">${adminNote}</p>
                    </div>
                    ` : ''}

                    <p class="text">Log in to the portal for more details.</p>
                    <a href="https://thelostlabel.com/dashboard?view=support" class="button">ENTER DASHBOARD</a>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} THE LOST LABEL. ALL RIGHTS RESERVED.<br/>
                    <a href="https://thelostlabel.com">WWW.THELOSTLABEL.COM</a>
                </div>
            </div>
        </body>
        </html>
    `;
}
