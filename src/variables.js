/**
 * Update the available static and dynamic variable definitions.
 */
export function updateVariableDefinitions() {
	this.log('debug', 'Running updateVariableDefinitions')
	const variables = []

	// system info vars:
	variables.push({
		name: 'Application Version',
		variableId: 'applicationVersion',
	})
	variables.push({
		name: 'macOS Version',
		variableId: 'macOSVersion',
	})
	variables.push({
		name: 'Computer Name',
		variableId: 'computerName',
	})

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
	variables.push({
		name: 'Story Page',
		variableId: 'storyPage',
	})
	variables.push({
		name: 'Story Name',
		variableId: 'storyName',
	})
	variables.push({
		name: "clip file path",
		variableId: "clipFilePath",
	})
	variables.push({
		name: "clip file name",
		variableId: "clipFileName",
	})

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
			variables.push({
				name: `Playlist ${pIndex} Clip ${index} duration`,
				variableId: `clipDuration_${pIndex}_${index}`,
			})
		})
	})

	this.setVariableDefinitions(variables)
	this.updatePlaylistVariables()
}

/**
 * Update the values of system info variables.
 */
export function updateInfoVariables(info) {
	let list = {}
	list['applicationVersion'] = info.application_version || '-'
	list['macOSVersion'] = info.mac_os_version || '-'
	list['computerName'] = info.computer_name || '-'
	this.setVariableValues(list)
}

/**
 * Update the values of static status variables.
 */
export function updateStatusVariables(status) {
	//	this.log('debug', 'Running updateStatusVariables')
	let list = {}
	list['playbackStatus'] = status.playback_status
	list['activePlaylist'] = status.playlist_index == undefined ? '-' : status.playlist_index
	list['activePlaylistName'] = status.playlist_display_name == undefined ? '-' : status.playlist_display_name
	list['activeClip'] = status.item_index == undefined ? '-' : status.item_index
	list['activeClipName'] = status.item_display_name == undefined ? '-' : status.item_display_name
	list['playlistDuration'] = status.playlist_duration == undefined ? '-' : renderTime(status.playlist_duration)
	list['playlistElapsed'] = status.playlist_elapsed == undefined ? '-' : renderTime(status.playlist_elapsed)
	list['playlistRemaining'] = status.playlist_remaining == undefined ? '-' : renderTime(status.playlist_remaining)
	list['clipDuration'] = status.item_duration == undefined ? '-' : renderTime(status.item_duration)
	list['clipElapsed'] = status.item_elapsed == undefined ? '-' : renderTime(status.item_elapsed)
	list['clipRemaining'] = status.item_remaining == undefined ? '-' : renderTime(status.item_remaining)
	list['storyPage'] = status.item_story_page == undefined ? '-' : status.item_story_page
	list['storyName'] = status.item_story_name == undefined ? '-' : status.item_story_name
	list['clipFilePath'] = status.item_media_url == undefined ? '-' : status.item_media_url
	list['clipFileName'] = status.item_filename == undefined ? '-' : status.item_filename
	this.setVariableValues(list)
}

/**
 * Update the values of dynamic playlist variables.
 */
export function updatePlaylistVariables() {
	this.log('debug', 'Running updatePlaylistVariables')
	let list = {}
	this.playlists.forEach((playlist, pIndex) => {
		this.log('debug', `Updating variables for playlist ${pIndex}: ${playlist.id}`)
		list[`playlist_${pIndex}`] = playlist.label
		//	this.setVariable(`playlist_${pIndex}`, playlist.label)
		playlist.clips.forEach((clip, index) => {
			this.log('debug', `-- Updating variables for clip ${index}: ${clip.name}, duration: ${clip.duration}`)
			list[`clip_${pIndex}_${index}`] = clip.name
			list[`clipDuration_${pIndex}_${index}`] = renderTime(clip.duration)
			//		this.setVariable(`clip_${pIndex}_${index}`, clip)
		})
	})
	this.setVariableValues(list)
}

function renderTime(seconds) {
	let time = new Date(null)
	time.setSeconds(seconds ? seconds : 0)
	let timeStr = time.toISOString().substr(11, 8)
	return timeStr.startsWith('00') ? timeStr.substr(3, 5) : timeStr
}
