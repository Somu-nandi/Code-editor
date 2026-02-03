import fs from "fs/promises";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runCode(socket, { code, lang, stdin = "" }) {
  const runId = uuidv4();
  const tmpDir = path.join(__dirname, "tmp_runs");
  await fs.mkdir(tmpDir, { recursive: true });

  let filename, compileCmd, runCmd, outExe, className;
  if (lang === "python") {
    filename = `code-${runId}.py`;
    await fs.writeFile(path.join(tmpDir, filename), code, "utf8");
    runCmd = ["python", [path.join(tmpDir, filename)]];
  } else if (lang === "java") {
    // Extract class name from Java code (look for "public class ClassName")
    const classMatch = code.match(/public\s+class\s+(\w+)/);
    className = classMatch ? classMatch[1] : `Code${runId.replace(/-/g, "")}`;
    filename = `${className}.java`;
    await fs.writeFile(path.join(tmpDir, filename), code, "utf8");
    compileCmd = ["javac", [path.join(tmpDir, filename)]];
    runCmd = ["java", ["-cp", tmpDir, className]];
  } else if (lang === "c") {
    filename = `code-${runId}.c`;
    outExe = path.join(tmpDir, `a-${runId}`);
    await fs.writeFile(path.join(tmpDir, filename), code, "utf8");
    compileCmd = ["gcc", [path.join(tmpDir, filename), "-O2", "-std=c11", "-o", outExe]];
    runCmd = [outExe, []];
  } else if (lang === "cpp") {
    filename = `code-${runId}.cpp`;
    outExe = path.join(tmpDir, `a-${runId}`);
    await fs.writeFile(path.join(tmpDir, filename), code, "utf8");
    compileCmd = ["g++", [path.join(tmpDir, filename), "-O2", "-std=c++17", "-o", outExe]];
    runCmd = [outExe, []];

  } else {
    socket.emit("run-output", { system: `Language ${lang} not supported.\n` });
    return;
  }

  try {
    if (compileCmd) {
      socket.emit("run-output", { system: "Compiling...\n" });
      await runCommandAndStream(socket, compileCmd[0], compileCmd[1]);
    }

    socket.emit("run-output", { system: "Running...\n" });
    await runCommandAndStream(socket, runCmd[0], runCmd[1], stdin);
  } catch (err) {
    socket.emit("run-output", { stderr: `Error: ${err.message}\n` });
  } finally {
    setTimeout(async () => {
      try {
        await fs.rm(path.join(tmpDir, filename), { force: true });
        if (outExe) await fs.rm(outExe, { force: true });
        // Clean up Java .class files
        if (lang === "java" && className) {
          await fs.rm(path.join(tmpDir, `${className}.class`), { force: true });
        }
      } catch (e) { }
    }, 5000);
  }
}

function runCommandAndStream(socket, cmd, args = [], stdin = "") {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "pipe" });

    child.stdout.on("data", (d) => {
      socket.emit("run-output", { stdout: d.toString() });
    });
    child.stderr.on("data", (d) => {
      socket.emit("run-output", { stderr: d.toString() });
    });

    child.on("error", (err) => {
      socket.emit("run-output", { stderr: `Execution error: ${err.message}\n` });
      reject(err);
    });

    child.on("close", (code) => {
      socket.emit("run-output", { system: `\nProcess exited with code ${code}\n` });
      resolve();
    });

    if (stdin) {
      child.stdin.write(stdin);
    }
    child.stdin.end();
  });
}
