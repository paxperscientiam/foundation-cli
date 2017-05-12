var bhttp = require('bhttp');
var Promise = require("bluebird");

module.exports = function fetchUrl(hostname, path) {
  var url = hostname+path;
  return Promise.try(function() {
    return bhttp.get(url);
  })
}
