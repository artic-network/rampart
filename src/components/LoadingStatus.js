import React from 'react';
import { css } from 'glamor'

const styles = css({
  width: '100%',
  margin: 'auto',
  alignSelf: 'center'
})

class LoadingStatus extends React.Component {

  render() {
    return (
      <div {...styles}>
        <h2>
          {`loading status: ${this.props.status}`}
        </h2>
      </div>
    )

  }
}

export default LoadingStatus;
