import prisma from "@/lib/prisma";

/**
 * Create a version snapshot of the current demo state before it is updated.
 * This copies the demo's title, genre, message, and files into a new DemoVersion row.
 */
export async function createDemoVersionSnapshot(demoId: string): Promise<void> {
  const demo = await prisma.demo.findUnique({
    where: { id: demoId },
    include: { files: true, versions: { orderBy: { version: "desc" }, take: 1 } },
  });

  if (!demo) throw new Error("Demo not found");

  const nextVersion = demo.versions.length > 0 ? demo.versions[0].version + 1 : 1;

  await prisma.demoVersion.create({
    data: {
      demoId,
      version: nextVersion,
      title: demo.title,
      genre: demo.genre,
      message: demo.message,
      files: {
        create: demo.files.map((f) => ({
          filename: f.filename,
          filepath: f.filepath,
          filesize: f.filesize,
        })),
      },
    },
  });
}

/**
 * Return the full version history for a demo, newest first.
 */
export async function getDemoVersionHistory(demoId: string) {
  return prisma.demoVersion.findMany({
    where: { demoId },
    include: { files: true },
    orderBy: { version: "desc" },
  });
}

/**
 * Restore a specific version: copy its data back to the main Demo record.
 * The current state is automatically snapshotted first so nothing is lost.
 */
export async function restoreDemoVersion(demoId: string, versionId: string): Promise<void> {
  const version = await prisma.demoVersion.findUnique({
    where: { id: versionId },
    include: { files: true },
  });

  if (!version || version.demoId !== demoId) {
    throw new Error("Version not found or does not belong to this demo");
  }

  // Snapshot current state before overwriting
  await createDemoVersionSnapshot(demoId);

  await prisma.$transaction(async (tx) => {
    // Update demo fields
    await tx.demo.update({
      where: { id: demoId },
      data: {
        title: version.title,
        genre: version.genre,
        message: version.message,
      },
    });

    // Replace demo files: delete existing, recreate from version
    await tx.demoFile.deleteMany({ where: { demoId } });

    if (version.files.length > 0) {
      await tx.demoFile.createMany({
        data: version.files.map((f) => ({
          demoId,
          filename: f.filename,
          filepath: f.filepath,
          filesize: f.filesize,
        })),
      });
    }
  });
}
