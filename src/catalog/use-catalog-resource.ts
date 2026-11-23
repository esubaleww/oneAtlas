import { useEffect, useState } from "react";

type Resource<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error"; httpStatus?: number };

export function useCatalogResource<T>(url: string | null) {
  const [attempt, setAttempt] = useState(0);
  const key = `${attempt}:${url}`;
  const [response, setResponse] = useState<{ key: string; state: Resource<T> }>();

  useEffect(() => {
    if (url === null) return;
    const controller = new AbortController();

    async function load(requestUrl: string) {
      try {
        const result = await fetch(requestUrl, { signal: controller.signal, cache: "no-store" });
        if (!result.ok) {
          if (!controller.signal.aborted) {
            setResponse({ key, state: { status: "error", httpStatus: result.status } });
          }
          return;
        }

        const { data } = (await result.json()) as { data?: T };
        if (!controller.signal.aborted) {
          const state: Resource<T> = data === undefined
            ? { status: "error" }
            : { status: "ready", data };
          setResponse({ key, state });
        }
      } catch {
        if (!controller.signal.aborted) {
          setResponse({ key, state: { status: "error" } });
        }
      }
    }

    void load(url);
    return () => controller.abort();
  }, [key, url]);

  return {
    state: response?.key === key ? response.state : ({ status: "loading" } as const),
    retry: () => setAttempt((value) => value + 1),
  };
}
