const { sendEmails, emailTypes } = require('../emails/emailSender');

/*
 * Users functions
 */

  // Get username by email, phone or account number
Parse.Cloud.define("check_user", async request => {

  var emailOrAccount = request.params.email_account_phone;

  let UserQuery = new Parse.Query(Parse.User);

  UserQuery.include("avatar");
  UserQuery.include("avatars");

  if(emailOrAccount.includes("@")){
      UserQuery.equalTo("email", emailOrAccount);
  } else if(emailOrAccount.startsWith("+")){
      UserQuery.equalTo("phone_number_full", emailOrAccount);
  } else {
      UserQuery.equalTo("username", emailOrAccount);
  }

  return UserQuery.first({ useMasterKey: true })
    .then(function (user) {

      if (user != null) {

      return Promise.resolve(user);

      } else {

        // throw an error
        throw new Parse.Error(101, 'ObjectNotFound');
        //return Promise.reject('error');

      }

    }).catch(function (error) {
      console.error("Got an error " + error);

       // throw an error
       return Promise.reject(error);

    });

});

// Follow user and make friends
Parse.Cloud.define("follow_user", async request => {
  
  var authorId = request.params.authorId;
  var receiverId = request.params.receiverId;

  var userQueryAuthor = new Parse.Query(Parse.User);
  userQueryAuthor.equalTo("objectId", authorId);
  const author = await userQueryAuthor.first({
    useMasterKey: true
  });

  var userQueryReceiver = new Parse.Query(Parse.User);
  userQueryReceiver.equalTo("objectId", receiverId);
  const receiver = await userQueryReceiver.first({
    useMasterKey: true
  });

  var isFollowing = author.get("following") || [];

  if(isFollowing.includes(receiverId)){

    author.remove("following", receiverId);
    author.remove("friends", receiverId);

    receiver.remove("followers", authorId);
    receiver.remove("friends", authorId);

  } else {

    author.addUnique("following", receiverId);
    receiver.addUnique("followers", authorId);

    // Check if the receiver is following back to add friendship
    const receiverFollowing = receiver.get("following") || [];
    if (receiverFollowing.includes(authorId)) {
      author.addUnique("friends", receiverId);
      receiver.addUnique("friends", authorId);
    }
  }

  await author.save(null, {useMasterKey: true});
  return receiver.save(null, {
    useMasterKey: true
  }).then(function () {

    return author;
  })
  .catch(function (error) {

    return Promise.reject(error);

  });

});

// Add referring user and it's fucntions
Parse.Cloud.define("register_referring_user", async request => {
  
  var userId = request.params.userId;
  var referringUserId = request.params.referringUserId;

  var userQueryAuthor = new Parse.Query(Parse.User);
  userQueryAuthor.equalTo("objectId", userId);
  const author = await userQueryAuthor.first({
    useMasterKey: true
  });

  var userQueryReceiver = new Parse.Query(Parse.User);
  userQueryReceiver.equalTo("objectId", referringUserId);
  const receiver = await userQueryReceiver.first({
    useMasterKey: true
  });

  author.set("invitedByUser", referringUserId);

  receiver.addUnique("invitedUsers", userId);

  await author.save(null, {useMasterKey: true});
  return receiver.save(null, {
    useMasterKey: true
  }).then(async function () {

  const InvitedUser = Parse.Object.extend("InvitedUsers");
  const invitedUser = new InvitedUser();

  invitedUser.set("author", author);
  invitedUser.set("authorId", author.id);

  invitedUser.set("invitedBy", receiver);
  invitedUser.set("invitedById", receiver.id);

  await invitedUser.save(null, { useMasterKey: true });
    return author;

  })
  .catch(function (error) {

    return Promise.reject(error);

  });

});

// Set new password
Parse.Cloud.define("set_new_password", async request => {

  var username = request.params.user;
  var password = request.params.password;

  let UserQuery = new Parse.Query(Parse.User);

  UserQuery.include("avatar");
  UserQuery.include("avatars");

  if(username.includes("@")){
    UserQuery.equalTo("email", username);
  } else {
    UserQuery.equalTo("username", username);
  }
  
  return UserQuery.first({ useMasterKey: true })
    .then(async function (user) {

      if (user != null) {

        user.set("password", password);

        await user.save(null, {
          useMasterKey: true
        });

        return Promise.resolve(user);

      } else {

        throw new Parse.Error(101, 'ObjectNotFound');

      }

    }).catch(function (error) {
      
       return Promise.reject(error);

    });

});

// Online user status
Parse.Cloud.define("updateUserStatus", async request => {

  const userId = request.params.userId; // Get user ID from request parameters
  const status = request.params.status; // Get status from request parameters
  const query = new Parse.Query(Parse.User);

  // Find the user by ID
  query.equalTo("objectId", userId);
  const user = await query.first({ useMasterKey: true });

  // Update the user's status
  if (user) {
      user.set('status', status);
      if(status === "online"){
        user.set("lastSeen", new Date());
      }
      await user.save(null, { useMasterKey: true });
      return "Status updated successfully";
  } else {
      throw "User not found";
  }

});

//Parse Cloud Code for updating data
Parse.Cloud.define("update_user_global", async request => {

  var username = request.params.user;
  var column = request.params.column;
  var value = request.params.value;

  var User = Parse.Object.extend("_User");
  let query = new Parse.Query(User);
  query.equalTo("username", username);

  query.include("avatar");
  query.include("avatars");

  const user = await query.first({ useMasterKey: true });
  user.set(column, value);

  return user.save(null, { useMasterKey: true })
  .then(function (user) {

    return Promise.resolve(user);

  }).catch(function (error) {

      return Promise.reject(error);

  });

});

Parse.Cloud.define("update_user_global_list", async request => {

  var username = request.params.user;

  var User = Parse.Object.extend("_User");
  let query = new Parse.Query(User);
  query.equalTo("username", username);

  query.include("avatar");
  query.include("avatars");

  const user = await query.first({ useMasterKey: true });

  for (const val of a) { // You can use `let` instead of `const` if you like

    column = request.params.column;
    user.set(column, val);
  }

  return user.save(null, { useMasterKey: true })
  .then(function (user) {

    return Promise.resolve(user);

  }).catch(function (error) {

      return Promise.reject(error);

    });

});

Parse.Cloud.define("email_code", async request => { 

  const emailCode = Math.floor(100000 + Math.random() * 900000);

  var emailOrAccount = request.params.email_account_phone;

  let UserQuery = new Parse.Query(Parse.User);

  if(emailOrAccount.includes("@")){
      UserQuery.equalTo("email", emailOrAccount);
  } else if(emailOrAccount.startsWith("+")){
      UserQuery.equalTo("primary_phone", emailOrAccount);
  } else {
      UserQuery.equalTo("username", emailOrAccount);
  }

  return UserQuery.first({ useMasterKey: true })
    .then(async function (user) {

      if (user != null) {

        user.set("email_verification_code", emailCode);
        await user.save(null, {useMasterKey: true});

        const email = user.get('email');
        const verificationCode = user.get('email_verification_code');
        const firstname = user.get('first_name');

        sendEmails(emailTypes.resetPassword, email, firstname, verificationCode);

        return Promise.resolve(user);

      } else {

        throw new Parse.Error(101, 'ObjectNotFound');
      }

    }).catch(function (error) {
      console.error("Got an error " + error);

       return Promise.reject(error);

    });
});

// New account email code
Parse.Cloud.define("email_code_new", async request => { 

  const emailCode = Math.floor(100000 + Math.random() * 900000);

  var email = request.params.email;
  var firstName = request.params.name;
  
  sendEmails(emailTypes.verification, email, firstName, emailCode);
  return emailCode;

});

// New account email code
Parse.Cloud.define("add_new_email", async request => { 

  const emailCode = Math.floor(100000 + Math.random() * 900000);

  var email = request.params.email;
  var firstName = request.params.name;
  
  sendEmails(emailTypes.addEmail, email, firstName, emailCode);
  return emailCode;

});

// verify email
Parse.Cloud.define("verify_my_email", async request => {

  var username = request.params.user;
  var code = request.params.email_verification_code;

  let UserQuery = new Parse.Query(Parse.User);

  if(username.includes("@")){
    UserQuery.equalTo("email", username);
  } else {
    UserQuery.equalTo("username", username);
  }
  
  return UserQuery.first({ useMasterKey: true })
    .then(async function (user) {

      if (user != null) {

          var veriCode = user.get("email_verification_code");

          if(veriCode != null && veriCode == code){
              
              user.set("emailVerified", true);
              user.unset("email_verification_code");

              await user.save(null, {useMasterKey: true});

              const email = user.get('email');
              const firstname = user.get('first_name');

              sendEmails(emailTypes.emailVerifed, email, firstname, code);

              return Promise.resolve(user);

          } else {
              throw new Parse.Error(311, 'InvalidEmailVerificationCode');
          }

      } else {

        throw new Parse.Error(101, 'ObjectNotFound');

      }

    }).catch(function (error) {
      
       return Promise.reject(error);

    });

});

// Verify user 
Parse.Cloud.define("verify_my_email_signup", async request => {
  
  var username = request.params.user;

  let UserQuery = new Parse.Query(Parse.User);

  if(username.includes("@")){
    UserQuery.equalTo("email", username);
  } else {
    UserQuery.equalTo("username", username);
  }
  
  return UserQuery.first({ useMasterKey: true })
    .then(async function (user) {

      if (user != null) {

        const email = user.get('email');
        const firstname = user.get('first_name');

        user.set('emailVerified', true);

        await user.save(null, { useMasterKey: true, context: { noTrigger: true } });
  
        sendEmails(emailTypes.welcomeEmail, email, firstname, username);

        return Promise.resolve(user);

      } else {

        throw new Parse.Error(101, 'ObjectNotFound');

      }

    }).catch(function (error) {
      
       return Promise.reject(error);

    });
});

Parse.Cloud.define("update_user_email", async request => {

  var username = request.params.user;
  var email = request.params.email;

  let UserQuery = new Parse.Query(Parse.User);

  if(username.includes("@")){
    UserQuery.equalTo("email", username);
  } else {
    UserQuery.equalTo("username", username);
  }
  
  return UserQuery.first({ useMasterKey: true })
    .then(async function (user) {

      if (user != null) {

        user.set("email", email);
        user.set("email_public", email);
        user.set("emailVerified", true);

        await user.save(null, {useMasterKey: true});

        return Promise.resolve(user);

      } else {

        throw new Parse.Error(101, 'ObjectNotFound');

      }

    }).catch(function (error) {
      
       return Promise.reject(error);

    });

});

Parse.Cloud.define("unlink", async (request) => {

  var username = request.params.user;
  var type = request.params.type;

  var User = Parse.Object.extend("_User");
  let query = new Parse.Query(User);
  query.equalTo("username", username);

  const user = await query.first({ useMasterKey: true });

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Remove the Service auth data from the user
  if(type === "facebook"){
    //user.unset("authData.facebook");

  } else  if(type === "apple"){
    //user.unset("authData.apple");

  } else  if(type === "google"){
    //user.unset("authData.google");
    
  } else if(type === "delete"){

    user.set("accountDeleted", true);
    user.set("emailVerified", false);

    //user.set("authData", {});

    user.unset("phone_number");
    user.unset("phone_number_full");
    user.unset("email");
    user.unset("email_public");

  }

  try {
    await user.save(null, { useMasterKey: true });

    if(type === "delete"){
      return unlink(user.id);
    } else {
      return type + " account unlinked successfully";
    }
    
  } catch (error) {

    if(type === "delete"){
      throw new Error("Failed to delete account: "+ error.message);
    } else {
      throw new Error("Failed to unlink " + type +  "account: "+ error.message);
    }
    
  }
});

async function unlink(userId) {

  try {
    await Parse.Cloud.httpRequest({
      method: "PUT",
      url: process.env.PARSE_SERVER_URL + "/users/" + userId,
      headers: {
        'X-Parse-Application-Id': process.env.PARSE_SERVER_APPLICATION_ID,
        'X-Parse-Master-Key': process.env.PARSE_SERVER_MASTER_KEY,
        'Content-Type': 'application/json'
      },
      body: {
        "authData": {
          "facebook": null,
          "apple": null,
          "google": null
        }
      }
    });

    return "account deleted successfully";

  } catch (error) {
    console.info("HTTP request failed: ", JSON.stringify(error, null, 2));
    throw new Error("HTTP request failed: " + error);
  }
}

Parse.Cloud.define('fetchInstallations', async (request) => {
  const { user } = request;
  
  // Ensure the user is authenticated
  if (!user) {
    throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, 'User must be authenticated.');
  }

  try {
    // Query for installations
    const query = new Parse.Query(Parse.Installation);
    
    // If you want to limit installations to the current user, uncomment the next line
    // query.equalTo('user', user);

    // Include the user object in the results
    query.include('user');

    // Fetch the installations
    const installations = await query.find({ useMasterKey: true });

    // Map the results to the desired format
    const formattedInstallations = installations.map(installation => {
      const userData = installation.get('user');
      return {
        id: installation.id,
        deviceType: installation.get('deviceType'),
        deviceToken: installation.get('deviceToken'),
        // Add any other relevant fields from the Installation object
        user: userData ? {
          id: userData.id,
          name: userData.get('name')
        } : null
      };
    });

    return formattedInstallations;
  } catch (error) {
    console.error('Error in fetchInstallations:', error);
    throw new Parse.Error(Parse.Error.INTERNAL_SERVER_ERROR, 'An error occurred while fetching installations.');
  }
});

/* Parse.Cloud.beforeSave("Picture", async (request) => {
  
  const picture = request.object;
  const photoFile = picture.get("file");
  const imageUrl = photoFile.url();

  if (picture.isNew() && config.oa_enabled() == true) {
      try {
          const description = await openAiUtils.checkImage(imageUrl);

          if (openAiUtils.isAdultContent(description)) {
              const errorDesc = description + ' Not allowed';
              console.info("Picture Upload: ", errorDesc);
              throw new Parse.Error(Parse.Error.VALIDATION_ERROR, errorDesc);
          } else if (openAiUtils.isFaceNotDetected(description)) {
              const errorDesc = 'Face not detected';
              console.info("Picture Upload: ", errorDesc);
              throw new Parse.Error(Parse.Error.VALIDATION_ERROR, errorDesc);
          } else if (openAiUtils.isPending(description)) {
              console.info("Picture Upload: ", description);
              picture.set("fileStatus", "pending");
              await picture.save();
          } else if (openAiUtils.isGood(description)) {
              console.info("Picture Upload: Good image");
          }
      } catch (error) {
          console.error("Error in beforeSave: ", error);
          throw new Parse.Error(Parse.Error.SCRIPT_FAILED, "Image validation failed");
      }
  }
}); */