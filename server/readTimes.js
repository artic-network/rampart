/**
 * median read time from an annotated CSV
 * @param {Array} annotations
 * @returns unix timestamp in ms
 */
const getTimeFromAnnotatedCSV = (annotations) => {
    return (annotations
        .map((a) => (new Date(a.start_time)).getTime())
        .sort((a, b) => a - b) // numerical sort
    )[Math.floor(annotations.length/2)];
}

module.exports = {
  getTimeFromAnnotatedCSV
}
