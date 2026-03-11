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

export function useApps() {
  return useQuery({
    queryKey: [api.apps.list.path],
    queryFn: async () => {
      try {
        const res = await fetch(api.apps.list.path, { credentials: "include" });
        if (!res.ok) {
          throw new Error("Failed to fetch apps");
        }

        return api.apps.list.responses[200].parse(await res.json());
      } catch (error) {
        throw toNetworkAwareError(error, "Failed to fetch apps");
      }
    },
  });
}

function invalidateAppQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: [api.apps.list.path] });
  queryClient.invalidateQueries({ queryKey: [api.dashboard.summary.path] });
  queryClient.invalidateQueries({ queryKey: [api.keywords.list.path] });
  queryClient.invalidateQueries({ queryKey: [api.keywords.explore.path] });
}

export function useCreateApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: z.infer<typeof api.apps.create.input>) => {
      try {
        const validated = api.apps.create.input.parse(data);
        const res = await fetch(api.apps.create.path, {
          method: api.apps.create.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validated),
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status === 400) {
            const err = api.apps.create.responses[400].parse(await res.json());
            throw new Error(err.message);
          }

          throw new Error("Failed to create app");
        }

        return api.apps.create.responses[201].parse(await res.json());
      } catch (error) {
        throw toNetworkAwareError(error, "Failed to create app");
      }
    },
    onSuccess: () => invalidateAppQueries(queryClient),
  });
}

export function useImportApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: z.infer<typeof api.apps.importFromUrl.input>) => {
      try {
        const validated = api.apps.importFromUrl.input.parse(data);
        const res = await fetch(api.apps.importFromUrl.path, {
          method: api.apps.importFromUrl.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validated),
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status === 400) {
            const err = api.apps.importFromUrl.responses[400].parse(await res.json());
            throw new Error(err.message);
          }

          throw new Error("Failed to import app from store URL");
        }

        return api.apps.importFromUrl.responses[201].parse(await res.json());
      } catch (error) {
        throw toNetworkAwareError(error, "Failed to import app from store URL");
      }
    },
    onSuccess: () => invalidateAppQueries(queryClient),
    onError: (error) => {
      if (error instanceof Error && /already in your catalog/i.test(error.message)) {
        invalidateAppQueries(queryClient);
      }
    },
  });
}

export function useDeleteApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      try {
        const res = await fetch(buildUrl(api.apps.delete.path, { id }), {
          method: api.apps.delete.method,
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to delete app");
        }
      } catch (error) {
        throw toNetworkAwareError(error, "Failed to delete app");
      }
    },
    onSuccess: () => invalidateAppQueries(queryClient),
  });
}
