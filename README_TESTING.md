# Testing Voice Server with Postman

This guide explains how to test the Voice Agent logic without making a real phone call.

## Prerequisites
- Postman (Desktop App)
- Running Voice Server (`npm run dev`)
- A valid Agent ID from your MongoDB database

## Steps

1. **Open Postman** and create a new request.
2. **Set Request Type** to `WebSocket`.
3. **Enter URL**:
   ```
   ws://localhost:8080/media-stream/<YOUR_AGENT_ID>
   ```
   Replace `<YOUR_AGENT_ID>` with the `_id` of an agent in your database.

4. **Connect**: Click "Connect". You should see "Call Connected for Agent: ..." in the server logs.

5. **Send Test Event**:
   In the "Message" tab, send the following JSON:
   ```json
   {
     "event": "test_input",
     "text": "Hello, who are you?"
   }
   ```

6. **Verify Response**:
   - The server will bypass STT and send the text directly to the Brain.
   - You should receive a WebSocket message back with `event: "media"` containing the base64 audio payload.
   - You should also see logs in the server terminal:
     ```
     [DEBUG] Received test input: Hello, who are you?
     AI Replying: I am your helpful assistant...
     ```

## Troubleshooting
- **Connection Closed Immediately?** Check if the Agent ID is valid and exists in the database.
- **No Audio?** Ensure your AWS credentials in `.env` are correct and have permissions for Polly/Bedrock.
