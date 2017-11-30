# MoveCount Bulk upload

A super hacky way to upload a lot of GPX files (in batch) to [movescount.com](http://www.movescount.com/).

## Getting Started

Before anything, we need the auth cookie from Movescount...login to [movescount.com](http://www.movescount.com/), and copy the cookie value from your browser session. We need this for http auth requests. I used the inspector and just grabbed it from the headers (sorry, to lazy to write in an auth on this app....)

### Get the source of this app

1. download the project source
2. cd to/project/source
2. `
npm install`

### Upload thos GPX files

3. `node index {dir=path/to/gpx/files cookie="crazyLongCookie"}` - alternative is to hard code the `config.js` file with directory of gpx files and movescount cookie

## notes

### personal notes

I wrote this app to push 1000s of gpx files since 2010. Any route under 9 miles is assumed to be a `run`, since i rarely run beyond that these days. The app does not distinguish between trail run , run, etc. Nor cycling vs mountain biking. Just too much effort to do that. On a first pass. It will really only do the minimum - attach date, avg speed, and route - i'll one day get to adding elevation.

After each gpx uploads, we move it physically to the `uploaded` directory. The app creates this in your dir if you don't already have it. We do this so you can see at the end of the process any files that were not uploaded for whatever reason. Sorry, you will have to move them back if that bothers you.

Uploading 2157 files took about 2 hours (+/-)

If you find you messed up and need an atomic reset of your Movescount account, you can remove all routes &/ or all moves. See the bottom of the `index.js` file...:

```
// uploadRouteAndMove(items[0]); - comment this out if doing any of the below....

//--- EXAMPLE FOR REMOVING ROUTES
route.removeAll((err, response) => {
  console.log('*******done removeing all routes');
});

//--- EXAMPLE FOR REMOVING MOVES
move.removeAll((error, dataOfLastObject) => {
  console.log('*******error,dataOfLastObject', error, dataOfLastObject);
});

//--- EXAMPLE FOR FETCHING ALL MOVES
move.findAll((error, dataOfLastObject) => {
  console.log('*******error,dataOfLastObject', error, dataOfLastObject.length);
});

//--- EXAMPLE REMOVE EVERYTHING
route.removeAll((err, response) => {
  // console.log('*******done removeing all routes');
  move.removeAll((error, dataOfLastObject) => {
    console.log('*******error,dataOfLastObject', error, dataOfLastObject);
  });
});
```

### Movescount nuances

In this journey to upload 1000s of gpx files, I learned a few things about Movescount:

* there are `move` objects and `route` objects. A `route` can belong to many `move`s, but a `move` can only have one `route`. It means to associate a gpx to a move, we have to upload it attach it, and then remove it reduce clutter. Why do we remove it???? read on...
* Movecount only allows a profile to have 2000 routes associated. This is why creating a `move` from a gpx works like this:

  1. parse gpx file
  2. upload data as a `route`
  3. create a `move` from the `route` response (ie: using `routeID`)
  4. delte the newly created `route` to reduce profile limitations and clutter
