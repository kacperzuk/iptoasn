// you must pass a directory in which database will be saved
// if it doesn't exist, it will be created
const iptoasn = require("./index")("cache/");

function start() {
  var arr = ['50.21.180.100',
    '50.22.180.100',
    '1.38.1.1',
    '8.8.8.8',
    '127.0.0.1'
  ];

  arr.forEach(function(ip) {
    console.log(ip, '-', iptoasn.lookup(ip));
  })
}

// check when the database was updated
// t are days
// t is Infinity if there's no database at all
iptoasn.lastUpdated(function(t) {
  // update the database if it's older than 31 days
  // you must call .load() even if you don't update the database
  if (t > 31) {
    iptoasn.update(null, () => {
      iptoasn.load(start);
    });
  } else {
    iptoasn.load(start);
  }
});
