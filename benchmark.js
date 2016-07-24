"use strict";

var iptoasn = require("./index")("cache/");
var ip = require("ip");

iptoasn.load(() => {
  var addr = new Array(1000*1000);
  var d = ip.toLong("255.255.255.255")/addr.length;
  for (var i = 0; i < addr.length; i++) {
    addr[i] = ip.fromLong(Math.floor(i * d));
  }

  var i = 0;
  var start = Date.now();
  for (var i = 0; i < addr.length; i++) {
    iptoasn.lookup(addr[i]);
  };
  var end = Date.now();

  console.log("Benchmark took: ", (end-start), "ms (avg", Math.ceil((end-start)/addr.length*1000), "us per lookup)");



});

