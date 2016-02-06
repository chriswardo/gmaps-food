//DON'T USE THIS NOW. See gmaps2json_update_locations_db.js

// Take input of Places
// Load location db
// Add locations to Places
// Save location db
// Output Places

// Oh god, this code got so so messy. I apologise to my future self or anyone else who ever reads this.

const LOCATIONS_FILE = "./locations.json";
var loc = require(LOCATIONS_FILE);
var loccount = 0;
for ( var n in loc ) { loccount++; }
process.stderr.write( "\nLoaded " + loccount + " locations from db." );

var fs = require('fs');
var stdin = process.stdin,
    inputChunks = [],
    places = [];

stdin.resume();
stdin.setEncoding('utf8');

stdin.on('data', function (chunk) {
    inputChunks.push(chunk);
});

stdin.on('end', function () {
  var inputJSON = inputChunks.join('');
  
  places = JSON.parse(inputJSON);
    
  
  process.stderr.write( "\nProcessing Geocode data:\n" );
  processGeocode();
});


//const loc = [];
var count = 0;
var len = 0;
var processed = 0;
var countplaces = 0;
var processedplaces = 0;
var lenplaces = 0;



function processPlaces() {
  //console.log( "processing places" );
  countplaces = 0;
  processedplaces = 0;
  places.forEach( function(place,i) {
  
    setTimeout( function() {
      grabPlaceData( i, place.lat, place.lng );
    }, 1000 );
  
  } );
}

function grabPlaceData( i, lat, lng ) {
  if ( (lng + "," + lat) in loc && loc[lng + "," + lat].place_name ) {
    process.stderr.write( 'F' );
    countplaces++;
    for (var attrname in loc[lng + "," + lat]) { places[i][attrname] = loc[lng + "," + lat][attrname]; }
    if ( countplaces == places.length ) finishedPlaceParse();
    return;
  }
  else processedplaces++;
  
  var url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" + lng + "," + lat + "&radius=1&types=food&key=AIzaSyB9cSxcJcVGp3jmdN8VPj7itbk-n9FFnCA&sensor=true";
  
  var exec = require('child_process').exec;
  var cmd = "curl --silent '" + url + "' | jq '. | { place_name: .results[0].name, place_types: .results[0].types, address: .results[0].vicinity, status }'";
  
  setTimeout( function() {
  
    exec(cmd, function(error, stdout, stderr) {
      if ( error || stdout.length == 0 ) {
        process.stderr.write( 'E' );
        //process.stderr.write( JSON.stringify(error) );
      }
      else {
        var json = JSON.parse( stdout );
        if ( json.place_name != null ) {
        
          
          for (var attrname in json) { loc[ lng + "," + lat ][attrname] = json[attrname]; }
        
          fs.writeFile(LOCATIONS_FILE, JSON.stringify(loc), function(err) {
              //if(!err) process.stderr.write('S');
          }); 
        
          for (var attrname in json) { places[i][attrname] = json[attrname]; }
          process.stderr.write( '.' );
          lenplaces++;
        }
        else if ( json.status == "ZERO_RESULTS" ) {
          //loc[ lng + "," + lat ] = json;
          process.stderr.write( 'X' );
          lenplaces++;
        }
        else if ( json.status == "OVER_QUERY_LIMIT" ) {
          process.stderr.write( 'O' );
        }
      }
    
      countplaces++;
      if ( countplaces == places.length ) finishedPlaceParse();
    });
  }, 1000 );
  
}



function processGeocode() {
  //console.log( "processing places" );
  count = 0;
  processed = 0;
  places.forEach( function(place,i) {
  
    setTimeout( function() {
      grabLocationData( i, place.lat, place.lng );
    }, 1000 );
  
  } );
}

function grabLocationData( i, lat, lng ) {
  if ( (lng + "," + lat) in loc ) {
    process.stderr.write( 'F' );
    count++;
    for (var attrname in loc[lng + "," + lat]) { places[i][attrname] = loc[lng + "," + lat][attrname]; }
    if ( count == places.length ) finishedParse();
    return;
  }
  else processed++;
  
  var url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + lng + "," + lat + "&key=AIzaSyB9cSxcJcVGp3jmdN8VPj7itbk-n9FFnCA&sensor=true";
  
  var exec = require('child_process').exec;
  var cmd = "curl --silent '" + url + "' | jq '. | { address: .results[0].address_components[1].long_name, city: .results[0].address_components[-3].long_name, region: .results[0].address_components[-2].long_name, country: .results[0].address_components[-1].long_name, countryCode: .results[0].address_components[-1].short_name, location: [.results[0].address_components[].long_name], status: .status }'";
  //console.log( cmd );
  
  //var out = false;
  setTimeout( function() {
  
    exec(cmd, function(error, stdout, stderr) {
      if ( error || stdout.length == 0 ) {
        process.stderr.write( 'E' );
      }
      else {
        //console.log( "STDOUT: " + stdout.length );
        var json = JSON.parse( stdout );
        //process.stderr.write( stdout );
        if ( json.country != null ) {
          loc[ lng + "," + lat ] = json;
        
          fs.writeFile(LOCATIONS_FILE, JSON.stringify(loc), function(err) {
              //if(!err) process.stderr.write('S');
          }); 
        
          for (var attrname in json) { places[i][attrname] = json[attrname]; }
          
          
          process.stderr.write( '.' );
          len++;
        }
        else if ( json.status == "ZERO_RESULTS" ) {
          loc[ lng + "," + lat ] = json;
          process.stderr.write( 'X' );
          len++;
        }
        else if ( json.status == "OVER_QUERY_LIMIT" ) {
          process.stderr.write( 'O' );
        }
      }
    
      count++;
      if ( count == places.length ) finishedParse();
    });
  }, 1000 );
  
}

function finishedParse() {
  process.stderr.write( "|\n" );
  //process.stderr.write( count + ' of ' + places.length + ', ' + len + ' completed.' );
  if ( len == places.length || processed == 0 ) finishedProcessing();
  else setTimeout( processGeocode, 10000 );
}

function finishedPlaceParse() {
  process.stderr.write( "|\n" );
  //process.stderr.write( count + ' of ' + places.length + ', ' + len + ' completed.' );
  if ( lenplaces == places.length || processedplaces == 0 ) finishedAllProcessing();
  else setTimeout( processPlaces, 10000 );
}

function finishedProcessing() {

  process.stderr.write( "\nProcessing Place data:\n" );
  processPlaces();
}

function finishedAllProcessing() {
  //console.log( "YES" );
  process.stdout.write( JSON.stringify( places ) );
  //Save LOCATIONS_FILE
  fs.writeFile(LOCATIONS_FILE, JSON.stringify(loc), function(err) {
      if(err) {
          process.stderr.write('ERROR SAVING LOCATIONS DB');
      }
      //else process.stderr.write('SAVED LOCATIONS DB');
  }); 
}