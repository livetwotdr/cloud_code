/* const NextCors = require("nextjs-cors");

async function commonFilter(req, resp) {
  await NextCors(req, resp, {
    // Options
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    origin: "*",
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  });
  resp.setHeader(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate"
  );
  resp.setHeader("Expires", "-1");
  resp.setHeader("Pragma", "no-cache");
}

module.exports = commonFilter; */