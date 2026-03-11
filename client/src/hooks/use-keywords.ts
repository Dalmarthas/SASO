import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export function useKeywords() {
  return useQuery({
    queryKey: [api.keywords.list.path],
    queryFn: async () => {
      const res = await fetch(api.keywords.list.path, { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch keywords");
      }

      return api.keywords.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateKeyword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: z.infer<typeof api.keywords.create.input>) => {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.keywords.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.summary.path] });
    },
  });
}

export function useDeleteKeyword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(buildUrl(api.keywords.delete.path, { id }), {
        method: api.keywords.delete.method,
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to delete keyword");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.keywords.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.summary.path] });
    },
  });
}
