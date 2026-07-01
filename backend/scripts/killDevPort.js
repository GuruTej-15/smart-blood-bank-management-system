const { execSync } = require("child_process");

const port = Number(process.env.PORT) || 5001;

function getListeningPids() {
  try {
    const output = execSync(`netstat -ano | findstr ":${port}"`, { encoding: "utf8" });
    const pids = new Set();

    for (const line of output.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.includes("LISTENING")) {
        continue;
      }

      const columns = trimmed.split(/\s+/);
      const pid = Number(columns[columns.length - 1]);
      if (Number.isInteger(pid) && pid > 0) {
        pids.add(pid);
      }
    }

    return [...pids];
  } catch (err) {
    return [];
  }
}

function getCommandLine(pid) {
  try {
    const command = `powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter 'ProcessId = ${pid}').CommandLine"`;
    return execSync(command, { encoding: "utf8" }).trim();
  } catch (err) {
    return "";
  }
}

function shouldKill(commandLine) {
  const normalized = commandLine.toLowerCase();
  return normalized.includes("server.js") || normalized.includes("nodemon") || normalized.includes("smart-blood-bank-backend");
}

for (const pid of getListeningPids()) {
  const commandLine = getCommandLine(pid);
  if (!commandLine) {
    continue;
  }

  if (shouldKill(commandLine)) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "inherit" });
      console.log(`[dev] Stopped stale backend process on port ${port} (PID ${pid})`);
    } catch (err) {
      console.warn(`[dev] Failed to stop PID ${pid} on port ${port}`);
    }
  }
}