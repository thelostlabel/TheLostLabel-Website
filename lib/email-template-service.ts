import prisma from "@/lib/prisma";
import {
    generateVerificationEmail,
    generateAccountApprovalEmail,
    generatePasswordResetEmail,
    generateDemoApprovalEmail,
    generateDemoRejectionEmail,
    generateDemoReceivedEmail,
    generateEarningsNotificationEmail,
    generateBroadcastEmail,
    generateContractCreatedEmail,
    generateSupportUpdateEmail,
    generateSupportStatusEmail,
    generatePayoutStatusEmail,
} from "@/lib/mail-templates";

// ---------------------------------------------------------------------------
// Hardcoded fallback registry
// ---------------------------------------------------------------------------

type HardcodedTemplate = {
    name: string;
    subject: string;
    body: string;
    variables: string[];
};

function getHardcodedTemplates(): Record<string, HardcodedTemplate> {
    return {
        verification: {
            name: "Email Verification",
            subject: "Verify Your Email",
            body: generateVerificationEmail("{{verificationLink}}"),
            variables: ["verificationLink"],
        },
        "account-approval": {
            name: "Account Approval",
            subject: "Your Account Has Been Approved",
            body: generateAccountApprovalEmail("{{loginLink}}"),
            variables: ["loginLink"],
        },
        "account-approval-with-verification": {
            name: "Account Approval (Needs Verification)",
            subject: "Your Account Has Been Approved - Verify Email",
            body: generateAccountApprovalEmail("{{loginLink}}", "{{verificationLink}}"),
            variables: ["loginLink", "verificationLink"],
        },
        "password-reset": {
            name: "Password Reset",
            subject: "Reset Your Password",
            body: generatePasswordResetEmail("{{resetLink}}"),
            variables: ["resetLink"],
        },
        "demo-approval": {
            name: "Demo Approved",
            subject: "Your Demo Has Been Approved!",
            body: generateDemoApprovalEmail("{{artistName}}", "{{trackTitle}}"),
            variables: ["artistName", "trackTitle"],
        },
        "demo-rejection": {
            name: "Demo Rejected",
            subject: "Demo Status Update",
            body: generateDemoRejectionEmail("{{artistName}}", "{{trackTitle}}", "{{reason}}"),
            variables: ["artistName", "trackTitle", "reason"],
        },
        "demo-received": {
            name: "Demo Received",
            subject: "We Received Your Demo",
            body: generateDemoReceivedEmail("{{artistName}}", "{{trackTitle}}"),
            variables: ["artistName", "trackTitle"],
        },
        "earnings-notification": {
            name: "Earnings Notification",
            subject: "New Earnings Available",
            body: generateEarningsNotificationEmail("{{artistName}}", "{{trackTitle}}", "{{amount}}", "{{period}}"),
            variables: ["artistName", "trackTitle", "amount", "period"],
        },
        broadcast: {
            name: "Broadcast Email",
            subject: "{{subject}}",
            body: generateBroadcastEmail("{{artistName}}", "{{subject}}", "{{message}}"),
            variables: ["artistName", "subject", "message"],
        },
        "contract-created": {
            name: "Contract Created",
            subject: "New Contract Available",
            body: generateContractCreatedEmail("{{artistName}}", "{{releaseTitle}}"),
            variables: ["artistName", "releaseTitle"],
        },
        "support-update": {
            name: "Support Update",
            subject: "Support Request Update",
            body: generateSupportUpdateEmail("{{artistName}}", "{{requestId}}", "{{type}}", "{{content}}"),
            variables: ["artistName", "requestId", "type", "content"],
        },
        "support-status": {
            name: "Support Status Change",
            subject: "Support Request Status Updated",
            body: generateSupportStatusEmail("{{artistName}}", "{{type}}", "{{status}}", "{{adminNote}}"),
            variables: ["artistName", "type", "status", "adminNote"],
        },
        "payout-status": {
            name: "Payout Status",
            subject: "Payout Request Update",
            body: generatePayoutStatusEmail("{{artistName}}", "{{amount}}", "{{status}}", "{{adminNote}}"),
            variables: ["artistName", "amount", "status", "adminNote"],
        },
    };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get a template by slug. Checks the database first; falls back to the
 * hardcoded template from mail-templates.js when not found or inactive.
 */
export async function getEmailTemplate(
    slug: string,
): Promise<{ subject: string; body: string } | null> {
    try {
        const dbTemplate = await prisma.emailTemplate.findUnique({
            where: { slug },
        });

        if (dbTemplate && dbTemplate.active) {
            return { subject: dbTemplate.subject, body: dbTemplate.body };
        }
    } catch (error) {
        console.error(`[email-template-service] DB lookup failed for "${slug}":`, error);
    }

    // Fallback to hardcoded
    const hardcoded = getHardcodedTemplates()[slug];
    if (hardcoded) {
        return { subject: hardcoded.subject, body: hardcoded.body };
    }

    return null;
}

/**
 * Render a template by replacing `{{variableName}}` placeholders with the
 * provided values in both subject and body.
 */
export async function renderEmailTemplate(
    slug: string,
    variables: Record<string, string>,
): Promise<{ subject: string; body: string } | null> {
    const template = await getEmailTemplate(slug);
    if (!template) return null;

    const replaceVars = (text: string): string => {
        return text.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
            return variables[key] !== undefined ? variables[key] : `{{${key}}}`;
        });
    };

    return {
        subject: replaceVars(template.subject),
        body: replaceVars(template.body),
    };
}

/**
 * Seed default email templates from the hardcoded ones. Skips any slug
 * that already exists in the database.
 */
export async function seedDefaultTemplates(): Promise<void> {
    const hardcoded = getHardcodedTemplates();

    for (const [slug, template] of Object.entries(hardcoded)) {
        const existing = await prisma.emailTemplate.findUnique({
            where: { slug },
        });

        if (!existing) {
            await prisma.emailTemplate.create({
                data: {
                    slug,
                    name: template.name,
                    subject: template.subject,
                    body: template.body,
                    variables: JSON.stringify(template.variables),
                    active: true,
                },
            });
        }
    }
}
