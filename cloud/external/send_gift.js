//const commonFilter = require("../lib/filter");
const GenerateUASignature = require("../lib/zego_auth");
const axios = require("axios");
const crypto = require("crypto");
const config = require("../config");

async function sendGift(
    room_id,
    user_id,
    user_name,
    gift_type,
    gift_count,
    timestamp) {
  // Apply common filter
  //await commonFilter(req, resp);

  // Logging request body and query parameters
  //console.info(req.body, req.query);

  // Generate signature nonce
  const signatureNonce = crypto.randomBytes(8).toString("hex");
  const serverTimeStamp = Math.round(Date.now() / 1000);

  // Ensure app_id is a number
  const appId = Number(config.zc_id);
  
  // Generate signature
  const signature = GenerateUASignature(
    appId,
    signatureNonce,
    config.zc_secret,
    serverTimeStamp
  );

  // Construct API URL
  const url = `https://zim-api.zego.im/?Action=SendRoomMessage&AppId=${appId}&Timestamp=${serverTimeStamp}&Signature=${signature}&SignatureVersion=2.0&SignatureNonce=${signatureNonce}`;

  // Construct message payload
  const Message = JSON.stringify({
    room_id, // Room ID
    user_id, // The user ID of the sender
    user_name, // The user name of the sender
    gift_type, // Gift type
    gift_count, // Number of gifts
    timestamp,
  });

  // Construct form data for the API request
  const formData = {
    FromUserId: user_id,
    RoomId: room_id,
    MessageType: 2,
    Priority: 3,
    MessageBody: { Message },
  };

  try {
    // Send request to Zego API
    const result = await axios.post(url, formData);
    console.info("Zego Gift sent:", JSON.stringify(result.data, null, 2));
    return result.data;
  } catch (error) {
    // Handle request error
    console.error("Zego Gift", error);
    return error;
  }
}

module.exports = sendGift;
