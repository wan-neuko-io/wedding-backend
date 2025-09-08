// env
const {
  REGION
} = process.env;

const {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminLinkProviderForUserCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand
} = require("@aws-sdk/client-cognito-identity-provider");

// const
const EXTERNAL_AUTHENTICATION_PROVIDER = 'PreSignUp_ExternalProvider';
const atLeastOneUppercase = /[A-Z]/g; // capital letters from A to Z
const atLeastOneLowercase = /[a-z]/g; // small letters from a to z
const atLeastOneNumeric = /[0-9]/g; // numbers from 0 to 9
const atLeastOneSpecialChar = /[#?!@$%^&*-]/g; // any of the special characters within the square brackets
const eightCharsOrMore = /.{12,}/g; // eight characters or more

// clients
const idpclient = new CognitoIdentityProviderClient({
  region: REGION
});


function generatePassword(pLength = 12) {
  const length = pLength
  const charsets = ["@#$&*-", "@#$&*0123456789ABCDstuvwEFGHIJKLefghijklmnopqrstMNOPQRS2345678TUVWXYZ@#$&*0123456789abcdefghijklmnopqrstuvwxyz"]
  let password = "";

  for (let i = 0; i < length; i++) {
    const rand = Math.random();
    let selector = 1;
    if (rand > 0.5) selector = 0;
    const n = charsets[selector].length;

    password += charsets[selector].charAt(Math.floor(Math.random() * n));
  }
  return password;
}

const passwordChecker = (_password) => {
  return {
    uppercase: _password.match(atLeastOneUppercase),
    lowercase: _password.match(atLeastOneLowercase),
    number: _password.match(atLeastOneNumeric),
    specialChar: _password.match(atLeastOneSpecialChar),
    eightCharsOrGreater: _password.match(eightCharsOrMore),
  }
}

function generateValidPassword(pLength) {
  let password = "";
  for (let i = 0; i < 50; i++) {
    password = generatePassword(pLength);

    // sanity check
    const strength = Object.values(passwordChecker(password)).filter(value => value).length;
    if (strength >= 5) break;
    else continue;
  }

  return password;
}

async function listUsersByEmail({ userPoolId, email }) {
  try {
    const input = {
      UserPoolId: userPoolId,
      Filter: `email = "${email}"`,
    };

    const command = new ListUsersCommand(input);
    return await idpclient.send(command);

  } catch (err) {
    console.error('listUsersByEmail', err)
    throw Error(err);
  }
};

async function adminLinkUserAccounts({
  username,
  userPoolId,
  providerName,
  providerUserId,
}) {

  try {

    const input = {
      UserPoolId: userPoolId,
      DestinationUser: {
        ProviderAttributeValue: username,
        ProviderName: 'Cognito',
      },
      SourceUser: {
        ProviderAttributeName: 'Cognito_Subject',
        ProviderAttributeValue: providerUserId,
        ProviderName: providerName,
      },
    };

    const command = new AdminLinkProviderForUserCommand(input);
    return await idpclient.send(command);

  } catch (err) {
    console.error('adminLinkUserAccounts', err)
    throw Error(err);
  }
};

async function adminCreateUser({
  userPoolId,
  email,
  name,
}) {
  try {

    const input = {
      UserPoolId: userPoolId,
      MessageAction: 'SUPPRESS',
      Username: email,
      DesiredDeliveryMediums: ['EMAIL'],
      UserAttributes: [
        {
          Name: 'name',
          Value: name,
        },
        {
          Name: 'email',
          Value: email,
        },
        {
          Name: 'email_verified',
          Value: 'true',
        },
      ],
    };

    const command = new AdminCreateUserCommand(input);
    return await idpclient.send(command);

  } catch (err) {
    console.error('adminCreateUser', err)
    throw Error(err);
  }
};

async function adminSetUserPassword({userPoolId, email}) {
  try {
    const params = {
      Password: generateValidPassword(24),
      UserPoolId: userPoolId,
      Username: email,
      Permanent: true,
    };

    const command = new AdminSetUserPasswordCommand(params);
    return await idpclient.send(command);
  } catch (err) {
    console.error('adminSetUserPassword', err)
    throw Error(err);
  }
};

async function adminAddUserToGroup({userPoolId, username, groupName}) {
  try {
    const params = {
      UserPoolId: userPoolId,
      Username: username,
      GroupName: groupName,
    };

    const command = new AdminAddUserToGroupCommand(params);
    return await idpclient.send(command);
  } catch (err) {
    console.error('adminSetUserPassword', err)
    throw Error(err);
  }
};

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
    if (triggerSource !== EXTERNAL_AUTHENTICATION_PROVIDER) {
      return event;
    }

    // userName example: "Facebook_12324325436" or "Google_1237823478"
    const [providerNameValue, providerUserId] = userName.split('_');

    // Uppercase the first letter because the event sometimes
    // has it as google_1234 or facebook_1234. In the call to `adminLinkProviderForUser`
    // the provider name has to be Google or Facebook (first letter capitalized)
    const providerName =
      providerNameValue.charAt(0).toUpperCase() + providerNameValue.slice(1);


    // find user with the email
    const usersFilteredByEmail = await listUsersByEmail({
      userPoolId,
      email,
    });

    if (usersFilteredByEmail.Users && usersFilteredByEmail.Users.length > 0) {

      // user already has cognito account
      const cognitoUsername =
        usersFilteredByEmail.Users[0].Username || 'username-not-found';

      // if they have access to the Google / Facebook account of email X, verify their email.
      // even if their cognito native account is not verified
      await adminLinkUserAccounts({
        username: cognitoUsername,
        userPoolId,
        providerName,
        providerUserId,
      });

    } else {
      /* --> user does not have a cognito native account ->
          1. create a native cognito account
          2. change the password, to change status from FORCE_CHANGE_PASSWORD to CONFIRMED
          3. merge the social and the native accounts
          4. add the user to a group - OPTIONAL
      */

      const createdCognitoUser = await adminCreateUser({
        userPoolId,
        email,
        name: name,
      });

      await adminSetUserPassword({ userPoolId, email });

      const cognitoNativeUsername =
        createdCognitoUser.User?.Username || 'username-not-found';

      await adminLinkUserAccounts({
        username: cognitoNativeUsername,
        userPoolId,
        providerName,
        providerUserId,
      });

      // OPTIONALLY add the user to a group
      await adminAddUserToGroup({
        userPoolId,
        username: cognitoNativeUsername,
        groupName: 'Users',
      });

      event.response.autoVerifyEmail = true;
      event.response.autoConfirmUser = true;
    }

    return event;

  } catch (err) {
    console.error(err, JSON.stringify(event));
    throw Error(err);
  }
}
