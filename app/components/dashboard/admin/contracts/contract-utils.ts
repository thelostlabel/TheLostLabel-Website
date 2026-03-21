import { extractContractMetaAndNotes } from '@/lib/contract-template';

export type Split = {
  name: string;
  percentage: number;
  userId: string;
  artistId: string;
  legalName: string;
  phoneNumber: string;
  address: string;
  email: string;
  role: string;
};

export type ContractDetails = {
  agreementReferenceNo: string;
  effectiveDate: string;
  deliveryDate: string;
  isrc: string;
  songTitles: string;
  artistLegalName: string;
  artistPhone: string;
  artistAddress: string;
};

export type ContractForm = {
  userId: string;
  artistId: string;
  primaryArtistName: string;
  releaseId: string;
  demoId: string;
  title: string;
  isDemo: boolean;
  artistShare: number;
  labelShare: number;
  notes: string;
  pdfUrl: string;
  contractDetails: ContractDetails;
  isValid: boolean;
  splits: Split[];
};

export const createEmptySplit = (): Split => ({
  name: '',
  percentage: 0,
  userId: '',
  artistId: '',
  legalName: '',
  phoneNumber: '',
  address: '',
  email: '',
  role: 'featured',
});

export const createDefaultContractForm = (): ContractForm => ({
  userId: '',
  artistId: '',
  primaryArtistName: '',
  releaseId: '',
  demoId: '',
  title: '',
  isDemo: false,
  artistShare: 0.7,
  labelShare: 0.3,
  notes: '',
  pdfUrl: '',
  contractDetails: {
    agreementReferenceNo: '',
    effectiveDate: '',
    deliveryDate: '',
    isrc: '',
    songTitles: '',
    artistLegalName: '',
    artistPhone: '',
    artistAddress: '',
  },
  isValid: true,
  splits: [{ ...createEmptySplit(), percentage: 100, role: 'primary' }],
});

export const hydrateContractForm = (contract: any): ContractForm => {
  const { details, userNotes } = extractContractMetaAndNotes(contract.notes || '');
  let featuredArtists: any[] = [];

  try {
    featuredArtists = contract.featuredArtists ? JSON.parse(contract.featuredArtists) : [];
  } catch {
    featuredArtists = [];
  }

  const featuredByKey = new Map(
    featuredArtists.map((featured: any) => [
      `${featured.artistId || ''}:${featured.userId || ''}:${(featured.name || '').toLowerCase()}`,
      featured,
    ])
  );

  const hydratedSplits = (contract.splits || []).map((split: any, index: number) => {
    const match = featuredByKey.get(
      `${split.artistId || ''}:${split.userId || ''}:${(split.name || '').toLowerCase()}`
    );
    return {
      ...createEmptySplit(),
      name: split.name,
      percentage: split.percentage,
      userId: split.userId || '',
      artistId: split.artistId || '',
      email: split.email || match?.email || '',
      legalName:
        match?.legalName ||
        split.user?.legalName ||
        split.user?.fullName ||
        split.artist?.user?.legalName ||
        split.artist?.user?.fullName ||
        '',
      phoneNumber:
        match?.phoneNumber || split.user?.phoneNumber || split.artist?.user?.phoneNumber || '',
      address: match?.address || split.user?.address || split.artist?.user?.address || '',
      role: split.role || (index === 0 ? 'primary' : 'featured'),
    };
  });

  return {
    userId: contract.userId || '',
    artistId: contract.artistId || '',
    primaryArtistName: contract.primaryArtistName || '',
    releaseId: contract.releaseId || '',
    demoId: contract.demoId || '',
    title: contract.title || '',
    isDemo: !contract.releaseId,
    artistShare: contract.artistShare,
    labelShare: contract.labelShare,
    notes: userNotes || '',
    pdfUrl: contract.pdfUrl || '',
    contractDetails: {
      agreementReferenceNo: details.agreementReferenceNo || '',
      effectiveDate: details.effectiveDate || '',
      deliveryDate: details.deliveryDate || '',
      isrc: details.isrc || '',
      songTitles: details.songTitles || '',
      artistLegalName: details.artistLegalName || '',
      artistPhone: details.artistPhone || '',
      artistAddress: details.artistAddress || '',
    },
    isValid: true,
    splits:
      hydratedSplits.length > 0
        ? hydratedSplits
        : [{ ...createEmptySplit(), percentage: 100, role: 'primary' }],
  };
};
