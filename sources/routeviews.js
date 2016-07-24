"use strict";

const http = require("http");
const fs = require("fs");
const bz2 = require("unbzip2-stream");
const byline = require("byline");

const bgpTableUrl = "http://archive.routeviews.org/dnszones/originas.bz2";

module.exports = (dst, callback) => {
  http.get(bgpTableUrl, (response) => {
    const writeStream = fs.createWriteStream(dst);
    let prev = null;
    response.pipe(bz2()).pipe(byline())
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
