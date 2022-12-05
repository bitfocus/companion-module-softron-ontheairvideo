const instance_skel = require('../../instance_skel')
const actions = require('./actions')
const presets = require('./presets')
const { updateVariableDefinitions, updateStatusVariables, updatePlaylistVariables } = require('./variables')
const { initFeedbacks } = require('./feedbacks')

let debug
let log

/**
 * Companion instance class for the Softron OnTheAir Vidoe software playout API.
 *
 * @extends instance_skel
 * @version 1.0.0
 * @since 1.0.0
 * @author Stephen Harrison <stephen@redleopard.org>
 */
class instance extends instance_skel {
	/**
	 * Main constructor
	 * @param  {} system
	 * @param  {} id
	 * @param  {} config
	 */
	constructor(system, id, config) {
		super(system, id, config)

		Object.assign(this, {
			...actions,
			...presets,
		})

		this.updateVariableDefinitions = updateVariableDefinitions
		this.updateStatusVariables = updateStatusVariables
		this.updatePlaylistVariables = updatePlaylistVariables

		this.port = 8081 // Fixed port
		this.playlists = []
		this.playing = {}
		this.pollingActive = 0
		this.errorCount = 0
		this.pollTimer = null
		this.pollingInterval = 1000 // ms
		this.testingActive = 0
		this.testInterval = 10000
		this.pollUrl = ``

		this.CHOICES_PLAYBACKSTATUS = [
			{ id: 'Playing', label: 'Playing' },
			{ id: 'Paused', label: 'Paused' },
			{ id: 'Stopped', label: 'Stopped' },
			{ id: 'Hold First Frame', label: 'Hold First Frame' },
		]

		this.CHOICES_POSITIONTYPE = [
			{ id: 'relativeTimecode', label: 'Relative Timecode' },
			{ id: 'mediaTimecode', label: 'Media Timecode' },
			{ id: 'relativeSeconds', label: 'Relative Seconds' },
		]
		
		this.CHOICES_CLIP_PLAYLIST = [
			{ id: 'clip', label: 'Clip' },
			{ id: 'playlist', label: 'Playlist' },
		]
	}

	/**
	 * Creates the configuration fields for web config.
	 *
	 * @returns {Array} the config fields
	 * @access public
	 * @since 1.0.0
	 */
	config_fields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'Target IP',
				width: 6,
				regex: this.REGEX_IP,
			},
		]
	}

	/**
	 * Clean up the instance before it is destroyed.
	 *
	 * @access public
	 * @since 1.0.0
	 */
	destroy() {
		this.debug('destroy', this.id)
	}

	/**
	 * Main initialization function called once the module
	 * is OK to start doing things.
	 *
	 * @access public
	 * @since 1.0.0
	 */
	init() {
		debug = this.debug
		log = this.log

		this.status(this.STATUS_WARNING, 'Waiting') // status not currently known

		//Test the connection with a status request
		//		this.sendGetRequest(`playback/playing`);

		this.getPlaylists()
		this.actions() // Set the actions after info is retrieved
		this.initVariables()
		this.initFeedbacks()
		this.initPresets()

		this.setupConnectivtyTester()
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
	actions(system) {
		this.setActions(this.getActions())
	}

	/**
	 * Process all executed actions (by user)
	 * @param  {} action
	 */
	action(action) {
		let id = action.action
		let opt = action.options
		let cmd = ''
		switch (id) {
			case 'play':
				if (opt.playlist == '') {
					cmd = `playback/play`
				} else {
					if (opt.clip !== '') {
						cmd = `playlists/${opt.playlist}/items/${opt.clip}/play`
					} else {
						cmd = `playlists/${opt.playlist}/play`
					}
				}
				break
			case 'playPosition':
				switch (opt.type) {
					case 'relativeTimecode':
						cmd = `playlists/${opt.playlist}/items/${opt.clip}/play?position_relative_timecode=${opt.position}`
						break
					case 'mediaTimecode':
						cmd = `playlists/${opt.playlist}/items/${opt.clip}/play?position_media_timecode=${opt.position}`
						break
					case 'relativeSeconds':
						cmd = `playlists/${opt.playlist}/items/${opt.clip}/play?position_relative_seconds=${opt.position}`
						break
				}
				break
			case 'pause':
				if (opt.playlist == '') {
					cmd = `playback/pause`
				} else {
					if (opt.clip !== '') {
						cmd = `playlists/${opt.playlist}/items/${opt.clip}/pause`
					} else {
						cmd = `playlists/${opt.playlist}/pause`
					}
				}
				break
			case 'pausePosition':
				switch (opt.type) {
					case 'relativeTimecode':
						cmd = `playlists/${opt.playlist}/items/${opt.clip}/pause?position_relative_timecode=${opt.position}`
						break
					case 'mediaTimecode':
						cmd = `playlists/${opt.playlist}/items/${opt.clip}/pause?position_media_timecode=${opt.position}`
						break
					case 'relativeSeconds':
						cmd = `playlists/${opt.playlist}/items/${opt.clip}/pause?position_relative_seconds=${opt.position}`
						break
				}
				break
			case 'resume':
				if (opt.playlist == '') {
					cmd = `playback/resume`
				} else {
					cmd = `playlists/${opt.playlist}/resume`
				}
				break
			case 'stop':
				if (opt.playlist == '') {
					cmd = `playback/stop`
				} else {
					cmd = `playlists/${opt.playlist}/stop`
				}
				break
			case 'skipNext':
				if (opt.playlist == '') {
					cmd = `playback/skip_next`
				} else {
					cmd = `playlists/${opt.playlist}/skip_next`
				}
				break
			case 'skipPrevious':
				if (opt.playlist == '') {
					cmd = `playback/skip_previous`
				} else {
					cmd = `playlists/${opt.playlist}/skip_previous`
				}
				break
			case 'updatePlaylists':
				this.getPlaylists()
				break
		}

		this.sendGetRequest(cmd) // Execute command
	}

	/**
	 * INTERNAL: uses rest_poll_get to create an interval to, effectively, ping
	 * the device to see if its there.  This uses a longer interval so we're
	 * not firing a ton of poll calls to a non-responsive device.
	 *
	 * @private
	 * @since 1.0.0
	 */
	setupConnectivtyTester() {
		debug('Setup Connectivity Tester!!!!!!')
		this.errorCount = 0
		this.pollingActive = 0
		this.pollUrl = `http://${this.config.host}:${this.port}/playback/playing`
		this.system.emit('rest_poll_destroy', this.id)

		this.system.emit(
			'rest_poll_get',
			this.id,
			this.testInterval,
			this.pollUrl,
			(err, pollInstance) => {
				if (pollInstance.id !== undefined) {
					this.currentInterval = pollInstance
					this.testingActive = 1
				} else {
					this.currentInterval = {}
					this.status(this.STATUS_ERROR, 'Connectivity Failed')
					this.log('error', 'Failed to create connectivity interval timer')
				}
			},
			this.processResult.bind(this)
		)
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
		this.pollUrl = `http://${this.config.host}:${this.port}/playback/playing`
		this.system.emit('rest_poll_destroy', this.id)

		this.system.emit(
			'rest_poll_get',
			this.id,
			parseInt(this.pollingInterval),
			this.pollUrl,
			(err, pollInstance) => {
				if (pollInstance.id !== undefined) {
					this.currentInterval = pollInstance
					this.pollingActive = 1
				} else {
					this.status(this.STATUS_ERROR, 'Polling Failed')
					this.log('error', 'Failed to create polling interval timer')
				}
			},
			this.processResult.bind(this)
		)
	}

	updateConfig(config) {
		let resetConnection = false

		this.debug('Updating config:', config)
		if (this.config.host != config.host) {
			resetConnection = true
		}
		this.config = config
		debug('Reset connection', resetConnection)
		if (resetConnection === true) {
			this.status(this.STATUS_WARNING, 'Waiting…')
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
	sendGetRequest(cmd) {
		let url = `http://${this.config.host}:${this.port}/${cmd}`
		this.system.emit('rest_get', url, this.processResult.bind(this))
	}

	/**
	 * INTERNAL: Callback for REST calls to process the return
	 *
	 * @param {?boolean} err - null if a normal result, true if there was an error
	 * @param {Object} result - data: & response: if normal; error: if error
	 * @private
	 * @since 1.0.0
	 */
	processResult(err, result) {
		if (err !== null) {
			if (result.error.code !== undefined) {
				this.log('error', 'Connection failed (' + result.error.code + ')')
			} else {
				this.log('error', 'general HTTP failure')
			}
			this.status(this.STATUS_ERROR, 'NOT CONNECTED')
			if (this.pollingActive === 1) {
				debug('Error Count:', this.errorCount)
				this.errorCount++
			}
			if (this.errorCount > 10) {
				this.setupConnectivtyTester()
			}
		} else {
			switch (result.response.statusCode) {
				case 200: // OK
					this.status(this.STATUS_OK)
					if (this.testingActive === 1) {
						this.setupPolling()
					}
					this.processData200(decodeURI(result.response.req.path), result.data)
					break
				case 201: // Created
					this.status(this.STATUS_OK)
					this.log('debug', 'Created: ' + result.data.error)
					this.debug('Created: ', result.data.error)
					break
				case 202: // Accepted
					this.status(this.STATUS_OK)
					this.log('debug', 'Accepted: ' + result.data.error)
					this.debug('Accepted: ', result.data.error)
					break
				case 400: // Bad Request
					this.status(this.STATUS_WARNING, 'Bad request: ' + result.data.error)
					this.log('warning', 'Bad request: ' + result.data.error)
					break
				case 404: // Not found
					this.status(this.STATUS_WARNING, 'Not found: ' + result.data.error)
					this.log('warning', 'Not found: ' + result.data.error)
					break
				case 422: // Unprocessable entity
					this.status(this.STATUS_WARNING, 'Unprocessable entity: ' + result.data.error)
					this.log('warning', 'Unprocessable entity: ' + result.data.error)
					break
				default:
					// Unexpenses response
					this.status(this.STATUS_ERROR, 'Unexpected HTTP status code: ' + result.response.statusCode)
					this.log('error', 'Unxspected HTTP status code: ' + result.response.statusCode)
					break
			}
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
}

exports = module.exports = instance
