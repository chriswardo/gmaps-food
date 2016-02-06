if [ "$1" != "" ]; then
  curl --silent 'https://www.google.com/maps/d/kml?&forcekml=1&mid='$1 | xml2json -t xml2json --strip_text --strip_namespace | jq '[ .kml.Document.Folder[].Placemark[] | { name: .name?, lat: (.Point.coordinates?|values|tostring/",")[0], lng: (.Point.coordinates?|values|tostring/",")[1], description: .description?|values, images: (.ExtendedData.Data.value? | tostring / " " - [ "null" ]), icon: .styleUrl?, visited: .name?|endswith("(not visited)")|not } ]' | jq '[ .[] | select( .icon == "#icon-1075" or .icon == "#icon-1087" or .icon == "#icon-1085" or .icon == "#icon-991" ) ]'

else
    echo "Missing MAP ID. Usage: " $0 " [MAP ID]"
fi
