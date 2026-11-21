// SPDX-License-Identifier: AGPL-3.0-or-later
"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
  type ChatModelRunResult,
  type SuggestionAdapter,
  type ThreadSuggestion,
} from "@assistant-ui/react";
import { Thread } from "@/components/assistant-ui/elements/thread.aui";
import { NotCoveredDataUI } from "@/components/juman/not-covered";
import { CreateDraftToolUI } from "@/components/juman/create-draft-approval";

type TenantConfig = { name: string; welcome_text: string; suggested_questions: string[] };
export const TenantConfigContext = createContext<TenantConfig | null>(null);
export const useTenantConfig = () => useContext(TenantConfigContext);

const API_URL =
  process.env.NEXT_PUBLIC_JUMAN_API_URL ?? "http://localhost:8000";

const chatAdapter: ChatModelAdapter = {
  async *run({ messages, abortSignal }) {
    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages.map((m) => ({
          role: m.role,
          content:
            m.content
              ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
              .map((p) => p.text)
              .join("") ?? "",
        })),
      }),
      signal: abortSignal,
    });

    const contentType = response.headers.get("content-type") ?? "";

    // Structured JSON responses (not-covered, tool-call)
    if (contentType.includes("application/json")) {
      const data = await response.json();

      if (data.type === "not-covered") {
        const result: ChatModelRunResult = {
          content: [
            { type: "data", name: "not-covered", data: { message: data.message } },
          ],
        };
        yield result;
        return;
      }

      if (data.type === "tool-call") {
        const result: ChatModelRunResult = {
          content: [
            {
              type: "tool-call",
              toolCallId: data.tool_call_id,
              toolName: data.tool_name,
              args: data.args,
              argsText: JSON.stringify(data.args),
            },
          ],
          status: { type: "requires-action", reason: "tool-calls" },
        };
        yield result;
        return;
      }
    }

    // Streaming text response
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      fullText += decoder.decode(value, { stream: true });
      yield { content: [{ type: "text" as const, text: fullText }] };
    }
  },
};

export const Assistant = () => {
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/config`, { credentials: "include" })
      .then((r) => r.json())
      .then(setTenantConfig)
      .catch(() => {});
  }, []);

  // Show tenant's suggested questions on the welcome screen
  const suggestionAdapter = useMemo<SuggestionAdapter | undefined>(() => {
    if (!tenantConfig?.suggested_questions?.length) return undefined;
    const suggestions: ThreadSuggestion[] =
      tenantConfig.suggested_questions.map((q) => ({ prompt: q }));
    return {
      async *generate({ messages }) {
        if (messages.length === 0) yield suggestions;
      },
    };
  }, [tenantConfig]);

  const runtime = useLocalRuntime(chatAdapter, {
    adapters: { suggestion: suggestionAdapter },
  });

  return (
    <TenantConfigContext.Provider value={tenantConfig}>
      <AssistantRuntimeProvider runtime={runtime}>
        <NotCoveredDataUI />
        <CreateDraftToolUI />
        <main className="h-dvh">
          <Thread />
        </main>
      </AssistantRuntimeProvider>
    </TenantConfigContext.Provider>
  );
};
