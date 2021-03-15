module.exports = {
	/**
	 * INTERNAL: Get the available actions.
	 *
	 * @returns {Object[]} the available actions
	 * @access protected
	 * @since 1.3.0
	 */
	getActions() {
		let actions = {}

		actions['play'] = {
			label: 'Play',
			options: [
				{
					type: 'textinput',
					label: 'Playlist',
					id: 'playlist',
					default: '0',
					tooltip: 'Enter an index (zero based) or name of a playlist',
					regex: this.REGEX_SOMETHING,
				},
				{
					type: 'number',
					label: 'Clip Index (optional)',
					id: 'clip',
					tooltip: 'Enter an index (zero based) for a clip',
					min: 0,
					max: 10000,
					required: false,
				},
			],
		}
		actions['playPosition'] = {
			label: 'Play clip at position',
			options: [
				{
					type: 'textinput',
					label: 'Playlist',
					id: 'playlist',
					default: '0',
					tooltip: 'Enter an index (zero based) or name of a playlist',
					regex: this.REGEX_SOMETHING,
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
				},
				{
					type: 'dropdown',
					label: 'Position type',
					id: 'type',
					choices: this.CHOICES_POSITIONTYPE,
				},
				{
					type: 'textinput',
					label: 'Time (timecode or seconds)',
					id: 'position',
					regex: '/^(d+(.d+)?)|([0-1][0-9]|[0-2][0-3]):([0-5][0-9]):([0-5][0-9])[:;]([0-6][0-9])$/',
					required: true,
				},
			],
		}
		actions['pause'] = {
			label: 'Pause',
			options: [
				{
					type: 'textinput',
					label: 'Playlist',
					id: 'playlist',
					default: '0',
					tooltip: 'Enter an index (zero based) or name of a playlist',
					regex: this.REGEX_SOMETHING,
				},
				{
					type: 'number',
					label: 'Clip Index (optional)',
					id: 'clip',
					tooltip: 'Enter an index (zero based) for a clip',
					min: 0,
					max: 10000,
					required: false,
				},
			],
		}
		actions['pausePosition'] = {
			label: 'Pause clip at position',
			options: [
				{
					type: 'textinput',
					label: 'Playlist',
					id: 'playlist',
					default: '0',
					tooltip: 'Enter an index (zero based) or name of a playlist',
					regex: this.REGEX_SOMETHING,
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
				},
				{
					type: 'dropdown',
					label: 'Position type',
					id: 'type',
					choices: this.CHOICES_POSITIONTYPE,
				},
				{
					type: 'textinput',
					label: 'Time (timecode or seconds)',
					id: 'position',
					regex: '/([0-1][0-9]|[0-2][0-3]):([0-5][0-9]):([0-5][0-9])[:;]([0-6][0-9])|(d+(.d+)?)/',
					required: true,
				},
			],
		}
		actions['resume'] = {
			label: 'Resume',
			options: [
				{
					type: 'textinput',
					label: 'Playlist',
					id: 'playlist',
					default: '0',
					tooltip: 'Enter an index (zero based) or name of a playlist',
					regex: this.REGEX_SOMETHING,
				},
			],
		}
		actions['stop'] = {
			label: 'Stop',
			options: [
				{
					type: 'textinput',
					label: 'Playlist',
					id: 'playlist',
					default: '0',
					tooltip: 'Enter an index (zero based) or name of a playlist',
					regex: this.REGEX_SOMETHING,
				},
			],
		}
		actions['skipNext'] = {
			label: 'Skip to next clip',
			options: [
				{
					type: 'textinput',
					label: 'Playlist',
					id: 'playlist',
					default: '0',
					tooltip: 'Enter an index (zero based) or name of a playlist',
					regex: this.REGEX_SOMETHING,
				},
			],
		}
		actions['skipPrevious'] = {
			label: 'Skip to previous clip',
			options: [
				{
					type: 'textinput',
					label: 'Playlist',
					id: 'playlist',
					default: '0',
					tooltip: 'Enter an index (zero based) or name of a playlist',
					regex: this.REGEX_SOMETHING,
				},
			],
		}
		actions['updatePlaylists'] = {
			label: 'Update playlist info',
		}

		return actions
	},
}
