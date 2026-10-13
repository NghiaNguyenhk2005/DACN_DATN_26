"use client";

import { useEffect, useState } from "react";
import type { Schema } from "@farmery/contract";
import { api } from "@/lib/api";

type State = { kind: "loading" } | { kind: "up"; health: Schema<"Health"> } | { kind: "down" };

export function ApiStatus() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    api
      .GET("/health")
      .then(({ data }) => setState(data ? { kind: "up", health: data } : { kind: "down" }))
      .catch(() => setState({ kind: "down" }));
  }, []);

  if (state.kind === "loading") return <span className="text-muted-foreground">API: đang kiểm tra…</span>;
  if (state.kind === "down") return <span className="text-destructive">API: chưa chạy</span>;
  return <span className="text-muted-foreground">API: {state.health.status}</span>;
}
