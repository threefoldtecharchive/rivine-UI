import React, { PropTypes } from 'react'

const containerStyle = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	flexDirection: 'column',
	backgroundColor: '#C6C6C6',
	width: '100%',
	height: '100%',
}

const DisabledPlugin = ({startRivined}) => (
	<div style={containerStyle}>
		<h1>Rivined has stopped.</h1>
		<button onClick={startRivined}>Start Rivined</button>
	</div>
)

DisabledPlugin.propTypes = {
	startRivined: PropTypes.func.isRequired,
}

export default DisabledPlugin
