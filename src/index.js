import { runEntrypoint, InstanceBase, InstanceStatus, Regex } from '@companion-module/base'
import { getActions } from './actions.js'
import { getPresets } from './presets.js'
import { updateVariableDefinitions, updateStatusVariables, updatePlaylistVariables, updateInfoVariables } from './variables.js'
import { initFeedbacks } from './feedbacks.js'
import { upgradeScripts } from './upgrades.js'
import got, { Options } from 'got'

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

		this.getActions = getActions.bind(this)
		this.updateVariableDefinitions = updateVariableDefinitions.bind(this)
		this.updateStatusVariables = updateStatusVariables.bind(this)
		this.updatePlaylistVariables = updatePlaylistVariables.bind(this)
		this.updateInfoVariables = updateInfoVariables.bind(this)

		this.playlists = []
		this.cgProjects = []
		this.playing = {}
		this.info = {}
		this.availableActions = []
		this.pollingActive = false
		this.errorCount = 0
		this.pollTimer = null
		this.pollInterval = 1000 // ms
		this.testingActive = false
		this.testInterval = 10000
		this.pollCmd = `playback/playing`
		this.pollId = ``
		this.gotOptions = undefined
		this.thumbnailFeedbacks = new Map() // Track active thumbnail feedbacks
		this.thumbnailTimers = new Map() // Track thumbnail refresh timers
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
		this.log('debug', `destroy ${this.id}`)
		// Clean up all thumbnail timers
		for (const timer of this.thumbnailTimers.values()) {
			clearInterval(timer)
		}
		this.thumbnailTimers.clear()
		this.thumbnailFeedbacks.clear()
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

		// Define the got default options
		this.gotOptions = new Options({
			prefixUrl: `http://${this.config.host}:${this.config.port}/`,
			responseType: 'json',
			throwHttpErrors: false,
		})

		this.updateStatus(InstanceStatus.Connecting, 'Waiting') // status not currently known

		//Test the connection with a status request
		await this.setupConnectivtyTester()

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
		this.setPresetDefinitions(getPresets.bind(this)())
	}

	/**
	 * Set all the actions
	 * @param  {} system
	 */
	initActions(system) {
		this.setActionDefinitions(this.getActions())
	}

	/**
	 * INTERNAL: uses polling to create an interval to, effectively, ping
	 * the device to see if its there.  This uses a longer interval so we're
	 * not firing a ton of poll calls to a non-responsive device.
	 *
	 * @private
	 * @since 1.0.0
	 */
	setupConnectivtyTester() {
		this.log('debug', 'Setup Connectivity Tester!')
		this.errorCount = 0
		this.pollingActive = false
		this.testingActive = true
		clearTimeout(this.pollTimer)
		this.pollTimer = setInterval(this._restPolling.bind(this), this.testInterval)
		// Run _restPolling now so we don't have to wait
		this._restPolling()
	}

	/**
	 * INTERNAL: creates an interval to run the active polling.
	 *
	 * @private
	 * @since 1.0.0
	 */
	setupPolling() {
		this.log('debug', 'Setup Polling')
		this.errorCount = 0
		this.testingActive = false
		clearInterval(this.pollTimer)
		this.pollTimer = setInterval(this._restPolling.bind(this), this.pollInterval)
		this.pollingActive = true
	}

	async configUpdated(config) {
		let resetConnection = false

		this.log('debug', `Updating config: ${config}`)
		if (this.config.host != config.host || this.config.port != config.port) {
			resetConnection = true
		}
		this.config = config
		this.log('debug', `Reset connection ${resetConnection}`)
		if (resetConnection === true) {
			this.gotOptions.prefixUrl = `http://${this.config.host}:${this.config.port}/`
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
	 * Fetch system info from /info endpoint
	 */
	getInfo() {
		this.sendGetRequest('info')
	}

	/**
	 * Build an array of available CG projects
	 */
	getCGProjects() {
		this.cgProjects = []
		this.sendGetRequest('playback/cg_projects')
	}

	/**
	 * Send a REST GET request to the player and handle errorcodes
	 * @param  {} cmd
	 */
	async sendGetRequest(cmd) {
		this.log('debug', `Sending request: ${this.gotOptions.prefixUrl}${cmd}`)
		let response
		let poll
		try {
			response = await got(cmd, undefined, this.gotOptions)
			poll = await got(this.pollCmd, undefined, this.gotOptions)
		} catch (error) {
			console.log(error.message)
			this.processError(error)
			return
		}
		this.processResult(response)
		this.processResult(poll)
	}

	/**
	 * Send a REST POST request to the player and handle errorcodes
	 * @param {string} cmd - API path to POST to
	 * @param {Object} body - JSON body to send
	 */
	async sendPostRequest(cmd, body) {
		this.log('debug', `Sending POST request: ${this.gotOptions.prefixUrl}${cmd} body=${JSON.stringify(body)}`)
		let response
		let poll
		// Build minimal options for POST while keeping prefix and JSON response type
		const postOptions = {
			prefixUrl: this.gotOptions.prefixUrl,
			responseType: 'json',
			throwHttpErrors: false,
			json: body,
		}
		try {
			response = await got.post(cmd, postOptions)
			poll = await got(this.pollCmd, undefined, this.gotOptions)
		} catch (error) {
			console.log(error.message)
			this.processError(error)
			return
		}
		this.processResult(response)
		this.processResult(poll)
	}

	/**
	 * INTERNAL: Callback for REST calls to process the return
	 *
	 * @param {Object} response - data: & response: if normal; error: if error
	 * @private
	 * @since 2.0.0
	 */
	processResult(response) {
		console.log(`Processing result: ${response.statusCode} ${response.request.requestUrl.pathname}`)
		switch (response.statusCode) {
			case 200: // OK
				if (this.testingActive) {
					this.updateStatus(InstanceStatus.Ok)
					this.setupPolling()
					this.getPlaylists()
					this.getInfo()
					this.getCGProjects()
				}
				this.processData200(response.request.requestUrl.pathname, response.body)
				break
			case 201: // Created
				if (this.testingActive) {
					this.updateStatus(InstanceStatus.Ok)
				}
				this.log('debug', `Created: ${response.body.error}`)
				break
			case 202: // Accepted
				if (this.testingActive) {
					this.updateStatus(InstanceStatus.Ok)
				}
				this.log('debug', `Accepted: ${response.body.error}`)
				break
			case 400: // Bad Request
				this.log('info', `Bad request: ${response.statusCode} - ${response.body.error}`)
				break
			case 404: // Not found
				this.log('info', `Not found: ${response.statusCode} - ${response.body.error}`)
				break
			case 422: // Unprocessable entity
				this.log('info', `Unprocessable entity: ${response.statusCode} - ${response.body.error}`)
				break
			default:
				// Unexpenses response
				this.updateStatus(
					InstanceStatus.UnknownError,
					`Unexpected HTTP status code: ${response.statusCode} - ${response.body.error}`
				)
				this.log('warn', `Unexpected HTTP status code: ${response.statusCode} - ${response.body.error}`)
				break
		}
	}

	/**
	 * Process incoming data from the websocket connection
	 * @param  {string} cmd - the path passed to the API
	 * @param  {Object} data - response data
	 * @private
	 */
	processData200(cmd, data) {
		if (cmd == '/playback/playing') {
			this.playing = data
			this.updateStatusVariables(data)
			this.checkFeedbacks()
		} else if (cmd == '/playlists') {
			// Updated the list of playlists
			// console.log(`Playlist data: ${JSON.stringify(data)}`)
			let index
			for (index in data) {
				this.playlists.push({ id: data[index].unique_id, label: data[index].name, clips: [] })
				this.sendGetRequest('playlists/' + data[index].unique_id + '/items')
			}
			this.updateVariableDefinitions() // Refresh the variables
		} else if (cmd.match(/^\/playlists\/.*\/items$/)) {
			// Update the clips for the given playlist
			let playlistID = decodeURI(cmd.match(/playlists\/(.*)\/items/)[1])
			let index
			let playlist = this.playlists.find((element) => element.id === playlistID)

			for (index in data) {
				playlist['clips'].push(data[index])
			}
			this.updateVariableDefinitions() // Refresh the variables
		} else if (cmd == '/playback/cg_projects') {
			// Updated the list of CG projects
			console.log(`CG Projects data: ${JSON.stringify(data)}`)
			// The API might return the array directly or nested in cg_projects property
			const projects = Array.isArray(data) ? data : data.cg_projects || []
			let index
			for (index in projects) {
				this.cgProjects.push({
					id: projects[index].unique_id,
					label: projects[index].display_name,
					status: projects[index].status,
					published_items: projects[index].published_items || [],
				})
			}
			this.log('debug', `Loaded ${this.cgProjects.length} CG projects`)
			this.updateVariableDefinitions() // Refresh the variables
			this.initActions() // Refresh actions to update dropdown choices
		} else if (cmd == '/info') {
			// Store system info
			this.info = data
			this.availableActions = Array.isArray(data.available_actions) ? data.available_actions : []
			this.log('debug', `Loaded system info: ${data.application_name} v${data.application_version}`)
			this.log('debug', `Available actions: ${this.availableActions.join(', ')}`)
			this.updateInfoVariables(data)
			this.initActions() // Refresh actions to update dropdown choices with available actions
		}
	}

	/**
	 * Process REST errors
	 * @since 2.0.0
	 * @private
	 */
	processError(error) {
		console.log(`Processing error: ${error.message}`)
		if (error !== null) {
			if (error.code !== undefined) {
				this.log('error', 'Connection failed (' + error.message + ')')
			} else {
				this.log('error', 'general HTTP failure')
			}
			this.updateStatus(InstanceStatus.Disconnected, 'NOT CONNECTED')
			if (this.pollingActive) {
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
	 * @private
	 * @since 2.0.0
	 */
	async _restPolling() {
		let response
		try {
			response = await got(this.pollCmd, undefined, this.gotOptions)
		} catch (error) {
			console.log(error.message)
			this.processError(error)
			return
		}
		this.processResult(response)
	}

	/**
	 * Subscribe to thumbnail feedback
	 * @param {Object} feedback - The feedback object
	 */
	subscribeThumbnailFeedback(feedback) {
		const feedbackId = feedback.id
		const interval = feedback.options.interval || 500

		this.log('debug', `Subscribing to thumbnail feedback ${feedbackId} with interval ${interval}ms`)

		// Store the feedback
		this.thumbnailFeedbacks.set(feedbackId, feedback)

		// Set up periodic refresh
		const timer = setInterval(() => {
			this.checkFeedbacks('playbackThumbnail')
		}, interval)

		this.thumbnailTimers.set(feedbackId, timer)

		// Trigger immediate update
		this.checkFeedbacks('playbackThumbnail')
	}

	/**
	 * Unsubscribe from thumbnail feedback
	 * @param {Object} feedback - The feedback object
	 */
	unsubscribeThumbnailFeedback(feedback) {
		const feedbackId = feedback.id

		this.log('debug', `Unsubscribing from thumbnail feedback ${feedbackId}`)

		// Clear the timer
		const timer = this.thumbnailTimers.get(feedbackId)
		if (timer) {
			clearInterval(timer)
			this.thumbnailTimers.delete(feedbackId)
		}

		// Remove the feedback
		this.thumbnailFeedbacks.delete(feedbackId)
	}

	/**
	 * Get the thumbnail image from the API
	 * @returns {Object} Image object for feedback
	 */
	async getThumbnailImage() {
		try {
			// Create options for fetching image buffer
			const imageOptions = new Options({
				prefixUrl: this.gotOptions.prefixUrl,
				responseType: 'buffer',
				throwHttpErrors: false,
			})

			const response = await got('playback/thumbnail', undefined, imageOptions)

			if (response.statusCode === 200 && response.body) {
				// Return the image in base64 format that Companion expects
				return {
					png64: response.body.toString('base64'),
				}
			}
		} catch (error) {
			this.log('warn', `Failed to fetch thumbnail: ${error.message}`)
		}

		return undefined
	}
}

runEntrypoint(OnTheAirVideoInstance, upgradeScripts)
