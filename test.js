var iptoasn = require('./index.js')("cache/");

iptoasn.lastUpdated(function(err, t) {
  if (err) {
    console.error(err);
  } else {
    if (t > 1) {
      //updated more than 1 day ago, lets update from the net
      iptoasn.load({ update: true });
    } else {
      iptoasn.load();
    }
  }
});

var arr = ['50.21.180.100',
  '50.22.180.100',
  '1.38.1.1',
  2733834241,
  '8.8.8.8',
  '127.0.0.1',
  'asd'
]

iptoasn.on('ready', function() {
  arr.forEach(function(ip) {
    console.log(iptoasn.lookup(ip));
  })
});
