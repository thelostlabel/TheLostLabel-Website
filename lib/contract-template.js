const META_START = "[[CONTRACT_META_JSON]]";
const META_END = "[[/CONTRACT_META_JSON]]";

export function normalizeContractDetails(details = {}) {
    return {
        agreementReferenceNo: details.agreementReferenceNo || "",
        effectiveDate: details.effectiveDate || "",
        deliveryDate: details.deliveryDate || "",
        isrc: details.isrc || "",
        songTitles: details.songTitles || "",
        artistLegalName: details.artistLegalName || "",
        artistPhone: details.artistPhone || "",
        artistAddress: details.artistAddress || "",
    };
}

export function embedContractMetaInNotes(userNotes = "", details = {}) {
    const normalized = normalizeContractDetails(details);
    const json = JSON.stringify(normalized);
    const cleanNotes = (userNotes || "").trim();
    return `${META_START}${json}${META_END}\n${cleanNotes}`.trim();
}

export function extractContractMetaAndNotes(rawNotes = "") {
    const notes = rawNotes || "";
    const start = notes.indexOf(META_START);
    const end = notes.indexOf(META_END);

    if (start === -1 || end === -1 || end < start) {
        return {
            details: normalizeContractDetails({}),
            userNotes: notes,
        };
    }

    const jsonText = notes.slice(start + META_START.length, end).trim();
    let parsed = {};
    try {
        parsed = JSON.parse(jsonText);
    } catch {
        parsed = {};
    }

    const before = notes.slice(0, start).trim();
    const after = notes.slice(end + META_END.length).trim();
    const userNotes = [before, after].filter(Boolean).join("\n\n").trim();

    return {
        details: normalizeContractDetails(parsed),
        userNotes,
    };
}
