// Imported Electron modules
import Path from 'path'
import * as Rivined from '../../rivine.js'
import loadingScreen from './loadingScreen.js'
import { remote, ipcRenderer } from 'electron'
import { unloadPlugins, loadPlugin, setCurrentPlugin, getOrderedPlugins, getPluginName } from './plugins.js'

const App = remote.app
const mainWindow = remote.getCurrentWindow()
const defaultPluginDirectory = Path.join(App.getAppPath(), './plugins')
const defaultHomePlugin = 'About'
const config = remote.getGlobal('config')
window.closeToTray = mainWindow.closeToTray

// Called at window.onload by the loading screen.
// Wait for rivined to load, then load the plugin system.
function init(callback) {
	// Initialize plugins.
	const plugins = getOrderedPlugins(defaultPluginDirectory, defaultHomePlugin)
	let homePluginView
	// Load each plugin element into the UI
	for (let i = 0; i < plugins.size; i++) {
		const plugin = loadPlugin(plugins.get(i))
		if (getPluginName(plugins.get(i)) === defaultHomePlugin) {
			homePluginView = plugin
		}
	}
	const onHomeLoad = () => {
		setCurrentPlugin(defaultHomePlugin)
		homePluginView.removeEventListener('dom-ready', onHomeLoad)
		callback()
	}
	// wait for the home plugin to load before calling back
	homePluginView.addEventListener('dom-ready', onHomeLoad)
}

// shutdown triggers a clean shutdown of rivined.
const shutdown = async () => {
	unloadPlugins()

	const overlay = document.getElementsByClassName('overlay')[0]
	const overlayText = overlay.getElementsByClassName('centered')[0].getElementsByTagName('p')[0]
	const rivinedConfig = config.attr('rivined')

	overlay.style.display = 'inline-flex'
	overlayText.textContent = 'Quitting Rivine...'

	// Block, displaying Quitting Rivine..., until Rivined has stopped.
	if (typeof window.rivinedProcess !== 'undefined') {
		setTimeout(() => window.rivinedProcess.kill('SIGKILL'), 15000)
		Rivined.call(rivinedConfig.address, '/daemon/stop')
		const running = (pid) => {
			try {
				process.kill(pid, 0)
				return true
			} catch (e) {
				return false
			}
		}
		const sleep = (ms = 0) => new Promise((r) => setTimeout(r, ms))
		while (running(window.rivinedProcess.pid)) {
			await sleep(200)
		}
	}

	mainWindow.destroy()
}

// Register an IPC callback for triggering clean shutdown
ipcRenderer.on('quit', async () => {
	await shutdown()
})

// If closeToTray is set, hide the window and cancel the close.
// On windows, display a balloon notification on first hide
// to inform users that Rivine-UI is still running.  NOTE: returning any value
// other than `undefined` cancels the close.
let hasClosed = false
window.onbeforeunload = () => {
	if (window.closeToTray) {
		mainWindow.hide()
		if (process.platform === 'win32' && !hasClosed) {
			mainWindow.tray.displayBalloon({
				title: 'Rivine-UI information',
				content: 'Rivine is still running.  Right click this tray icon to quit or restore Rivine.',
			})
			hasClosed = true
		}
		return false
	}
	shutdown()
	return false
}

// Once the main window loads, start the loading process.
window.onload = function() {
	loadingScreen(init)
}
