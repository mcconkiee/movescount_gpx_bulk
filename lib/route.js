const config = require('../config.js');
var distance = require('gps-distance');
var geocoding = new require('reverse-geocoding');
var gpxParse = require('gpx-parse');

const helper = require('./helper.js');
const http = require('http');
const move = require('./move.js');
const parseGpx = require('parse-gpx');
var request = require('request');
const route = {
  cookie: config.cookie,
  create: function(filePath, done) {
    const self = this;
    let times = [];
    let lat = [];
    let lon = [];
    let ele = [];
    let distancePath = [];
    let trackpoints = [];

    parseGpx(filePath).then(track => {
      track.forEach(t => {
        distancePath.push([t.latitude, t.longitude]);
        times.push(t.timestamp);
        lat.push(parseFloat(t.latitude));
        lon.push(parseFloat(t.longitude));
        ele.push(parseFloat(t.elevation));
        trackpoints.push({
          lat: t.latitude,
          lon: t.longitude,
          elevation: t.elevation,
          time: t.timestamp
        });
      });
      const _distance = Math.round(distance(distancePath) * 1000);
      const helperData = helper.workWith(trackpoints, _distance);
      if (trackpoints.length >= 1) {
        geocoding.location(
          {
            latitude: trackpoints[0].lat,
            longitude: trackpoints[0].lon
          },
          function(err, geoData) {
            if (err) {
              console.log(err, `${filePath} NOT uploaded`);
              done(null, {});
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
                distance: _distance, //meters
                waypointCount: 0,
                ascent: 0,
                descent: 0,
                mapProviderName: 'mapbox'
              };
              if (geoData && geoData.results && geoData.results.length >= 1) {
                (routeData.latitude = geoData.results[0].geometry.location.lat),
                  (routeData.longitude =
                    geoData.results[0].geometry.location.lng);
              }
              const postData = {
                route: routeData
              };
              self.upload(postData, helperData, done);
              //---
            }
          }
        );
      } else {
        // done(new Error('not enough geo data'), null);
        console.log('not enough geo data', filePath);
        done(null, {});
      }
    });
  },
  upload: function(postData, helperData, done) {
    const self = this;
    var options = {
      method: 'POST',
      hostname: 'www.movescount.com',
      port: null,
      path: '/Move/RouteAppData',
      headers: {
        cookie: this.cookie
      }
    };
    var req = http.request(options, function(res) {
      var chunks = [];

      res.on('data', function(chunk) {
        chunks.push(chunk);
      });

      res.on('end', function() {
        var body = Buffer.concat(chunks);
        const json = JSON.parse(body.toString());
        if (json && json.route) {
          postData.route.routeID = json.route.id;
          move.create(
            {
              routeData: postData.route,
              helperData: helperData
            },
            done
          );
        } else {
          done(null, {});
        }
      });
    });
    req.write(JSON.stringify(postData));
    req.end();
  },
  removeAll: function(done) {
    const self = this;
    var options = {
      method: 'GET',
      url: 'http://www.movescount.com/api/routes/private',
      headers: {
        'cache-control': 'no-cache',
        cookie: this.cookie
      }
    };
    request(options, function(error, response, body) {
      if (error) throw new Error(error);
      const json = JSON.parse(body);

      let next = 0;

      function doNext() {
        next++;
        if (next == json.length) {
          return done(null, json);
        }
        execRemoveRoute();
      }

      function execRemoveRoute() {
        self.removeRoute(json[next].RouteID, () => {
          doNext();
        });
      }
      execRemoveRoute();
    });
  },
  removeRoute: function(id, done) {
    //-----

    var options = {
      method: 'DELETE',
      url: `http://www.movescount.com/Move/RouteAppData/${id}`,
      headers: {
        cookie: this.cookie
      }
    };

    request(options, function(error, response, body) {
      if (error) {
        done(error, null);
      } else {
        const json = JSON.parse(body);
        console.log('removed', json);
        done(null, json);
      }
    });
  }
};
module.exports = route;
