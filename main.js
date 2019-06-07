import concaveman from "concaveman";

import distance from "@turf/distance";
import bearing from "@turf/bearing";
import { coordAll } from "@turf/meta";

/**
 * Returns the counter-clockwise angle between
 * { coords[a], coords[a + 1] } to { coords[b], coords[b + 1] }
 *
 * @param {Array<[number, number]>} coords List of GeoJSON coordinates
 * @param {Number} a starting index of the first ray
 * @param {Number} b starting index of the second ray
 * @returns {Number} counter-clockwise angle between 0 and 2 * pi
 */
function dtheta(coords, a, b) {
  // For bearings +180 is clockwise, -180 is counterclockwise
  const a1 = bearing(coords[a], coords[(a + 1) % coords.length]);
  const a2 = bearing(coords[b], coords[(b + 1) % coords.length]);

  // Difference between bearings in counterclockwise degrees
  const delta = -a2 - -a1;

  // Convert to radians, make limits 0 to 2*pi
  const limit = 2 * Math.PI;
  return (limit + (Math.PI * delta) / 180) % limit;
}

/**
 * Takes a {@link Feature} or {@link FeatureCollection} and returns the
 * [polygon diameter](http://mathworld.wolfram.com/PolygonDiameter.html).
 *
 * Internally, this uses the rotating calipers method and pseudocode
 * described [here](https://www.tvhoang.com/articles/2018/12/rotating-calipers).
 * The concepts from the article are based off of the following paper:
 * Shamos, Michael (1978). "Computational Geometry" (PDF). Yale University. pp. 76–81.
 *
 * The rotating calipers method requires a convex hull so we use mapbox's concaveman,
 * which runs in O(n * log n) time as stated [here](https://github.com/mapbox/concaveman).
 *
 * The algorithm in the paper runs in about O(n) time, making this entire algorithm
 * run in O(n) + O(n * log n) = O(n * log n) time.
 *
 * @name diamter
 * @param {GeoJSON} geojson input Feature or FeatureCollection
 * @returns {Number} the polygon diameter of the GeoJSON
 * @example
 * const points = turf.featureCollection([
 *   turf.point([10.195312, 43.755225]),
 *   turf.point([10.404052, 43.8424511]),
 *   turf.point([10.579833, 43.659924]),
 *   turf.point([10.360107, 43.516688]),
 *   turf.point([10.14038, 43.588348]),
 *   turf.point([10.195312, 43.755225])
 * ]);
 *
 * const len = diameter(points);
 */
export default function diameter(geojson) {
  // Build a convex hull for the feature
  const coords = concaveman(coordAll(geojson), Infinity);

  // Through analysis (Chrome devtools), it seems that concaveman
  // will return coordinates in the opposite order of what we need.
  //
  // Flip them to be consistent with our algorithm.
  coords.reverse();

  let max = 0;
  const addToMax = ([a, b]) => {
    max = Math.max(max, distance(a, b));
  };

  let i = 0;
  let j = 1;
  while (i !== j && dtheta(coords, i, j) < Math.PI) {
    j = (j + 1) % coords.length;
  }

  addToMax([coords[i], coords[j]]);

  while (j !== 0) {
    const a = 2 * Math.PI - dtheta(coords, i, j);
    if (a === Math.PI) {
      addToMax([coords[(i + 1) % coords.length], coords[j]]);
      addToMax([coords[i], coords[(j + 1) % coords.length]]);
      addToMax([
        coords[(i + 1) % coords.length],
        coords[(j + 1) % coords.length]
      ]);

      i = (i + 1) % coords.length;
      j = (j + 1) % coords.length;
    } else if (a < Math.PI) {
      addToMax([coords[(i + 1) % coords.length], coords[j]]);
      i = (i + 1) % coords.length;
    } else {
      addToMax([coords[i], coords[(j + 1) % coords.length]]);
      j = (j + 1) % coords.length;
    }
  }

  return max;
}
