const async = require('async');
const config = require('./config.js');
const Errors = require('./lib/errors.js');
const fs = require('fs');
const ff = require('ff');
const route = require('./models/route.js');
const move = require('./models/move.js');

// check if we have arguments for cookie or dir, etc
process.argv.forEach(arg => {
  console.log(arg);
  if (arg.includes('dir=')) {
    const val = arg.split('dir=');
    config.path = val[1];
    console.log('updating config.path = ', config.path);
  }
  if (arg.includes('cookie=')) {
    const val = arg.split('cookie=');
    config.cookie = val[1];
    console.log('updating config.cookie = ', config.cookie);
  }
});

//assign the path & upload holding dir
const path = config.path;
const uploadedPathName = 'uploaded';
const uploadPath = `${config.path}/${uploadedPathName}`;

//handle errors
process.on('uncaughtException', function(err) {
  console.error(err, err.stack);
  console.log("We've handled this error and moving on....");
});

// var path = process.argv[2];
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function zzz() {
  await sleep(2000);
}

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}
fs.readdir(path, function(err, items) {
  let next = 0;
  let retry = 0;

  function doNext() {
    retry = 0;
    next++;
    if (next > items.length) {
      console.log('END OF PROCESS. You can quit now.');
      return;
    }
    const gpxFileNext = items[next];
    zzz(); //respect query limit on geocode...we need latency to recover
    uploadRouteAndMove(gpxFileNext);
  }

  function uploadRouteAndMove(gpxFile) {
    if (!gpxFile.includes('.gpx') || gpxFile === undefined) {
      doNext();
      return;
    }
    const filePath = `${path}/${gpxFile}`;
    console.log(`file: ${filePath}`);

    route.create(filePath, (err, moveData) => {
      if (err) {
        console.log(err, err.stack, ';()');
        doNext();
        return;
      }

      if (Object.keys(moveData).length === 0) {
        //try 3 times....we crapped out somewhere
        retry++;
        if (retry == 3) {
          doNext();
          return;
        }
        console.log('something went wrong, but will retry ', gpxFile);
        uploadRouteAndMove(gpxFile);
        return;
      }
      // console.log(err, moveData);
      console.log('CREATED move and route for ******** ', filePath);
      const destination = `${uploadPath}/${gpxFile}`;
      console.log('moving file to : ', destination);
      fs.rename(filePath, destination, err => {
        if (!err) {
          doNext();
        }
      });
    });
  }
  // START BATCH UPLOADS!
  uploadRouteAndMove(items[0]);

  // //--- EXAMPLE FOR REMOVING ROUTES
  // route.removeAll((err, response) => {
  //   console.log('*******done removeing all routes');
  // });
  //
  // //--- EXAMPLE FOR REMOVING MOVES
  // move.removeAll((error, dataOfLastObject) => {
  //   console.log('*******error,dataOfLastObject', error, dataOfLastObject);
  // });
  //
  // //--- EXAMPLE FOR FETCHING ALL MOVES
  // move.findAll((error, dataOfLastObject) => {
  //   console.log('*******error,dataOfLastObject', error, dataOfLastObject.length);
  // });
  //
  // //--- EXAMPLE REMOVE EVERYTHING
  // route.removeAll((err, response) => {
  //   // console.log('*******done removeing all routes');
  //   move.removeAll((error, dataOfLastObject) => {
  //     console.log('*******error,dataOfLastObject', error, dataOfLastObject);
  //   });
  // });
});
