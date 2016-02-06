if [ "$2" != "" ]; then
  echo "Downloading map $2 for $1..."
  ./gmaps2json_kml_to_json.sh $2 1> $1/basic.json
  node ./gmaps2json_update_locations_db.js $1
  cat $1/combined.json | node ./gmaps2json_format_food.js $1 | jq 'group_by(.location_group)' 1> $1/by-location.json
  node build-from-templates.js $1 > out/$1.html
  aws s3 cp out/$1.html s3://chrisward.co.uk/travel/$1/food/index.html --region eu-west-1
  aws s3 cp out/scripts/script.js s3://chrisward.co.uk/travel/$1/food/scripts/script.js --region eu-west-1

  lessc out/styles/style.less out/styles/style.css; aws s3 cp out/styles/style.css s3://chrisward.co.uk/travel/$1/food/styles/style.css --region eu-west-1

else
    echo "Usage: " $0 " [FOLDER] [MAP ID]"
fi
