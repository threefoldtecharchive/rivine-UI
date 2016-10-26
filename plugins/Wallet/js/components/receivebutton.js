import React from 'react'

const ReceiveButton = ({actions}) => {
	const handleReceiveButtonClick = () => actions.getNewReceiveAddress()
	return (
		<div className="receive-button" onClick={handleReceiveButtonClick}>
			<i className="fa fa-download fa-2x" />
			<span>Receive Coins</span>
		</div>
	)
}

export default ReceiveButton
