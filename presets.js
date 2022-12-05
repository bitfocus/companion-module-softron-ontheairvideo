exports.getPresets = function () {
	let presets = []
	const whiteColor = this.rgb(255, 255, 255)
	const blackColor = this.rgb(0, 0, 0)
	const playingColor = this.rgb(0, 204, 0)
	const pausedColor = this.rgb(255, 255, 0)
	const stoppedColor = this.rgb(255, 0, 0)
	const prevNextColor = this.rgb(0, 51, 204)
	const activeColor = this.rgb(0, 51, 204)

	/**
	 * Play
	 */
	presets.push({
		category: 'Transport',
		label: 'Play',
		bank: {
			style: 'text',
			text: '\u23f5',
			size: '44',
			color: playingColor,
			bgcolor: blackColor,
		},
		actions: [
			{
				action: 'play',
				options: {
					playlist: '',
					clip: '',
				},
			},
		],
		feedbacks: [
			{
				type: 'playbackStatus',
				options: {
					status: 'Playing',
					fg: whiteColor,
					bg: playingColor,
				},
			},
		],
	})

	/**
	 * Pause
	 */
	presets.push({
		category: 'Transport',
		label: 'Pause',
		bank: {
			style: 'text',
			text: '\u23ef',
			size: '44',
			color: pausedColor,
			bgcolor: blackColor,
		},
		actions: [
			{
				action: 'pause',
				options: {
					playlist: '',
					clip: '',
				},
			},
		],
		feedbacks: [
			{
				type: 'playbackStatus',
				options: {
					status: 'Paused',
					fg: blackColor,
					bg: pausedColor,
				},
			},
		],
	})

	/**
	 * Stop
	 */
	presets.push({
		category: 'Transport',
		label: 'Stop',
		bank: {
			style: 'text',
			text: '\u23f9',
			size: '44',
			color: stoppedColor,
			bgcolor: blackColor,
		},
		actions: [
			{
				action: 'stop',
				options: {
					playlist: '',
				},
			},
		],
		feedbacks: [
			{
				type: 'playbackStatus',
				options: {
					status: 'Stopped',
					fg: whiteColor,
					bg: stoppedColor,
				},
			},
		],
	})

	/**
	 * Previous
	 */
	presets.push({
		category: 'Transport',
		label: 'Previous',
		bank: {
			style: 'text',
			text: '\u23ee',
			size: '44',
			color: prevNextColor,
			bgcolor: blackColor,
		},
		actions: [
			{
				action: 'skipPrevious',
				options: {
					playlist: '',
				},
			},
		],
	})

	/**
	 * Next
	 */
	presets.push({
		category: 'Transport',
		label: 'Next',
		bank: {
			style: 'text',
			text: '\u23ed',
			size: '44',
			color: prevNextColor,
			bgcolor: blackColor,
		},
		actions: [
			{
				action: 'skipNext',
				options: {
					playlist: '',
				},
			},
		],
	})

	/**
	 * Playback status
	 */
	presets.push({
		category: 'Transport',
		label: 'Status',
		bank: {
			style: 'text',
			text: `$(${this.shorthame}:playbackStatus)`,
			size: '14',
			color: whiteColor,
			bgcolor: blackColor,
		},
		feedbacks: [
			{
				type: 'playbackStatus',
				options: {
					status: 'Playing',
					fg: whiteColor,
					bg: playingColor,
				},
			},
			{
				type: 'playbackStatus',
				options: {
					status: 'Paused',
					fg: blackColor,
					bg: pausedColor,
				},
			},
			{
				type: 'playbackStatus',
				options: {
					status: 'Stopped',
					fg: whiteColor,
					bg: stoppedColor,
				},
			},
			{
				type: 'playbackStatus',
				options: {
					status: 'Hold First Frame',
					fg: whiteColor,
					bg: activeColor,
				},
			},
		],
	})

	/**
	 * Update
	 */
	presets.push({
		category: 'Transport',
		label: 'Update',
		bank: {
			style: 'text',
			text: 'Update',
			size: '18',
			color: whiteColor,
			bgcolor: blackColor,
		},
		actions: [
			{
				action: 'updatePlaylists',
			},
		],
	})

	/**
	 * Clip presets
	 */
	for (let playlist = 0; playlist < 2; playlist++) {
		for (let clip = 0; clip < 20; clip++) {
			presets.push({
				category: `Clips (playlist ${playlist})`,
				label: `Clip ${clip}`,
				bank: {
					style: 'text',
					text: `$(${this.shorthame}:clip_${playlist}_${clip})`,
					size: 'auto',
					color: whiteColor,
					bgcolor: blackColor,
				},
				actions: [
					{
						action: 'pause',
						options: {
							playlist: `${playlist}`,
							clip: `${clip}`,
						},
					},
				],
				feedbacks: [
					{
						type: 'clipStatus',
						options: {
							playlist: playlist,
							clip: clip,
							status: 'Hold First Frame',
							fg: whiteColor,
							bg: activeColor,
						},
					},
					{
						type: 'clipStatus',
						options: {
							playlist: playlist,
							clip: clip,
							status: 'Playing',
							fg: whiteColor,
							bg: playingColor,
						},
					},
					{
						type: 'clipStatus',
						options: {
							playlist: playlist,
							clip: clip,
							status: 'Paused',
							fg: blackColor,
							bg: pausedColor,
						},
					},
				],
			})
		}
	}

	return presets
}
