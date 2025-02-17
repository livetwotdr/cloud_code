const crypto = require('crypto');
const config = require('../config');


function GenerateUASignature(appId, serverSecret, stamp, signature) {
    const Timestamp = stamp || Math.round(Date.now() / 1000);
    const SignatureNonce = signature || crypto.randomBytes(8).toString('hex');
    const hash = crypto.createHash('md5');
    const str = appId + SignatureNonce + serverSecret + Timestamp;
    hash.update(str);
    return { SignatureNonce, Timestamp, Signature: hash.digest('hex') };
}

function getServerURL(Action, AppId, SignatureVersion = '2.0') {
    const checkKeys = GenerateUASignature(AppId, config.zc_secret);
    const url = `${config.zc_host}?Action=${Action}&AppId=${AppId}&SignatureNonce=${checkKeys.SignatureNonce}&Timestamp=${checkKeys.Timestamp}&Signature=${checkKeys.Signature}&SignatureVersion=${SignatureVersion}`;
    console.warn(url);
    return url;
}

module.exports = GenerateUASignature;
module.exports = getServerURL;
