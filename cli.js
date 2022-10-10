const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");
const { cli } = require("@remix-run/dev");
const httpProxy = require("http-proxy");
const chokidar = require("chokidar");

function spawnServer(command) {
  return spawn(command, { stdio: "inherit", shell: true });
}

async function run() {
  let serverCommand = process.argv.slice(3).join(" ");

  if (!serverCommand.length) {
    throw new Error(
      "You must provide a command to run the server. For example: `node ./cli.js -- node ./server.js`"
    );
  }

  let proxy = httpProxy.createProxyServer();
  let app = path.resolve(process.cwd(), "app");
  let server = path.resolve(process.cwd(), "server.js");

  let serverProcess;

  chokidar
    .watch([app, server], { persistent: true })
    .on("ready", () => {
      serverProcess = spawnServer(serverCommand);
      console.log(serverProcess);
      console.log("started server");
    })
    .on("change", () => {
      console.log("restarting server");
      process.kill(serverProcess.pid);
      console.log("stopped server");
      serverProcess = spawnServer(serverCommand);
      console.log("started server");
    });

  void cli.run(["watch", "."]);
  console.log("running remix watch");

  http
    .createServer((req, res) => {
      proxy.web(req, res, { target: "http://localhost:3000" });
    })
    .listen(9000);
}

run();
