import Path from 'path'
import fs from 'graceful-fs'
import child_process from 'child_process'
import { Map } from 'immutable'
import http from 'http'
import url from 'url'
import * as constants from '../constants/helper.js'

export const checkRivinePath = () => new Promise((resolve, reject) => {
	fs.stat(RivineAPI.config.attr('rivinec').path, (err) => {
		if (!err) {
			if (Path.basename(RivineAPI.config.attr('rivinec').path).indexOf('rivinec') !== -1) {
				resolve()
			} else {
				reject({ message: 'Invalid binary name.' })
			}
		} else {
			reject(err)
		}
	})
})

export const initPlugin = () => checkRivinePath().catch(() => {
	//Look in the rivined folder for rivinec.
	RivineAPI.config.attr('rivinec', { path: Path.resolve( Path.dirname(RivineAPI.config.attr('rivined').path), (process.platform === 'win32' ? './rivinec.exe' : './rivinec') ) })
	checkRivinePath().catch(() => {
		// config.path doesn't exist. Prompt the user for rivinec's location
		if (!RivineAPI.config.attr('rivinec')) {
			RivineAPI.config.attr('rivinec', { path: '' })
		}
		RivineAPI.showError({ title: 'Rivinec not found', content: 'Rivine-UI couldn\'t locate rivinec. Please navigate to rivinec.' })
		const rivinecPath = RivineAPI.openFile({
			title: 'Please locate rivinec.',
			properties: ['openFile'],
			defaultPath: Path.join('..', RivineAPI.config.attr('rivinec').path || './' ),
			filters: [{ name: 'rivinec', extensions: ['*'] }],
		})
		if (rivinecPath) {
			if (Path.basename(rivinecPath[0]).indexOf('rivinec') === -1) {
				RivineAPI.showError({ title: 'Invalid Binary Name', content: 'The rivinec binary must be called rivinec. Restart the plugin to choose a valid binary.' })
			} else {
				RivineAPI.config.attr('rivinec', { path: rivinecPath[0] })
			}
		} else {
			RivineAPI.showError({ title: 'Rivinec not found', content: 'This plugin will be unusable until a proper rivinec binary is found.' })
		}
	})
	RivineAPI.config.save()
})

export const commandType = function(commandString, specialArray) {
	//Cleans string and sees if any subarray in array starts with the string when split.
	const args = commandString.replace(/\s*\s/g, ' ').trim().split(' ')
	if (args[0] === './rivinec' || args[0] === 'rivinec') {
		args.shift()
	}

	//Can't do a simple match because commands can be passed additional arguments.
	return specialArray.findIndex( (command) =>
		command.reduce((matches, argument, i) =>
			(matches && argument === args[i]),
		true) && commandString.indexOf('-h') === -1 //Also covers --help.
		//Don't show a password prompt if user is looking for help.
	)
}

export const getArgumentString = function(commandString, rawCommandSplit) {
	//Parses out ./rivinec, rivinec, command, and address flags leaving only arguments.

	//Remove leading ./rivinec or rivinec
	const args = commandString.replace(/\s*\s/g, ' ').trim().split(' ')
	if (args[0] === './rivinec' || args[0] === 'rivinec') {
		args.shift()
	}

	//Remove command from sting.
	for (const token of rawCommandSplit) {
		if (args[0] === token) {
			args.shift()
		} else {
			console.log(`ERROR: getArgumentString failed, string: ${commandString}, did not contain command: ${rawCommandSplit.join(' ')}`)
			return ''
		}
	}

	//Strip out address flag.
	let index = args.indexOf('-a')
	if  (index === -1) {
		index = args.indexOf('--address')
	}
	if (index !== -1) {
		args.splice(index, 2)
	}
	return args.join(' ')
}

export const spawnCommand = function(commandStr, actions, newid) {
	//Create new command object. Id doesn't need to be unique, just can't be the same for adjacent commands.

	//We set the command first so the user sees exactly what they type. (Minus leading and trailing spaces, double spaces, etc.)
	let commandString = commandStr.replace(/\s*\s/g, ' ').trim()
	const newCommand = Map({ command: commandString, result: '', id: newid, stat: 'running' })
	actions.addCommand(newCommand)

	//Remove surrounding whitespace and leading rivinec command.
	if (commandString.startsWith('rivinec')) {
		commandString = commandString.slice(4).trim()
	} else if (commandString.startsWith('./rivinec')) {
		commandString = commandString.slice(6).trim()
	}

	//Add address flag to rivinec.
	let args = commandString.split(' ')
	if (args.indexOf('-a') === -1 && args.indexOf('--address') === -1 && RivineAPI.config.attr('address')) {
		args = args.concat([ '-a', RivineAPI.config.attr('address') ])
	}

	const rivinec = child_process.spawn('./rivinec', args, { cwd: Path.dirname(RivineAPI.config.attr('rivinec').path || '') })

	//Update the UI when the process receives new ouput.
	const consumeChunk = function(chunk) {
		const chunkTrimmed = chunk.toString().replace(/stty: stdin isn't a terminal\n/g, '')
		actions.updateCommand(newCommand.get('command'), newCommand.get('id'), chunkTrimmed)
	}
	rivinec.stdout.on('data', consumeChunk)
	rivinec.stderr.on('data', consumeChunk)

	let closed = false
	const streamClosed = function() {
		if (!closed) {
			actions.endCommand(newCommand.get('command'), newCommand.get('id'))
			closed = true
		}
	}

	rivinec.on('error', (e) => {
		consumeChunk(`Error running command: ${e.message}.\nIs your rivinec path correct?`)
		streamClosed()
	})
	rivinec.on('close', () => {
		streamClosed()
	})

	//If window is small auto close command overview so we can see the return value.
	if (document.getElementsByClassName('command-history-list')[0].offsetHeight < 180) {
		actions.hideCommandOverview()
	}

	return rivinec
}

export const httpCommand = function(commandStr, actions, newid) {
	let commandString = commandStr
	const originalCommand = commandStr.replace(/\s*\s/g, ' ').trim()

	//Remove surrounding whitespace and leading rivinec command.
	if (commandString.startsWith('rivinec')) {
		commandString = commandString.slice(4).trim()
	} else if (commandString.startsWith('./rivinec')) {
		commandString = commandString.slice(6).trim()
	}

	//Parse arguments.
	const args = commandString.split(' ')

	//Add address flag to rivinec.
	let rivineAddr = url.parse('http://localhost:9980')

	if (args.indexOf('-a') === -1 && args.indexOf('--address') === -1) {
		if (RivineAPI.config.attr('address')) {
			//Load default address.
			rivineAddr = url.parse('http://' + RivineAPI.config.attr('address'))
		}
	} else {
		//Parse address flag.
		let index = args.indexOf('-a')
		if  (index === -1) {
			index = args.indexOf('--address')

		}
		if (index < args.length-1) {
			rivineAddr = url.parse('http://' + args[index+1])
		}
		args.splice(index, 2)
		commandString = args.join(' ')
	}

	let apiURL = ''
	if (commandString === 'wallet unlock') {
		apiURL = '/wallet/unlock'
	} else if (commandString === 'wallet load seed') {
		apiURL = '/wallet/seed'
	} else if (commandString.includes('wallet load 033x', 0)) {
		apiURL = '/wallet/033x'
	} else if (commandString.includes('wallet load rivineg', 0)) {
		apiURL = '/wallet/rivinegkey'
	} else {
		return spawnCommand(commandString, actions).stdin
	}

	//Spawn new command if we are good to go.
	const newCommand = Map({ command: originalCommand, result: '', id: newid, stat: 'running' })
	actions.addCommand(newCommand)

	//Update the UI when the process receives new ouput.
	let buffer = ''
	const consumeChunk = function(chunk) {
		buffer += chunk.toString()
	}

	let closed = false
	const streamClosed = function(res) {
		if (!closed) {
			try {
				buffer = JSON.parse(buffer).message
			} catch (e) {}

			if (res && res.statusCode >= 200 && res.statusCode <= 299) {
				buffer += 'Success'
			}

			actions.updateCommand(newCommand.get('command'), newCommand.get('id'), buffer)
			actions.endCommand(newCommand.get('command'), newCommand.get('id'))
			closed = true
		}
	}

	//If window is small auto close command overview so we can see the return value.
	if (document.getElementsByClassName('command-history-list')[0].offsetHeight < 180) {
		actions.hideCommandOverview()
	}

	const options = {
		hostname: rivineAddr.hostname,
		port: rivineAddr.port,
		path: apiURL,
		method: 'POST',
		headers: {
			'User-Agent': 'Rivine-Agent',
			'Content-Type': 'application/x-www-form-urlencoded',
		},
	}
	const req = http.request(options, (res) => {
		res.on('data', consumeChunk)
		res.on('end', () => streamClosed(res))
	})
	req.on('error', (e) => {
		consumeChunk(e.message)
		streamClosed()
	})
	return req
}

export const commandInputHelper = function(e, actions, currentCommand, showCommandOverview, newid) {
	const eventTarget = e.target
	//Enter button.
	if (e.keyCode === 13) {

		//Check if command is special.
		switch ( commandType(currentCommand, constants.specialCommands) ) {
		case constants.REGULAR_COMMAND: //Regular command.
			spawnCommand(currentCommand, actions, newid) //Spawn command defined in index.js.
			break

		case constants.WALLET_UNLOCK: //wallet unlock
		case constants.WALLET_033X: //wallet load 033x
		case constants.WALLET_rivineG: //wallet load rivineg
		case constants.WALLET_SEED: //wallet load seed
			actions.showWalletPrompt()
			break

		case constants.HELP: //help
			const text = 'help'
		case constants.HELP_QMARK: //?
			const newText = text || '?'
			if (showCommandOverview) {
				actions.hideCommandOverview()
			} else {
				actions.showCommandOverview()
			}

			//The command log won't actually show a help command but we still want to be able to select it in the command history.
			const newCommand = Map({ command: newText, result: '', id: newid })
			actions.addCommand(newCommand)
			actions.endCommand(newCommand.get('command'), newCommand.get('id'))
			break

		default:
			break
		}
	} else if (e.keyCode === 38) {
		//Up arrow.
		actions.loadPrevCommand(eventTarget.value)
		setTimeout( () => {
			eventTarget.setSelectionRange(eventTarget.value.length, eventTarget.value.length)
		}, 0)
	} else if (e.keyCode === 40) {
		//Down arrow.
		actions.loadNextCommand(eventTarget.value)
		setTimeout(() => {
			eventTarget.setSelectionRange(eventTarget.value.length, eventTarget.value.length)
		}, 0)
	}
}
