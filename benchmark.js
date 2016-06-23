var iptoasn = require("./index")("cache/");
var ip = require("ip");

iptoasn.lastUpdated(function(err, t) {
  if (t > 2) {
    iptoasn.load({ update: true });
  } else {
    iptoasn.load();
  }
});

var addr = new Array(1000*1000);
var d = ip.toLong("255.255.255.255")/addr.length;
for (var i = 0; i < addr.length; i++) {
  addr[i] = ip.fromLong(Math.floor(i * d));
}

iptoasn.on("ready", function(){
  var i = 0;
  var start = Date.now();
  for (var i = 0; i < addr.length; i++) {
    iptoasn.lookup(addr[i]);
  };
  var end = Date.now();
  console.log("Benchmark took: ", (end-start), "ms");
});

