
/* there are plenty or more advanced methods of displaying the primers / amplicons to explore for the future */
export const processAmplicons = (annotationData) => {
  if (annotationData.amplicons) {
    const sorted = annotationData.amplicons.sort((a, b) =>
      a[0]<b[0] ? -1 : 1
    );
    console.log(sorted)
    annotationData.amplicons = sorted;
  }
}
