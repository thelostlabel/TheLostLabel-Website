export type UserProfileResponse = {
  id: string;
  email: string;
  fullName: string | null;
  legalName: string | null;
  phoneNumber: string | null;
  address: string | null;
  stageName: string | null;
  spotifyUrl: string | null;
  monthlyListeners: number;
  role: string;
  status: string;
  createdAt: Date;
  notifyDemos: boolean;
  notifyEarnings: boolean;
  notifySupport: boolean;
  notifyContracts: boolean;
  discordNotifyEnabled: boolean;
  discordId: string | null;
  artist: {
    id: string;
    name: string;
    image: string | null;
    spotifyUrl: string | null;
    monthlyListeners: number | null;
  } | null;
  artistImage: string | null;
  discordLinked: boolean;
};

export type UserProfilePatchInput = {
  email?: string;
  fullName?: string | null;
  legalName?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  notifyDemos?: boolean;
  notifyEarnings?: boolean;
  notifySupport?: boolean;
  notifyContracts?: boolean;
  discordNotifyEnabled?: boolean;
};

export type ContractProfilePatchInput = Pick<UserProfilePatchInput, "legalName" | "phoneNumber" | "address">;
