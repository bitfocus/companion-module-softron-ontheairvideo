/**
 * Update the available static and dynamic variable definitions.
 */
export function updateVariableDefinitions() {
	const variables = []

	// playback status vars:
	variables.push({
		name: 'Playback status',
		variableId: 'playbackStatus',
	})
	variables.push({
		name: 'Active playlist index',
		variableId: 'activePlaylist',
	})
	variables.push({
		name: 'Active playlist name',
		variableId: 'activePlaylistName',
	})
	variables.push({
		name: 'Active playlist duration',
		variableId: 'playlistDuration',
	})
	variables.push({
		name: 'Active playlist elapsed',
		variableId: 'playlistElapsed',
	})
	variables.push({
		name: 'Active playlist remaining',
		variableId: 'playlistRemaining',
	})
	variables.push({
		name: 'Active clip index',
		variableId: 'activeClip',
	})
	variables.push({
		name: 'Active clip name',
		variableId: 'activeClipName',
	})
	variables.push({
		name: 'Clip duration',
		variableId: 'clipDuration',
	})
	variables.push({
		name: 'Clip elapsed',
		variableId: 'clipElapsed',
	})
	variables.push({
		name: 'Clip remaining',
		variableId: 'clipRemaining',
	})

	this.log('debug', 'Build playlist variables.')
	// playlist variables:
	this.playlists.forEach((playlist, pIndex) => {
		// this.debug('Playlist:', playlist)
		variables.push({
			name: `Playlist ${pIndex}`,
			variableId: `playlist_${pIndex}`,
		})
		playlist.clips.forEach((clip, index) => {
			variables.push({
				name: `Playlist ${pIndex} Clip ${index}`,
				variableId: `clip_${pIndex}_${index}`,
			})
		})
	})

	this.setVariableDefinitions(variables)
	this.updatePlaylistVariables()
}

/**
 * Update the values of static status variables.
 */
export function updateStatusVariables(status) {
	this.setVariableValues({ playbackStatus: status.playback_status })
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

	this.serVariableValues({
		activePlaylist: status.playlist_index,
		activePlaylistName: status.playlist_display_name,
		activeClip: status.item_index,
		activeClipName: status.item_display_name,
		playlistDuration: status.playlist_duration_display,
		playlistElapsed: status.playlist_elapsed_display,
		playlistRemaining: status.playlist_remaining_display,
		clipDuration: status.item_duration_display,
		clipElapsed: status.item_elapsed_display,
		clipRemaining: status.item_remaining_display,
	})
}

/**
 * Update the values of dynamic playlist variables.
 */
export function updatePlaylistVariables() {
	let list = {}
	this.playlists.forEach((playlist, pIndex) => {
		// this.debug('Playlist:', playlist);
		list[`playlist_${pIndex}`] = playlist.label
		//	this.setVariable(`playlist_${pIndex}`, playlist.label)
		playlist.clips.forEach((clip, index) => {
			list[`clip_${pIndex}_${index}`] = clip
			//		this.setVariable(`clip_${pIndex}_${index}`, clip)
		})
	})
	this.setVariableValues(list)
}

function renderTime(seconds) {
	let time = new Date(null)
	time.setSeconds(seconds)
	let timeStr = time.toISOString().substr(11, 8)
	return timeStr.startsWith('00') ? timeStr.substr(3, 5) : timeStr
}
