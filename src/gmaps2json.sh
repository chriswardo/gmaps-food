if [ "$2" != "" ]; then
  echo "Downloading map $2 for $1..."
  ./src/gmaps2json_kml_to_json.sh $2 1> ./maps/$1/basic.json
  node ./src/gmaps2json_update_locations_db.js $1
  cat ./maps/$1/combined.json | node ./src/gmaps2json_format_food.js $1 | jq 'group_by(.location_slug) | [ .[] | { ( .[0].location_slug ): . | group_by(.category) | [ .[] | { ( .[0].category ): . | sort_by(.order) } ] | [ reduce .[] as $item ({}; . + $item) ][0] } ] | reduce .[] as $item ({}; . + $item)' 1> ./maps/$1/location-category.json
  node ./src/build-from-templates.js $1 > out/$1.html
  lessc out/styles/style.less out/styles/style.css

else
    echo "Usage: " $0 " [FOLDER] [MAP ID]"
fi
