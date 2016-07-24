"use strict";

const http = require("http");
const fs = require("fs");

const bgpTableUrl = "http://thyme.apnic.net/current/data-raw-table";
const lockFilename = "dbupdate.lock";
const bgpDbFilename = "db.txt";

module.exports = (dst, callback) => {
  http.get(bgpTableUrl, (response) => {
    const writeStream = fs.createWriteStream(dst);
    response.on("data", (chunk) => writeStream.write(chunk.toString().replace(/\t+/g, " ")));
    response.on("end", () => {
      writeStream.close();
      callback('finished');
    });
  });
};
