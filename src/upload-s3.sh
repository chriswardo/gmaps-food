if [ "$1" != "" ]; then
  #86400
  aws s3 cp out/styles/style.min.css.gz s3://chrisward.co.uk/travel/$1/food/styles/style.min.css --region eu-west-1 --metadata-directive REPLACE --content-type "text/css" --content-encoding "gzip" --cache-control "max-age=2419200"
  aws s3 cp out/$1.html.gz s3://chrisward.co.uk/travel/$1/food/index.html --region eu-west-1 --metadata-directive REPLACE --content-type "text/html" --content-encoding "gzip" --cache-control "max-age=2419200"
  aws s3 cp out/scripts/script.min.js.gz s3://chrisward.co.uk/travel/$1/food/scripts/script.min.js --region eu-west-1 --metadata-directive REPLACE --content-type "application/x-javascript" --content-encoding "gzip" --cache-control "max-age=2419200"


  aws s3 cp out/styles/swipebox.min.css.gz s3://chrisward.co.uk/travel/$1/food/styles/swipebox.min.css.gz --region eu-west-1 --metadata-directive REPLACE --content-type "text/css" --content-encoding "gzip" --cache-control "max-age=2419200"

  aws cloudfront create-invalidation --distribution-id E2JH6T6MPLSO2D --paths /travel/$1/food/* | jq '(. | keys[0]) + " " + (.[ . | keys[0] ].Status?)'

else
    echo "Usage: " $0 " [FOLDER]"
fi
