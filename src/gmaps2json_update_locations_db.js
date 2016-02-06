var Promise = require('promise');
var exec = require('promised-exec');

const API_KEY = "AIzaSyDdJdIoqW-kaIvI25iEkSu1CgEkXpTNtGU";
const LOCATIONS_DB = "../db/locations_db.json"; // lat,lng => location data
const PLACE_ID_DB = "../db/place_id_db.json"; // lat,lng => place_id
const PLACE_DETAILS_DB = "../db/place_details_db.json"; // place_id => place data

if ( process.argv.length < 3 ) {
  process.stderr.write( "Usage: " + process.argv[0] + " " + process.argv[1] + " [FOLDER]\n" );
  process.exit(1);
}
else {
  var folder = process.argv[2];
}
  

const PLACES_DATA = "../maps/" + folder + "/basic.json";
const PLACES_DATA_COMBINED = "../maps/" + folder + "/combined.json";

var places = require(PLACES_DATA);
var locations_db = require(LOCATIONS_DB);
var place_id_db = require(PLACE_ID_DB);
var place_details_db = require(PLACE_DETAILS_DB);

var fs = require('fs');


// TO RUN:
/*
VIETNAM:

./gmaps2json_kml_to_json.sh "z3eNgSynVnvQ.kJTp8Bet1GRQ" 1> vietnam/basic.json
node ./gmaps2json_update_locations_db.js vietnam
cat vietnam/combined.json | node ./gmaps2json_format_food.js vietnam | jq 'group_by(.location_group)' 1> vietnam/by-location.json
node build-from-templates.js vietnam > out/vietnam.html
aws s3 cp out/vietnam.html s3://chrisward.co.uk/travel/vietnam/food/index.html --region eu-west-1

lessc out/styles/style.less out/styles.css; aws s3 cp out/styles/style.css s3://chrisward.co.uk/travel/vietnam/food/styles/style.css --region eu-west-1


MALAYSIA:

./gmaps2json_kml_to_json.sh "z3eNgSynVnvQ.kXS79B-4MOxc" 1> malaysia/basic.json
node ./gmaps2json_update_locations_db.js malaysia
cat malaysia/combined.json | node ./gmaps2json_format_food.js malaysia | jq 'group_by(.location_group)' 1> malaysia/by-location.json
node build-from-templates.js malaysia > out/malaysia.html
aws s3 cp out/malaysia.html s3://chrisward.co.uk/travel/malaysia/food/index.html --region eu-west-1

lessc out/styles/style.less out/styles.css; aws s3 cp out/styles/style.css s3://chrisward.co.uk/travel/malaysia/food/styles/style.css --region eu-west-1



*/

// TODO: create overall shell script which takes the map id and folder name ('vietnam') and does everything.


// Location Data

getAllLocationData( places ).done(function (results) {
  process.stderr.write( "Got location data for " + ( results.length - places.length ) + " new places.\n" );
  runPlaceIDs();
}, function (err) {
    process.stderr.write( "ERROR" );
    console.log( err );
});



function writeCombined() {

  // Use places
  // Add each piece of data from locations_db
  // If there's a place_id in place_id_db then add place_id and each piece of data from place_details_db
  places.forEach( function(place,i) {
    
    for (var attrname in locations_db[place.lng + "," + place.lat]) { places[i][attrname] = locations_db[place.lng + "," + place.lat][attrname]; }
    
    var place_id = place_id_db[place.lng + "," + place.lat].place_id;
    if ( place_id != undefined ) {
      places[i].place_id = place_id;
      
      for (var attrname in place_details_db[place_id]) { places[i][attrname] = place_details_db[place_id][attrname]; }
    
    }
  });
  

  fs.writeFile(PLACES_DATA_COMBINED, JSON.stringify(places), function(err) {} );
  process.stderr.write( "\nSaved Combined DB.\n" );
}




function getAllLocationData( places ) {
  return Promise.all( places.map(getLocationData) );
}

function getLocationData( place ) {
  var lat = place.lat;
  var lng = place.lng;
  return new Promise(function (fulfill, reject){
    if ( (lng + "," + lat) in locations_db ) {
      //process.stderr.write( 'F' );
      fulfill( locations_db[ lng + "," + lat ] ); // found in db
    }
    else {
    
      //var url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" + lng + "," + lat + "&radius=1&types=food&key=" + API_KEY + "&sensor=true";
      var url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + lng + "," + lat + "&key=" + API_KEY + "&sensor=true";
  
      var cmd = "curl --silent '" + url + "' | jq '. | { address: .results[0].address_components[1].long_name, city: .results[0].address_components[-3].long_name, region: .results[0].address_components[-2].long_name, country: .results[0].address_components[-1].long_name, countryCode: .results[0].address_components[-1].short_name, location: [.results[0].address_components[].long_name], status: .status }'";
  
      exec_promise = exec(cmd);
      exec_promise.then(function (stdout) {

        if ( stdout.length > 0 ) {
          var data = {};
          var json = JSON.parse( stdout );
          if ( json.status == "OK" ) {
            process.stderr.write( '.' );
            data = json;
          
            locations_db[ place.lng + "," + place.lat ] = data;
            fs.writeFile(LOCATIONS_DB, JSON.stringify(locations_db), function(err) {} );
            fulfill(data);
          }
          else {
            //process.stderr.write( 'X' );
            reject( json.status );
          }
        }
        else {
          reject( "No output from exec: " + cmd );
        }
          
  
      },reject);
    }
  });
}





// Place ID

function runPlaceIDs() {

  // TODO: expand search (range and no longer just food).
  // 1. Exact name match?
  // 2. Close name match?
  // 3. First result is food?

  try {
    getAllPlaceIDs( places ).done(function (results) {
      process.stderr.write( "Got place ids for " + (results.length - places.length) + " new places.\n" );
  

      //Now that we have the place ids, we can get the place details...
      runPlaceDetails();

  
  
    }, function (err) {
        process.stderr.write( "ERROR" );
        //process.stderr.write( err );
        console.log( err );
    });
  }
  catch ( e ) {
    console.log( "Exception on runPlaceIDs" );
    console.log( e );
  }

}

function getAllPlaceIDs( places ) {
  return Promise.all( places.map(getPlaceID) );
}

function getPlaceID( place ) {
  return new Promise(function (fulfill, reject){
    
    var lat = place.lat;
    var lng = place.lng;
    if ( (lng + "," + lat) in place_id_db ) {
      //process.stderr.write( 'F' );
      fulfill( place_id_db[ lng + "," + lat ] ); // found in db
    }
    else {
      var namestart = place.name;
		  place.name.replace( /^(.+)\s*\(([^\)]+)\)$/gi, function(all, a, b) { namestart = a; }.bind(this) );
		  //process.stderr.write( 

      var url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" + lng + "," + lat + "&key=" + API_KEY + "&sensor=true&rankby=distance&keyword=" + namestart.replace(/ /g,'+').replace(/\'/g,"%27");

      //var url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" + lng + "," + lat + "&radius=2&types=food&key=" + API_KEY + "&sensor=true";
     // var url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + lng + "," + lat + "&key=AIzaSyB9cSxcJcVGp3jmdN8VPj7itbk-n9FFnCA&sensor=true";
  
      var cmd = "curl --silent '" + url + "' | jq '. | { place_id: .results[0].place_id, name: .results[0].name, status }'";
  
      //process.stderr.write( "\n" + cmd + "\n" );
      try {
        exec_promise = exec(cmd);
        exec_promise.then(function (stdout) {

          var data = {};
          if ( stdout.length > 0 ) {
            var json = JSON.parse( stdout );
            if ( json.status == "OK" ) {
              //process.stderr.write( "" + place.name + " => " + json.name + "\n" );
              process.stderr.write( '.' );
              data = json;
          
              place_id_db[ place.lng + "," + place.lat ] = data;
              fs.writeFile(PLACE_ID_DB, JSON.stringify(place_id_db), function(err) {} );
              fulfill(data);
            }
            else if ( json.status == "ZERO_RESULTS" ) {
              //process.stderr.write( 'Z' );
              place_id_db[ place.lng + "," + place.lat ] = data;
              fs.writeFile(PLACE_ID_DB, JSON.stringify(place_id_db), function(err) {} );
              fulfill(data); // no results but still fulfilled
            }
            else {
              //process.stderr.write( 'X' );
              reject( json.status );
            }
          }
          else {
            process.stderr.write( '0' );
            //process.stderr.write( cmd );
            reject( "No output from exec: " + cmd );
          }
  
        },reject);
      }
      catch ( e ) {
        
        process.stderr.write( "Exception with exec" );
        console.log(e);
      }
    }
  });
}




// Place Details


function runPlaceDetails() {
  getAllPlaceDetails( places ).catch(function (errorObject) {
    process.stderr.write( "EXCEPTION" );
    console.log( errorObject );
  }).done(function (results) {
    process.stderr.write( "Got place details for " + (results.length - places.length) + " new places.\n" );
    writeCombined();
  }, function (err) {
      process.stderr.write( "ERROR" );
      console.log( err );
  });
}

function getAllPlaceDetails( places ) {
  return Promise.all( places.map(getPlaceDetails) );
}

function getPlaceDetails( place ) {
  return new Promise(function (fulfill, reject){
  
    var place_id = place_id_db[ place.lng + "," + place.lat ].place_id;
    if ( place_id == undefined ) {
      //process.stderr.write( 'X' );
      fulfill( {} ); // doesn't have a place
    }
    else if ( place_id in place_details_db ) {
      //process.stderr.write( 'F' );
      fulfill( place_details_db[ place_id ] ); // found in db
    }
    else {
    
      var url = "https://maps.googleapis.com/maps/api/place/details/json?placeid=" + place_id + "&key=" + API_KEY + "&sensor=true";
  
      var cmd = "curl --silent '" + url + "' | jq '. | { place_name: .result.name, address: .result.vicinity, phone: .result.formatted_phone_number, website: .result.website, types: .result.types, status }'";
  
      exec_promise = exec(cmd);
      exec_promise.then(function (stdout) {

        if ( stdout.length > 0 ) {
          var data = {};
          var json = JSON.parse( stdout );
          if ( json.status == "OK" ) {
            process.stderr.write( '.' );
            data = json;
          
            place_details_db[ place_id ] = data;
            fs.writeFile(PLACE_DETAILS_DB, JSON.stringify(place_details_db), function(err) {} );
            fulfill(data);
          }
          else if ( json.status == "ZERO_RESULTS" ) {
            //process.stderr.write( 'Z' );
            place_details_db[ place_id ] = data;
            fs.writeFile(PLACE_DETAILS_DB, JSON.stringify(place_details_db), function(err) {} );
            fulfill(data); // no results but still fulfilled
          }
          else {
            //process.stderr.write( 'X' );
            reject( json.status );
          }
        }
        else {
          reject( "No output from exec: " + cmd );
        }
  
      },reject);
    }
  });
}

