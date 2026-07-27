export const SUPABASE_READ_TIMEOUT_MS = 8_000;

export async function withSupabaseRequestTimeout<T>(
  request: (signal: AbortSignal) => Promise<T>,
  timeoutMs = SUPABASE_READ_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout>;

  try {
    return await Promise.race([
      request(controller.signal),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          controller.abort();
          reject(new Error("Supabase request timeout"));
        }, timeoutMs);
      }),
    ]);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("Supabase request timeout");
    }
    throw error;
  } finally {
    clearTimeout(timeout!);
  }
}
