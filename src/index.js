import { runEntrypoint, InstanceBase, InstanceStatus, Regex } from '@companion-module/base'
import { getActions } from './actions.js'
import { getPresets } from './presets.js'
import {
	updateVariableDefinitions,
	updateStatusVariables,
	updatePlaylistVariables,
	updateInfoVariables,
	renderTime,
} from './variables.js'
import { initFeedbacks } from './feedbacks.js'
import { upgradeScripts } from './upgrades.js'
import got, { Options } from 'got'
import WebSocket from 'ws'

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
		this.gotOptions = undefined
		this.pollCmd = 'playback/playing' // Used to refresh state after REST actions
		this.thumbnailFeedbacks = new Map() // Track active thumbnail feedbacks
		this.thumbnailTimers = new Map() // Track thumbnail refresh timers

		// WebSocket properties
		this.ws = null
		this.wsConnected = false
		this.wsReconnectTimer = null
		this.wsReconnectAttempts = 0
		this.wsReconnectInterval = 5000 // 5 seconds base

		// CG state tracking
		this.cgState = {} // Maps projectUniqueID -> {status, elapsed_time, duration}
		this.activeCgProjectId = null

		// ID lookup maps for WebSocket events
		this.playlistIdMap = new Map() // playlist_unique_id -> {index, label}
		this.clipIdMap = new Map() // item_unique_id -> {playlistIndex, clipIndex, name, duration}

		// Playlist timing calculation
		this.currentPlaylistIndex = -1
		this.currentClipIndex = -1
		this.playlistElapsedBase = 0 // Sum of previous clips' durations
		this.currentPlaylistDuration = 0

		// Throttling for timing updates
		this.lastTimingUpdate = 0
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

		// Clean up WebSocket
		this.closeWebSocket()

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

		// Define the got default options (for REST API)
		this.gotOptions = new Options({
			prefixUrl: `http://${this.config.host}:${this.config.port}/`,
			responseType: 'json',
			throwHttpErrors: false,
		})

		this.updateStatus(InstanceStatus.Connecting, 'Waiting')

		// Connect via WebSocket (REST is used for initial data only)
		this.initWebSocket()

		this.initActions()
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
	 * Initialize WebSocket connection to OnTheAir Video
	 * @private
	 */
	initWebSocket() {
		this.closeWebSocket()

		const wsUrl = `ws://${this.config.host}:${this.config.port}/playback`
		const playlistWsUrl = `ws://${this.config.host}:${this.config.port}/playlists`
		this.log('info', `Connecting to WebSocket: ${wsUrl}`)

		try {
			this.ws = new WebSocket(wsUrl)
			this.playlistWs = new WebSocket(playlistWsUrl, ['playlist_update_v1'])

			this.ws.on('open', () => {
				this.log('info', 'WebSocket connected')
				this.wsConnected = true
				this.wsReconnectAttempts = 0
				this.updateStatus(InstanceStatus.Ok)

				// Fetch initial data via REST
				this.getPlaylists()
				this.getInfo()
				this.getCGProjects()
			})

			this.ws.on('message', (data) => {
				this.processWebSocketMessage(data)
			})

			this.ws.on('close', (code, reason) => {
				this.log('warn', `WebSocket closed: ${code} - ${reason}`)
				this.wsConnected = false
				this.updateStatus(InstanceStatus.Disconnected, 'WebSocket disconnected')
				this.scheduleWebSocketReconnect()
			})

			this.ws.on('error', (error) => {
				this.log('error', `WebSocket error: ${error.message}`)
				this.wsConnected = false
			})

			this.playlistWs.on('message', (data) => {
				try {
					const message = JSON.parse(data.toString())
					if (message.event === 'playlist_changed') {
						this.log('debug', 'Playlist change detected via WebSocket, refreshing playlists')
						this.getPlaylists()
					}
				} catch (error) {
					// Ignore invalid JSON
				}
			})

			this.playlistWs.on('error', (error) => {
				this.log('debug', `Playlist WebSocket error: ${error.message}`)
			})
		} catch (error) {
			this.log('error', `Failed to create WebSocket: ${error.message}`)
			this.scheduleWebSocketReconnect()
		}
	}

	/**
	 * Close WebSocket connection cleanly
	 * @private
	 */
	closeWebSocket() {
		if (this.wsReconnectTimer) {
			clearTimeout(this.wsReconnectTimer)
			this.wsReconnectTimer = null
		}

		if (this.ws) {
			this.ws.removeAllListeners()
			if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
				this.ws.close()
			}
			this.ws = null
		}
		if (this.playlistWs) {
			this.playlistWs.removeAllListeners()
			if (this.playlistWs.readyState === WebSocket.OPEN || this.playlistWs.readyState === WebSocket.CONNECTING) {
				this.playlistWs.close()
			}
			this.playlistWs = null
		}
		this.wsConnected = false
	}

	/**
	 * Schedule WebSocket reconnection with exponential backoff
	 * @private
	 */
	scheduleWebSocketReconnect() {
		if (this.wsReconnectTimer) {
			return // Already scheduled
		}

		this.wsReconnectAttempts++

		// Exponential backoff: 5s, 10s, 20s, 40s, ... capped at 60s
		const delay = Math.min(this.wsReconnectInterval * Math.pow(2, this.wsReconnectAttempts - 1), 60000)
		this.log('debug', `Scheduling WebSocket reconnect in ${delay}ms (attempt ${this.wsReconnectAttempts})`)

		this.wsReconnectTimer = setTimeout(() => {
			this.wsReconnectTimer = null
			this.initWebSocket()
		}, delay)
	}

	/**
	 * Process incoming WebSocket messages
	 * @param {Buffer|string} data - Raw WebSocket message
	 * @private
	 */
	processWebSocketMessage(data) {
		let message
		try {
			message = JSON.parse(data.toString())
		} catch (error) {
			this.log('warn', `Invalid WebSocket message: ${error.message}`)
			return
		}

		// Route based on message structure
		if (message.event) {
			// Playback events
			this.processPlaybackEvent(message)
		} else if (message.type === 'project property') {
			// CG project updates
			this.processCGEvent(message)
		} else {
			this.log('debug', `Unknown WebSocket message type: ${JSON.stringify(message)}`)
		}
	}

	/**
	 * Process playback-related WebSocket events
	 * @param {Object} event - Parsed event object
	 * @private
	 */
	processPlaybackEvent(event) {
		switch (event.event) {
			case 'playback_timing_changed':
				this.processPlaybackTiming(event)
				break

			case 'item_changed':
				this.processItemChanged(event)
				break

			case 'playback_status_changed':
				this.processPlaybackStatusChanged(event)
				break

			default:
				this.log('debug', `Unhandled playback event: ${event.event}`)
		}
	}

	/**
	 * Process playback_timing_changed event (frequent, ~30fps)
	 * @param {Object} event
	 */
	processPlaybackTiming(event) {
		// Throttle to ~10fps
		const now = Date.now()
		if (now - this.lastTimingUpdate < 100) return
		this.lastTimingUpdate = now

		// Update internal state
		this.playing.item_duration = event.item_duration
		this.playing.item_elapsed = event.item_elapsed_time
		this.playing.item_remaining = event.item_remaining_time
		this.playing.item_unique_id = event.item_unique_id
		this.playing.item_display_name = event.item_display_name

		if (event.playlist_duration != null) {
			this.playing.playlist_duration = event.playlist_duration
		}

		// Total duration: clip cache can be 0 while /items are still loading or if the API omits per-clip duration
		const playlistTotal =
			this.currentPlaylistDuration > 0
				? this.currentPlaylistDuration
				: typeof this.playing.playlist_duration === 'number' && !Number.isNaN(this.playing.playlist_duration)
					? this.playing.playlist_duration
					: 0

		// Calculate playlist timing
		const playlistElapsed = this.playlistElapsedBase + (event.item_elapsed_time || 0)
		const playlistRemaining = playlistTotal - playlistElapsed
		this.playing.playlist_elapsed = playlistElapsed
		this.playing.playlist_remaining = playlistRemaining

		// Update variables
		const list = {}
		list['clipDuration'] = event.item_duration != null ? renderTime(event.item_duration) : '-'
		list['clipElapsed'] = event.item_elapsed_time != null ? renderTime(event.item_elapsed_time) : '-'
		list['clipRemaining'] = event.item_remaining_time != null ? renderTime(event.item_remaining_time) : '-'
		list['activeClipName'] = event.item_display_name || '-'
		list['playlistDuration'] = renderTime(playlistTotal)
		list['playlistElapsed'] = playlistElapsed >= 0 ? renderTime(playlistElapsed) : '-'
		list['playlistRemaining'] = playlistRemaining >= 0 ? renderTime(playlistRemaining) : '-'

		// Next live info
		list['nextLiveName'] = event.next_live_display_name || '-'
		list['remainingUntilNextLive'] =
			event.remaining_time_until_next_live != null ? renderTime(event.remaining_time_until_next_live) : '-'

		this.setVariableValues(list)
		this.checkFeedbacks('playbackStatus', 'clipActive', 'clipStatus', 'timeRemaining')
	}

	/**
	 * Process item_changed event
	 * @param {Object} event
	 */
	processItemChanged(event) {
		this.playing.item_unique_id = event.item_unique_id
		// Note: item_name is the technical/file name, NOT the display name
		// item_display_name comes from playback_timing_changed events

		// Look up playlist info from cache
		if (event.playlist_unique_id && this.playlistIdMap.has(event.playlist_unique_id)) {
			const playlistInfo = this.playlistIdMap.get(event.playlist_unique_id)
			this.currentPlaylistIndex = playlistInfo.index
			this.playing.playlist_index = playlistInfo.index
			this.playing.playlist_display_name = playlistInfo.label

			this.setVariableValues({
				activePlaylist: playlistInfo.index,
				activePlaylistName: playlistInfo.label,
			})
		}

		// Look up clip info from cache
		if (event.item_unique_id && this.clipIdMap.has(event.item_unique_id)) {
			const clipInfo = this.clipIdMap.get(event.item_unique_id)
			this.currentClipIndex = clipInfo.clipIndex
			this.playing.item_index = clipInfo.clipIndex

			this.setVariableValues({
				activeClip: clipInfo.clipIndex,
			})
		}
		// Don't set activeClipName here - let processPlaybackTiming handle it
		// since that event has item_display_name (the human-readable name)

		// Recalculate playlist timing base
		this.calculatePlaylistElapsedBase()

		this.checkFeedbacks()
	}

	/**
	 * Process playback_status_changed event
	 * @param {Object} event
	 */
	processPlaybackStatusChanged(event) {
		this.playing.playback_status = event.playback_status

		this.setVariableValues({
			playbackStatus: event.playback_status,
		})

		this.checkFeedbacks()
	}

	/**
	 * Process CG project property updates
	 * @param {Object} event
	 */
	processCGEvent(event) {
		const projectId = event.projectUniqueID

		if (!projectId) {
			this.log('warn', 'CG event missing projectUniqueID')
			return
		}

		// Initialize state for this project if needed
		if (!this.cgState[projectId]) {
			this.cgState[projectId] = {
				status: 'Stopped',
				elapsed_time: 0,
				duration: 0,
			}
		}

		// Apply changes
		if (event.changes) {
			if (event.changes.status !== undefined) {
				this.cgState[projectId].status = event.changes.status

				// If playing, set as active CG
				if (event.changes.status === 'Playing') {
					this.activeCgProjectId = projectId
				} else if (this.activeCgProjectId === projectId && event.changes.status === 'Stopped') {
					this.activeCgProjectId = null
				}
			}

			if (event.changes.elapsed_time !== undefined) {
				this.cgState[projectId].elapsed_time = event.changes.elapsed_time
			}

			if (event.changes.duration !== undefined) {
				this.cgState[projectId].duration = event.changes.duration
			}
		}

		// Update CG variables
		this.updateCGVariables()
		this.checkFeedbacks()
	}

	/**
	 * Update CG-related variables
	 */
	updateCGVariables() {
		const list = {}

		this.cgProjects.forEach((project, index) => {
			const state = this.cgState[project.id]
			list[`cg_${index}_name`] = project.label || '-'
			list[`cg_${index}_status`] = state?.status || '-'
		})

		this.setVariableValues(list)
	}

	/**
	 * Duration in seconds from a playlist item returned by the REST API (field name varies).
	 */
	clipSeconds(clip) {
		if (!clip) return 0
		const v = clip.duration ?? clip.item_duration ?? clip.Duration
		return typeof v === 'number' && !Number.isNaN(v) ? v : 0
	}

	/**
	 * Calculate the sum of durations for clips before the current clip
	 */
	calculatePlaylistElapsedBase() {
		if (this.currentPlaylistIndex < 0 || this.currentPlaylistIndex >= this.playlists.length) {
			this.playlistElapsedBase = 0
			this.currentPlaylistDuration = 0
			return
		}

		const playlist = this.playlists[this.currentPlaylistIndex]
		if (!playlist || !playlist.clips) {
			this.playlistElapsedBase = 0
			this.currentPlaylistDuration = 0
			return
		}

		// Sum durations of clips before current clip
		let sum = 0
		for (let i = 0; i < this.currentClipIndex && i < playlist.clips.length; i++) {
			sum += this.clipSeconds(playlist.clips[i])
		}
		this.playlistElapsedBase = sum

		const fromClips = playlist.clips.reduce((acc, clip) => acc + this.clipSeconds(clip), 0)
		const fromPlaying =
			typeof this.playing.playlist_duration === 'number' && !Number.isNaN(this.playing.playlist_duration)
				? this.playing.playlist_duration
				: 0
		if (fromClips > 0) {
			this.currentPlaylistDuration = fromClips
		} else if (fromPlaying > 0) {
			this.currentPlaylistDuration = fromPlaying
		} else if (playlist.clips.length === 0) {
			// Staggered /items loads: another playlist's items may have triggered this; do not force 0
		} else {
			this.currentPlaylistDuration = 0
		}

		// Update playlist duration variable
		this.setVariableValues({
			playlistDuration: renderTime(this.currentPlaylistDuration),
		})
	}

	/**
	 * Build ID lookup maps from cached playlist data
	 */
	buildIdMaps() {
		this.playlistIdMap.clear()
		this.clipIdMap.clear()

		this.playlists.forEach((playlist, pIndex) => {
			this.playlistIdMap.set(playlist.id, { index: pIndex, label: playlist.label })
			if (playlist.clips) {
				playlist.clips.forEach((clip, cIndex) => {
					if (clip.unique_id) {
						this.clipIdMap.set(clip.unique_id, {
							playlistIndex: pIndex,
							clipIndex: cIndex,
							name: clip.name,
							duration: this.clipSeconds(clip),
						})
					}
				})
			}
		})

		this.log('debug', `Built ID maps: ${this.playlistIdMap.size} playlists, ${this.clipIdMap.size} clips`)
	}

	async configUpdated(config) {
		let resetConnection = false
		this.log('debug', `Updating config: ${JSON.stringify(config)}`)

		if (this.config.host != config.host || this.config.port != config.port) {
			resetConnection = true
		}

		this.config = config
		this.log('debug', `Reset connection: ${resetConnection}`)

		if (resetConnection === true) {
			this.gotOptions.prefixUrl = `http://${this.config.host}:${this.config.port}/`
			this.updateStatus(InstanceStatus.Connecting, 'Waiting…')

			// Clean up existing connection
			this.closeWebSocket()

			// Reinitialize WebSocket
			this.initWebSocket()
		}
	}

	/**
	 * Build an array of active playlists and their contained clips
	 */
	getPlaylists() {
		this.playlists = []
		this.pendingItemsCount = 0
		this.sendGetRequest('playlists')
	}

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
			this.log('error', error.message)
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
			this.log('error', error.message)
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
		this.log('debug', `Processing result: ${response.statusCode} ${response.request.requestUrl.pathname}`)
		switch (response.statusCode) {
			case 200: // OK
				this.processData200(response.request.requestUrl.pathname, response.body)
				break
			case 201: // Created
				this.log('debug', `Created: ${response.body.error}`)
				break
			case 202: // Accepted
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
				// Unexpected response
				this.updateStatus(
					InstanceStatus.UnknownError,
					`Unexpected HTTP status code: ${response.statusCode} - ${response.body.error}`,
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
			this.playlists = []
			this.pendingItemsCount = Array.isArray(data) ? data.length : 0
			for (const item of data) {
				this.playlists.push({ id: item.unique_id, label: item.name, clips: [] })
				this.sendGetRequest('playlists/' + item.unique_id + '/items')
			}
			if (this.pendingItemsCount === 0) {
				this.updateVariableDefinitions()
			}
		} else if (cmd.match(/^\/playlists\/.*\/items$/)) {
			// Update the clips for the given playlist
			const playlistID = decodeURI(cmd.match(/playlists\/(.*)\/items/)[1])
			const playlist = this.playlists.find((element) => element.id === playlistID)

			if (playlist) {
				playlist.clips = Array.isArray(data) ? [...data] : []
			}

			// Only rebuild maps and recalculate once all /items responses have arrived
			if (this.pendingItemsCount > 0) {
				this.pendingItemsCount--
			}
			if (this.pendingItemsCount <= 0) {
				this.updateVariableDefinitions() // Refresh the variables
				this.buildIdMaps() // Rebuild ID maps with new clip data
				this.calculatePlaylistElapsedBase() // Recalculate duration when clips change
			}
		} else if (cmd == '/playback/cg_projects') {
			// Updated the list of CG projects
			this.log('debug', `CG Projects data: ${JSON.stringify(data)}`)
			// The API might return the array directly or nested in cg_projects property
			const projects = Array.isArray(data) ? data : data.cg_projects || []
			this.cgProjects = []
			for (const project of projects) {
				const projectId = project.unique_id
				this.cgProjects.push({
					id: projectId,
					label: project.display_name,
					status: project.status,
					published_items: project.published_items || [],
				})
				// Initialize cgState for this project so feedbacks work immediately
				this.cgState[projectId] = {
					status: project.status || 'Stopped',
					elapsed_time: project.elapsed_time || 0,
					duration: project.duration || 0,
				}
			}
			this.log('debug', `Loaded ${this.cgProjects.length} CG projects`)
			this.updateVariableDefinitions() // Refresh the variables
			this.updateCGVariables() // Set initial CG variable values
			this.initActions() // Refresh actions to update dropdown choices
			this.initFeedbacks() // Refresh feedbacks to populate CG project dropdown
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
		this.log('debug', `Processing error: ${error.message}`)
		if (error !== null) {
			if (error.code !== undefined) {
				this.log('error', 'Connection failed (' + error.message + ')')
			} else {
				this.log('error', 'general HTTP failure')
			}
		}
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
