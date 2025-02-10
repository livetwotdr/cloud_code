//////// Send push notifications ///////

const sendOneSignalPush = require("./send_push");


Parse.Cloud.define("sendPush", async (request) => {

  var tarketsIds;

  var type = request.params.type;
  var senderId = request.params.senderId;
  var senderName = request.params.senderName;
  var avatar = request.params.avatar;
  var postImage = request.params.postImage;
  var message = request.params.message;
  var receiverId = request.params.receiverId;
  var postType = request.params.postType;

  if(type === "live"){
    tarketsIds = request.params.followers;

  } else if(type === "mention"){
    tarketsIds = request.params.mentions;

  } else {
    tarketsIds = [receiverId];
  }

  const data = {
    type: type,
    sender_id: senderId,
    receiver_id: tarketsIds,
    sender_name: senderName,
    message: message,
    avatar_url: avatar,
    post_image_url: postImage,
    post_type: postType,
    object_id: request.params.objectId,
  }

  return await sendOneSignalPush(type, data, tarketsIds);

  });