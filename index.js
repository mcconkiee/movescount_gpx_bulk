const async = require('async');
const config = require('./config.js');
const fs = require('fs');
const ff = require('ff');
const route = require('./lib/route.js');
const move = require('./lib/move.js');
const path = config.path;

// if (process.argv.length <= 2) {
//   console.log('Usage: ' + __filename + ' path/to/directory');
//   process.exit(-1);
// }

// var path = process.argv[2];
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function zzz() {
  console.log('Taking a break...');
  await sleep(2000);
  console.log('Two second later');
}

fs.readdir(path, function(err, items) {
  let next = 0;
  let retry = 0;

  function doNext() {
    retry = 0;
    next++;
    const gpxFileNext = items[next];
    zzz(); //respect query limit on geocode...
    uploadRouteAndMove(gpxFileNext);
  }

  function uploadRouteAndMove(gpxFile) {
    if (gpxFile === '.DS_Store' || gpxFile === 'uploaded') {
      doNext();
      return;
    }
    const filePath = `${path}/${gpxFile}`;
    console.log(`file: ${filePath}`);
    route.create(filePath, (err, moveData) => {
      if (Object.keys(moveData).length === 0) {
        //try again....we crapped out somewhere
        retry++;
        if (retry == 3) {
          doNext();
          return;
        }
        console.log('something went wrong, but will retry ', gpxFile);
        uploadRouteAndMove(gpxFile);
        return;
      }
      if (!err) {
        // console.log(err, moveData);
        console.log('move and route for ******** ', filePath);
        const destination = `${path}/uploaded/${gpxFile}`;
        console.log('moving file to : ', destination);
        fs.rename(filePath, destination, err => {
          if (!err) {
            doNext();
          }
        });
      } else {
        console.log('error in process....done');
      }
    });
  }
  // START THE PROCESS
  uploadRouteAndMove(items[0]);

  // //--- EXAMPLE FOR REMOVING ROUTES
  // route.removeAll((err, response) => {
  //   // console.log('*******done removeing all routes');
  // });

  // //--- EXAMPLE FOR REMOVING MOVES
  // move.removeAll((error, dataOfLastObject) => {
  //   console.log('*******error,dataOfLastObject', error, dataOfLastObject);
  // });

  // --- EXAMPLE FOR FETCHING ALL MOVES
  // move.findAll((error, dataOfLastObject) => {
  //   console.log('*******error,dataOfLastObject', error, dataOfLastObject.length);
  // });

  // --- EXAMPLE REMOVE EVERYTHING
  // route.removeAll((err, response) => {
  //   // console.log('*******done removeing all routes');
  //   move.removeAll((error, dataOfLastObject) => {
  //     console.log('*******error,dataOfLastObject', error, dataOfLastObject);
  //   });
  // });
});
