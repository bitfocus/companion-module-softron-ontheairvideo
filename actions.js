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
			await sendGetRequest(cmd)
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
			await sendGetRequest(cmd)
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
			await sendGetRequest(cmd)
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
			await sendGetRequest(cmd)
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
		options: [{ type: 'number', label: 'Time to end of clip (seconds)', id: 'tMinus', default: '30', required: true }],
		callback: async (event) => {
			if (this.playing.item_playback_status == 'playing' || 'paused') {
				const mode = this.playing.item_playback_status == 'playing' ? 'play' : 'pause'
				const time = this.playing.item_duration - event.options.tMinus
				cmd = `playlists/${this.playing.playlist_index}/items/${this.playing.item_index}/${mode}?position_relative_seconds=${time}`
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

	return actions
}
