const crypto = require("crypto");

//Signature=md5(AppId + SignatureNonce + ServerSecret + Timestamp)
function GenerateUASignature(appId, signatureNonce, serverSecret, timeStamp) {
  const hash = crypto.createHash("md5"); // Specifies the use of the MD5 algorithm in the hash algorithm
  var str = appId + signatureNonce + serverSecret + timeStamp;
  hash.update(str);
  // hash.digest('hex') indicates that the output format is hexadecimal
  return hash.digest("hex");
}

module.exports = GenerateUASignature;