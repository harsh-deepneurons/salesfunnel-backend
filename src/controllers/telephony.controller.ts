import type { Request, Response } from 'express';
import { AgentModel } from '../../shared/models.ts';

export class TelephonyController {
  static async listNumbers(req: Request, res: Response) {
    res.send([
      { phoneNumber: '+1234567890', friendlyName: '(234) 567-8901', capabilities: { voice: true } },
      { phoneNumber: '+1987654321', friendlyName: '(987) 654-3210', capabilities: { voice: true } }
    ]);
  }

  static async handleIncomingCall(req: Request, res: Response) {
    const host = req.headers.host;
    const calledNumber = req.body.To;
    const callerNumber = req.body.From;

    console.log(`Incoming call to: ${calledNumber}`);

    // Logic to find agent by phone number
    const agent = await AgentModel.findOne({ phoneNumber: calledNumber });

    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const response = new VoiceResponse();

    if (!agent) {
      console.error(`No agent found for number ${calledNumber}`);
      response.say('Sorry, this number is not assigned to an agent.');
      response.hangup();

      res.type('text/xml');
      res.send(response.toString());
      return;
    }

    const connect = response.connect();
    const stream = connect.stream({
      url: `wss://${host}/media-stream/${agent._id}`,
    });
    stream.parameter({
      name: 'callerNumber',
      value: callerNumber,
    });

    res.type('text/xml');
    res.send(response.toString());
  }
}
