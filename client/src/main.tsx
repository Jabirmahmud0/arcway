import { ClerkProvider, useAuth as useClerkAuth } from "@clerk/react";
import { trpc } from "@/lib/trpc";
import { COOKIE_NAME, UNAUTHED_ERR_MSG } from "@shared/const";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { startLogin } from "./const";
import "./index.css";

function WorkspaceSession({
  getToken,
}: {
  getToken?: () => Promise<string | null>;
}) {
  const [queryClient] = useState(() => {
    const client = new QueryClient();
    const onError = (error: unknown) => {
      if (
        error instanceof TRPCClientError &&
        error.message === UNAUTHED_ERR_MSG
      )
        startLogin();
    };
    client.getQueryCache().subscribe(event => {
      if (event.type === "updated" && event.action.type === "error")
        onError(event.query.state.error);
    });
    client.getMutationCache().subscribe(event => {
      if (event.type === "updated" && event.action.type === "error")
        onError(event.mutation.state.error);
    });
    return client;
  });
  const [client] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
          async headers() {
            if (getToken) {
              const token = await getToken();
              return token ? { Authorization: `Bearer ${token}` } : {};
            }
            try {
              const prefix = `${COOKIE_NAME}=`;
              const raw = sessionStorage.getItem("manus-cookie");
              const token = raw
                ?.split(";")
                .find(pair => pair.trim().startsWith(prefix))
                ?.trim()
                .slice(prefix.length);
              if (token) return { Authorization: `Bearer ${token}` };
            } catch {}
            return {};
          },
          fetch(input, init) {
            return globalThis.fetch(input, { ...init, credentials: "include" });
          },
        }),
      ],
    })
  );
  return (
    <trpc.Provider client={client} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
function ClerkSession() {
  const { isLoaded, userId, getToken } = useClerkAuth();
  if (!isLoaded)
    return (
      <div
        role="status"
        className="grid min-h-dvh place-items-center bg-background text-sm text-slate-400"
      >
        Connecting securely…
      </div>
    );
  // A separate cache per identity prevents a new account seeing the old account's data.
  return <WorkspaceSession key={userId || "signed-out"} getToken={getToken} />;
}
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
createRoot(document.getElementById("root")!).render(
  publishableKey ? (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/sign-in"
    >
      <ClerkSession />
    </ClerkProvider>
  ) : (
    <WorkspaceSession />
  )
);
