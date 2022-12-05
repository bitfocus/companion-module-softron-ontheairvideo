/**
 * Update the available static and dynamic variable definitions.
 */
exports.updateVariableDefinitions = function () {
	const variables = []

	// playback status vars:
	variables.push({
		label: 'Playback status',
		name: 'playbackStatus',
	})
	variables.push({
		label: 'Active playlist index',
		name: 'activePlaylist',
	})
	variables.push({
		label: 'Active playlist name',
		name: 'activePlaylistName',
	})
	variables.push({
		label: 'Active playlist duration',
		name: 'playlistDuration',
	})
	variables.push({
		label: 'Active playlist elapsed',
		name: 'playlistElapsed',
	})
	variables.push({
		label: 'Active playlist remaining',
		name: 'playlistRemaining',
	})
	variables.push({
		label: 'Active clip index',
		name: 'activeClip',
	})
	variables.push({
		label: 'Active clip name',
		name: 'activeClipName',
	})
	variables.push({
		label: 'Clip duration',
		name: 'clipDuration',
	})
	variables.push({
		label: 'Clip elapsed',
		name: 'clipElapsed',
	})
	variables.push({
		label: 'Clip remaining',
		name: 'clipRemaining',
	})

	this.debug('Build playlist variables.')
	// playlist variables:
	this.playlists.forEach((playlist, pIndex) => {
		// this.debug('Playlist:', playlist)
		variables.push({
			label: `Playlist ${pIndex}`,
			name: `playlist_${pIndex}`,
		})
		playlist.clips.forEach((clip, index) => {
			variables.push({
				label: `Playlist ${pIndex} Clip ${index}`,
				name: `clip_${pIndex}_${index}`,
			})
		})
	})

	this.setVariableDefinitions(variables)
	this.updatePlaylistVariables()
}

/**
 * Update the values of static status variables.
 */
exports.updateStatusVariables = function (status) {
	this.setVariable('playbackStatus', status.playback_status)
	if (status.playlist_index == undefined) {
		status.playlist_index = '-'
	}
	if (status.playlist_display_name == undefined) {
		status.playlist_display_name = '-'
	}
	if (status.item_index == undefined) {
		status.item_index = '-'
	}
	if (status.item_display_name == undefined) {
		status.item_display_name = '-'
	}
	if (status.playlist_duration != undefined) {
		status.playlist_duration_display = renderTime(status.playlist_duration)
	} else {
		status.playlist_duration_display = '-'
	}
	if (status.playlist_elapsed != undefined) {
		status.playlist_elapsed_display = renderTime(status.playlist_elapsed)
	} else {
		status.playlist_elapsed_display = '-'
	}
	if (status.playlist_remaining != undefined) {
		status.playlist_remaining_display = renderTime(status.playlist_remaining)
	} else {
		status.playlit_remaingin_display = '-'
	}
	if (status.item_duration != undefined) {
		status.item_duration_display = renderTime(status.item_duration)
	} else {
		status.item_duration_display = '-'
	}
	if (status.item_elapsed != undefined) {
		status.item_elapsed_display = renderTime(status.item_elapsed)
	} else {
		status.item_elapsed_display = '-'
	}
	if (status.item_remaining != undefined) {
		status.item_remaining_display = renderTime(status.item_remaining)
	} else {
		status.item_remaining_display = '-'
	}

	this.setVariable('activePlaylist', status.playlist_index)
	this.setVariable('activePlaylistName', status.playlist_display_name)
	this.setVariable('activeClip', status.item_index)
	this.setVariable('activeClipName', status.item_display_name)
	this.setVariable('playlistDuration', status.playlist_duration_display)
	this.setVariable('playlistElapsed', status.playlist_elapsed_display)
	this.setVariable('playlistRemaining', status.playlist_remaining_display)
	this.setVariable('clipDuration', status.item_duration_display)
	this.setVariable('clipElapsed', status.item_elapsed_display)
	this.setVariable('clipRemaining', status.item_remaining_display)
}

/**
 * Update the values of dynamic playlist variables.
 */
exports.updatePlaylistVariables = function () {
	this.playlists.forEach((playlist, pIndex) => {
		// this.debug('Playlist:', playlist);
		this.setVariable(`playlist_${pIndex}`, playlist.label)
		playlist.clips.forEach((clip, index) => {
			this.setVariable(`clip_${pIndex}_${index}`, clip)
		})
	})
}

renderTime = function (seconds) {
	let time = new Date(null)
	time.setSeconds(seconds)
	let timeStr = time.toISOString().substr(11, 8)
	return timeStr.startsWith('00') ? timeStr.substr(3, 5) : timeStr
}
