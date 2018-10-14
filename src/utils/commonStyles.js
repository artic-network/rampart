import { css } from 'glamor';

export const chartTitleCSS = css({
  textAlign: "center",
  "fontWeight": "bold",
  "fontSize": "1em"
});

export const toolTipCSS = css({
    zIndex: 20,
    position: "absolute",
    borderRadius: "5px",
    padding: "5px",
    margin: "auto",
    backgroundColor: "hsla(0,0%,0%,.8)",
    color: "white",
    pointerEvents: "none",
    visibility: "hidden",
    fontSize: "14px",
    fontWeight: "700"
});

