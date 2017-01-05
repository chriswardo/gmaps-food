if [ "$1" != "" ]; then

  aws s3 cp out/$1/styles/style.min.css.gz s3://chrisward.co.uk/travel/$1/food/styles/style.min.css --region eu-west-1 --metadata-directive REPLACE --content-type "text/css" --content-encoding "gzip" --cache-control "max-age=2419200"

  aws s3 cp out/$1/index.html.gz s3://chrisward.co.uk/travel/$1/food/index.html --region eu-west-1 --metadata-directive REPLACE --content-type "text/html" --content-encoding "gzip" --cache-control "max-age=2419200"

  aws s3 cp out/$1/scripts/script.min.js.gz s3://chrisward.co.uk/travel/$1/food/scripts/script.min.js --region eu-west-1 --metadata-directive REPLACE --content-type "application/x-javascript" --content-encoding "gzip" --cache-control "max-age=2419200"

  aws s3 cp out/$1/styles/swipebox.min.css.gz s3://chrisward.co.uk/travel/$1/food/styles/swipebox.min.css.gz --region eu-west-1 --metadata-directive REPLACE --content-type "text/css" --content-encoding "gzip" --cache-control "max-age=2419200"

  if [ "$2" != "" ]; then
    echo "Uploading Images..."
    for file in out/$1/images/thumb/*.jpg ; do
      aws s3 cp ${file} s3://chrisward.co.uk/travel/$1/food/images/thumb/`basename ${file}` --region eu-west-1 --metadata-directive REPLACE --content-type "image/jpeg" --cache-control "max-age=31536000"
    done
    for file in out/$1/images/medium/*.jpg ; do
      aws s3 cp ${file} s3://chrisward.co.uk/travel/$1/food/images/medium/`basename ${file}` --region eu-west-1 --metadata-directive REPLACE --content-type "image/jpeg" --cache-control "max-age=31536000"
    done
    for file in out/$1/images/large/*.jpg ; do
      aws s3 cp ${file} s3://chrisward.co.uk/travel/$1/food/images/large/`basename ${file}` --region eu-west-1 --metadata-directive REPLACE --content-type "image/jpeg" --cache-control "max-age=31536000"
    done
  fi

  aws cloudfront create-invalidation --distribution-id E2JH6T6MPLSO2D --paths /travel/$1/food/* | jq '(. | keys[0]) + " " + (.[ . | keys[0] ].Status?)'

else
    echo "Usage: " $0 " [FOLDER]"
fi
