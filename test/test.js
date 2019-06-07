const diameter = require("../bundle");

const distance = require("@turf/distance").default;
const { coordAll } = require("@turf/meta");

const fs = require("promise-fs");
const path = require("path");

// Exaustive brute force solution to compare with.
function bruteForce(feature) {
  const coords = coordAll(feature);
  let max = 0;

  for (let i = 0; i < coords.length; i++) {
    for (let j = i; j < coords.length; j++) {
      max = Math.max(max, distance(coords[i], coords[j]));
    }
  }

  return max;
}

describe("diameter", () => {
  it("trivial example", async () => {
    const test = JSON.parse(
      String(await fs.readFile(path.join(__dirname, "in", "test1.geojson")))
    );

    expect(diameter(test)).toBeCloseTo(bruteForce(test));
  });

  it("works with concave polygons, high latitude such as Alaska", async () => {
    const test = JSON.parse(
      String(await fs.readFile(path.join(__dirname, "in", "test2.geojson")))
    );

    expect(diameter(test)).toBeCloseTo(bruteForce(test));
  });

  it("second trivial example", async () => {
    const test = JSON.parse(
      String(await fs.readFile(path.join(__dirname, "in", "test3.geojson")))
    );

    expect(diameter(test)).toBeCloseTo(bruteForce(test));
  });
});
