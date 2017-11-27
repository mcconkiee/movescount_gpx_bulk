const http = require('http');
const axios = require('axios');
var distance = require('gps-distance');
const fs = require('fs');
var geocoding = new require('reverse-geocoding');
var gpxParse = require('gpx-parse');
import gpxUtil from 'gpx-for-runners';
const parseGpx = require('parse-gpx');
var request = require('request');
const path = '/Users/ericmcconkie/Google Drive/Personal/gps/GPX files/';
const cookie =
  'AWSELB=6BA385EF167F548755DA9475B5E2E58BE6A3496C1B179CAD67EB88DA3D7C3C8DC0B8DF7D7B8716ECEC4BE2CD15D10107D31C3BBD065F26DB2EBEECA1F5E5E3D117BC6A4273; Movescount_lang=9; ASP.NET_SessionId=is4djlzgdf45cs5kq1hiddqv; videoCookie=true; accept_cookies=true; MovesCountCookie=E0304550DA7BD08FA8D3649455EF6E2F3282BC4AF6CE587E75E0344744E75E58E0A6D3C3DC497CB525055E6B3A982E5BB03CBBE93940C075EB46F4FC9C4782DE53D18C7F73844CA6D8E0E103AD8362C867E8E1ACC48A1082EB5ADC93DF749F8D7BFD49F5B73BBF502D209EE312FE1901AF3B1D4976F40FE8E09ABAD31487C57C1F3E7BB6059D95EEEB7F867F293E9132692B152C72D39CFA6797AB49FD60784F1937C99181C151ABDBAEBA043F4157D6A5158201714D713E0A2FAE9B6A1F1BFF6498C16000F1925BCA24B6D7FA8EFCA38CACB2C7C9C6BDDC95F7DD66E2B4A67B3966D580; gsScrollPos-3392=; reloadShoutbox=1; unsupportedBrowserWarningDisplayed=true; _ga=GA1.2.491109496.1511638216; _gid=GA1.2.916992897.1511638216; __atuvc=1%7C47%2C6%7C48; __atuvs=5a1b0d7d05ad3c44000';
const move = require('./lib/move.js');
move.cookie = cookie;
// if (process.argv.length <= 2) {
//   console.log('Usage: ' + __filename + ' path/to/directory');
//   process.exit(-1);
// }

// var path = process.argv[2];

fs.readdir(path, function(err, items) {
  for (var i = 0; i < items.length; i++) {
    const gpxFile = items[i];
    const filePath = `${path}/${gpxFile}`;
    fs.readFile('/etc/hosts', 'utf8', function(err, data) {
      if (err) {
        return console.log(err);
      }
      console.log(data);
    });
    if (i > 0) {
      continue;
    }
    let lat = [];
    let lon = [];
    let ele = [];
    let distancePath = [];
    parseGpx(filePath).then(track => {
      track.forEach(t => {
        distancePath.push([t.latitude, t.longitude]);
        lat.push(parseFloat(t.latitude));
        lon.push(parseFloat(t.longitude));
        ele.push(parseFloat(t.elevation));
      });

      geocoding.location({ latitude: lat[0], longitude: lon[0] }, function(
        err,
        geoData
      ) {
        if (err) {
          console.log(err);
        } else {
          const geoname =
            geoData.results.length >= 1
              ? geoData.results[1].formatted_address
              : 'unknown_Start';
          const startingLat =
            geoData.results.length >= 1
              ? geoData.results[1].formatted_address
              : 'unknown_Start';
          let activityID = 4; //TODO - update this for file type

          let routeData = {
            activityID: activityID,
            points: {
              latitudes: lat,
              longitudes: lon,
              altitudes: ele,
              data: {}
            },
            routeName: `Route_${geoname}`,
            routeDescription: '',
            isPrivate: false,
            tags: [''],
            websiteUrl: null,
            location: geoname,
            distance: Math.round(distance(distancePath) * 1000), //meters
            waypointCount: 0,
            ascent: 0,
            descent: 0,
            mapProviderName: 'mapbox'
          };
          if (geoData && geoData.results && geoData.results.length >= 1) {
            (routeData.latitude = geoData.results[0].geometry.location.lat),
              (routeData.longitude = geoData.results[0].geometry.location.lng);
          }
          const postData = { route: routeData };

          var options = {
            method: 'POST',
            hostname: 'www.movescount.com',
            port: null,
            path: '/Move/RouteAppData',
            headers: {
              cookie: cookie
            }
          };
          var req = http.request(options, function(res) {
            var chunks = [];

            res.on('data', function(chunk) {
              console.log('on data');
              chunks.push(chunk);
            });

            res.on('end', function() {
              var body = Buffer.concat(chunks);
              const json = JSON.parse(body.toString());
              routeData.routeID = json.route.id;
              move.create(routeData, (err, moveData) => {
                console.log('created move', err, moveData);
              });
            });
          });
          req.write(JSON.stringify(postData));
          req.end();
          //---
        }
      });
    });
  }
});
