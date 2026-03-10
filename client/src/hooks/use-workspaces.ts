import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

export function useWorkspaces() {
  return useQuery({
    queryKey: [api.workspaces.list.path],
    queryFn: async () => {
      const res = await fetch(api.workspaces.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch workspaces");
      return api.workspaces.list.responses[200].parse(await res.json());
    },
  });
}
