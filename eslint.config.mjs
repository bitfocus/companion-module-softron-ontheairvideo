import { generateEslintConfig } from '@companion-module/tools/eslint/config.mjs'

const config = await generateEslintConfig({})

export default [
	...config,
	{
		files: ['src/**/*.js'],
		languageOptions: {
			sourceType: 'module',
		},
	},
]
