import { app } from 'electron'
import Path from 'path'
import loadConfig from './config.js'
import initWindow from './initWindow.js'

// load config.json manager
global.config = loadConfig(Path.join(__dirname, '../config.json'))
let mainWindow

// When Electron loading has finished, start Rivine-UI.
app.on('ready', () => {
	// Load mainWindow
	mainWindow = initWindow(config)
})

// Allow only one instance of Rivine-UI
app.makeSingleInstance(() => {
	mainWindow.restore()
	mainWindow.focus()
})

// Quit once all windows have been closed.
app.on('window-all-closed', () => {
	app.quit()
})

// On quit, save the config.
// There's no need to call rivined.stop here, since if rivined was launched by the UI,
// it will be a descendant of the UI in the process tree and will therefore be killed.
app.on('quit', () => {
	config.save()
})
