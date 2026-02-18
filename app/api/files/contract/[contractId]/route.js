import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createReadStream } from "fs";
import { stat, readFile } from "fs/promises";
import { extname, join } from "path";
import { Readable } from "stream";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { extractContractMetaAndNotes } from "@/lib/contract-template";

const MIME_BY_EXT = {
  ".pdf": "application/pdf",
};
const CONTRACT_TEMPLATE_PATH = join(
  process.cwd(),
  "public/templates/contracts/lostlabel-exclusive-master-license-agreement.pdf"
);

function formatDate(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString().slice(0, 10);
}

async function buildLegacyGeneratedContractPdf(contract) {
  const { details, userNotes } = extractContractMetaAndNotes(contract.notes || "");
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = 800;
  const margin = 48;

  const drawLine = (text, opts = {}) => {
    const size = opts.size || 11;
    const font = opts.bold ? fontBold : fontRegular;
    const color = opts.color || rgb(0.1, 0.1, 0.1);
    page.drawText(text, { x: margin, y, size, font, color });
    y -= opts.gap || 18;
  };

  let featuredArtists = [];
  try {
    featuredArtists = contract.featuredArtists ? JSON.parse(contract.featuredArtists) : [];
  } catch {
    featuredArtists = [];
  }
  const artists = featuredArtists.length > 0
    ? featuredArtists
    : (Array.isArray(contract.splits) ? contract.splits : []);
  const mainArtistName =
    contract.artist?.name ||
    contract.primaryArtistName ||
    contract.user?.stageName ||
    "Unknown Artist";
  const songs = details.songTitles || contract.release?.name || contract.title || "-";
  const releaseTitle = contract.release?.name || contract.title || "Untitled Release";

  drawLine("THE LOST LABEL", { bold: true, size: 10, gap: 14 });
  drawLine("EXCLUSIVE MASTER LICENSE AGREEMENT", { bold: true, size: 20, gap: 26 });
  drawLine(`Agreement Ref: ${details.agreementReferenceNo || contract.id}`, { size: 10, gap: 14 });
  drawLine(`Effective Date: ${formatDate(details.effectiveDate || contract.createdAt)}`, { size: 10, gap: 24 });

  drawLine("PARTIES", { bold: true, size: 12, gap: 16 });
  drawLine("Label: The Lost Label", { size: 10, gap: 14 });
  drawLine(`Artist: ${mainArtistName}`, { size: 10, gap: 14 });
  drawLine(`Artist Legal Name: ${details.artistLegalName || contract.user?.legalName || "-"}`, { size: 10, gap: 14 });
  drawLine(`Artist Phone: ${details.artistPhone || contract.user?.phoneNumber || "-"}`, { size: 10, gap: 14 });
  drawLine(`Artist Address: ${details.artistAddress || contract.user?.address || "-"}`, { size: 10, gap: 22 });

  drawLine("RECORDING INFORMATION", { bold: true, size: 12, gap: 16 });
  drawLine(`Release/Project: ${releaseTitle}`, { size: 10, gap: 14 });
  drawLine(`Song Title(s): ${songs}`, { size: 10, gap: 14 });
  drawLine(`Genre: ${contract.release?.type || "-"}`, { size: 10, gap: 14 });
  drawLine(`ISRC: ${details.isrc || "-"}`, { size: 10, gap: 14 });
  drawLine(`Delivery Date: ${formatDate(details.deliveryDate)}`, { size: 10, gap: 22 });

  drawLine("ROYALTY SPLIT", { bold: true, size: 12, gap: 16 });
  drawLine(`Artist Share (master): ${(contract.artistShare * 100).toFixed(2)}%`, { size: 10, gap: 14 });
  drawLine(`Label Share (master): ${(contract.labelShare * 100).toFixed(2)}%`, { size: 10, gap: 14 });
  if (artists.length > 0) {
    drawLine("Contributors:", { bold: true, size: 10, gap: 14 });
    for (const split of artists) {
      const splitLegalName =
        split.legalName ||
        split.user?.legalName ||
        split.artist?.user?.legalName ||
        split.user?.fullName ||
        split.artist?.user?.fullName ||
        "-";
      const splitPhone =
        split.phoneNumber ||
        split.user?.phoneNumber ||
        split.artist?.user?.phoneNumber ||
        "-";
      const splitAddress =
        split.address ||
        split.user?.address ||
        split.artist?.user?.address ||
        "-";
      const splitRole = split.role ? ` [${String(split.role).toUpperCase()}]` : "";
      drawLine(`- ${split.name}${splitRole}: ${Number(split.percentage || 0).toFixed(2)}% of artist share`, { size: 10, gap: 13 });
      drawLine(`  Legal Name: ${splitLegalName}`, { size: 9, gap: 12, color: rgb(0.25, 0.25, 0.25) });
      drawLine(`  Phone: ${splitPhone}`, { size: 9, gap: 12, color: rgb(0.25, 0.25, 0.25) });
      if (split.email) {
        drawLine(`  Email: ${split.email}`, { size: 9, gap: 12, color: rgb(0.25, 0.25, 0.25) });
      }
      drawLine(`  Address: ${splitAddress}`, { size: 9, gap: 14, color: rgb(0.25, 0.25, 0.25) });
      if (y < 120) break;
    }
  }

  if (userNotes) {
    y -= 8;
    drawLine("NOTES", { bold: true, size: 12, gap: 16 });
    const noteLines = String(userNotes).slice(0, 1200).split("\n");
    for (const line of noteLines) {
      drawLine(line, { size: 10, gap: 13, color: rgb(0.2, 0.2, 0.2) });
      if (y < 120) break;
    }
  }

  y = Math.max(y - 24, 100);
  drawLine("SIGNATURES", { bold: true, size: 12, gap: 22 });
  drawLine("Artist Signature: ____________________________", { size: 10, gap: 18 });
  drawLine(`Artist Name: ${mainArtistName}`, { size: 10, gap: 18 });
  drawLine("Label Signature: ____________________________", { size: 10, gap: 18 });
  drawLine("Label Representative: Can Ahmet Gündüz", { size: 10, gap: 18 });
  drawLine(`Generated At: ${new Date().toISOString()}`, { size: 9, gap: 14, color: rgb(0.4, 0.4, 0.4) });

  return Buffer.from(await pdfDoc.save());
}

async function buildGeneratedContractPdf(contract) {
  const { details } = extractContractMetaAndNotes(contract.notes || "");
  let featuredArtists = [];
  try {
    featuredArtists = contract.featuredArtists ? JSON.parse(contract.featuredArtists) : [];
  } catch {
    featuredArtists = [];
  }
  const artists = featuredArtists.length > 0
    ? featuredArtists
    : (Array.isArray(contract.splits) ? contract.splits : []);

  try {
    const templateBytes = await readFile(CONTRACT_TEMPLATE_PATH);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const singleLine = (value, max = 90) => {
      const clean = String(value || "").replace(/\s+/g, " ").trim();
      if (!clean) return "-";
      return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
    };

    const wrapLines = (value, maxPerLine = 48, maxLines = 2) => {
      const clean = String(value || "").replace(/\s+/g, " ").trim();
      if (!clean) return [];
      const words = clean.split(" ");
      const lines = [];
      let current = "";
      for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length <= maxPerLine) {
          current = candidate;
          continue;
        }
        lines.push(current);
        current = word;
        if (lines.length >= maxLines) break;
      }
      if (lines.length < maxLines && current) lines.push(current);
      return lines.slice(0, maxLines);
    };

    const firstPage = pdfDoc.getPages()[0];
    if (firstPage) {
      const draw = (text, x, y, size = 9, bold = false) => {
        firstPage.drawText(String(text || "-").slice(0, 120), {
          x,
          y,
          size,
          font: bold ? fontBold : fontRegular,
          color: rgb(0.08, 0.08, 0.08),
        });
      };

      const mainArtistName =
        contract.artist?.name ||
        contract.primaryArtistName ||
        contract.user?.stageName ||
        "-";
      const artistNames = artists.length > 0
        ? artists.map((a) => a.name).filter(Boolean).join(", ")
        : mainArtistName;
      const songTitles = details.songTitles || contract.release?.name || contract.title || "-";
      const artistNameLines = wrapLines(artistNames, 54, 2);
      const songTitleLines = wrapLines(songTitles, 58, 2);

      draw(
        singleLine(details.agreementReferenceNo || `LL-${new Date().getFullYear()}-${String(contract.id).slice(0, 6).toUpperCase()}`, 34),
        165,
        670,
        10
      );
      draw(formatDate(details.effectiveDate || contract.createdAt), 386, 670, 10);

      // RECORDING INFORMATION (page 1) - aligned to actual template fields
      if (songTitleLines[0]) draw(songTitleLines[0], 206, 414, 10);
      if (songTitleLines[1]) draw(songTitleLines[1], 206, 402, 10);

      if (artistNameLines[0]) draw(artistNameLines[0], 206, 375, 10);
      if (artistNameLines[1]) draw(artistNameLines[1], 206, 363, 10);

      draw(singleLine(contract.release?.type || "-", 36), 206, 337, 10);
      draw(singleLine(details.isrc || "-", 36), 206, 299, 10);
      draw(formatDate(details.deliveryDate), 206, 261, 10);
    }

    // PAGE 7 - SCHEDULE 1 table (first row)
    const pages = pdfDoc.getPages();
    if (pages.length >= 7) {
      const schedulePage = pages[6];
      const drawSchedule = (text, x, y, size = 9, bold = false) => {
        schedulePage.drawText(String(text || "-"), {
          x,
          y,
          size,
          font: bold ? fontBold : fontRegular,
          color: rgb(0.08, 0.08, 0.08),
        });
      };

      const rowY = 561; // row #1 baseline
      const songTitle = singleLine(details.songTitles || contract.release?.name || contract.title || "-", 34);
      const contributors = singleLine(
        (artists.length > 0 ? artists.map((a) => a.name).filter(Boolean).join(", ") : (contract.primaryArtistName || contract.artist?.name || "-")),
        36
      );
      const isrc = singleLine(details.isrc || "-", 14);
      const artistSharePct = `${Math.round((contract.artistShare || 0) * 100)}%`;
      const labelSharePct = `${Math.round((contract.labelShare || 0) * 100)}%`;
      const compOwn = "100%";

      drawSchedule("1", 157, rowY, 11);
      drawSchedule(songTitle, 195, rowY, 9);
      drawSchedule(contributors, 332, rowY, 9);
      drawSchedule(isrc, 460, rowY, 9);
      drawSchedule(artistSharePct, 519, rowY, 10);
      drawSchedule(labelSharePct, 570, rowY, 10);
      drawSchedule(compOwn, 625, rowY, 10);
    }

    return Buffer.from(await pdfDoc.save());
  } catch (error) {
    console.warn("Contract template not found/readable, falling back to legacy PDF:", error?.message);
    return buildLegacyGeneratedContractPdf(contract);
  }
}

const resolveStoragePath = (filepath) => {
  if (!filepath || typeof filepath !== "string") return [];
  const normalized = filepath.replace(/^\/+/, "");
  if (normalized.includes("..")) return [];
  if (!normalized.startsWith("private/uploads/contracts/")) return [];

  const root = process.cwd();
  const appRoot = "/app";
  const configuredPrivateRoot = process.env.PRIVATE_STORAGE_ROOT || "/app/private";
  return [
    join(root, normalized),
    join(appRoot, normalized),
    join(configuredPrivateRoot, normalized.replace(/^private\/+/, "")),
  ];
};

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const contractId = (await params)?.contractId;
  if (!contractId) return new Response("Missing contract id", { status: 400 });

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      splits: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              legalName: true,
              phoneNumber: true,
              address: true
            }
          },
          artist: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  legalName: true,
                  phoneNumber: true,
                  address: true
                }
              }
            }
          }
        }
      },
      artist: { select: { userId: true, name: true } },
      user: { select: { stageName: true, legalName: true, phoneNumber: true, address: true } },
      release: { select: { name: true, type: true } }
    },
  });

  if (!contract) return new Response("Not found", { status: 404 });

  const isAdminOrAR = session.user.role === "admin" || session.user.role === "a&r";
  const isOwner = contract.userId && contract.userId === session.user.id;
  const isArtist = contract.artist?.userId && contract.artist.userId === session.user.id;
  const isSplit = contract.splits?.some((s) => s.userId === session.user.id);
  const isPrimaryEmail = contract.primaryArtistEmail && contract.primaryArtistEmail === session.user.email;

  if (!isAdminOrAR && !isOwner && !isArtist && !isSplit && !isPrimaryEmail) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const forceGenerated = url.searchParams.get("generated") === "1";
    const isDownload = url.searchParams.get("download") === "1";

    if (forceGenerated || !contract.pdfUrl) {
      const bytes = await buildGeneratedContractPdf(contract);
      return new Response(bytes, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Length": bytes.length.toString(),
          "Content-Disposition": `${isDownload ? "attachment" : "inline"}; filename="contract-${contract.id}-generated.pdf"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const candidates = resolveStoragePath(contract.pdfUrl);
    let filePath = null;
    let fileStat = null;
    for (const candidate of candidates) {
      try {
        const s = await stat(candidate);
        filePath = candidate;
        fileStat = s;
        break;
      } catch {
        // Try next candidate path.
      }
    }

    if (!filePath || !fileStat) return new Response("Not found", { status: 404 });

    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_BY_EXT[ext] || "application/octet-stream";
    const stream = Readable.toWeb(createReadStream(filePath));
    return new Response(stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileStat.size.toString(),
        "Content-Disposition": `${isDownload ? "attachment" : "inline"}; filename="contract-${contract.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Contract file read error:", error);
    return new Response("File error", { status: 500 });
  }
}
