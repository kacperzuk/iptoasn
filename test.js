// you must pass a directory in which database will be saved
// if it doesn't exist, it will be created
const iptoasn = require("./index")("cache/");

// check when the database was updated
// t are days
// t is Infinity if there's no database at all
iptoasn.lastUpdated(function(err, t) {
  // update the database if it's older than 1 day
  // you must call .load() even if you don't update the database
  if (t > 31) {
    iptoasn.load({ update: true });
  } else {
    iptoasn.load();
  }
})

var arr = ['50.21.180.100',
  '50.22.180.100',
  '1.38.1.1',
  2733834241,
  '8.8.8.8',
  '127.0.0.1',
  'asd'
];

// ready event is emitted when the database has been loaded
iptoasn.on("ready", function() {
  arr.forEach(function(ip) {
    console.log(ip, '-', iptoasn.lookup(ip));
  })
});
