import { CreateConvertToBooleanFeedbackUpgradeScript } from '@companion-module/base'

export const upgradeScripts = [
	CreateConvertToBooleanFeedbackUpgradeScript({
		playbackStatus: true,
		clipActive: true,
		clipStatus: true,
		timeRemaining: true,
	}),
]
