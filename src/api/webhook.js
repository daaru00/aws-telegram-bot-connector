import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge'

/**
 * AWS Clients
 */
const eventBridge = new EventBridgeClient({
	apiVersion: '2015-10-07',
	logger: console
})

/**
 * Constants 
 */
const USERNAMES_WHITELIST = process.env.USERNAMES_WHITELIST ? `${process.env.USERNAMES_WHITELIST}`.split(',') : []

/**
 * Lambda handler
 * 
 * @param {object} event 
 * @param {string} event.body
 */
export async function handler(event) {
	// Parse JSON serialized body
	const body = JSON.parse(event.body)
	console.log(JSON.stringify({ body }))

	// Parse fields
	const { from } = body.message

	// Deny message from other bots
	if (from.is_bot === true) {
		console.log('Message skipped due bot message protection')
		return {
			statusCode: 201
		}
	}

	// Check whitelist
	if (USERNAMES_WHITELIST.length > 0 && USERNAMES_WHITELIST.includes(`${from.username}`) === false) {
		console.log(`Message skipped due username whitelist: username ${from.username} not whitelisted`)
		return {
			statusCode: 201
		}
	}

	// Send event using EventBridge
	const { FailedEntryCount: failedEvents, Entries: entries } = await eventBridge.send(new PutEventsCommand({
		Entries: [{
			EventBusName: process.env.EVENT_BUS_NAME,
			Source: process.env.EVENT_SOURCE,
			DetailType: 'Message Received',
			Detail: JSON.stringify(body),
		}]
	}))

	// Check send event
	if (failedEvents > 0) {
		const errors = entries.filter(entry => entry.ErrorCode).map(entry => entry.ErrorMessage).join(',')
		console.error(errors)

		throw new Error('An error occurred during message event sent')
	}

	// Return ok
	console.log('Message event sent')
	return {
		statusCode: 200
	}
}
