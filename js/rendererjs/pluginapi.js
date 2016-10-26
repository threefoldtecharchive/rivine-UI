// pluginapi.js: Rivine-UI plugin API interface exposed to all plugins.
// This is injected into every plugin's global namespace.
import * as Rivined from '../mainjs/rivine.js'
import { remote } from 'electron'
import React from 'react'
import DisabledPlugin from './disabledplugin.js'
const dialog = remote.dialog
const mainWindow = remote.getCurrentWindow()
const config = remote.getGlobal('config')
const rivinedConfig = config.rivined
let disabled = false

const sleep = (ms = 0) => new Promise((r) => setTimeout(r, ms))

window.onload = async function() {
	// ReactDOM needs a DOM in order to be imported,
	// but the DOM is not available until the plugin has loaded.
	// therefore, we have to global require it inside the window.onload event.

	/* eslint-disable global-require */
	const ReactDOM = require('react-dom')
	/* eslint-enable global-require */

	const startRivined = () => {
		Rivined.launch(rivinedConfig.path, {
			'rivine-directory': rivinedConfig.datadir,
		})
	}
	// Continuously check (every 2000ms) if rivined is running.
	// If rivined is not running, disable the plugin by mounting
	// the `DisabledPlugin` component in the DOM's body.
	// If rivined is running and the plugin has been disabled,
	// reload the plugin.
	while (true) {
		const running = await Rivined.isRunning(rivinedConfig.address)
		if (running && disabled) {
			disabled = false
			window.location.reload()
		}
		if (!running && !disabled) {
			disabled = true
			ReactDOM.render(<DisabledPlugin startRivined={startRivined} />, document.body)
		}
		await sleep(2000)
	}
}


window.RivineAPI = {
	call: async function(url, callback) {
		const running = await Rivined.isRunning(rivinedConfig.address)
		if (running) {
			let results
			let error
			try {
				results = await Rivined.call(rivinedConfig.address, url)
			} catch (e) {
				error = e
			}
			callback(error, results)
		}
	},
	config: config,
	hastingsToRivinecoins: Rivined.hastingsToRivinecoins,
	rivinecoinsToHastings: Rivined.rivinecoinsToHastings,
	openFile: (options) => dialog.showOpenDialog(mainWindow, options),
	saveFile: (options) => dialog.showSaveDialog(mainWindow, options),
	showMessage: (options) => dialog.showMessageBox(mainWindow, options),
	showError: (options) => dialog.showErrorBox(options.title, options.content),
}
