/* eslint-disable no-unused-expressions */
import React from 'react'
import { shallow } from 'enzyme'
import { expect } from 'chai'
import { spy } from 'sinon'
import Wallet from '../../plugins/Wallet/js/components/wallet.js'
import ReceiveButton from '../../plugins/Wallet/js/containers/receivebutton.js'
import ReceivePrompt from '../../plugins/Wallet/js/containers/receiveprompt.js'
import NewWalletDialog from '../../plugins/Wallet/js/containers/newwalletdialog.js'
import TransactionList from '../../plugins/Wallet/js/containers/transactionlist.js'
import SendPrompt from '../../plugins/Wallet/js/containers/sendprompt.js'

const testActions = {
	startSendPrompt: spy(),
}

describe('wallet component', () => {
	afterEach(() => {
		testActions.startSendPrompt.reset()
	})
	it('renders balance info', () => {
		const walletComponent = shallow(<Wallet confirmedbalance="10" unconfirmedbalance="1" blockstakebalance="0" />)
		expect(walletComponent.find('.balance-info').children()).to.have.length(2)
		expect(walletComponent.find('.balance-info').children().first().text()).to.contain('Confirmed Balance: 10 C')
		expect(walletComponent.find('.balance-info').children().last().text()).to.contain('Unconfirmed Delta: 1 C')
	})
	it('renders blockstake balance when it is non-zero', () => {
		const walletComponent = shallow(<Wallet confirmedbalance="10" unconfirmedbalance="1" blockstakebalance="1" />)
		expect(walletComponent.find('.balance-info').children()).to.have.length(3)
		expect(walletComponent.find('.balance-info').children().last().text()).to.contain('Blockstake Balance: 1 BS')
	})
	it('renders coin send button when blockstake balance is zero', () => {
		const walletComponent = shallow(<Wallet confirmedbalance="10" unconfirmedbalance="1" blockstakebalance="0" />)
		expect(walletComponent.find('SendButton')).to.have.length(1)
	})
	it('renders start send prompt with coins when send coin button is clicked', () => {
		const walletComponent = shallow(<Wallet confirmedbalance="10" unconfirmedbalance="1" blockstakebalance="0" actions={testActions} />)
		walletComponent.find('SendButton').first().simulate('click')
		expect(testActions.startSendPrompt.calledWith('coins')).to.be.true
	})
	it('renders start send prompt with blockstakes when send blockstakes button is clicked', () => {
		const walletComponent = shallow(<Wallet confirmedbalance="10" unconfirmedbalance="1" blockstakebalance="1" actions={testActions} />)
		walletComponent.find('SendButton [currencytype="Blockstakes"]').first().simulate('click')
		expect(testActions.startSendPrompt.calledWith('blockstakes')).to.be.true
	})
	it('renders a transaction list', () => {
		const walletComponent = shallow(<Wallet confirmedbalance="10" unconfirmedbalance="1" blockstakebalance="0" actions={testActions} />)
		expect(walletComponent.contains(<TransactionList />)).to.be.true
	})
	it('renders a receive button', () => {
		const walletComponent = shallow(<Wallet confirmedbalance="10" unconfirmedbalance="1" blockstakebalance="0" actions={testActions} />)
		expect(walletComponent.contains(<ReceiveButton />)).to.be.true
	})
	it('does not render show new wallet dialog unless showNewWalletDialog', () => {
		const walletComponent = shallow(<Wallet showNewWalletDialog={false} confirmedbalance="10" unconfirmedbalance="1" blockstakebalance="0" actions={testActions} />)
		expect(walletComponent.contains(<NewWalletDialog />)).to.be.false
	})
	it('renders show new wallet dialog when showNewWalletDialog', () => {
		const walletComponent = shallow(<Wallet showNewWalletDialog confirmedbalance="10" unconfirmedbalance="1" blockstakebalance="0" actions={testActions} />)
		expect(walletComponent.contains(<NewWalletDialog />)).to.be.true
	})
	it('does not render show send prompt unless showSendPrompt', () => {
		const walletComponent = shallow(<Wallet showSendPrompt={false} confirmedbalance="10" unconfirmedbalance="1" blockstakebalance="0" actions={testActions} />)
		expect(walletComponent.contains(<SendPrompt />)).to.be.false
	})
	it('renders show send prompt when showSendPrompt', () => {
		const walletComponent = shallow(<Wallet showSendPrompt confirmedbalance="10" unconfirmedbalance="1" blockstakebalance="0" actions={testActions} />)
		expect(walletComponent.contains(<SendPrompt />)).to.be.true
	})
	it('does not render show receive prompt unless showReceivePrompt', () => {
		const walletComponent = shallow(<Wallet showReceivePrompt={false} confirmedbalance="10" unconfirmedbalance="1" blockstakebalance="0" actions={testActions} />)
		expect(walletComponent.contains(<ReceivePrompt />)).to.be.false
	})
	it('renders show receive prompt when showReceivePrompt', () => {
		const walletComponent = shallow(<Wallet showReceivePrompt confirmedbalance="10" unconfirmedbalance="1" blockstakebalance="0" actions={testActions} />)
		expect(walletComponent.contains(<ReceivePrompt />)).to.be.true
	})
})
/* eslint-enable no-unused-expressions */
