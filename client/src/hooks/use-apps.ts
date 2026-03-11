import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export function useApps() {
  return useQuery({
    queryKey: [api.apps.list.path],
    queryFn: async () => {
      const res = await fetch(api.apps.list.path, { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch apps");
      }

      return api.apps.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: z.infer<typeof api.apps.create.input>) => {
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
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.apps.list.path] }),
  });
}

export function useDeleteApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(buildUrl(api.apps.delete.path, { id }), {
        method: api.apps.delete.method,
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to delete app");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.apps.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.summary.path] });
      queryClient.invalidateQueries({ queryKey: [api.keywords.list.path] });
    },
  });
}
