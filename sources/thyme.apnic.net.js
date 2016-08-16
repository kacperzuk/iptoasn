"use strict";

const http = require("http");
const replace = require("replacestream");
const fs = require("fs");

const bgpTableUrl = "http://thyme.apnic.net/current/data-raw-table";

module.exports = (dst, callback) => {
  http.get(bgpTableUrl, (response) => {
    const writeStream = fs.createWriteStream(dst);
    response.pipe(replace(/\t+/g, " "))
        .pipe(writeStream)
        .on("finish", () => {
          writeStream.close();
          callback('finished');
        });
  });
};
