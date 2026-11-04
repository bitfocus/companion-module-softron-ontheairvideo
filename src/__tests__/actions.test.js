import assert from 'node:assert/strict'
import test from 'node:test'
import { getActions } from '../actions.js'

function setup() {
	const requests = []
	const instance = {
		cgProjects: [],
		parseVariablesInString: () => assert.fail('API 1.15 already resolved action options'),
		sendGetRequest: async (path) => requests.push({ path }),
		sendPostRequest: async (path, body) => requests.push({ path, body }),
	}
	return { actions: getActions.call(instance), requests }
}

test('play preserves variable syntax produced by the first expansion', async () => {
	const { actions, requests } = setup()
	await actions.play.callback({ options: { playlist: '$(custom:literal)', clip: '0' } })
	assert.deepEqual(requests, [{ path: 'playlists/$(custom:literal)/items/0/play' }])
})

test('create item accepts zero and nonzero numeric clip indices and an empty index', async () => {
	for (const clip of [0, 7, '']) {
		const { actions, requests } = setup()
		await actions['create item'].callback({ options: { playlist: '0', clip, type: '3', name: 'Note' } })
		assert.deepEqual(requests, [
			{
				path: clip === '' ? 'playlists/0/items' : `playlists/0/items/${clip}`,
				body: { clip_type: '3', name: 'Note' },
			},
		])
	}
})

test('run action encodes the resolved parameter once', async () => {
	const { actions, requests } = setup()
	await actions.runAction.callback({ options: { action: 'Test', parameter: '$(custom:literal) & value' } })
	assert.deepEqual(requests, [{ path: 'actions/Test/run?parameter=%24(custom%3Aliteral)%20%26%20value' }])
})

test('position actions retain variable support', () => {
	const { actions } = setup()
	for (const id of ['playPosition', 'pausePosition']) {
		assert.equal(actions[id].options.find((option) => option.id === 'position').useVariables, true)
	}
})
