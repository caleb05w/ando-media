import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ando Agent Interactions",
};

export default function AndoAgentInteractionsPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-16 py-32">
        <h1 className="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
          Ando Agent Interactions
        </h1>
        <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          New page scaffold. Start building the agent interaction UI here.
        </p>
      </main>
    </div>
  );
}
