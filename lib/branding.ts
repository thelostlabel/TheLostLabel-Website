export type BrandingConfig = {
  shortName: string;
  fullName: string;
  dotName: string;
};

const shortName = process.env.NEXT_PUBLIC_SITE_NAME || "LOST";

export const BRANDING: BrandingConfig = {
  shortName,
  fullName: process.env.NEXT_PUBLIC_SITE_FULL_NAME || "THE LOST LABEL",
  dotName: `${shortName}.`,
};
