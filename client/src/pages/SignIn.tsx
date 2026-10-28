import { SignIn, SignUp } from "@clerk/react";
import { Boxes, FileCheck2, ShieldCheck, ArrowUpRight } from "lucide-react";

export default function SignInPage({ signUp = false }: { signUp?: boolean }) {
  return (
    <div className="grid min-h-dvh bg-background text-slate-100 lg:grid-cols-2">
      <section className="hidden flex-col justify-between border-r border-white/10 bg-card p-12 lg:flex xl:p-16">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl border border-teal-300/20 bg-teal-300/10 text-teal-200">
            <ShieldCheck className="size-5" />
          </span>
          <span className="text-xl font-semibold">Arcway</span>
          <span className="ml-2 rounded-full border border-white/10 px-3 py-1 text-[11px] text-slate-400">
            Trade assurance
          </span>
        </div>
        <div className="max-w-lg py-12">
          <p className="eyebrow text-teal-300">CLARITY AT EVERY HANDOFF</p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight xl:text-5xl">
            Every trade.
            <br />
            <span className="text-slate-400">A clearer way forward.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-400">
            Bring your trade terms, evidence, and obligations into one trusted
            workspace.
          </p>
          <div className="mt-12 space-y-6">
            {[
              {
                icon: Boxes,
                title: "One connected trade picture",
                description: "Know where every agreement stands.",
              },
              {
                icon: FileCheck2,
                title: "Evidence behind every decision",
                description: "Keep the facts and their sources together.",
              },
              {
                icon: ShieldCheck,
                title: "Confidence before the next move",
                description: "Review readiness before every critical handoff.",
              },
            ].map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-4">
                <Icon className="mt-1 size-5 text-teal-300" />
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-1 text-sm text-slate-400">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="size-4" />
          Secure identity. Permissioned workspaces.
        </p>
      </section>
      <section
        aria-label={signUp ? "Create your ARCWAY account" : "Sign in to ARCWAY"}
        className="flex min-w-0 flex-col items-center justify-center px-4 py-12 sm:px-8"
      >
        <div className="mb-8 text-center">
          <span className="mb-6 inline-flex items-center gap-2 text-lg font-semibold lg:hidden">
            <ShieldCheck className="size-6 text-teal-300" />
            Arcway
          </span>
          <h2 className="text-2xl font-semibold">
            {signUp ? "Your workspace starts here." : "Welcome back."}
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            {signUp
              ? "Create your account to get started."
              : "Sign in to continue to your trade workspace."}
          </p>
        </div>
        {signUp ? (
          <SignUp
            routing="hash"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/trades"
            appearance={appearance}
          />
        ) : (
          <SignIn
            routing="hash"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/trades"
            appearance={appearance}
          />
        )}
        <p className="mt-8 flex items-center gap-2 text-xs text-slate-500">
          Identity powered by Clerk
          <ArrowUpRight className="size-3" />
        </p>
      </section>
    </div>
  );
}
const appearance = {
  variables: {
    colorPrimary: "#8dddc9",
    colorPrimaryForeground: "#102720",
    colorBackground: "#15232c",
    colorText: "#edf3f7",
    colorTextSecondary: "#a4b4c2",
    colorInputBackground: "#0d1820",
    colorInputText: "#edf3f7",
    borderRadius: "0.75rem",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  elements: {
    cardBox: "shadow-none border border-white/10 rounded-2xl",
    card: "shadow-none",
    footer: "bg-transparent",
  },
};
