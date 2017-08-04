'use strict';
const path = require('path');

const express = require('express');
const app = express();
const favicon = require('serve-favicon');
const http = require('http');
const pug = require('pug');

const jsonfile = require('jsonfile')
const server = http.Server(app);
const io = require('socket.io')(server);

const routegen = require('./route-generator.js');

const Mqtt = require('mqtt');
const mqtt = Mqtt.connect('mqtt://127.0.0.1:1883');

const DB = require('./db.js');
const db = new DB('127.0.0.1', 'sensors');


// var ledColor = '#00000000';
const subscribeList = [
    'home/rcr/sensors/bmp180/pressure',
    'home/rcr/sensors/bmp180/temperature'
];

const config = jsonfile.readFileSync('config.json', 'utf8');


mqtt.on('connect', function() {
    console.log('mqtt conn:');
    subscribeList.forEach(s => {
        console.log(`    ${s}`);
        mqtt.subscribe(s);
    });
});

mqtt.on('message', function(topic, message) {
    io.sockets.emit(topic, message.toString());
});


app.use(express.static('public'));
app.use('/static', express.static('public'));
app.use(favicon(path.join(__dirname, '/public/icons/favicon.ico')));

app.set('view engine', 'pug');

app.get('/', function(req, res) {
    res.render('index', config);
});

app.use('/api/cards', routegen.CardRouter(config, db));


var PING_URL = 'http://ipecho.net/plain';
var OWN_URL = 'http://racerzeroone.duckdns.org/';
http.get(PING_URL, function(res) {
    res.on('data', function(data) {
        console.log('================================================================================');
        console.log(`    ip:  ${data}:8081`);
        console.log(`    url: ${OWN_URL}`);
        console.log('================================================================================');
    }).setEncoding('utf8');
});


server.listen(8081, function() {
    console.log('listening');
});
