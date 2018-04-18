


export const getCoverageMaxes = (data) => {
  const y = data.map( el => el.value )
    .reduce((max, cur) => Math.max( max, cur ), -Infinity )
  const x = data[data.length - 1].key
  return {x, y}
}
