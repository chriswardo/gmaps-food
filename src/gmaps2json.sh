if [ "$2" != "" ]; then


  touch out/$1/images/build_start
  mkdir -p out/$1/images/original
  mkdir -p out/$1/images/large
  mkdir -p out/$1/images/medium
  mkdir -p out/$1/images/thumb
  mkdir -p out/$1/images/new

  echo "Downloading map $2 for $1..."
  ./src/gmaps2json_kml_to_json.sh $2 1> ./maps/$1/basic.json
  node ./src/gmaps2json_update_locations_db.js $1
  cat ./maps/$1/combined.json | node ./src/gmaps2json_get_images.js $1 | node ./src/gmaps2json_format_food.js $1 | jq . 1> ./maps/$1/location-food.json

  c=$(find ./out/$1/images/new/ -maxdepth 1 -iname "*.jpg" -print0 | tr -d -c "\000" | wc -c)
  if [ $c -gt 0 ]; then
    echo "Processing new images..."
    for file in ./out/$1/images/new/*; do convert -define jpeg:size=160x160 $file[0] -thumbnail 80x80^ -strip -quality 60 -gravity center -extent 80x80 ./out/$1/images/thumb/`basename $file`; convert $file[0] -resize 1000x1000 -strip -quality 65 ./out/$1/images/large/`basename $file`; convert $file[0] -resize 800x800 -strip -quality 65 ./out/$1/images/medium/`basename $file`; done
    mv ./out/$1/images/new/* ./out/$1/images/original/
  fi

  #cat ./maps/$1/combined.json | node ./src/gmaps2json_format_food.js $1 | jq . 1> ./maps/$1/location-food.json
  cat ./maps/$1/location-food.json | jq 'group_by(.location_slug) | [ .[] | { ( .[0].location_slug ): . | group_by(.category) | [ .[] | { ( .[0].category ): . | sort_by(.order) } ] | [ reduce .[] as $item ({}; . + $item) ][0] } ] | reduce .[] as $item ({}; . + $item)' 1> ./maps/$1/location-category.json


  mkdir -p out/$1/styles
  mkdir -p out/$1/scripts
  cp templates/styles/style.less out/$1/styles/style.less
  lessc out/$1/styles/style.less out/$1/styles/style.min.css --clean-css="--s1 --advanced --compatibility=ie8"
  gzip -9 -f --keep out/$1/styles/style.min.css

  gzip -9 -f --keep out/$1/styles/swipebox.min.css

  node ./src/build-from-templates.js $1 out/$1/styles/style.min.css
  html-minifier --collapse-whitespace out/$1/index.html -o out/$1/index.min.html
  gzip -9 -f --keep out/$1/index.min.html

  for D in `find ./out/$1/ -depth 1 -type d \! -name "images" \! -name "img" \! -name "scripts" \! -name "styles" -exec basename {} \;`
  do
    html-minifier --collapse-whitespace out/$1/${D}/index.html -o out/$1/${D}/index.min.html
    gzip -9 -f --keep out/$1/${D}/index.min.html
  done

  cp templates/scripts/script.js out/$1/scripts/script.js
  minify out/$1/scripts/script.js

  gzip -9 -f --keep out/$1/scripts/script.min.js

else
    echo "Usage: " $0 " [FOLDER] [MAP ID]"
fi
