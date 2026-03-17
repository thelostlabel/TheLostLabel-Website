const { performance } = require('perf_hooks');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const mockPrisma = {
    user: {
        create: async ({ data }) => {
            await sleep(10); // Simulate network/DB latency
            return data;
        },
        createMany: async ({ data }) => {
            await sleep(10); // Bulk operation still takes roughly one "trip"
            return { count: data.length };
        }
    }
};

async function runBenchmark() {
    const itemCount = 100;
    const items = Array.from({ length: itemCount }, (_, i) => ({ id: i, name: `User ${i}` }));

    console.log(`📊 Benchmarking ${itemCount} items...`);

    // Baseline: Sequential create
    const startSequential = performance.now();
    for (const item of items) {
        await mockPrisma.user.create({ data: item });
    }
    const endSequential = performance.now();
    const sequentialTime = endSequential - startSequential;

    console.log(`❌ Sequential create: ${sequentialTime.toFixed(2)}ms`);

    // Optimized: createMany
    const startBulk = performance.now();
    await mockPrisma.user.createMany({ data: items });
    const endBulk = performance.now();
    const bulkTime = endBulk - startBulk;

    console.log(`✅ createMany: ${bulkTime.toFixed(2)}ms`);

    const improvement = ((sequentialTime - bulkTime) / sequentialTime) * 100;
    console.log(`🚀 Improvement: ${improvement.toFixed(2)}%`);

    console.log('\nResults for PR description:');
    console.log(`- Baseline (Sequential): ~${sequentialTime.toFixed(0)}ms`);
    console.log(`- Optimized (createMany): ~${bulkTime.toFixed(0)}ms`);
    console.log(`- Speedup: ~${(sequentialTime / bulkTime).toFixed(1)}x faster`);
}

runBenchmark().catch(console.error);
