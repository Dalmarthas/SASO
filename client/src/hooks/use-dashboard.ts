import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useDashboard() {
  return useQuery({
    queryKey: [api.dashboard.summary.path],
    queryFn: async () => {
      const res = await fetch(api.dashboard.summary.path, { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      return api.dashboard.summary.responses[200].parse(await res.json());
    },
  });
}
