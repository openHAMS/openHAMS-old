var app = require('express')();
var StatsD = require('hot-shots');
var http = require('http');
var server = http.Server(app);
var io = require('socket.io')(server);
var serialport = require('serialport');
var qs = require('qs');
var request = require('request');

var jsonContent;
var portName = '/dev/ttyACM0';
if(process.argv.length > 2)
    portName = process.argv[2];

var sp = serialport.SerialPort;
var ardu = new sp(portName, 
{
    baudRate:9600, 
    parser:serialport.parsers.readline("\r\n")
});
var client = new StatsD(
{
    "telegraf": "true"
});


var pingUrl = "http://ipecho.net/plain";
var defUrl = "http://racerzeroone.ddns.net/";
var queryParams =
{
	u: 'public',
	p: 'public',
	db: 'mydb',
	epoch: 'ms',
	q: 'SELECT time,value FROM temp'
};

client.socket.on('error', function(error)
{
    console.error("Error in socket: ", error);
});



app.get('/query', function(req, res)
{
	request(
	{
		method:'GET',
		uri: 'http://localhost:8086/query?',
		qs: queryParams,
		json: 'true'
	}, 
	function(error, response, body)
	{
		if (!error && response.statusCode == 200)
		{
			res.json(body);
		}
	});
	//res.json("{\"results\": [{\"series\": [{\"name\": \"temp\",\"columns\": [\"time\",\"value\"],\"values\": [[1466536248710,27],[1466536259142,26.9],[1466645576000,27],[1466645606000,27],[1466645636000,27],[1466645666000,27]]}]}]}");
});




app.get('/', function(req, res)
{
    res.sendFile(__dirname + '/index.html');
});

ardu.on('open', function() { console.log("open"); });

ardu.on('data', function(data)
{
    try
    {
        var jsonData = JSON.parse(data);
        io.sockets.emit('temp', jsonData.temp);
        io.sockets.emit('atm', jsonData.atm);
		client.gauge('temp', jsonData.temp);
		client.gauge('atm', jsonData.atm);

    }catch(e)
    {
        console.log('json error: ' + e);
    }
});

http.get(pingUrl, function (res)
{
    res.on("data", function (data)
    {
		console.log("================================================================================");
        console.log("    " + "ip:  " + data + ":8081");
		console.log("    " + "url: " + defUrl);
		console.log("================================================================================");
    }).setEncoding("utf8");
});

server.listen(8081, function()
{
    console.log('listening');
});
