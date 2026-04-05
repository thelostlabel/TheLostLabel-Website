/**
 * Seed a new tenant database with default data.
 * Called by create-tenant.sh after running migrations.
 *
 * Usage: DATABASE_URL=... npx tsx scripts/seed-tenant.ts <slug>
 */

import { PrismaClient } from "@prisma/client";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: npx tsx scripts/seed-tenant.ts <slug>");
  process.exit(1);
}

const SLUG_UPPER = slug.toUpperCase();

const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding tenant database for "${slug}"...`);

  // 1. SystemSettings with feature flags and branding
  const defaultConfig = {
    genres: ["Hip-Hop", "R&B", "Pop", "Electronic", "Phonk", "Other"],
    siteName: `${SLUG_UPPER} MUSIC`,
    heroText: "THE NEW ORDER",
    heroSubText: "INDEPENDENT DISTRIBUTION REDEFINED.",
    featuredReleaseId: null,
    featuredReleaseLabel: "FEATURED RELEASE",
    featuredReleaseSubLabel: "NOW STREAMING",
    featuredReleaseStatus: "Featured",
    discord: "",
    instagram: "",
    spotify: "",
    youtube: "",
    twitter: "",
    facebook: "",
    showStats: true,
    registrationsOpen: true,
    maintenanceMode: false,
    joinHeroTitle: `WORK WITH ${SLUG_UPPER}.`,
    joinHeroSub: "A&R UNIT // UNRELEASED DEMOS & RELEASED TRACKS",
    allowCoverArt: true,
    allowAudio: true,
    allowDelete: true,
    allowOther: true,
    adminEmail: "",
    defaultPlaylistId: "",
    // Feature flags
    featureSubmissions: true,
    featureContracts: true,
    featureEarnings: true,
    featurePayments: true,
    featureReleases: true,
    featureCommunications: true,
    featureDiscordBridge: false,
    featureWisePayouts: false,
    featureSpotifySync: true,
    featureInvoices: true,
    featureAnnouncements: true,
    // Branding
    brandingShortName: SLUG_UPPER,
    brandingFullName: `THE ${SLUG_UPPER} LABEL`,
    brandingDotName: `${SLUG_UPPER}.`,
    brandingPrimaryColor: "#ffffff",
    brandingLogoUrl: "",
    brandingSupportEmail: "",
  };

  await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      config: JSON.stringify(defaultConfig),
    },
  });
  console.log("  ✓ SystemSettings seeded");

  // 2. Default site content
  const defaultContent = [
    { key: "faq", title: "FAQ", content: "[]" },
    { key: "join_genres", title: "Accepted Genres", content: "[]" },
    { key: "join_commissions", title: "Commission Table", content: "[]" },
    { key: "terms", title: "Terms of Service", content: "" },
    { key: "privacy", title: "Privacy Policy", content: "" },
    { key: "commission_rules", title: "Commission Rules", content: "" },
    { key: "home_services", title: "Services", content: "[]" },
    { key: "home_stats", title: "Stats", content: "[]" },
    { key: "home_partners", title: "Partners", content: "[]" },
    { key: "footer_links", title: "Footer Links", content: "[]" },
  ];

  for (const item of defaultContent) {
    await prisma.siteContent.upsert({
      where: { key: item.key },
      update: {},
      create: item,
    });
  }
  console.log("  ✓ SiteContent seeded");

  // 3. Default email templates
  const defaultTemplates = [
    {
      slug: "account-approved",
      name: "Account Approved",
      subject: `Welcome to ${SLUG_UPPER} — Account Approved`,
      body: `<p>Your account has been approved. You can now log in and start using the platform.</p>`,
      variables: "name,loginUrl",
    },
    {
      slug: "demo-received",
      name: "Demo Received",
      subject: `${SLUG_UPPER} — Demo Received`,
      body: `<p>We've received your demo submission. We'll review it and get back to you.</p>`,
      variables: "name,demoTitle",
    },
    {
      slug: "payout-processed",
      name: "Payout Processed",
      subject: `${SLUG_UPPER} — Payout Processed`,
      body: `<p>Your payout has been processed.</p>`,
      variables: "name,amount,currency",
    },
  ];

  for (const tpl of defaultTemplates) {
    await prisma.emailTemplate.upsert({
      where: { slug: tpl.slug },
      update: {},
      create: tpl,
    });
  }
  console.log("  ✓ EmailTemplates seeded");

  console.log(`\n✓ Tenant "${slug}" seeded successfully!\n`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
