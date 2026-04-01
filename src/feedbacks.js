import { Regex, combineRgb } from '@companion-module/base'
import { CHOICES_PLAYBACKSTATUS, CHOICES_CLIP_PLAYLIST, CHOICES_CGSTATUS } from './choices.js'

export function initFeedbacks() {
	const feedbacks = {}

	const stylePlaying = {
		color: combineRgb(255, 255, 255),
		bgcolor: combineRgb(0, 204, 0),
	}

	const _stylePaused = {
		color: combineRgb(255, 255, 255),
		bgcolor: combineRgb(255, 255, 0),
	}

	const _styleStopped = {
		color: combineRgb(255, 255, 255),
		bgcolor: combineRgb(255, 0, 0),
	}

	const styleActive = {
		color: combineRgb(255, 255, 255),
		bgcolor: combineRgb(0, 51, 204),
	}

	const styleRemaining = {
		color: combineRgb(255, 255, 255),
		bgcolor: combineRgb(255, 128, 0),
	}

	feedbacks.playbackStatus = {
		name: 'Playback status',
		type: 'boolean',
		description: 'Set feedback based on status (playing, paused, stopped)',
		options: [
			{
				type: 'dropdown',
				label: 'Status',
				id: 'status',
				choices: CHOICES_PLAYBACKSTATUS,
			},
		],
		defaultStyle: stylePlaying,
		callback: ({ options }) => {
			return options.status === this.playing.playback_status
		},
	}

	feedbacks.clipActive = {
		name: 'Active clip',
		type: 'boolean',
		description: 'Set feedback when a specific clip is active',
		options: [
			{
				type: 'textinput',
				label: 'Playlist',
				id: 'playlist',
				tooltip: 'Enter an index (zero based) or name of a playlist',
				default: '0',
				regex: Regex.SOMETHING,
			},
			{
				type: 'textinput',
				label: 'Clip',
				id: 'clip',
				tooltip: 'Enter an index (zero based) or name of a clip',
				default: '0',
				regex: Regex.SOMETHING,
			},
		],
		defaultStyle: styleActive,
		callback: ({ options }) => {
			return (
				(options.playlist == this.playing.playlist_index || options.playlist == this.playing.playlist_display_name) &&
				(options.clip == this.playing.item_index || options.clip == this.playing.item_display_name)
			)
		},
	}

	feedbacks.clipStatus = {
		name: 'Active clip, with status',
		type: 'boolean',
		description: 'Set feedback based on status of a specific clip',
		options: [
			{
				type: 'textinput',
				label: 'Playlist',
				id: 'playlist',
				tooltip: 'Enter an index (zero based) or name of a playlist',
				default: '0',
				regex: Regex.SOMETHING,
			},
			{
				type: 'textinput',
				label: 'Clip',
				id: 'clip',
				tooltip: 'Enter an index (zero based) or name of a clip',
				default: '0',
				regex: Regex.SOMETHING,
			},
			{
				type: 'dropdown',
				label: 'Status',
				id: 'status',
				choices: CHOICES_PLAYBACKSTATUS,
			},
		],
		defaultStyle: styleActive,
		callback: ({ options }) => {
			return (
				(options.playlist == this.playing.playlist_index || options.playlist == this.playing.playlist_display_name) &&
				(options.clip == this.playing.item_index || options.clip == this.playing.item_display_name) &&
				options.status == this.playing.playback_status
			)
		},
	}

	feedbacks.timeRemaining = {
		name: 'Time remaining',
		type: 'boolean',
		description: 'Set feedback when a specified amount of time remains in the clip/playlist',
		options: [
			{
				type: 'dropdown',
				label: 'Clip/Playlist',
				id: 'type',
				default: 'clip',
				choices: CHOICES_CLIP_PLAYLIST,
			},
			{
				type: 'number',
				label: 'Time (seconds)',
				id: 'time',
				tooltip: 'The number of seconds remaining when the feedback should trigger',
				default: '30',
				min: 0,
				max: 1000,
			},
		],
		style: styleRemaining,
		callback: ({ options }, _bank) => {
			const status = this.playing.playback_status ?? this.playing.item_playback_status
			const s = typeof status === 'string' ? status.toLowerCase() : ''
			if (s !== 'playing' && s !== 'paused') {
				return false
			}
			const threshold = Number(options.time)
			if (!Number.isFinite(threshold)) {
				return false
			}
			switch (options.type) {
				case 'clip': {
					const remaining = this.playing.item_remaining
					return typeof remaining === 'number' && Math.floor(remaining) <= threshold
				}
				case 'playlist': {
					const remaining = this.playing.playlist_remaining
					return typeof remaining === 'number' && Math.floor(remaining) <= threshold
				}
				default:
					return false
			}
		},
	}

	feedbacks.playbackThumbnail = {
		name: 'Playback Thumbnail',
		type: 'advanced',
		description: 'Display the playback thumbnail on the button',
		options: [
			{
				type: 'number',
				label: 'Refresh Interval (ms)',
				id: 'interval',
				tooltip: 'How often to refresh the thumbnail in milliseconds',
				default: 500,
				min: 100,
				max: 10000,
			},
		],
		subscribe: (feedback) => {
			this.subscribeThumbnailFeedback(feedback)
		},
		unsubscribe: (feedback) => {
			this.unsubscribeThumbnailFeedback(feedback)
		},
		callback: async (_feedback) => {
			return this.getThumbnailImage()
		},
	}

	feedbacks.cgStatus = {
		name: 'CG Project Status',
		type: 'boolean',
		description: 'Set feedback based on CG project status',
		options: [
			{
				type: 'dropdown',
				label: 'CG Project',
				id: 'project',
				choices: this.cgProjects.map((p) => ({ id: p.id, label: p.label })),
				default: this.cgProjects.length > 0 ? this.cgProjects[0].id : '',
			},
			{
				type: 'dropdown',
				label: 'Status',
				id: 'status',
				choices: CHOICES_CGSTATUS,
				default: 'Playing',
			},
		],
		defaultStyle: stylePlaying,
		callback: ({ options }) => {
			return this.cgState[options.project]?.status === options.status
		},
	}

	return feedbacks
}
