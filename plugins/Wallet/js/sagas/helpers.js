// Helper functions for the wallet plugin.  Mostly used in sagas.

import BigNumber from 'bignumber.js'
import { List } from 'immutable'
const uint64max = Math.pow(2, 64)

// rivinedCall: promisify Rivined API calls.  Resolve the promise with `response` if the call was successful,
// otherwise reject the promise with `err`.
export const rivinedCall = (uri) => new Promise((resolve, reject) => {
	RivineAPI.call(uri, (err, response) => {
		if (err) {
			reject(err)
		} else {
			resolve(response)
		}
	})
})

// Compute the sum of all currencies of type currency in txns
const sumCurrency = (txns, currency) => txns.reduce((sum, txn) => {
	if (txn.fundtype.indexOf(currency) > -1) {
		return sum.add(new BigNumber(txn.value))
	}
	return sum
}, new BigNumber(0))

// Compute the net value and currency type of a transaction.
const computeTransactionSum = (txn) => {
	let totalCoinInput = new BigNumber(0)
	let totalBlockstakeInput = new BigNumber(0)
	let totalMinerInput = new BigNumber(0)

	let totalCoinOutput = new BigNumber(0)
	let totalBlockstakeOutput = new BigNumber(0)
	let totalMinerOutput = new BigNumber(0)

	if (txn.inputs) {
		const walletInputs = txn.inputs.filter((input) => input.walletaddress && input.value)
		totalCoinInput = sumCurrency(walletInputs, 'coin')
		totalBlockstakeInput = sumCurrency(walletInputs, 'blockstake')
		totalMinerInput = sumCurrency(walletInputs, 'miner')
	}
	if (txn.outputs) {
		const walletOutputs = txn.outputs.filter((input) => input.walletaddress && input.value)
		totalCoinOutput = sumCurrency(walletOutputs, 'coin')
		totalBlockstakeOutput = sumCurrency(walletOutputs, 'blockstake')
		totalMinerOutput = sumCurrency(walletOutputs, 'miner')
	}
	return {
		totalCoin: RivineAPI.hastingsToCoins(totalCoinOutput.minus(totalCoinInput)),
		totalBlockstake: totalBlockstakeOutput.minus(totalBlockstakeInput),
		totalMiner:   RivineAPI.hastingsToCoins(totalMinerOutput.minus(totalMinerInput)),
	}
}

// Parse data from /wallet/transactions and return a immutable List of transaction objects.
// The transaction objects contain the following values:
// {
//   confirmed (boolean): whether this transaction has been confirmed by the network
//	 transactionsums: the net coin, blockstake, and miner values
//   transactionid: The transaction ID
//   confirmationtimestamp:  The time at which this transaction occurred
// }
export const parseRawTransactions = (response) => {
	if (!response.unconfirmedtransactions) {
		response.unconfirmedtransactions = []
	}
	if (!response.confirmedtransactions) {
		response.confirmedtransactions = []
	}
	const rawTransactions = response.unconfirmedtransactions.concat(response.confirmedtransactions)
	const parsedTransactions = List(rawTransactions.map((txn) => {
		const transactionsums = computeTransactionSum(txn)
		const confirmed = (txn.confirmationtimestamp !== uint64max)
		return {
			confirmed,
			transactionsums,
			transactionid: txn.transactionid,
			confirmationtimestamp: new Date(txn.confirmationtimestamp*1000),
		}
	}))
	// Return the transactions, sorted by timestamp.
	return parsedTransactions.sortBy((txn) => -txn.confirmationtimestamp)
}
