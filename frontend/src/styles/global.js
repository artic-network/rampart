import {css} from 'glamor';
import colours from "./colours";


css.global('body', {
  "fontFamily": "Lato",
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
  stroke: '#000',
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
