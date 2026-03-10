type SideEffectTask = {
  label: string;
  run: () => Promise<unknown>;
};

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutId: NodeJS.Timeout | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function settleSideEffects(tasks: SideEffectTask[], timeoutMs = 5000) {
  return Promise.allSettled(
    tasks.map(async (task) => {
      await withTimeout(task.run(), timeoutMs, task.label);
    }),
  );
}
