"use strict";

let BGPSearch;
try {
  BGPSearch = require("./build/Debug/addon").BGPSearch;
} catch(e) {
  BGPSearch = require("./build/Release/addon").BGPSearch;
}

const http = require("http");
const fs = require("fs");
const fsext = require("fs-ext");
const byline = require("byline");

const lockFilename = "dbupdate.lock";
const bgpDbFilename = "db.txt";

const asNamesUrl = "http://thyme.apnic.net/current/data-used-autnums";
const asNamesFilename = "used-autnums.txt";

class IPtoASN {
  constructor(cachedir) {
    this.cachedir = cachedir;
    this.bgpsearch = new BGPSearch();
    this.asnames = {};
    try {
      fs.mkdirSync(cachedir);
    } catch(e) {}
  }

  _updateASNames(callback) {
    http.get(asNamesUrl, (response) => {
      const writeStream = fs.createWriteStream(this.cachedir + "/" + asNamesFilename);
      response.on("data", (chunk) => writeStream.write(chunk));
      response.on("end", () => {
        writeStream.close();
        if(callback)
          callback();
      });
    });
  }

  update(source, callback) {
    fs.open(this.cachedir + "/" + lockFilename, 'a', (err, fd) => {
      if(err) throw err;
      fsext.flock(fd, 'exnb', (err) => {
        if(err) {
          if(err.code == "EAGAIN") {
            callback('cache_locked');
            return;
          } else {
            throw err;
          }
        }
        if(!source) source = "thyme.apnic.net";
        this._updateASNames(() => {
          require(`./sources/${source}`)(this.cachedir + "/" + bgpDbFilename, () => {
            fsext.flock(fd, 'un');
            callback('finished');
          });
        });
      });
    });
  }

  load(callback) {
    fs.open(this.cachedir + "/" + lockFilename, 'a', (err, fd) => {
      if(err) throw err;
      fsext.flock(fd, 'sh', (err) => {
        if(err) throw err;

        const rstream = byline(fs.createReadStream(this.cachedir + "/" + asNamesFilename));
        rstream.on("data", (line) => {
          let tokens = line.toString().trim().split(" ");
          let asn = tokens.shift();
          let name = tokens.join(" ");
          this.asnames[asn] = { asn, name };
        });
        rstream.on('end', () => {
          const rstream = byline(fs.createReadStream(this.cachedir + "/" + bgpDbFilename));
          rstream.on('data', (line) => {
            this.bgpsearch.push(line.toString().trim());
          });
          rstream.on("end", () => {
            fsext.flock(fd, 'un');
            callback();
          });
        });
      });
    });
  }

  lastUpdated(callback) {
    fs.stat(this.cachedir + "/" + bgpDbFilename, (err, stat) => {
      let daysSinceUpdate;
      // FIXME: should check the error probably...
      if(err) daysSinceUpdate = Infinity;
      else {
        let msSinceUpdate = new Date() - new Date(stat.mtime);
        daysSinceUpdate = msSinceUpdate/1000/3600/24.0;
      }
      callback(daysSinceUpdate);
    });
  }

  lookup(ip) {
    let asn = this.bgpsearch.find(ip);
    if(this.asnames[asn]) {
      return this.asnames[asn];
    } else if(asn) {
      return { asn };
    } else {
      return null;
    }
  }
}

module.exports = (cachedir) => {
  return new IPtoASN(cachedir);
};
