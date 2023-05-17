import { combineRgb } from '@companion-module/base'

export function getPresets() {
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
				},
				style: {
					color: whiteColor,
					bgcolor: playingColor,
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
				},
				style: {
					color: blackColor,
					bgcolor: pausedColor,
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
				},
				style: {
					color: whiteColor,
					bgcolor: stoppedColor,
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
		feedbacks: [],
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
						actionId: 'skipNext',
						options: {
							playlist: '',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	/**
	 * Playback status
	 */
	presets['status'] = {
		type: 'button',
		category: 'Transport',
		name: 'Status',
		style: {
			text: `$(${this.shortname}:playbackStatus)`,
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
				},
				style: {
					color: whiteColor,
					bgcolor: playingColor,
				},
			},
			{
				feedbackId: 'playbackStatus',
				options: {
					status: 'Paused',
				},
				style: {
					color: blackColor,
					bgcolor: pausedColor,
				},
			},
			{
				feedbackId: 'playbackStatus',
				options: {
					status: 'Stopped',
				},
				style: {
					color: whiteColor,
					bgcolor: stoppedColor,
				},
			},
			{
				feedbackId: 'playbackStatus',
				options: {
					status: 'Hold First Frame',
				},
				style: {
					color: whiteColor,
					bgcolor: activeColor,
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
		feedbacks: [],
	}

	/**
	 * Goto T-Minus
	 */
	for (let time = 30; time > 0; time = time - 10) {
		presets[`goto${time}`] = {
			type: 'button',
			category: 'Transport',
			name: `Goto ${time}`,
			style: {
				text: `Goto ${time}`,
				size: '18',
				color: whiteColor,
				bgcolor: blackColor,
			},
			steps: [
				{
					down: [
						{
							actionId: 'gotoEndMinus',
							options: {
								tMinus: time,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		}
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
					text: `$(${this.shortname}:clip_${playlist}_${clip})`,
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
						},
						style: {
							color: whiteColor,
							bgcolor: activeColor,
						},
					},
					{
						feedbackId: 'clipStatus',
						options: {
							playlist: playlist,
							clip: clip,
							status: 'Playing',
						},
						style: {
							color: whiteColor,
							bgcolor: playingColor,
						},
					},
					{
						feedbackId: 'clipStatus',
						options: {
							playlist: playlist,
							clip: clip,
							status: 'Paused',
						},
						style: {
							color: blackColor,
							bgcolor: pausedColor,
						},
					},
				],
			}
		}
	}

	return presets
}
