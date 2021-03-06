/**
* Update the available static and dynamic variable definitions.
*/
exports.updateVariableDefinitions = function() {
    const variables = [];

    // playback status vars:
    variables.push({
        label: 'Playback status',
        name:  'playbackStatus'
    });
    variables.push({
        label: 'Active clip index',
        name:  'activeClip'
    });
    variables.push({
        label: 'Active clip name',
        name:  'activeClipName'
    });
    variables.push({
        label: 'Clip duration',
        name:  'clipDuration'
    });
    variables.push({
        label: 'Time elapsed',
        name:  'clipElapsed'
    });
    variables.push({
        label: 'Time remaining',
        name:  'clipRemaining'
    });
    
    this.debug('Build playlist variables.');
    // playlist variables:
    this.playlists.forEach ((playlist, pIndex) => {
//        this.debug('Playlist:', playlist);
        variables.push({
            label: `Playlist ${pIndex}`,
            name:  `playlist_${pIndex}`
        });
        playlist.clips.forEach ((clip, index) => {
            variables.push({
                label: `Playlist ${pIndex} Clip ${index}`,
                name:  `clip_${pIndex}_${index}`
            });
        });
    });
    
    this.setVariableDefinitions(variables);
    this.updatePlaylistVariables();
}

/**
* Update the values of static status variables.
*/
exports.updateStatusVariables = function(status) {
    this.setVariable('playbackStatus', status.playback_status);
    if (status.item_index == undefined) { status.item_index = '-' };
    if (status.item_display_name == undefined) { status.item_display_name = '-' };
    if (status.item_duration != undefined) {
        status.item_duration = renderTime(status.item_duration);
    } else {
        status.item_duration = '-';
    };
    if (status.item_elapsed != undefined) {
        status.item_elapsed = renderTime(status.item_elapsed);
    } else {
        status.item_elapsed = '-';
    };
    if (status.item_remaining != undefined) {
        status.item_remaining = renderTime(status.item_remaining);
    } else {
        status.item_remaining = '-';
    };
    
    this.setVariable('activeClip', status.item_index);
    this.setVariable('activeClipName', status.item_display_name);
    this.setVariable('clipDuration', status.item_duration);
    this.setVariable('clipElapsed', status.item_elapsed);
    this.setVariable('clipRemaining', status.item_remaining);
}

/**
* Update the values of dynamic playlist variables.
*/
exports.updatePlaylistVariables = function() {
    this.playlists.forEach((playlist, pIndex) => {
//        this.debug('Playlist:', playlist);
        this.setVariable(`playlist_${pIndex}`, playlist.label);
        playlist.clips.forEach ((clip, index) => {
            this.setVariable(`clip_${pIndex}_${index}`, clip);
        });
    })
}

renderTime = function (seconds) {
    let time = new Date(null);
    time.setSeconds(seconds);
    let timeStr = time.toISOString().substr(11, 8);
    return (timeStr.startsWith('00') ? timeStr.substr(3, 5) : timeStr);
}