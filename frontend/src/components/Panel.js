import dc from "dc"
import React from 'react';
import { css } from 'glamor'

const styles = css({
  width: '100%',
  margin: 'auto'
})

class Panel extends React.Component {

  render() {
    return (
      <div {...styles}>
        {`panel ${this.props.data.length}`}
      </div>
    )

  }
}

export default Panel;
