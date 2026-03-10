import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useClients() {
  return useQuery({
    queryKey: [api.clients.list.path],
    queryFn: async () => {
      const res = await fetch(api.clients.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch clients");
      return api.clients.list.responses[200].parse(await res.json());
    },
  });
}
