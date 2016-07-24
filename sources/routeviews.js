"use strict";

const http = require("http");
const fs = require("fs");
const byline = require("byline");
const child_process = require("child_process");

const bgpTableUrl = "http://archive.routeviews.org/dnszones/originas.bz2";

module.exports = (dst, callback) => {
  const bz2 = child_process.spawn("bunzip2");
  http.get(bgpTableUrl, (response) => {
    response.pipe(bz2.stdin);
    let prev = null;
    const writeStream = fs.createWriteStream(dst);
    bz2.stdout.pipe(byline())
      .on("data", (line) => {
        let tokens = line
          .toString()
          .trim()
          .replace(/\t+/g, " ")
          .replace(/"/g, "")
          .split(" ");
        let len = tokens.length;
        let asn = tokens[len-3].trim();
        let network = tokens[len-2].trim();
        let netmask = tokens[len-1].trim();
        let formatted = `${network}/${netmask} ${asn}\n`;
        if(formatted != prev) {
          writeStream.write(formatted);
          prev = formatted;
        }
      })
      .on("end", () => {
        writeStream.close();
        callback('finished');
      });
  });
};
