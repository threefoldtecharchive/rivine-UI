import React, { PropTypes } from 'react'
import TransactionList from '../containers/transactionlist.js'
import SendButton from './sendbutton.js'
import SendPrompt from '../containers/sendprompt.js'
import ReceiveButton from '../containers/receivebutton.js'
import ReceivePrompt from '../containers/receiveprompt.js'
import NewWalletDialog from '../containers/newwalletdialog.js'
import LockButton from '../containers/lockbutton.js'

const Wallet = ({confirmedbalance, unconfirmedbalance, blockstakebalance, showReceivePrompt, showSendPrompt, showNewWalletDialog, actions }) => {
	const onSendClick = (currencytype) => () => actions.startSendPrompt(currencytype)
	return (
		<div className="wallet">
			<div className="wallet-toolbar">
				<div className="balance-info">
					<span>Confirmed Balance: {confirmedbalance} C </span>
					<span>Unconfirmed Delta: {unconfirmedbalance} C </span>
					{blockstakebalance !== '0' ? (<span> Blockstake Balance: {blockstakebalance} BS </span>) : null}
				</div>
				<LockButton />
				{blockstakebalance !== '0' ? <SendButton currencytype="Blockstakes" onClick={onSendClick('blockstakes')} />: null}
				<SendButton currencytype="Coins" onClick={onSendClick('coins')} />
				<ReceiveButton />
			</div>
			{showNewWalletDialog ? <NewWalletDialog /> : null}
			{showSendPrompt ? <SendPrompt /> : null}
			{showReceivePrompt ? <ReceivePrompt /> : null}
			<TransactionList />
		</div>
	)
}

Wallet.propTypes = {
	confirmedbalance: PropTypes.string.isRequired,
	unconfirmedbalance: PropTypes.string.isRequired,
	blockstakebalance: PropTypes.string.isRequired,
	showNewWalletDialog: PropTypes.bool,
	showSendPrompt: PropTypes.bool,
	showReceivePrompt: PropTypes.bool,
}

export default Wallet
