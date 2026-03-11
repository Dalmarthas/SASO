import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

function toNetworkAwareError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof Error) {
    if (/network|failed to fetch|fetch resource/i.test(error.message)) {
      return new Error("Backend is not reachable. Restart the local app server and try again.");
    }

    return error;
  }

  return new Error(fallbackMessage);
}

function invalidateKeywordQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: [api.keywords.list.path] });
  queryClient.invalidateQueries({ queryKey: [api.keywords.explore.path] });
  queryClient.invalidateQueries({ queryKey: [api.dashboard.summary.path] });
}

function buildKeywordExplorerUrl(input: z.infer<typeof api.keywords.explore.input>) {
  const params = new URLSearchParams({
    appId: input.appId.toString(),
    seed: input.seed,
    country: input.country,
    language: input.language,
    limit: input.limit.toString(),
  });

  return `${api.keywords.explore.path}?${params.toString()}`;
}

export function useKeywords() {
  return useQuery({
    queryKey: [api.keywords.list.path],
    queryFn: async () => {
      try {
        const res = await fetch(api.keywords.list.path, { credentials: "include" });
        if (!res.ok) {
          throw new Error("Failed to fetch keywords");
        }

        return api.keywords.list.responses[200].parse(await res.json());
      } catch (error) {
        throw toNetworkAwareError(error, "Failed to fetch keywords");
      }
    },
  });
}

export function useExploreKeywords(input: z.input<typeof api.keywords.explore.input> | null) {
  const trimmedSeed = input?.seed?.trim() ?? "";
  const isEnabled = Boolean(input?.appId) && trimmedSeed.length >= 2;

  return useQuery({
    queryKey: [api.keywords.explore.path, input],
    enabled: isEnabled,
    queryFn: async () => {
      try {
        const validated = api.keywords.explore.input.parse(input);
        const res = await fetch(buildKeywordExplorerUrl(validated), { credentials: "include" });

        if (!res.ok) {
          if (res.status === 400) {
            const err = api.keywords.explore.responses[400].parse(await res.json());
            throw new Error(err.message);
          }

          throw new Error("Failed to explore keywords");
        }

        return api.keywords.explore.responses[200].parse(await res.json());
      } catch (error) {
        throw toNetworkAwareError(error, "Failed to explore keywords");
      }
    },
  });
}

export function useCreateKeyword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: z.infer<typeof api.keywords.create.input>) => {
      try {
        const validated = api.keywords.create.input.parse(data);
        const res = await fetch(api.keywords.create.path, {
          method: api.keywords.create.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validated),
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status === 400) {
            const err = api.keywords.create.responses[400].parse(await res.json());
            throw new Error(err.message);
          }

          throw new Error("Failed to create keyword");
        }

        return api.keywords.create.responses[201].parse(await res.json());
      } catch (error) {
        throw toNetworkAwareError(error, "Failed to create keyword");
      }
    },
    onSuccess: () => invalidateKeywordQueries(queryClient),
  });
}

export function useDeleteKeyword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      try {
        const res = await fetch(buildUrl(api.keywords.delete.path, { id }), {
          method: api.keywords.delete.method,
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to delete keyword");
        }
      } catch (error) {
        throw toNetworkAwareError(error, "Failed to delete keyword");
      }
    },
    onSuccess: () => invalidateKeywordQueries(queryClient),
  });
}

