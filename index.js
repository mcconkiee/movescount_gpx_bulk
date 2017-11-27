const async = require('async');
const fs = require('fs');
const ff = require('ff');
const route = require('./lib/route.js');
const path = '/Users/ericmcconkie/Google Drive/Personal/gps/GPX files';
route.cookie =
  'AWSELB=6BA385EF167F548755DA9475B5E2E58BE6A3496C1B179CAD67EB88DA3D7C3C8DC0B8DF7D7B8716ECEC4BE2CD15D10107D31C3BBD065F26DB2EBEECA1F5E5E3D117BC6A4273; Movescount_lang=9; ASP.NET_SessionId=is4djlzgdf45cs5kq1hiddqv; videoCookie=true; accept_cookies=true; MovesCountCookie=E0304550DA7BD08FA8D3649455EF6E2F3282BC4AF6CE587E75E0344744E75E58E0A6D3C3DC497CB525055E6B3A982E5BB03CBBE93940C075EB46F4FC9C4782DE53D18C7F73844CA6D8E0E103AD8362C867E8E1ACC48A1082EB5ADC93DF749F8D7BFD49F5B73BBF502D209EE312FE1901AF3B1D4976F40FE8E09ABAD31487C57C1F3E7BB6059D95EEEB7F867F293E9132692B152C72D39CFA6797AB49FD60784F1937C99181C151ABDBAEBA043F4157D6A5158201714D713E0A2FAE9B6A1F1BFF6498C16000F1925BCA24B6D7FA8EFCA38CACB2C7C9C6BDDC95F7DD66E2B4A67B3966D580; gsScrollPos-3392=; reloadShoutbox=1; unsupportedBrowserWarningDisplayed=true; _ga=GA1.2.491109496.1511638216; _gid=GA1.2.916992897.1511638216; __atuvc=1%7C47%2C6%7C48; __atuvs=5a1b0d7d05ad3c44000';

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
  uploadRouteAndMove(items[0]);
});
