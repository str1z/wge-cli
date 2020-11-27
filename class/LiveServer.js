const http = require("http");
const fs = require("fs");
const path = require("path");
const wge = require("wge");
const mime = require("../lib/mime");
const watch = require("../lib/watch");
const wagonTypes = [".html", ".htm", ".wg"];
const templates = {
  error: path.resolve(__dirname, "../template/error.html"),
  404: path.resolve(__dirname, "../template/404.html"),
};
const injection = `
<script>
/* Injected */
function doHotReload(){fetch("/do-hot-reload").then(() => location.reload()).catch(() => doHotReload())}; doHotReload()
</script>
`;
class LiveServer {
  constructor(dir = process.cwd(), map = {}) {
    this.pool = [];
    this.dir = dir;
    this.map = map;
    this.createServer();
    this.watch();
  }
  watch() {
    watch(this.dir, () => {
      for (let res of this.pool) res.end();
      this.pool.splice(0, this.pool.length);
    });
  }
  createServer() {
    this.server = http.createServer((req, res) => {
      let url = req.url;
      if (url === "/do-hot-reload") return this.pool.push(res);
      if (this.map[url]) url = this.map[url];
      let filepath = path.join(this.dir, url);
      let extname = path.extname(filepath);
      let isTemplate = wagonTypes.includes(extname);
      res.setHeader("Content-Type", isTemplate ? "text/html" : mime[extname] || "application/octet-stream");
      if (isTemplate) return this.handleTemplate(req, res, filepath);
      this.handleFile(req, res, filepath);
    });
  }
  listen(port = 8080, callback = () => {}) {
    this.server.listen(port).on("listening", callback);
  }
  async handleTemplate(req, res, filepath) {
    if (!fs.existsSync(filepath)) return this.handle404(req, res, filepath);
    let dataFile = filepath + ".js";
    let data;
    try {
      delete require.cache[require.resolve(dataFile)];
      data = require(dataFile);
    } catch (e) {}
    let template = wge.Template.fromFile(filepath);
    let out;
    try {
      out = await template.compile(true)(data);
    } catch (error) {
      out = wge.render(templates.error, { error, template }, false);
      console.log(error);
    }
    res.end(injection + out);
  }
  handleFile(req, res, filepath) {
    fs.createReadStream(filepath)
      .on("error", () => this.handle404(req, res, filepath))
      .pipe(res);
  }
  handle404(req, res, filepath) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/html");
    let folders;
    if (fs.existsSync(filepath) && fs.statSync(filepath).isDirectory()) folders = fs.readdirSync(filepath);
    res.end(injection + wge.render(templates[404], { url: req.url, filepath, folders }, false));
  }
}
module.exports = LiveServer;
