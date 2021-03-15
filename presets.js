exports.getPresets = function () {
	let presets = []
	const whiteColor = this.rgb(255, 255, 255)
	const blackColor = this.rgb(0, 0, 0)
	const backgroundColorPlaying = this.rgb(0, 204, 0)
	const backgroundColorPaused = this.rgb(255, 255, 0)
	const backgroundColorStopped = this.rgb(255, 0, 0)
	const backgroundColorActive = this.rgb(0, 51, 204)

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
			color: whiteColor,
			bgcolor: blackColor,
		},
		actions: [
			{
				action: 'play',
				options: {
					playlist: '0',
					clip: null,
				},
			},
		],
		feedbacks: [
			{
				type: 'playbackStatus',
				options: {
					status: 'Playing',
					fg: whiteColor,
					bg: backgroundColorPlaying,
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
			text: '\u23f8',
			size: '44',
			color: whiteColor,
			bgcolor: blackColor,
		},
		actions: [
			{
				action: 'pause',
				options: {
					playlist: '0',
					clip: null,
				},
			},
		],
		feedbacks: [
			{
				type: 'playbackStatus',
				options: {
					status: 'Paused',
					fg: blackColor,
					bg: backgroundColorPaused,
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
			color: whiteColor,
			bgcolor: blackColor,
		},
		actions: [
			{
				action: 'stop',
				options: {
					playlist: '0',
				},
			},
		],
		feedbacks: [
			{
				type: 'playbackStatus',
				options: {
					status: 'Stopped',
					fg: whiteColor,
					bg: backgroundColorStopped,
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
			color: whiteColor,
			bgcolor: blackColor,
		},
		actions: [
			{
				action: 'skipPrevious',
				options: {
					playlist: '0',
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
			color: whiteColor,
			bgcolor: blackColor,
		},
		actions: [
			{
				action: 'skipNext',
				options: {
					playlist: '0',
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
					bg: backgroundColorPlaying,
				},
			},
			{
				type: 'playbackStatus',
				options: {
					status: 'Paused',
					fg: blackColor,
					bg: backgroundColorPaused,
				},
			},
			{
				type: 'playbackStatus',
				options: {
					status: 'Stopped',
					fg: whiteColor,
					bg: backgroundColorStopped,
				},
			},
			{
				type: 'playbackStatus',
				options: {
					status: 'Hold First Frame',
					fg: whiteColor,
					bg: backgroundColorActive,
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
							bg: backgroundColorActive,
						},
					},
					{
						type: 'clipStatus',
						options: {
							playlist: playlist,
							clip: clip,
							status: 'Playing',
							fg: whiteColor,
							bg: backgroundColorPlaying,
						},
					},
					{
						type: 'clipStatus',
						options: {
							playlist: playlist,
							clip: clip,
							status: 'Paused',
							fg: blackColor,
							bg: backgroundColorPaused,
						},
					},
				],
			})
		}
	}

	return presets
}
