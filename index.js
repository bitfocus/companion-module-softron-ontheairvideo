import { runEntrypoint, InstanceBase, InstanceStatus, Regex } from '@companion-module/base'
import { getActions } from './actions.js'
import { getPresets } from './presets.js'
import { updateVariableDefinitions, updateStatusVariables, updatePlaylistVariables } from './variables.js'
import { initFeedbacks } from './feedbacks.js'
import { upgradeScripts } from './upgrades.js'
import got from 'got'

/**
 * Companion instance class for the Softron OnTheAir Vidoe software playout API.
 *
 * @extends InstanceBase
 * @version 1.0.0
 * @since 1.0.0
 * @author Stephen Harrison <stephen@redleopard.org>
 */
class OnTheAirVideoInstance extends InstanceBase {
	/**
	 * Main constructor
	 * @since 1.0.0
	 */
	constructor(internal) {
		super(internal)

		//	this.updateVariableDefinitions = updateVariableDefinitions
		//	this.updateStatusVariables = updateStatusVariables
		//	this.updatePlaylistVariables = updatePlaylistVariables

		this.playlists = []
		this.playing = {}
		this.pollingActive = 0
		this.errorCount = 0
		this.pollTimer = null
		this.pollingInterval = 1000 // ms
		this.testingActive = 0
		this.testInterval = 10000
		this.pollUrl = ``
	}

	/**
	 * Creates the configuration fields for web config.
	 *
	 * @returns {Array} the config fields
	 * @access public
	 * @since 1.0.0
	 */
	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'Target IP',
				width: 6,
				regex: Regex.IP,
			},
			{
				type: 'number',
				id: 'port',
				label: 'Target Port',
				min: 1,
				max: 65535,
				default: 8081,
			},
		]
	}

	/**
	 * Clean up the instance before it is destroyed.
	 *
	 * @access public
	 * @since 1.0.0
	 */
	async destroy() {
		this.log('debug', `destroy ${his.id}`)
	}

	/**
	 * Main initialization function called once the module
	 * is OK to start doing things.
	 *
	 * @access public
	 * @since 1.0.0
	 */
	async init(config) {
		this.config = config
		//	debug = this.debug
//	log = this.log

		this.updateStatus(InstanceStatus.Connecting, 'Waiting') // status not currently known

		//Test the connection with a status request
		//		this.sendGetRequest(`playback/playing`);
		await this.setupConnectivtyTester()
		
		this.getPlaylists()
		this.initActions() // Set the actions after info is retrieved
		this.initVariables()
		this.initFeedbacks()
		this.initPresets()
	}

	/**
	 * INTERNAL: initialize variables.
	 *
	 * @access protected
	 * @since 1.1.0
	 */
	initVariables() {
		this.updateVariableDefinitions()
	}

	/**
	 * Set available feedback choices
	 */
	initFeedbacks() {
		const feedbacks = initFeedbacks.bind(this)()
		this.setFeedbackDefinitions(feedbacks)
	}

	/**
	 * Initialize presets
	 * @param  {} updates
	 */
	initPresets(updates) {
		this.setPresetDefinitions(this.getPresets())
	}

	/**
	 * Set all the actions
	 * @param  {} system
	 */
	initActions(system) {
		this.setActionDefinitions(this.getActions())
	}

	/**
	 * INTERNAL: uses rest_poll_get to create an interval to, effectively, ping
	 * the device to see if its there.  This uses a longer interval so we're
	 * not firing a ton of poll calls to a non-responsive device.
	 *
	 * @private
	 * @since 1.0.0
	 */
	async setupConnectivtyTester() {
		this.log('debug', 'Setup Connectivity Tester!')
		this.errorCount = 0
		this.pollingActive = 0
		this.pollUrl = `http://${this.config.host}:${this.config.port}/playback/playing`
//	this.system.emit('rest_poll_destroy', this.id)

		try {
			const {response} = await got(this.pollUrl).json()
			this.log('debug', response.statusCode)
			this.processResult(response)
		}  catch (error) {
			console.log(error)
			this.processResult(error)
		}
		
//	this.system.emit(
//		'rest_poll_get',
//		this.id,
//		this.testInterval,
//		this.pollUrl,
//		(err, pollInstance) => {
//			if (pollInstance.id !== undefined) {
//				this.currentInterval = pollInstance
//				this.testingActive = 1
//			} else {
//				this.currentInterval = {}
//				this.updateStatus(InstanceStatus.ConnectionFailure, 'Connectivity Failed')
//				this.log('error', 'Failed to create connectivity interval timer')
//			}
//		},
//		this.processResult.bind(this)
//	)
	}

	/**
	 * INTERNAL: uses rest_poll_get to create an interval to run the active polling.
	 *
	 * @private
	 * @since 1.0.0
	 */
	setupPolling() {
		this.errorCount = 0
		this.testingActive = 0
		this.pollUrl = `http://${this.config.host}:${this.config.port}/playback/playing`
//	this.system.emit('rest_poll_destroy', this.id)
		

//	this.system.emit(
//		'rest_poll_get',
//		this.id,
//		parseInt(this.pollingInterval),
//		this.pollUrl,
//		(err, pollInstance) => {
//			if (pollInstance.id !== undefined) {
//				this.currentInterval = pollInstance
//				this.pollingActive = 1
//			} else {
//				this.updateStatus(InstanceStatus.ConnectionFailure, 'Polling Failed')
//				this.log('error', 'Failed to create polling interval timer')
//			}
//		},
//		this.processResult.bind(this)
//	)
	}

	async configUpdated(config) {
		let resetConnection = false

		this.log('debug', `Updating config: ${config}`)
		if (this.config.host != config.host) {
			resetConnection = true
		}
		this.config = config
		this.log('debug', `Reset connection ${resetConnection}`)
		if (resetConnection === true) {
			this.updateStatus(InstanceStatus.Connecting, 'Waiting…')
			this.setupConnectivtyTester()
		}
	}

	/**
	 * Build an array of active playlists and their contained clips
	 */
	getPlaylists() {
		this.playlists = []
		this.sendGetRequest('playlists')
	}
	// TODO Update playlists periodically

	/**
	 * Send a REST GET request to the player and handle errorcodes
	 * @param  {} cmd
	 */
	async sendGetRequest(cmd) {
		let url = `http://${this.config.host}:${this.config.port}/${cmd}`
//	this.system.emit('rest_get', url, this.processResult.bind(this))
		try {
			const response = await got(url).json()
			console.log(response.body)
		}  catch (error) {
			console.log(error.response)
			this.processResult(error)
		}
	}

	/**
	 * INTERNAL: Callback for REST calls to process the return
	 *
	 * @param {?boolean} err - null if a normal result, true if there was an error
	 * @param {Object} result - data: & response: if normal; error: if error
	 * @private
	 * @since 1.0.0
	 */
	processResult(response) {
		console.log(`Response statusCode: ${response.statusCode}`)
		switch (response.statusCode) {
			case 200: // OK
				this.updateStatus(InstanceStatus.Ok)
				if (this.testingActive === 1) {
					this.setupPolling()
				}
//				this.processData200(decodeURI(result.response.req.path), result.data)
				break
			case 201: // Created
				this.updateStatus(InstanceStatus.Ok)
				this.log('debug', `Created: ${result.data.error}`)
				break
			case 202: // Accepted
				this.updateStatus(InstanceStatus.Ok)
				this.log('debug', `Accepted: ${result.data.error}`)
				break
			case 400: // Bad Request
				this.updateStatus(InstanceStatus.BadConfig, 'Bad request: ' + result.data.error)
				this.log('warning', 'Bad request: ' + result.data.error)
				break
			case 404: // Not found
				this.updateStatus(InstanceStatus.UnknownError, 'Not found: ' + result.data.error)
				this.log('warning', 'Not found: ' + result.data.error)
				break
			case 422: // Unprocessable entity
				this.updateStatus(InstanceStatus.UnknownError, 'Unprocessable entity: ' + result.data.error)
				this.log('warning', 'Unprocessable entity: ' + result.data.error)
				break
			default:
				// Unexpenses response
				this.updateStatus(InstanceStatus.UnknownError, 'Unexpected HTTP status code: ' + response.statusCode)
				this.log('error', 'Unexpected HTTP status code: ' + response.statusCode)
				break
		}
	}

	/**
	 * Process incoming data from the websocket connection
	 * @param  {string} cmd - the path passed to the API
	 * @param  {Object} data - response data
	 */
	processData200(cmd, data) {
		//		debug('Sent cmd:',cmd);
		//		debug('Return data: ',data);
		if (cmd == '/playback/playing') {
			this.playing = data
			this.updateStatusVariables(data)
			this.checkFeedbacks()
		} else if (cmd == '/playlists') {
			// Updated the list of playlists
			let index
			for (index in data) {
				this.playlists.push({ id: data[index].unique_id, label: data[index].name, clips: [] })
				this.sendGetRequest('playlists/' + data[index].unique_id + '/items')
			}
			this.updateVariableDefinitions() // Refresh the variables
		} else if (cmd.match(/^\/playlists\/.*\/items$/)) {
			// Update the clips for the given playlist
			let playlistID = cmd.match(/playlists\/(.*)\/items/)[1]
			let index
			let playlist = this.playlists.find((element) => element.id === playlistID)
			for (index in data) {
				playlist['clips'].push(data[index].name)
			}
			this.updateVariableDefinitions() // Refresh the variables
		}
	}
	
	/**
	 * Process REST errors
	 * @since 2.0.0
	 */
	processError(err) {
		if (err !== null) {
			if (result.error.code !== undefined) {
				this.log('error', 'Connection failed (' + result.error.code + ')')
			} else {
				this.log('error', 'general HTTP failure')
			}
			this.updateStatus(InstanceStatus.Disconnected, 'NOT CONNECTED')
			if (this.pollingActive === 1) {
				this.log('debug', `Error Count: ${this.errorCount}`)
				this.errorCount++
			}
			if (this.errorCount > 10) {
				this.setupConnectivtyTester()
			}
		}
	}
	
	/**
	 * Maintain a polling connection to the target system
	 */
	_restPolling(url, duration) {
		
	}
}

runEntrypoint(OnTheAirVideoInstance, upgradeScripts)
