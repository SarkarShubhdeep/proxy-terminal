import { getAppEnv } from "@/lib/env";

export function AppShell() {
  const { appName, vfsFolderName } = getAppEnv();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#0d1117] font-mono text-[#c9d1d9]">
      <header className="flex items-center justify-between border-b border-[#30363d] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
          <span className="ml-3 text-sm text-[#8b949e]">{appName}</span>
        </div>
        <span className="text-xs text-[#8b949e]">Phase 0 — bootstrap</span>
      </header>

      <main className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12">
        <pre className="mb-8 text-sm leading-relaxed text-[#58a6ff]">
          {`  ____                        _           _____                   _             _
 |  _ \\ _ __ _____  ___   _  | |_ ___    |_   _|__ _ __ _ __ ___ (_)_ __   __ _| |
 | |_) | '__/ _ \\ \\/ / | | | | __/ _ \\_____| |/ _ \\ '__| '_ \` _ \\| | '_ \\ / _\` | |
 |  __/| | | (_) >  <| |_| | | || (_) |_____| |  __/ |  | | | | | | | | | (_| | |
 |_|   |_|  \\___/_/\\_\\\\__, |  \\__\\___/      |_|\\___|_|  |_| |_| |_|_|_| |_|\\__,_|_|
                      |___/`}
        </pre>

        <div className="space-y-3 text-sm">
          <p>
            <span className="text-[#7ee787]">guest@proxy</span>
            <span className="text-[#8b949e]">:</span>
            <span className="text-[#79c0ff]">~</span>
            <span className="text-[#8b949e]">$ </span>
            <span>echo &quot;Welcome to {appName}&quot;</span>
          </p>
          <p className="text-[#c9d1d9]">Welcome to {appName}</p>
          <p className="text-[#8b949e]">
            A secured web terminal for managing{" "}
            <span className="text-[#c9d1d9]">.txt</span>,{" "}
            <span className="text-[#c9d1d9]">.md</span>, and{" "}
            <span className="text-[#c9d1d9]">.doc</span> files in Google
            Drive.
          </p>
          <p className="pt-4 text-[#8b949e]">
            Mount folder:{" "}
            <span className="text-[#ffa657]">~/{vfsFolderName}</span>
          </p>
          <p className="text-[#8b949e]">
            Next up: run{" "}
            <span className="text-[#c9d1d9]">login-drive</span> after Phase 1
            auth is wired.
          </p>
        </div>
      </main>
    </div>
  );
}
