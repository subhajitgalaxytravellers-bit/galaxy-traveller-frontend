"use client";

import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getValidToken } from "@/lib/auth";

const client = new QueryClient();

export default function ReactQueryProvider({ children }) {
  useEffect(() => {
    const id = setInterval(() => {
      getValidToken();
    }, 30000);
    return () => clearInterval(id);
  }, []);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
