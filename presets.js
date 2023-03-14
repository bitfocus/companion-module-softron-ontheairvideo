const { combineRgb } = require('@companion-module/base')

exports.getPresets = function () {
	const presets = {}
	const whiteColor = combineRgb(255, 255, 255)
	const blackColor = combineRgb(0, 0, 0)
	const playingColor = combineRgb(0, 204, 0)
	const pausedColor = combineRgb(255, 255, 0)
	const stoppedColor = combineRgb(255, 0, 0)
	const prevNextColor = combineRgb(0, 51, 204)
	const activeColor = combineRgb(0, 51, 204)

	/**
	 * Play
	 */
	presets['play'] = {
		type: 'button',
		category: 'Transport',
		name: 'Play',
		style: {
			text: '\u23f5',
			size: '44',
			color: playingColor,
			bgcolor: blackColor,
		},
		steps: [
			{
				down: [
					{
						actionId: 'play',
						options: {
							playlist: '',
							clip: '',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'playbackStatus',
				options: {
					status: 'Playing',
					fg: whiteColor,
					bg: playingColor,
				},
			},
		],
	}

	/**
	 * Pause
	 */
	presets['pause'] = {
		type: 'button',
		category: 'Transport',
		name: 'Pause',
		style: {
			text: '\u23ef',
			size: '44',
			color: pausedColor,
			bgcolor: blackColor,
		},
		steps: [
			{
				down: [
					{
						actionId: 'pause',
						options: {
							playlist: '',
							clip: '',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'playbackStatus',
				options: {
					status: 'Paused',
					fg: blackColor,
					bg: pausedColor,
				},
			},
		],
	}

	/**
	 * Stop
	 */
	presets['stop'] = {
		type: 'button',
		category: 'Transport',
		name: 'Stop',
		style: {
			text: '\u23f9',
			size: '44',
			color: stoppedColor,
			bgcolor: blackColor,
		},
		steps: [
			{
				down: [
					{
						actionId: 'stop',
						options: {
							playlist: '',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'playbackStatus',
				options: {
					status: 'Stopped',
					fg: whiteColor,
					bg: stoppedColor,
				},
			},
		],
	}

	/**
	 * Previous
	 */
	presets['previous'] = {
		type: 'button',
		category: 'Transport',
		name: 'Previous',
		style: {
			text: '\u23ee',
			size: '44',
			color: prevNextColor,
			bgcolor: blackColor,
		},
		steps: [
			{
				down: [
					{
						actionId: 'skipPrevious',
						options: {
							playlist: '',
						},
					},
				],
				up: [],
			},
		],
	}

	/**
	 * Next
	 */
	presets['next'] = {
		type: 'button',
		category: 'Transport',
		name: 'Next',
		style: {
			text: '\u23ed',
			size: '44',
			color: prevNextColor,
			bgcolor: blackColor,
		},
		steps: [
			{
				down: [
					{
						action: 'skipNext',
						options: {
							playlist: '',
						},
					},
				],
				up: [],
			},
		],
	}

	/**
	 * Playback status
	 */
	presets['status'] = {
		type: 'button',
		category: 'Transport',
		name: 'Status',
		style: {
			text: `$(${this.shorthame}:playbackStatus)`,
			size: '14',
			color: whiteColor,
			bgcolor: blackColor,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'playbackStatus',
				options: {
					status: 'Playing',
					fg: whiteColor,
					bg: playingColor,
				},
			},
			{
				feedbackId: 'playbackStatus',
				options: {
					status: 'Paused',
					fg: blackColor,
					bg: pausedColor,
				},
			},
			{
				feedbackId: 'playbackStatus',
				options: {
					status: 'Stopped',
					fg: whiteColor,
					bg: stoppedColor,
				},
			},
			{
				feedbackId: 'playbackStatus',
				options: {
					status: 'Hold First Frame',
					fg: whiteColor,
					bg: activeColor,
				},
			},
		],
	}

	/**
	 * Update
	 */
	presets['update'] = {
		type: 'button',
		category: 'Transport',
		name: 'Update',
		style: {
			text: 'Update',
			size: '18',
			color: whiteColor,
			bgcolor: blackColor,
		},
		steps: [
			{
				down: [
					{
						actionId: 'updatePlaylists',
					},
				],
				up: [],
			},
		],
	}

	/**
	 * Clip presets
	 */
	for (let playlist = 0; playlist < 2; playlist++) {
		for (let clip = 0; clip < 20; clip++) {
			presets[`clip_${playlist}_${clip}`] = {
				type: 'button',
				category: `Clips (playlist ${playlist})`,
				name: `Clip ${clip}`,
				style: {
					text: `$(${this.shorthame}:clip_${playlist}_${clip})`,
					size: 'auto',
					color: whiteColor,
					bgcolor: blackColor,
				},
				steps: [
					{
						down: [
							{
								actionId: 'pause',
								options: {
									playlist: `${playlist}`,
									clip: `${clip}`,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'clipStatus',
						options: {
							playlist: playlist,
							clip: clip,
							status: 'Hold First Frame',
							fg: whiteColor,
							bg: activeColor,
						},
					},
					{
						feedbackId: 'clipStatus',
						options: {
							playlist: playlist,
							clip: clip,
							status: 'Playing',
							fg: whiteColor,
							bg: playingColor,
						},
					},
					{
						feedbackId: 'clipStatus',
						options: {
							playlist: playlist,
							clip: clip,
							status: 'Paused',
							fg: blackColor,
							bg: pausedColor,
						},
					},
				],
			}
		}
	}

	return presets
}
