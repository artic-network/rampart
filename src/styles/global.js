import {css} from 'glamor';
// import colours from "./colours";

const THEME = "light"; // currently a constant - this could be set by a configuration

const lightScheme = {
    background: "#ffffff",
    foreground: "#02292e"
};

const darkScheme = {
    background: "#02292e",
    foreground: "#fffcf2"
};

let scheme = lightScheme;

if (THEME === "dark") {
    scheme = darkScheme;
}

css.global('body', {
  "fontFamily": "Lato",
    "background": scheme.background,
    "color": scheme.foreground
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

css.global('.axis path, .axis line', {
  fill: 'none',
  stroke: scheme.foreground,
  strokeWidth: 1,
  shapeRendering: 'auto'
})

css.global('.axis text', {
    fill: scheme.foreground,
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
