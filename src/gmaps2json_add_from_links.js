"use strict";
var request = require("request");
var cheerio = require("cheerio");
var Promise = require('promise');
var exec = require('promised-exec');


if (process.argv.length < 3) {
  process.stderr.write("Usage: " + process.argv[0] + " " + process.argv[1] + " [FOLDER]\n");
  process.exit(1);
} else {
  var folder = process.argv[2];
}

process.stderr.write("[ADDING DATA FROM EXTERNAL LINKS] Processing JSON...\n");

var stdin = process.stdin,
  stdout = process.stdout,
  inputChunks = [],
  places = [];



function getHoursFromFoody(url) {
  return new Promise(function (fulfill, reject) {
    request({
      uri: url
    }, function (error, response, body) {
    
      if (response) {
      
        var $ = cheerio.load(body), allHours = [];
        $(".micro-timesopen > span > span").each(function () {
          var hours = $(this).html().replace(new RegExp('<span>', 'g'), '').replace(new RegExp('</span>', 'g'), '');
          if (!isNaN(parseInt(hours.substr(0, 1)))) {
            allHours.push(hours);
          }
        });
        fulfill(allHours);
      } else {
        reject('no response');
      }
    });
  });
}

function processPlaces() {
  places.forEach(function (place, i) {
    places[i].links.forEach(function (link, j) {
      if (link.url.indexOf("foody.vn") > -1) {
        getHoursFromFoody(link.url).then(function (results) {
          process.stderr.write(link.url + '\n');
          process.stderr.write('\t' + results + '\n');
        });
      }
    });
  
  });
}


stdin.resume();
stdin.setEncoding('utf8');

stdin.on('data', function (chunk) {
  inputChunks.push(chunk);
});

stdin.on('end', function () {
  var inputJSON = inputChunks.join('');
  
  places = JSON.parse(inputJSON);
  processPlaces();
  
});



