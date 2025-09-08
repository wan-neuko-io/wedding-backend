const { 
  EventBridgeClient, 
  PutEventsCommand 
} = require("@aws-sdk/client-eventbridge");

// env var
const {
  REGION,
  PROJECT_NAME,
  MAIN_EVENTS_BUSNAME,
} = process.env;

// const
const TIGGER_SOURCE = 'PostConfirmation_ConfirmSignUp';

// clients
const busClient = new EventBridgeClient({
  region: REGION
});

async function createEvent(source, eventType, event) {
  try {
    const input = {
      Entries: [
        {
          Detail: JSON.stringify(event),
          DetailType: eventType,
          EventBusName: MAIN_EVENTS_BUSNAME,
          Source: source,
        },
      ],
    };
    const command = new PutEventsCommand(input);
    return await busClient.send(command);

  } catch (err) {
    console.error('createEvent', err)
  }
}

exports.handler = async (event, context) => {
  if (process.env.NODE_ENV !== 'production') console.log('event', JSON.stringify(event), JSON.stringify(context));
  try {
    // var
    const {
      triggerSource,
      userPoolId,
      userName,
      request: {
        userAttributes: { email, name },
      },
    } = event;

    // sanity check
    if (triggerSource !== TIGGER_SOURCE) {
      return event;
    }

    // create event
    await createEvent(
      ['com', PROJECT_NAME, 'iam'].join("."), 
      'user.signup.confirmed', 
      {
        user: { email, name },
        userPoolId,
        userName,
      }
    );

    return event;

  } catch (err) {
    console.error(err, JSON.stringify(event));
    throw Error(err);
  }
}