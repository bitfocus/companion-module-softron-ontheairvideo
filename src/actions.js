import { CHOICES_POSITIONTYPE } from './choices.js'

export function getActions() {
	const actions = {}

	actions['play'] = {
		name: 'Play',
		options: [
			{
				type: 'textinput',
				label: 'Playlist (optional, name/index)',
				id: 'playlist',
				default: '',
				tooltip: 'Enter an index (zero based) or name of a playlist',
				required: false,
				useVariables: true,
			},
			{
				type: 'number',
				label: 'Clip Index (optional)',
				id: 'clip',
				tooltip: 'Enter an index (zero based) for a clip',
				default: '',
				min: 0,
				max: 10000,
				required: false,
				useVariables: true,
			},
		],
		callback: async (event) => {
			const playlist = await this.parseVariablesInString(event.options.playlist)
			const clip = await this.parseVariablesInString(event.options.clip)
			let cmd = ''
			if (playlist == '') {
				cmd = `playback/play`
			} else {
				if (clip !== '') {
					cmd = `playlists/${playlist}/items/${clip}/play`
				} else {
					cmd = `playlists/${playlist}/play`
				}
			}
			await this.sendGetRequest(cmd)
		},
	}
	actions['playPosition'] = {
		name: 'Play clip at position',
		options: [
			{
				type: 'textinput',
				label: 'Playlist',
				id: 'playlist',
				default: '0',
				tooltip: 'Enter an index (zero based) or name of a playlist',
				required: true,
				useVariables: true,
			},
			{
				type: 'number',
				label: 'Clip Index',
				id: 'clip',
				tooltip: 'Enter an index (zero based) for a clip',
				default: 0,
				min: 0,
				max: 10000,
				required: true,
				useVariables: true,
			},
			{
				type: 'dropdown',
				label: 'Position type',
				id: 'type',
				choices: CHOICES_POSITIONTYPE,
			},
			{
				type: 'textinput',
				label: 'Time (timecode or seconds)',
				id: 'position',
				regex: '/^(d+(.d+)?)|([0-1][0-9]|[0-2][0-3]):([0-5][0-9]):([0-5][0-9])[:;]([0-6][0-9])$/',
				required: true,
			},
		],
		callback: async (event) => {
			const playlist = await this.parseVariablesInString(event.options.playlist)
			const clip = await this.parseVariablesInString(event.options.clip)
			const position = await this.parseVariablesInString(event.options.position)
			let cmd = ''
			switch (event.options.type) {
				case 'relativeTimecode':
					cmd = `playlists/${playlist}/items/${clip}/play?position_relative_timecode=${position}`
					break
				case 'mediaTimecode':
					cmd = `playlists/${playlist}/items/${clip}/play?position_media_timecode=${position}`
					break
				case 'relativeSeconds':
					cmd = `playlists/${playlist}/items/${clip}/play?position_relative_seconds=${position}`
					break
			}
			await this.sendGetRequest(cmd)
		},
	}
	actions['pause'] = {
		name: 'Pause',
		options: [
			{
				type: 'textinput',
				label: 'Playlist (optional, name/index)',
				id: 'playlist',
				default: '',
				tooltip: 'Enter an index (zero based) or name of a playlist',
				required: false,
				useVariables: true,
			},
			{
				type: 'number',
				label: 'Clip Index (optional)',
				id: 'clip',
				tooltip: 'Enter an index (zero based) for a clip',
				default: '',
				min: 0,
				max: 10000,
				required: false,
				useVariables: true,
			},
		],
		callback: async (event) => {
			const playlist = await this.parseVariablesInString(event.options.playlist)
			const clip = await this.parseVariablesInString(event.options.clip)
			let cmd = ''
			if (playlist == '') {
				cmd = `playback/pause`
			} else {
				if (clip !== '') {
					cmd = `playlists/${playlist}/items/${clip}/pause`
				} else {
					cmd = `playlists/${playlist}/pause`
				}
			}
			await this.sendGetRequest(cmd)
		},
	}
	actions['pausePosition'] = {
		name: 'Pause clip at position',
		options: [
			{
				type: 'textinput',
				label: 'Playlist',
				id: 'playlist',
				default: '0',
				tooltip: 'Enter an index (zero based) or name of a playlist',
				required: true,
				useVariables: true,
			},
			{
				type: 'number',
				label: 'Clip Index',
				id: 'clip',
				tooltip: 'Enter an index (zero based) for a clip',
				default: 0,
				min: 0,
				max: 10000,
				required: true,
				useVariables: true,
			},
			{
				type: 'dropdown',
				label: 'Position type',
				id: 'type',
				choices: CHOICES_POSITIONTYPE,
			},
			{
				type: 'textinput',
				label: 'Time (timecode or seconds)',
				id: 'position',
				regex: '/([0-1][0-9]|[0-2][0-3]):([0-5][0-9]):([0-5][0-9])[:;]([0-6][0-9])|(d+(.d+)?)/',
				required: true,
			},
		],
		callback: async (event) => {
			const playlist = await this.parseVariablesInString(event.options.playlist)
			const clip = await this.parseVariablesInString(event.options.clip)
			const position = await this.parseVariablesInString(event.options.position)
			let cmd = ''
			switch (event.options.type) {
				case 'relativeTimecode':
					cmd = `playlists/${playlist}/items/${clip}/pause?position_relative_timecode=${position}`
					break
				case 'mediaTimecode':
					cmd = `playlists/${playlist}/items/${clip}/pause?position_media_timecode=${position}`
					break
				case 'relativeSeconds':
					cmd = `playlists/${playlist}/items/${clip}/pause?position_relative_seconds=${position}`
					break
			}
			await this.sendGetRequest(cmd)
		},
	}
	actions['resume'] = {
		name: 'Resume',
		options: [
			{
				type: 'textinput',
				label: 'Playlist (optional, name/index)',
				id: 'playlist',
				default: '',
				tooltip: 'Enter an index (zero based) or name of a playlist',
				required: false,
				useVariables: true,
			},
		],
		callback: async (event) => {
			let playlist = await this.parseVariablesInString(event.options.playlist)
			let cmd = ''
			if (playlist == '') {
				cmd = `playback/resume`
			} else {
				cmd = `playlists/${playlist}/resume`
			}
			await this.sendGetRequest(cmd)
		},
	}
	actions['stop'] = {
		name: 'Stop',
		options: [
			{
				type: 'textinput',
				label: 'Playlist (optional, name/index)',
				id: 'playlist',
				default: '',
				tooltip: 'Enter an index (zero based) or name of a playlist',
				required: false,
				useVariables: true,
			},
		],
		callback: async (event) => {
			let playlist = await this.parseVariablesInString(event.options.playlist)
			let cmd = ''
			if (playlist == '') {
				cmd = `playback/stop`
			} else {
				cmd = `playlists/${playlist}/stop`
			}
			await this.sendGetRequest(cmd)
		},
	}
	actions['skipNext'] = {
		name: 'Skip to next clip',
		options: [
			{
				type: 'textinput',
				label: 'Playlist (optional, name/index)',
				id: 'playlist',
				default: '',
				tooltip: 'Enter an index (zero based) or name of a playlist',
				required: false,
				useVariables: true,
			},
		],
		callback: async (event) => {
			let playlist = await this.parseVariablesInString(event.options.playlist)
			let cmd = ''
			if (playlist == '') {
				cmd = `playback/skip_next`
			} else {
				cmd = `playlists/${playlist}/skip_next`
			}
			await this.sendGetRequest(cmd)
		},
	}
	actions['skipPrevious'] = {
		name: 'Skip to previous clip',
		options: [
			{
				type: 'textinput',
				label: 'Playlist (optional, name/index)',
				id: 'playlist',
				default: '',
				tooltip: 'Enter an index (zero based) or name of a playlist',
				required: false,
				useVariables: true,
			},
		],
		callback: async (event) => {
			let playlist = await this.parseVariablesInString(event.options.playlist)
			let cmd = ''
			if (playlist == '') {
				cmd = `playback/skip_previous`
			} else {
				cmd = `playlists/${playlist}/previous`
			}
			await this.sendGetRequest(cmd)
		},
	}
	actions['gotoEndMinus'] = {
		name: 'Goto (end minus)',
		options: [
			{
				type: 'number',
				label: 'Time to end of clip (seconds)',
				id: 'tMinus',
				default: 30,
				required: true,
			},
		],
		callback: async (event) => {
			if (this.playing.item_playback_status == 'playing') {
				const mode = this.playing.item_playback_status == 'playing' ? 'play' : 'pause'
				const time = this.playing.item_duration - event.options.tMinus
				const cmd = `playlists/${this.playing.playlist_index}/items/${this.playing.item_index}/${mode}?position_relative_seconds=${time}`
				await this.sendGetRequest(cmd)
			}
		},
	}
	actions['updatePlaylists'] = {
		name: 'Update playlist info',
		options: [],
		callback: async (event) => {
			this.getPlaylists()
		},
	}
	actions['joinInProgress'] = {
		name: 'Join In Progress',
		options: [
			{
				type: 'textinput',
				label: 'Playlist (optional, name/index)',
				id: 'playlist',
				default: '',
				tooltip: 'Enter an index (zero based) or name of a playlist',
				required: false,
				useVariables: true,
			},
			{
				type: 'textinput',
				label: 'Clip (optional, index/UID)',
				id: 'clip',
				tooltip: 'Enter an index (zero based) or UID for a clip',
				default: '',
				required: false,
				useVariables: true,
			},
		],
		callback: async (event) => {
			const playlist = await this.parseVariablesInString(event.options.playlist)
			const clip = await this.parseVariablesInString(event.options.clip)
			let cmd = ''
			if (playlist == '') {
				cmd = `playback/join_in_progress`
			} else {
				if (clip !== '') {
					cmd = `playlists/${playlist}/items/${clip}/join_in_progress`
				} else {
					cmd = `playlists/${playlist}/join_in_progress`
				}
			}
			await this.sendGetRequest(cmd)
		},
	}
	actions['gpiTrigger'] = {
		name: 'Toggle Virtual GPI',
		options: [
			{
				type: 'number',
				label: 'GPI Input',
				id: 'input',
				default: 1,
				min: 1,
				max: 25,
				required: true,
				tooltip: 'GPI input number (1-25)',
			},
		],
		callback: async (event) => {
			const cmd = `playback/gpi_trigger?input=${event.options.input}`
			await this.sendGetRequest(cmd)
		},
	}
	actions['cueTrigger'] = {
		name: 'Cue Trigger (Space Bar)',
		options: [],
		callback: async (event) => {
			await this.sendGetRequest('playback/cue_trigger')
		},
	}
	actions['cgPlay'] = {
		name: 'CG Project - Play',
		options: [
			{
				type: 'dropdown',
				label: 'CG Project',
				id: 'project',
				default: '',
				choices: this.cgProjects.map((project) => ({ id: project.id, label: project.label })),
				tooltip: 'Select a CG project',
				required: true,
			},
		],
		callback: async (event) => {
			await this.sendGetRequest(`playback/cg_projects/${event.options.project}/play`)
		},
	}
	actions['cgPause'] = {
		name: 'CG Project - Pause',
		options: [
			{
				type: 'dropdown',
				label: 'CG Project',
				id: 'project',
				default: '',
				choices: this.cgProjects.map((project) => ({ id: project.id, label: project.label })),
				tooltip: 'Select a CG project',
				required: true,
			},
		],
		callback: async (event) => {
			await this.sendGetRequest(`playback/cg_projects/${event.options.project}/pause`)
		},
	}
	actions['cgStop'] = {
		name: 'CG Project - Stop',
		options: [
			{
				type: 'dropdown',
				label: 'CG Project',
				id: 'project',
				default: '',
				choices: this.cgProjects.map((project) => ({ id: project.id, label: project.label })),
				tooltip: 'Select a CG project',
				required: true,
			},
		],
		callback: async (event) => {
			await this.sendGetRequest(`playback/cg_projects/${event.options.project}/stop`)
		},
	}
	actions['updateCGProjects'] = {
		name: 'Update CG projects info',
		options: [],
		callback: async (event) => {
			this.getCGProjects()
		},
	}
	actions['runAction'] = {
		name: 'Run Action (AppleScript)',
		options: [
			{
				type: 'dropdown',
				label: 'Action',
				id: 'action',
				default: '',
				choices: (this.availableActions || []).map((action) => ({ id: action, label: action })),
				tooltip: 'Select an available action to run',
				required: true,
			},
			{
				type: 'textinput',
				label: 'Parameter (optional)',
				id: 'parameter',
				default: '',
				tooltip: 'Optional parameter to pass to the action',
				required: false,
				useVariables: true,
			},
		],
		callback: async (event) => {
			const parameter = await this.parseVariablesInString(event.options.parameter)
			const cmd = `actions/${event.options.action}/run?parameter=${encodeURIComponent(parameter)}`
			await this.sendGetRequest(cmd)
		},
	}

	return actions
}
