const { CreateConvertToBooleanFeedbackUpgradeScript } = require('@companion-module/base')

module.exports.upgradeScripts = [
	CreateConvertToBooleanFeedbackUpgradeScript({
		playbackStatus: true,
		clipActive: true,
		clipStatus: true,
		timeRemaining: true,
	}),
]
