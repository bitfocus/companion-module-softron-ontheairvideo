import { Regex, combineRgb } from '@companion-module/base'
import { CHOICES_PLAYBACKSTATUS, CHOICES_CLIP_PLAYLIST } from './choices.js'

export function initFeedbacks() {
	const feedbacks = {}

	const stylePlaying = {
		color: combineRgb(255, 255, 255),
		bgcolor: combineRgb(0, 204, 0),
	}

	const stylePaused = {
		color: combineRgb(255, 255, 255),
		bgcolor: combineRgb(255, 255, 0),
	}

	const styleStopped = {
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
				defauls: '0',
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
				defauls: '0',
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
		callback: ({ options }, bank) => {
			if (this.playing.item_playback_status == 'playing' || 'paused') {
				switch (options.type) {
					case 'clip':
						if (Math.floor(this.playing.item_remaining) <= options.time) {
							return true
						}
						break
					case 'playlist':
						if (Math.floor(this.playing.playlist_remaining) <= options.time) {
							return true
						}
						break
					default:
						return false
				}
			}
		},
	}

	return feedbacks
}
