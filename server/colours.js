const d3color = require("d3-color").color;
const chromatic = require("d3-scale-chromatic");
// const scaleSequential = require("d3-scale").scaleSequential;

/**
 * Given a d3 interpolator function, return an array of hexes.
 * @param {int} n number of colours wanted
 * @param {int} ignoreStart trim colours from start -- helps to remove dark colours ;)
 * @param {int} ignoreEnd    "    "    "   "  end
 * @param {num} luminanceThresh value (ITU BT.709) below which we make brighter
 * @param {num} brighterVal value to make dark colours this much brighter (uses `d3.brighter`)
 */
const _interpolatorToArray = (interp, n, ignoreStart=0, ignoreEnd=0, luminanceThresh=30, brighterVal=1) => {
  const nn = n + ignoreStart + ignoreEnd;
  return Array.from(new Array(nn), (_, i) => 1/(nn-1)*i)
    .map((t) => interp(t))
    .map((rgb) => {
      let colour = d3color(rgb);
      const luminance = (0.2126*colour.r) + (0.7152*colour.g) + (0.0722*colour.b) // ITU BT.709
      if (luminance < luminanceThresh) {
        colour = colour.brighter(1.5)
      }
      return colour.hex()
    })
    .slice(ignoreStart||0, nn-ignoreEnd||nn+1)
}

/**
 * A list of available colours for the app.
 * All colours (references & samples) _must_ be included
 * here, else the colour picker won't work.
 * 
 * The colour picker fits 6 panels across (2 rows down)
 */
const availableColours = [
  /* ROW 1 */
  _interpolatorToArray(chromatic.interpolateYlGnBu, 10, 1, 1),
  _interpolatorToArray(chromatic.interpolateRdYlBu, 10, 0, 1),
  _interpolatorToArray(chromatic.interpolateViridis, 10, 1, 0),
  _interpolatorToArray(chromatic.interpolateCool, 10, 0, 0),
  _interpolatorToArray(chromatic.interpolateRainbow, 10, 0, 1),
  _interpolatorToArray(chromatic.interpolateInferno, 10, 3, 0),
  /* ROW 2 */
  _interpolatorToArray(chromatic.interpolateYlOrRd, 10, 0, 1),
  _interpolatorToArray(chromatic.interpolatePuBu, 10, 2, 1),
  _interpolatorToArray(chromatic.interpolatePuRd, 10, 2, 1),
  _interpolatorToArray(chromatic.interpolateBuPu, 10, 2, 1),
  _interpolatorToArray(chromatic.interpolateYlGn, 10, 2, 1),
  _interpolatorToArray(chromatic.interpolateGreys, 10, 0, 1, 0),
]


/**
 * Reference colours are picked from the availableColours by going "across" the 
 * second set of panels (i.e. the second "row" of swatches in the colour picker).
 * When we have gone across this, we repeat the progress at a higher index.
 * Loops around so that while colours will eventually repeat, they will never be undefined.
 */
const getInitialReferenceColours = (n) => {
  let whichPanelIdx = 6; /* start at the 7th set of available colours */
  let inPanelIdx = 2; /* start at the 2nd entry of each panel */
  const ret = new Array(n);
  for (let i = 0; i<n; i++) {
    ret[i] = availableColours[whichPanelIdx][inPanelIdx];
    whichPanelIdx++;
    if (whichPanelIdx === 11) {
      whichPanelIdx=6;
      inPanelIdx += 3; /* odd, so when we loop over (if!) use different ones */
    }
    if (inPanelIdx > 9) inPanelIdx -= 10;
  }
  return ret;
}


module.exports = {
  getInitialReferenceColours
};
