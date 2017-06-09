// loadingScreen.js: display a loading screen until communication with Rivined has been established.
// if an available daemon is not running on the host,
// launch an instance of rivined using config.js.
import { remote } from 'electron'
import * as Rivined from '../../rivine.js'
import Path from 'path'
import React from 'react'
import ReactDOM from 'react-dom'
import StatusBar from './statusbar.js'

const dialog = remote.dialog
const app = remote.app
const fs = remote.require('fs')
const config = remote.getGlobal('config')
const rivinedConfig = config.attr('rivined')

const overlay = document.getElementsByClassName('overlay')[0]
const overlayText = overlay.getElementsByClassName('centered')[0].getElementsByTagName('p')[0]
overlayText.textContent = 'Loading Rivine...'

const showError = (error) => {
	overlayText.textContent = 'A Rivine-UI error has occured: ' + error
}

// startUI starts a Rivine UI instance using the given welcome message.
// calls initUI() after displaying a welcome message.
const startUI = (welcomeMsg, initUI) => {
	// Display a welcome message, then initialize the ui
	overlayText.innerHTML = welcomeMsg

	// Construct the status bar component and poll for updates from Rivined
	const updateSyncStatus = async function() {
		const consensusData = await Rivined.call(rivinedConfig.address, '/consensus')
		const gatewayData = await Rivined.call(rivinedConfig.address, '/gateway')
		ReactDOM.render(<StatusBar peers={gatewayData.peers.length} synced={consensusData.synced} blockheight={consensusData.height} />, document.getElementById('statusbar'))
	}

	updateSyncStatus()
	setInterval(updateSyncStatus, 1000)

	initUI(() => {
		overlay.style.display = 'none'
	})
}

// checkRivinePath validates config's Rivine path.
// returns a promise that is resolved with `true` if rivinedConfig.path exists
// or `false` if it does not exist.
const checkRivinePath = () => new Promise((resolve) => {
	fs.stat(rivinedConfig.path, (err) => {
		if (!err) {
			resolve(true)
		} else {
			resolve(false)
		}
	})
})

// Check if Rivined is already running on this host.
// If it is, start the UI and display a welcome message to the user.
// Otherwise, start a new instance of Rivined using config.js.
export default async function loadingScreen(initUI) {
	// Create the Rivine data directory if it does not exist
	try {
		fs.statSync(rivinedConfig.datadir)
	} catch (e) {
		fs.mkdirSync(rivinedConfig.datadir)
	}
	// If Rivine is already running, start the UI with a 'Welcome Back' message.
	const running = await Rivined.isRunning(rivinedConfig.address)
	if (running) {
		startUI('Welcome back', initUI)
		return
	}

	// check rivinedConfig.path, if it doesn't exist optimistically set it to the
	// default path
	if (!await checkRivinePath(rivinedConfig.path)) {
		rivinedConfig.path = config.defaultRivinedPath
	}

	// check rivinedConfig.path, and ask for a new path if siad doesn't exist.
	if (!await checkRivinePath(rivinedConfig.path)) {

		// config.path doesn't exist.  Prompt the user for rivined's location
		dialog.showErrorBox('Rivined not found', 'Rivine-UI couldn\'t locate rivined.  Please navigate to rivined.')
		const rivinedPath = dialog.showOpenDialog({
			title: 'Please locate rivined.',
			properties: ['openFile'],
			defaultPath: Path.join('..', rivinedConfig.path),
			filters: [{ name: 'rivined', extensions: ['*'] }],
		})
		if (typeof rivinedPath === 'undefined') {
			// The user didn't choose rivined, we should just close.
			app.quit()
		}
		rivinedConfig.path = rivinedPath[0]
	}
	// Launch the new Rivined process
	try {
		const rivinedProcess = Rivined.launch(rivinedConfig.path, {
			'rivine-directory': rivinedConfig.datadir,
			'rpc-addr': rivinedConfig.rpcaddr,
			'api-addr': rivinedConfig.apiaddress,
		})
		rivinedProcess.on('error', (e) => showError('Rivined couldnt start: ' + e.toString()))
		rivinedProcess.on('close', () => showError('Rivined unexpectedly closed.'))
		rivinedProcess.on('exit', () => showError('Rivined unexpectedly exited.'))
		window.rivinedProcess = rivinedProcess
	} catch (e) {
		showError(e.toString())
		return
	}
	// Wait for this process to become reachable before starting the UI.
	const sleep = (ms = 0) => new Promise((r) => setTimeout(r, ms))
	while (await Rivined.isRunning(rivinedConfig.address) === false) {
		await sleep(500)
	}
	// Unregister callbacks
	window.rivinedProcess.removeAllListeners('error')
	window.rivinedProcess.removeAllListeners('exit')
	window.rivinedProcess.removeAllListeners('close')

	startUI('Welcome to Rivine', initUI)
}
