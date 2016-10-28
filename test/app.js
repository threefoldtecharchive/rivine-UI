import { Application } from 'spectron'
import { expect } from 'chai'
import psTree from 'ps-tree'
import * as Rivined from '../rivine.js'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// getRivinedChild takes an input pid and looks at all the child process of that
// pid, returning an object with the fields {exists, pid}, where exists is true
// if the input pid has a 'rivined' child, and the pid is the process id of the
// child.
const getRivinedChild = (pid) => new Promise((resolve, reject) => {
	psTree(pid, (err, children) => {
		if (err) {
			reject(err)
		}
		children.forEach((child) => {
			if (child.COMMAND === 'rivined') {
				resolve({exists: true, pid: child.PID})
			}
		})
		resolve({exists: false})
	})
})

// pkillRivined kills all rivined processes running on the machine, used in these
// tests to ensure a clean env
const pkillRivined = () => new Promise((resolve, reject) => {
	psTree(0, (err, children) => {
		if (err) {
			reject(err)
		}
		children.forEach((child) => {
			if (child.COMMAND === 'rivined') {
				process.kill(child.PID, 'SIGKILL')
			}
		})
		resolve()
	})
})

// isProcessRunning leverages the semantics of `process.kill` to return true if
// the input pid is a running process.  If process.kill is initiated with the
// signal set to '0', no signal is sent, but error checking is still performed.
const isProcessRunning = (pid) => {
	try {
		process.kill(pid, 0)
		return true
	} catch (e) {
		return false
	}
}

// we need functions for mocha's `this` for setting timeouts.
/* eslint-disable no-invalid-this */
/* eslint-disable no-unused-expressions */
describe('startup and shutdown behaviour', () => {
	after(async () => {
		// never leave a dangling rivined
		await pkillRivined()
	})
	describe('window closing behaviour', function() {
		this.timeout(10000)
		let app
		beforeEach(async () => {
			await pkillRivined()
			app = new Application({
				path: './node_modules/electron-prebuilt/dist/electron',
				args: [
					'.',
				],
			})
			return app.start()
		})
		afterEach(async () => {
			try {
				app.webContents.send('quit')
				await app.stop()
			} catch (e) {
			}
		})
		it('hides the window and persists in tray if closeToTray = true', async () => {
			await app.client.waitUntilWindowLoaded()
			app.webContents.executeJavaScript('window.closeToTray = true')
			while (await app.client.getText('#overlay-text') !== 'Welcome to Rivine') {
				await sleep(200)
			}
			app.browserWindow.close()
			await sleep(1000)
			expect(await app.browserWindow.isDestroyed()).to.be.false
		})
		it('quits gracefully on close if closeToTray = false', async () => {
			await app.client.waitUntilWindowLoaded()
			app.webContents.executeJavaScript('window.closeToTray = false')
			while (await app.client.getText('#overlay-text') !== 'Welcome to Rivine') {
				await sleep(200)
			}
			const pid = await app.mainProcess.pid()
			const rivinedProcess = await getRivinedChild(pid)
			expect(rivinedProcess.exists).to.be.true

			app.browserWindow.close()
			while (await app.client.isVisible('#overlay-text') === false) {
				await sleep(10)
			}
			while (await app.client.getText('#overlay-text') !== 'Quitting Rivine...') {
				await sleep(10)
			}
			while (isProcessRunning(pid)) {
				await sleep(10)
			}
			expect(isProcessRunning(rivinedProcess.pid)).to.be.false
		})
	})
	describe('startup with no rivined currently running', function() {
		this.timeout(120000)
		let app
		before(async () => {
			await pkillRivined()
			app = new Application({
				path: './node_modules/electron-prebuilt/dist/electron',
				args: [
					'.',
				],
			})
			return app.start()
		})
		after(() => {
			if (app.isRunning()) {
				app.webContents.send('quit')
				app.stop()
			}
		})
		it('starts rivined and loads correctly on launch', async () => {
			const pid = await app.mainProcess.pid()
			await app.client.waitUntilWindowLoaded()
			while (await app.client.getText('#overlay-text') !== 'Welcome to Rivine') {
				await sleep(200)
			}
			const rivinedProcess = await getRivinedChild(pid)
			expect(rivinedProcess.exists).to.be.true
		})
		it('gracefully exits rivined on quit', async () => {
			const pid = await app.mainProcess.pid()
			const rivinedProcess = await getRivinedChild(pid)
			expect(rivinedProcess.exists).to.be.true
			app.webContents.send('quit')
			while (await app.client.getText('#overlay-text') !== 'Quitting Rivine...') {
				await sleep(200)
			}
			while (isProcessRunning(pid)) {
				await sleep(200)
			}
			expect(isProcessRunning(rivinedProcess.pid)).to.be.false
		})
	})
	describe('startup with a rivined already running', function() {
		this.timeout(120000)
		let app
		let rivinedProcess
		before(async () => {
			await pkillRivined()
			rivinedProcess = Rivined.launch('rivined')
			app = new Application({
				path: './node_modules/electron-prebuilt/dist/electron',
				args: [
					'.',
				],
			})
			return app.start()
		})
		after(async () => {
			await pkillRivined()
			if (app.isRunning()) {
				app.webContents.send('quit')
				app.stop()
			}
		})
		it('connects and loads correctly to the running rivined', async () => {
			const pid = await app.mainProcess.pid()
			await app.client.waitUntilWindowLoaded()
			while (await app.client.getText('#overlay-text') !== 'Welcome back') {
				await sleep(200)
			}
			const childRivined = await getRivinedChild(pid)
			expect(childRivined.exists).to.be.false
		})
		it('doesnt quit rivined on exit', async () => {
			const pid = await app.mainProcess.pid()
			app.webContents.send('quit')
			while (isProcessRunning(pid)) {
				await sleep(200)
			}
			expect(isProcessRunning(rivinedProcess.pid)).to.be.true
			rivinedProcess.kill('SIGKILL')
		})
	})
})

/* eslint-enable no-invalid-this */
/* eslint-enable no-unused-expressions */
