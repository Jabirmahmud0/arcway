import { SignIn, SignUp } from "@clerk/react";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@shared/demo";
import { useState } from "react";
import { Boxes, FileCheck2, ShieldCheck, ArrowUpRight } from "lucide-react";

export default function SignInPage({ signUp = false }: { signUp?: boolean }) {
  const [demoEmail, setDemoEmail] = useState(DEMO_ACCOUNTS[0].email as string);
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
        {!signUp && <div className="mb-6 w-full max-w-[400px] rounded-2xl border border-teal-300/25 bg-teal-300/5 p-5">
          <p className="text-sm font-semibold text-teal-200">Recruiter demo</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">Explore a shared workspace with fictional trades, PDF evidence, and review scenarios. No signup needed. Changes are visible to other visitors.</p>
          <div className="mt-4 flex gap-2">{DEMO_ACCOUNTS.map(account => <button key={account.role} onClick={() => setDemoEmail(account.email)} className={`rounded-lg border px-3 py-2 text-xs capitalize ${demoEmail === account.email ? "border-teal-300/50 bg-teal-300/15 text-teal-100" : "border-white/10 text-slate-400"}`}>{account.role}</button>)}</div>
          <p className="mt-3 text-xs text-slate-400">{DEMO_ACCOUNTS.find(account => account.email === demoEmail)?.description}</p>
          <label className="mt-4 block text-xs text-slate-400">Email<input aria-label="Demo email" readOnly value={demoEmail} onFocus={event => event.target.select()} className="mt-1 w-full rounded-lg border border-white/10 bg-background p-2 text-xs text-slate-100" /></label>
          <label className="mt-3 block text-xs text-slate-400">Password<input aria-label="Demo password" readOnly value={DEMO_PASSWORD} onFocus={event => event.target.select()} className="mt-1 w-full rounded-lg border border-white/10 bg-background p-2 text-xs text-slate-100" /></label>
          <p className="mt-3 text-xs leading-5 text-slate-400">Use these details below. If Clerk asks for a test email code, enter <strong className="text-slate-200">424242</strong>. Start with Trade Twins → DEMO-COFFEE-001 for discrepancies, then Document Workbench and Why Blocked. External provider signals are sample data; AI runs use the configured models.</p>
        </div>}
        {signUp ? (
          <SignUp
            routing="hash"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/trades"
            appearance={appearance}
          />
        ) : (
          <SignIn
            key={demoEmail}
            initialValues={{ emailAddress: demoEmail }}
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
