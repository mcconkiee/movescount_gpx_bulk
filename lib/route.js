const config = require('../config.js');
var distance = require('gps-distance');
const Errors = require('../lib/errors.js');
var geocoding = new require('reverse-geocoding');
var gpxParse = require('gpx-parse');

const helper = require('./helper.js');
const http = require('http');
const move = require('./move.js');
const parseGpx = require('parse-gpx');
var request = require('request');
const fs = require('fs'),
  xml2js = require('xml2js');
const parser = new xml2js.Parser();

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
    fs.readFile(filePath, function(err, data) {
      parser.parseString(data, function(err, result) {
        if (!result.gpx.trk) {
          done(new Error(Errors.INSUFFICIENT_FILE_DATA), null);
          return;
        }
        if (!err) {
          parseGpx(filePath).then(track => {
            if (track.length <= 1) {
              const e = new Error(Errors.INSUFFICIENT_FILE_DATA);
              return done(e, null);
            }
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
                  // const nError = new Error('Bad Geo');
                  // console.log(nError);
                  if (err) {
                    console.log(err, `${filePath} NOT uploaded`);
                    done(null, {});
                  } else {
                    const geoname =
                      geoData.results.length >= 2
                        ? geoData.results[1].formatted_address
                        : 'unknown_Start';
                    const startingLat =
                      geoData.results.length >= 2
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

                    if (
                      geoData &&
                      geoData.results &&
                      geoData.results.length >= 1
                    ) {
                      (routeData.latitude =
                        geoData.results[0].geometry.location.lat),
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
        }
      });
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
            () => {
              self.removeRoute(json.route.id, done);
            }
          );
        } else {
          done(new Error(Errors.ROUTE_UPLOAD_ERROR), {});
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
      const size = json.length;
      console.log(size, ' starting to delete all...');
      //test we are really all done
      if (size === 0) {
        return done(null, json);
      }
      let next = 0;
      function doNext() {
        next++;
        if (next == json.length) {
          return self.removeAll(done);
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
