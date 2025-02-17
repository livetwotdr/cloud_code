const express = require('express');
const app = express();
const bodyParser = require("body-parser");

var webhook_stream = require('../webhook/webhook_stream');

///////// Webhook ///////
webhook_stream.setupStreamWebHooks(app, bodyParser);

module.exports = app;