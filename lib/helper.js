// all credit to https://github.com/timbenniks/gpx-for-runners/blob/master/src/index.js
/**
 * Returns formatted time for milliseconds.
 * @param {string} duration Duration in milliseconds
 * @return {string} Readable time
 */
const millisecondsToTime = function(duration) {
  let seconds = parseInt((duration / 1000) % 60, 10),
    minutes = parseInt((duration / (1000 * 60)) % 60, 10),
    hours = parseInt((duration / (1000 * 60 * 60)) % 24, 10),
    days = parseInt(duration / (1000 * 60 * 60 * 24), 10),
    hoursDays = parseInt(days * 24, 10);

  hours += hoursDays;
  hours = hours < 10 ? '0' + hours : hours;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  seconds = seconds < 10 ? '0' + seconds : seconds;
  return hours === '00'
    ? minutes + ':' + seconds
    : hours + ':' + minutes + ':' + seconds;
};
/**
 * Return average elevation for the whole gpx track.
 * @return {Number} The average elevation
 */
const duration = function(a, b) {
  let start = new Date(a),
    end = new Date(b),
    timeDiff = Math.abs(end.getTime() - start.getTime()),
    total = millisecondsToTime(timeDiff);

  return {
    start: start,
    end: end,
    totalMS: timeDiff,
    total: total
  };
};

/**
   * Returns elevation info of the run
   * @return {Elevation} The Elevation information object
   */
const elevation = function(time, trakcpoints) {
  let eleForMinMax = [],
    richElevation = [],
    gain = 0,
    loss = 0,
    startTime = new Date(time).getTime(),
    dist = 0;

  for (let i = 0; i < trackpoints.length - 1; i++) {
    let diff = trackpoints[i + 1].elevation - trackpoints[i].elevation,
      time = new Date(trackpoints[i + 1].time).getTime(),
      timeDiff = Math.abs(time - startTime);

    dist += calcDistanceBetweenPoints(trackpoints[i], trackpoints[i + 1]);

    if (diff < 0) {
      loss += diff;
    }

    if (diff > 0) {
      gain += diff;
    }

    eleForMinMax.push(trackpoints[i].elevation);
    richElevation.push({
      elevation: trackpoints[i].elevation,
      time: millisecondsToTime(timeDiff),
      dist: dist
    });
  }

  return {
    elevation: richElevation,
    max: Math.max.apply(null, eleForMinMax),
    min: Math.min.apply(null, eleForMinMax),
    loss: loss,
    gain: gain
  };
};
/**
   * Returns distance betwene points
   * @param {TrackPoint} wp1 Object with trackpoint info
   * @param {TrackPoint} wp2 Object with trackpoint info
   * @return {number} distance Distance between the points.
   */
const calcDistanceBetweenPoints = function(wp1, wp2) {
  let point1 = {
      lat: wp1.lat * (Math.PI / 180),
      lon: wp1.lon * (Math.PI / 180),
      alt: wp1.elevation / 1000
    },
    point2 = {
      lat: wp2.lat * (Math.PI / 180),
      lon: wp2.lon * (Math.PI / 180),
      alt: wp2.elevation / 1000
    },
    dp =
      2 *
      Math.asin(
        Math.sqrt(
          Math.pow(Math.sin((point1.lat - point2.lat) / 2), 2) +
            Math.cos(point1.lat) *
              Math.cos(point2.lat) *
              Math.pow(Math.sin((point1.lon - point2.lon) / 2), 2)
        )
      ),
    d = dp * 6366,
    h = Math.sqrt(Math.pow(d, 2) + Math.pow(point2.alt - point1.alt, 2));

  return h;
};
const workWith = function workWith(trackpoints, distance) {
  const dd = duration(
    trackpoints[0].time,
    trackpoints[trackpoints.length - 1].time
  );
  return {
    duration: dd,
    distance: distance,
    start: { lat: trackpoints[0].lat, lon: trackpoints[0].lon },
    speed: distance / (dd.totalMS / 1000)
  };
};
module.exports = { workWith: workWith };
