'use strict'

// Library for communicating with Rivine-UI
const electron = require('electron')

// Set UI version via package.json.
document.getElementById('uiversion').innerHTML = require('../../package.json').version

// Set daemon version via API call.
RivineAPI.call('/daemon/version', (err, result) => {
	if (err) {
		RivineAPI.showError('Error', err.toString())
		ipcRenderer.sendToHost('notification', err.toString(), 'error')
	} else {
		document.getElementById('rivineversion').innerHTML = result.version
	}
})

// Make FAQ button launch the FAQ webpage.
document.getElementById('faq').onclick = function() {
	electron.shell.openExternal('http://rivine.tech/faq')
}
