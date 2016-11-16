if [ "$1" != "" ]; then

  aws s3 cp out/styles/swipebox.min.css.gz s3://chrisward.co.uk/travel/$1/food/styles/swipebox.min.css --region eu-west-1 --metadata-directive REPLACE --content-type "text/css" --content-encoding "gzip" --cache-control "max-age=86400"
  aws s3 cp out/scripts/jquery.swipebox.min.js.gz s3://chrisward.co.uk/travel/$1/food/scripts/jquery.swipebox.min.js --region eu-west-1 --metadata-directive REPLACE --content-type "application/x-javascript" --content-encoding "gzip" --cache-control "max-age=86400"

else
    echo "Usage: " $0 " [FOLDER]"
fi
