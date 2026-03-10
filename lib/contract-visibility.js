function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function isPrivilegedContractViewer(user) {
  return user?.role === "admin" || user?.role === "a&r";
}

export function hasContractAccess(user, contract) {
  if (!contract) return false;
  if (isPrivilegedContractViewer(user)) return true;

  return (
    viewerOwnsPrimaryContract(contract, user) ||
    viewerOwnsArtistContract(contract, user) ||
    viewerOwnsEmail(contract?.primaryArtistEmail, user) ||
    (Array.isArray(contract?.splits) && contract.splits.some((split) => viewerOwnsSplit(split, user)))
  );
}

function viewerOwnsEmail(value, user) {
  const viewerEmail = normalizeEmail(user?.email);
  return Boolean(viewerEmail) && normalizeEmail(value) === viewerEmail;
}

function viewerOwnsPrimaryContract(contract, user) {
  return contract?.userId === user?.id || viewerOwnsEmail(contract?.user?.email, user);
}

function viewerOwnsArtistContract(contract, user) {
  return contract?.artist?.userId === user?.id || viewerOwnsEmail(contract?.artist?.email, user);
}

function viewerOwnsSplit(split, user) {
  return (
    split?.userId === user?.id ||
    viewerOwnsEmail(split?.email, user) ||
    viewerOwnsEmail(split?.user?.email, user)
  );
}

function sanitizeLinkedUser(userRecord, viewerOwnsRecord) {
  if (!userRecord) return userRecord;

  return {
    ...userRecord,
    id: viewerOwnsRecord ? userRecord.id ?? null : null,
    email: viewerOwnsRecord ? userRecord.email ?? null : null,
  };
}

function sanitizeLinkedArtist(artistRecord, viewerOwnsRecord) {
  if (!artistRecord) return artistRecord;

  return {
    ...artistRecord,
    email: viewerOwnsRecord ? artistRecord.email ?? null : null,
    userId: viewerOwnsRecord ? artistRecord.userId ?? null : null,
  };
}

function sanitizeSplit(split, user) {
  if (!split) return split;

  const viewerOwnsRecord = viewerOwnsSplit(split, user);
  return {
    ...split,
    userId: viewerOwnsRecord ? split.userId ?? null : null,
    artistId: viewerOwnsRecord ? split.artistId ?? null : null,
    email: viewerOwnsRecord ? split.email ?? null : null,
    user: sanitizeLinkedUser(split.user, viewerOwnsRecord),
  };
}

export function sanitizeContractForViewer(contract, user) {
  if (!contract || isPrivilegedContractViewer(user)) {
    return contract;
  }

  const viewerOwnsPrimary = viewerOwnsPrimaryContract(contract, user);
  const viewerOwnsArtist = viewerOwnsArtistContract(contract, user);
  const viewerOwnsPrimaryEmail = viewerOwnsEmail(contract?.primaryArtistEmail, user);

  return {
    ...contract,
    pdfUrl: contract?.pdfUrl ? "__protected__" : null,
    userId: viewerOwnsPrimary ? contract.userId ?? null : null,
    primaryArtistEmail: viewerOwnsPrimaryEmail ? contract.primaryArtistEmail ?? null : null,
    user: sanitizeLinkedUser(contract.user, viewerOwnsPrimary),
    artist: sanitizeLinkedArtist(contract.artist, viewerOwnsArtist),
    splits: Array.isArray(contract.splits)
      ? contract.splits.map((split) => sanitizeSplit(split, user))
      : contract.splits,
  };
}
