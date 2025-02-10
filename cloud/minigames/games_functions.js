const config = require("../config");
const getServerURL = require("../lib/game_token");
const GenerateUASignature = require("../lib/game_token");
const generateToken04 = require("../lib/get_token_04");
const request = require('request');


Parse.Cloud.define("game_token", async request => { 

    const seconds = request.params.seconds;
    const userId = request.params.userId;
    const effectiveTimeInSeconds = seconds || 3600;
    const payload = '';

    return generateToken04(+config.zc_id, userId, config.zc_secret.toString(), effectiveTimeInSeconds, payload);

 });

 Parse.Cloud.define("get_game_launch_code", async request => { 

    const roomId = request.params.roomId;
    const gameId = request.params.gameId;
    const anchorId = request.params.anchorId;
    const username = request.params.username;
    const avatarUrl = request.params.avatarUrl;
    const sex = request.params.sex;
    
    const data = await requestServer(
        {
            RoomId: roomId,
            MiniGameId: gameId,
            AnchorId: anchorId,
            Nickname: username,
            Avatar: avatarUrl,
            Sex: +sex,
        },
        getServerURL('DescribeGameLaunchCode', config.zc_id),
    );

    return data;

 });

 Parse.Cloud.define("get_order_info", async request => { 

    const AppId = +config.zc_id;
    const OrderId = +request.params.orderId;
    const OutOrderId = request.params.outOrderId;
    const UserId = request.params.userId;

    const data = await requestServer(
        {
            UserId,
            OrderId,
            OutOrderId,
        },
        getServerURL('DescribeOrderInfo', AppId),
    );

    return data;

 });

 Parse.Cloud.define("get_user_currency", async request => { 
    
    const AppId = +config.zc_id;
    
    const userId = request.params.userId;
    const gameId = request.params.gameId;

    const data = await requestServer({
            UserId: userId,
            MiniGameId: gameId,
            AppId,
        },
        getServerURL('DescribeUserCurrency', AppId),
    );

    return data;

 });

 Parse.Cloud.define("exchange_user_currency", async request => { 
    
    const AppId = +config.zc_id;
    const userId = request.params.userId;
    const gameId = request.params.gameId;
    const currencyDiff = request.params.currencyDiff;

    const OutOrderId = request.params.outOrderId || `out-order-id:${Date.now()}`;
    const data = await requestServer(
        {
            CurrencyDiff: currencyDiff, // Change gold coins, positive numbers increase, negative numbers decrease
            UserId: userId,
            MiniGameId: gameId,
            OutOrderId,
        },
        getServerURL('ExchangeUserCurrency', AppId),
    );

    return data;

 });

 Parse.Cloud.define("report_game_info", async request => { 

    const AppId = +config.zc_id;

    const Timestamp = +request.params.timestamp;
    const Signature = request.params.signature;

    const checkSignature = GenerateUASignature(AppId, config.zc_secret, Timestamp, Signature).Signature;
    console.log('checkSignature', checkSignature);

    return {Code: 0, Message: 'success'};

 });

 const requestServer = (data, host = config.zc_host) => {
    console.log(data);
    return new Promise((resolve, reject) => {
        request(
            {
                url: host,
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify(data),
            },
            function (error, response, body) {
                console.log('error', error);
                console.log('response', response);
                console.log('body', body);
                if (!error && response.statusCode == 200) {
                    resolve(body);
                } else {
                    reject(error);
                    throw new Error(error);
                }
            },
        );
    });
};