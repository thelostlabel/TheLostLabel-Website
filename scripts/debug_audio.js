
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkReleaseAudio() {
    console.log("Checking Releases for Audio Files...");

    const releases = await prisma.release.findMany({
        take: 5,
        orderBy: { releaseDate: 'desc' },
        include: {
            contracts: {
                include: {
                    demo: {
                        include: {
                            files: true
                        }
                    }
                }
            }
        }
    });

    for (const r of releases) {
        console.log(`\nRelease: ${r.name} (${r.id})`);
        const contract = r.contracts?.[0];
        if (!contract) {
            console.log("  - No Contract found.");
            continue;
        }
        const demo = contract.demo;
        if (!demo) {
            console.log("  - Contract has no Demo.");
            continue;
        }
        console.log(`  - Linked Demo: ${demo.title} (${demo.id})`);

        if (demo.files && demo.files.length > 0) {
            const audio = demo.files.find(f => f.filename.endsWith('.mp3') || f.filename.endsWith('.wav'));
            if (audio) {
                console.log(`  - HAS AUDIO: ${audio.filename} (ID: ${audio.id})`);
            } else {
                console.log("  - Demo has files, but no audio found.");
                demo.files.forEach(f => console.log(`    - ${f.filename}`));
            }
        } else {
            console.log("  - Demo has NO files.");
        }
    }
}

checkReleaseAudio()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
