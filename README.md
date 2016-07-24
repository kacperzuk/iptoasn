# iptoasn

Node.JS module for getting ASN for a given IP address. It uses data from
http://thyme.apnic.net/current/ .

See https://www.npmjs.com/package/ip2asn for a similar module that uses
MaxMind's GeoLite database.

## Installation

`npm install --save iptoasn`

## Description

This module downloads raw BGP table (~13MB) and ASN to name mapping (~2MB)
files from http://thyme.apnic.net/current/ and converts them into a more useful
format (~18M) that allows for a quick binary search. It will require about
30MB of disk space and ~150MB of memory (that's something I'll be happy to
accept PR for, however lookup speed is a priority).

## Usage

```javascript
// you must pass a directory in which database will be saved
// if it doesn't exist, it will be created
const iptoasn = require("iptoasn")("cache/");

function start() {
  var arr = ['50.21.180.100',
    '50.22.180.100',
    '1.38.1.1',
    2733834241,
    '8.8.8.8',
    '127.0.0.1',
    'asd'
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
```

Result of this sample script:

```
50.21.180.100 - { asn: '8560', name: '1&1 Internet AG' }
50.22.180.100 - { asn: '36351', name: 'SoftLayer Technologies Inc.' }
1.38.1.1 - { asn: '38266',
  name: 'Vodafone Essar Ltd., Telecommunication - Value Added Servi' }
2733834241 '-' { asn: '62567', name: 'Digital Ocean, Inc.' }
8.8.8.8 - { asn: '15169', name: 'Google Inc.' }
127.0.0.1 - null
asd - null
```

## TODO

* IPv6 not even tested...
* Memory usage is high
* Proper tests
