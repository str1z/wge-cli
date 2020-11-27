#!/usr/bin/env node
const cli = require("cliful");
const path = require("path");
const wge = require("wge");
const LiveServer = require("../class/LiveServer");

const app = new cli.App({
  name: "Wagon Engine CLI",
  description: "The CLI for the Wagon Engine.",
  author: "str1z",
  cmds: [
    {
      name: "serve",
      description: "Start the Wagon Engine live development server!",
      args: ["serve", { value: ".", type: "string", name: "dir" }],
      opts: { "port p": { value: 5000, type: "integer" }, "inject i": { value: false, type: "string" } },
      exec: ({ dir, port, inject }) => {
        let full = path.resolve(process.cwd(), dir);
        if (inject) {
          if (inject === "true") inject = "inject.js";
          let injectPath = path.resolve(full, inject);
          cli.print(`Injecting ${injectPath} into wge...`);
          let fn;
          try {
            require(injectPath);
            if (typeof fn === "function") fn(wge);
            else cli.print("{c:red}Failed to inject: injector must be of type function!{s:0}");
          } catch (e) {
            cli.print("{c:red}Failed to inject:{s:0}");
            console.log(e);
          }
        }
        new LiveServer(full).listen(port, () => {
          cli.print(`{c:lime}Your development server is live on {c:aqua}http://localhost:${port}{s:0}`);
        });
      },
    },
  ],
});

app.useHelp();
app.useInfo();
app.exec();
