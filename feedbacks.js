exports.initFeedbacks = function() {
	const feedbacks = {};

	const foregroundColor = {
		type: 'colorpicker',
		label: 'Foreground colour',
		id: 'fg',
		default: this.rgb(255, 255, 255)
	};

	const backgroundColorPlaying = {
		type: 'colorpicker',
		label: 'Background colour',
		id: 'bg',
		default: this.rgb(0, 204, 0)
	};
	
	const backgroundColorPaused = {
		type: 'colorpicker',
		label: 'Background colour',
		id: 'bg',
		default: this.rgb(255, 255, 0)
	};

	const backgroundColorStopped = {
		type: 'colorpicker',
		label: 'Background colour',
		id: 'bg',
		default: this.rgb(255, 0, 0)
	};
	
	const backgroundColorActive = {
		type: 'colorpicker',
		label: 'Background colour',
		id: 'bg',
		default: this.rgb(0, 51, 204)
	};
	
	feedbacks.playbackStatus = {
		label: 'Playback status',
		description: 'Set colour based on status (playing, paused, stopped)',
		options: [
			{
				type: 'dropdown',
				label: 'Status',
				id: 'status',
				choices: this.CHOICES_PLAYBACKSTATUS
			},
			foregroundColor,
			backgroundColorPlaying
		],
		callback: ({ options }, bank) => {
			if (options.status === this.playing.playback_status) {
				return { color: options.fg, bgcolor: options.bg };
			}
		}
	};
	
	feedbacks.clipActive = {
		label: 'Active clip',
		description: 'Set colour when a specific clip is active',
		options: [
			{
				type:    'textinput',
				label:   'Playlist',
				id:      'playlist',
				tooltip: 'Enter an index (zero based) or name of a playlist',
				default: '0',
					regex:   this.REGEX_SOMETHING
			},
			{
				type:    'textinput',
				label:   'Clip',
				id:      'clip',
				tooltip: 'Enter an index (zero based) or name of a clip',
				defauls: '0',
				regex:   this.REGEX_SOMETHING
			},
			foregroundColor,
			backgroundColorActive
		],
		callback: ({ options }, bank) => {
			if ( ((options.playlist == this.playing.playlist_index) || (options.playlist == this.playing.playlist_display_name)) && 
				((options.clip == this.playing.item_index) || (options.clip == this.playing.item_display_name)) ) {
					return { color: options.fg, bgcolor: options.bg };
				}
		}
	};
	
	feedbacks.clipStatus = {
		label: 'Active clip, with status',
		description: 'Set colour based on status of a specific clip',
		options: [
			{
				type:    'textinput',
				label:   'Playlist',
				id:      'playlist',
				tooltip: 'Enter an index (zero based) or name of a playlist',
				default: '0',
					regex:   this.REGEX_SOMETHING
			},
			{
				type:    'textinput',
				label:   'Clip',
				id:      'clip',
				tooltip: 'Enter an index (zero based) or name of a clip',
				defauls: '0',
				regex:   this.REGEX_SOMETHING
			},
			{
				type:     'dropdown',
				label:    'Status',
				id:       'status',
				choices:  this.CHOICES_PLAYBACKSTATUS
			},
			foregroundColor,
			backgroundColorActive
		],
		callback: ({ options }, bank) => {
			if ( ((options.playlist == this.playing.playlist_index) || (options.playlist == this.playing.playlist_display_name)) && 
				((options.clip == this.playing.item_index) || (options.clip == this.playing.item_display_name)) &&
				(options.status == this.playing.playback_status) ) {
					return { color: options.fg, bgcolor: options.bg };
				}
		}
	};
	
	return feedbacks;
	
}