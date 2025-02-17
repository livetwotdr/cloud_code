const live = require("../live/live_streaming_functions");

function setupStreamWebHooks(app, bodyParser) {

    app.use(bodyParser.json());

    app.post('/zegocalls', (req, res) => {
       
        if(req.body.event === "stream_create"){

            console.info('stream_create, RoomId: ' + req.body.room_id + ", UserId: " + req.body.user_id + ", Time: " + req.body.create_time);

            live.streamCreated(req.body, res);
            
        } else if(req.body.event === "stream_close"){
            
            console.info('stream_close, RoomId: ' + req.body.room_id + ", UserId: " + req.body.user_id + ", Time: " + req.body.timestamp);

            live.streamClosed(req.body, res);

        } else if(req.body.event === "room_login"){
            
            console.info('room_login, RoomId: ' + req.body.room_id + ", UserId: " + req.body.user_account + ", Time: " + req.body.login_time);

            live.roomLogin(req.body, res);

        } else if(req.body.event === "room_logout"){
            
            console.info('room_logout, RoomId: ' + req.body.room_id + ", UserId: " + req.body.user_account + ", Time: " + req.body.logout_time);

            live.roomLogout(req.body, res);
        }
      });

}

module.exports = {
    setupStreamWebHooks,
};