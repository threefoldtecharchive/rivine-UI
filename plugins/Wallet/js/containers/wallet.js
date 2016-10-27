import WalletView from '../components/wallet.js'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { startSendPrompt } from '../actions/wallet.js'

const mapStateToProps = (state) => ({
	confirmedbalance: state.wallet.get('confirmedbalance'),
	unconfirmedbalance: state.wallet.get('unconfirmedbalance'),
	blockstakebalance: state.wallet.get('blockstakebalance'),
	showReceivePrompt: state.wallet.get('showReceivePrompt'),
	showSendPrompt: state.wallet.get('showSendPrompt'),
	showNewWalletDialog: state.wallet.get('showNewWalletDialog'),
})
const mapDispatchToProps = (dispatch) => ({
	actions: bindActionCreators({ startSendPrompt }, dispatch),
})

const Wallet = connect(mapStateToProps, mapDispatchToProps)(WalletView)
export default Wallet
