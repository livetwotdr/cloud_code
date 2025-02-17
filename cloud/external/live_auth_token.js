/**
 * Generating basic authentication token.
 * 
 {  
	"room_id": "roomid", // Room ID, restricts users to log in to specific rooms. If it is empty, there is no restriction.   
	"privilege": {  
		"1": 1,   // Whether to allow login to the room. 1 for allow and 0 for close.      
		"2": 1   // Whether to allow streaming. 1 for allow and 0 for close.     
	},    
	"stream_id_list": ["s123"] // Stream ID array. Restricts users to push specified streams. If stream_id_list is empty, there is no restriction.    
 }  
 */

const config = require('../config');
const { generateToken04 } = require('../lib/get_token_04');

const appID = +config.zc_id; // type: number
const serverSecret = config.zc_secret;// type: 32 byte length string

function generateBasicToken(userId) {

    const effectiveTimeInSeconds = 3600; //type: number; unit: s; expiration time of token, in seconds.

    // When generating a basic authentication token, the payload should be set to an empty string.
    const payload = '';
    // Build token 
    const token = generateToken04(appID, userId, serverSecret, effectiveTimeInSeconds, payload);
    console.info(`Zegocloud: ${userId}, auth token generated: `, token);

    return token;

}

function generateRoomLoginToken(userId, roomId) {

    const effectiveTimeInSeconds = 3600; //type: number; unit: s； token expiration time, unit: seconds
    const payloadObject = {
        room_id: roomId, // Please modify to the user's roomID
        // The token generated in this example allows loginRoom.
        // The token generated in this example does not allow publishStream.
        privilege: {
            1: 1,   // loginRoom: 1 pass , 0 not pass
            2: 0    // publishStream: 1 pass , 0 not pass
        },
        stream_id_list: null
    }; // 
    const payload = JSON.stringify(payloadObject);
    // Build token 
    const token = generateToken04(appID, userId, serverSecret, effectiveTimeInSeconds, payload);

    console.info(`Zegocloud: ${userId}, Room login ${userId} token generated: `, token);

    return token;

}

function generatePublishStreamToken(userId, stream_ids) {

    const effectiveTimeInSeconds = 3600; //type: number; unit: s； token expiration time, unit: seconds
    const payloadObject = {
        room_id: null, // Please modify to the user's roomID
        // The token generated in this example allows loginRoom.
        // The token generated in this example allows publishStream.
        privilege: {
            1: 0,   // loginRoom: 1 pass , 0 not pass
            2: 1    // publishStream: 1 pass , 0 not pass
        },
        stream_id_list: stream_ids
    }; // 
    const payload = JSON.stringify(payloadObject);
    // Build token 
    const token = generateToken04(appID, userId, serverSecret, effectiveTimeInSeconds, payload);

    console.info(`Zegocloud: ${userId}, Publish Stream token generated: `, token);

    return token;

}

function generatePublishAndRoomLoginToken(userId, roomId, stream_ids) {

    const effectiveTimeInSeconds = 3600; //type: number; unit: s； token expiration time, unit: seconds
    const payloadObject = {
        room_id: roomId, // Please modify to the user's roomID
        // The token generated here allows loginRoom.
        // The token generated here allows publishStream.
        privilege: {
            1: 1,   // loginRoom: 1 pass , 0 not pass
            2: 1    // publishStream: 1 pass , 0 not pass
        },
        stream_id_list: stream_ids
    }; // 
    const payload = JSON.stringify(payloadObject);
    // Build token 
    const token = generateToken04(appID, userId, serverSecret, effectiveTimeInSeconds, payload);

    console.info(`Zegocloud: ${userId}, Stream and Room token generated: `, token);

    return token;

}

module.exports = {
    generateBasicToken,
    generateRoomLoginToken,
    generatePublishStreamToken,
    generatePublishAndRoomLoginToken,
};