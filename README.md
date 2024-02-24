# AWS Serverless Telegram Bot Connector

![CloudFormation](https://img.shields.io/badge/-CloudFormation-%23FF4F8B)
![API Gateway](https://img.shields.io/badge/-API%20Gateway-%23A166FF)
![EventBridge](https://img.shields.io/badge/-EventBridge-%23FF4F8B)

This is a serverless application that implements a Telegram bot connector for message receive and send.

## Created resources

This application create an API Gateway endpoint to listen for webhook request, an Event Bridge bus to send received messages.

![Infrastructure Schema](./doc/schema.png)

## Installation

Using the [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html):
```bash
sam build
sam deploy --guided
```

## Parameters

- **TelegramBotToken**: Telegram bot token.

- **TelegramIPsWhitelist**: Comma separate list of IPs of permitted senders IP, leave empty to disable whitelist.

## Outputs

- **WebhookEndpoint**: The Telegram bot Webhook URL

- **MessagesEventBusName**: Name of EventBridge bus where message event are sent

## Telegram bot configurations

Create a new bot talking to **@BotFather** and copy the provide token (needed for **TelegramBotToken** parameter).

### Retrieve list of sender IPs

Telegram report [which IPs](https://core.telegram.org/bots/webhooks#the-short-version) they’re sending webhook from.

Here the latest values:
```
149.154.160.0/20
91.108.4.0/22
```

### Retrieve updates

Retrieve bot updates navigating to `https://api.telegram.org/bot<here the bot token>/getUpdates`.

You should see a response like this:
```json
{"ok":true,"result":[{"update_id":1234567890,
"message":{"message_id":10,"from":{"id":1234567890,"is_bot":false,"first_name":"Fabio","username":"daaru","language_code":"it"},"chat":{"id":1234567890,"first_name":"Fabio","username":"daaru","type":"private"},"date":1234567890,"text":"test"}}]}
```

The `chat.id` is the value to use in **TelegramChatsWhitelist** parameter.

### Check Webhook

A StepFunction triggered by stack created event will automatically register the webhook using the [setWebhook](https://core.telegram.org/bots/api#setwebhook) bot API.

In order to check if the webhook is correctly registered navigating to `https://api.telegram.org/bot<here the bot token>/getWebhookInfo`, you should see a response like this:
```json
{"ok":true,"result":{"url":"https://xxxxxxxxxxxx.execute-api.eu-west-1.amazonaws.com/webhook/","has_custom_certificate":false,"pending_update_count":0,"max_connections":40,"ip_address":"0.0.0.0"}}
```

If the response is empty the webhook wasn't registered correctly:
```json
{"ok":true,"result":{"url":"","has_custom_certificate":false,"pending_update_count":0}}
```

Set the WebHook URL endpoint (retrieved from **WebhookEndpoint** stack output after the first deploy) navigating to: `https://api.telegram.org/bot<here the bot token>/setWebhook?url=<here the webhook endpoint url>`. 

You should see a response like this:
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

## Receive a message

When a message is sent to the bot (and the username whitelist pass) this application send an event to the **exported EventBridge bus** with the following format:
```js
{
    "source": "org.telegram.webhook",
    "detail-type": "Message Received",
    "detail": { /* Update object */ }
}
```

Event's details as the same format as [Update](https://core.telegram.org/bots/api#update) object.

## Send chat action

To trigger a chat event send an event send an event to the **exported EventBridge bus** with the following format:
```json
{
  "detail-type": "Send Chat Action",
  "detail": {
    "chat_id": 1234567,
    "action": "typing"
  }
}
```

## Send a message

In order to send a message through the Telegram bot send an event to the **exported EventBridge bus** with the following format:
```json
{
  "detail-type": "Send Message",
  "detail": {
    "chat_id": 1234567,
    "text": "this is an **example** message"
  }
}
```

## Credits

- Repository badges by [Shields.io](https://shields.io/)
- Infrastructure schema by [Cloudcraft](https://www.cloudcraft.co/)
