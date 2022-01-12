import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import axios from 'axios'

/**
 * AWS Clients
 */
const ssm = new SSMClient({
	apiVersion: '2014-11-06',
	logger: console
})

/**
 * Telegram Client
 */
let BOT_TOKEN = null // retrieved at runtime from SSM parameter
let BOT_CLIENT = null // create at runtime

/**
 * @returns {string}
 */
async function getBotTokenValue() {
	if (!BOT_TOKEN) {
		const { Parameter: param } = await ssm.send(new GetParameterCommand({
			Name: process.env.BOT_TOKEN_PARAMETER_NAME
		}))

		BOT_TOKEN = param.Value
	}
	return BOT_TOKEN
}

/**
 * @returns {import('axios').AxiosInstance}
 */
async function getTelegramClient() {
	if (!BOT_CLIENT) {
		const token = await getBotTokenValue()
		BOT_CLIENT = axios.create({
			baseURL: `https://api.telegram.org/bot${token}/`
		})
	}

	return BOT_CLIENT
}

/**
 * Lambda handler
 * 
 * @param {object} event 
 * @param {object} event.detail
 */
export async function handler({ detail }) {
	// Retrieve detail from event
	console.log(JSON.stringify({ detail }))

	// Send message using bot API
	const client = await getTelegramClient()
	try {
		await client.post('sendMessage', detail)	
	} catch (error) {
		const { response } = error
		if (response.data && response.data.description) {
			throw new Error(response.data.description)
		} else {
			throw error
		}
	}

	console.log('Message sent')
}
