if [ "$2" != "" ]; then
  echo "Downloading map $2 for $1..."
  ./src/gmaps2json_kml_to_json.sh $2 1> ./maps/$1/basic.json
  node ./src/gmaps2json_update_locations_db.js $1
  cat ./maps/$1/combined.json | node ./src/gmaps2json_format_food.js $1 | jq 'group_by(.location_slug) | [ .[] | { ( .[0].location_slug ): . | group_by(.category) | [ .[] | { ( .[0].category ): . | sort_by(.order) } ] | [ reduce .[] as $item ({}; . + $item) ][0] } ] | reduce .[] as $item ({}; . + $item)' 1> ./maps/$1/location-category.json
  node ./src/build-from-templates.js $1 > out/$1.max.html
  html-minifier --collapse-whitespace out/$1.max.html -o out/$1.html
  gzip -9 -f --keep out/$1.html
  
  cp templates/styles/style.less out/styles/style.less
  lessc out/styles/style.less out/styles/style.min.css --clean-css="--s1 --advanced --compatibility=ie8"
  #curl -s https://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css >> out/styles/style.min.css
  #curl -s http://fonts.googleapis.com/css?family=Roboto:400,500,300 >> out/styles/style.min.css
  #curl -s https://fonts.googleapis.com/icon?family=Material+Icons >> out/styles/style.min.css
  #cat out/styles/swipebox.min.css >> out/styles/style.min.css
  gzip -9 -f --keep out/styles/style.min.css
  
  cp templates/scripts/script.js out/scripts/script.js
  minify out/scripts/script.js
  #curl -s https://code.jquery.com/jquery-2.1.3.min.js > out/scripts/combined.min.js
  #cat out/scripts/jquery.swipebox.min.js >> out/scripts/combined.min.js
  #cat out/scripts/script.min.js >> out/scripts/combined.min.js
  gzip -9 -f --keep out/scripts/script.min.js

else
    echo "Usage: " $0 " [FOLDER] [MAP ID]"
fi
