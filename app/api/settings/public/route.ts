import prisma from "@/lib/prisma";

type PublicSettingsResponse = {
  genres: string[];
  siteName?: string;
  heroText?: string;
  heroSubText?: string;
  featuredReleaseId?: string | null;
  featuredReleaseLabel?: string;
  featuredReleaseSubLabel?: string;
  featuredReleaseStatus?: string;
  discord?: string;
  instagram?: string;
  spotify?: string;
  youtube?: string;
  twitter?: string;
  facebook?: string;
  showStats?: boolean;
  registrationsOpen?: boolean;
  maintenanceMode?: boolean;
  joinHeroTitle?: string;
  joinHeroSub?: string;
};

const defaultGenres = ["Hip-Hop", "R&B", "Pop", "Electronic", "Phonk", "Brazilian Funk", "Other"];

export async function GET() {
  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      return Response.json({ genres: defaultGenres });
    }

    const config = JSON.parse(settings.config) as Record<string, unknown>;
    const payload: PublicSettingsResponse = {
      genres: Array.isArray(config.genres) ? (config.genres as string[]) : ["Hip-Hop", "R&B", "Pop", "Electronic", "Other"],
      siteName: typeof config.siteName === "string" ? config.siteName : "LOST MUSIC",
      heroText: typeof config.heroText === "string" ? config.heroText : "THE NEW ORDER",
      heroSubText: typeof config.heroSubText === "string" ? config.heroSubText : "INDEPENDENT DISTRIBUTION REDEFINED.",
      featuredReleaseId: typeof config.featuredReleaseId === "string" ? config.featuredReleaseId : null,
      featuredReleaseLabel: typeof config.featuredReleaseLabel === "string" ? config.featuredReleaseLabel : "FEATURED RELEASE",
      featuredReleaseSubLabel: typeof config.featuredReleaseSubLabel === "string" ? config.featuredReleaseSubLabel : "NOW STREAMING",
      featuredReleaseStatus: typeof config.featuredReleaseStatus === "string" ? config.featuredReleaseStatus : "Featured",
      discord: typeof config.discord === "string" ? config.discord : "",
      instagram: typeof config.instagram === "string" ? config.instagram : "",
      spotify: typeof config.spotify === "string" ? config.spotify : "",
      youtube: typeof config.youtube === "string" ? config.youtube : "",
      twitter: typeof config.twitter === "string" ? config.twitter : "",
      facebook: typeof config.facebook === "string" ? config.facebook : "",
      showStats: typeof config.showStats === "boolean" ? config.showStats : true,
      registrationsOpen: typeof config.registrationsOpen === "boolean" ? config.registrationsOpen : true,
      maintenanceMode: typeof config.maintenanceMode === "boolean" ? config.maintenanceMode : false,
      joinHeroTitle: typeof config.joinHeroTitle === "string" ? config.joinHeroTitle : "WORK WITH THE LOST. COMPANY",
      joinHeroSub: typeof config.joinHeroSub === "string" ? config.joinHeroSub : "A&R UNIT // UNRELEASED DEMOS & RELEASED TRACKS",
    };

    return Response.json(payload, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
