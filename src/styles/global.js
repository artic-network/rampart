import {css} from 'glamor';
// import colours from "./colours";

const dark_background = "#02292e";
const dark_foreground = "#fffcf2";

css.global('body', {
  "fontFamily": "Lato",
    "background": dark_background,
    "color":dark_foreground
})

css.global('a', {
  textDecoration: "none",
  color: "#5097BA",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "94%"
})

css.global('h1', {
  "fontWeight": "bold",
  "fontSize": "2em"
})

css.global('h2', {
  "fontWeight": "bold",
  "fontSize": "1.5em"
})

css.global('div, p', {
  "fontWeight": "normal",
  "fontSize": "1em"
})

css.global('.dc-chart .axis path, .axis line', {
  fill: 'none',
  stroke: foreground,
  strokeWidth: 1,
  shapeRendering: 'auto'
})

css.global('.axis text', {
    fontSize: '12px'
})

css.global('.brush rect.extent', {
    fill: 'steelblue',
    fillOpacity: .125
})

css.global('.brush .resize path', {
    fill: '#eee',
    stroke: '#666'
})
