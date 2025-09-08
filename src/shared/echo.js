// env
const {
  REGION
} = process.env;

// clients
// const idpclient = new CognitoIdentityProviderClient({
//   region: REGION
// });

exports.handler = async (event, context) => {
  if (process.env.NODE_ENV !== 'production') console.log('event', JSON.stringify(event), JSON.stringify(context));
  try {
   return event;
  } catch (err) {
    console.error(err, JSON.stringify(event));
    throw Error(err);
  }
}
