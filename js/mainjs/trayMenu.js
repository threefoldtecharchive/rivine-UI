import { Menu } from 'electron'

export default function(window) {
	// Template for Rivine-UI tray menu.
	const menutemplate = [
		{
			label: 'Show Rivine',
			click: () => window.show(),
		},
		{ type: 'separator' },
		{
			label: 'Hide Rivine',
			click: () => window.hide(),
		},
		{ type: 'separator' },
		{
			label: 'Quit Rivine',
			click: () => {
				window.webContents.send('quit')
			},
		},
	]

	return Menu.buildFromTemplate(menutemplate)
}
