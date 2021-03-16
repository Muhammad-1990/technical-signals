const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const WebSocket = require('websocket').w3cwebsocket;
const ws = new WebSocket('wss://iqoption.com/echo/websocket')



app.get('/', function (req, res) {
    res.sendFile('./index.html', { root: __dirname });
});

app.get('/client.js', function (req, res) {
    res.sendFile('./client.js', { root: __dirname });
});

//Whenever someone connects this gets executed
io.on('connection', function (socket) {
    console.log('new web connection');

    // io.sockets.emit("msg-from-server", mayarr)

    socket.on("msg-from-web", function (data) {
        console.log(data)
    });

    //Whenever someone disconnects this piece of code executed
    socket.on('disconnect', function () {
        console.log('disconnected');
    });
});

// io.sockets.emit("msg-from-server", "test msg from server")



ws.onopen = function(){
    ws.send(JSON.stringify({"name":"authenticate","request_id":"1615551073_535206317","msg":{"ssid":"36b5c314230df8e4f516707f502c81d8","protocol":3,"session_id":""}}))
    setTimeout(function(){
        ws.send(JSON.stringify(
            { 
                "name": "sendMessage", 
                "request_id": "830.60", 
                "msg": 
                { 
                    "name": "get-candles", 
                    "version": "2.0", 
                    "body": 
                    { 
                        "active_id": 830, 
                        "size": 60,
                        "only_closed": true 
                    } 
                } 
            }
        ))
    },1000)
    
}

ws.onmessage = function (event) {
    var incomingMessage = JSON.parse(event.data)
    if ((incomingMessage.name != 'heartbeat') && (incomingMessage.name != 'timeSync')){
        if (incomingMessage.name == 'candles') {
            setupArrayHistory(incomingMessage.request_id.split('.')[0],incomingMessage.request_id.split('.')[1],incomingMessage.msg.candles)
        }
        if (incomingMessage.name == 'candle-generated') {
            addUpdateCandle(incomingMessage.msg.active_id, incomingMessage.msg.size, incomingMessage)
        }
    }
}

ws.onerror = function (event) {
    var incomingMessage = JSON.parse(event)
        console.log(incomingMessage)
}

http.listen(3000, function () {
    console.log('listening on *:3000');
});


var rates =
{
    '830': {
        60:     { currentCandle: 0, candles:{ open:[], close:[], min:[], max:[], volume:[] }, indicators: { adx: null, EightEMA: null,ThirteenEMA: null, TwentyOneEMA: null}, predictions: [], signals: [] },
        300:    { candles:[] },
        900:    { candles:[] },
        3600:   { candles:[] },
    }
}
var currentID = {}

function setupArrayHistory(active_id, size, arr){
    rates[active_id][size].currentCandle = arr[arr.length - 1].id
    var tempArr = arr.slice(Math.max(arr.length - 100, 0))

    tempArr.forEach(element => {
        rates[active_id][size].candles.open.push(element.open)
        rates[active_id][size].candles.close.push(element.close)
        rates[active_id][size].candles.min.push(element.min)
        rates[active_id][size].candles.max.push(element.max)
        rates[active_id][size].candles.volume.push(element.volume)
    });



    ws.send(JSON.stringify(
        {
            "name": "subscribeMessage", "request_id": active_id + '.' + size,
            "msg":
            {
                "name": "candle-generated",
                "params":
                {
                    "routingFilters":
                    {
                        "active_id": active_id, "size": size
                    }
                }
            }
        }
    ))
}

function addUpdateCandle(active_id, size, incomingMessage){
            if(incomingMessage.msg.id != rates[active_id][size].currentCandle){
                rates[active_id][size].currentCandle = incomingMessage.msg.id
                rates[active_id][size].candles.open.push(incomingMessage.msg.open)
                rates[active_id][size].candles.close.push(incomingMessage.msg.close)
                rates[active_id][size].candles.min.push(incomingMessage.msg.min)
                rates[active_id][size].candles.max.push(incomingMessage.msg.max)
                rates[active_id][size].candles.volume.push(incomingMessage.msg.volume)

                rates[active_id][size].candles.open.shift();
                rates[active_id][size].candles.close.shift();
                rates[active_id][size].candles.min.shift();
                rates[active_id][size].candles.max.shift();
                rates[active_id][size].candles.volume.shift();
            }
            else {
                rates[active_id][size].candles.open[rates[active_id][size].candles.open.length -1] = incomingMessage.msg.open
                rates[active_id][size].candles.close[rates[active_id][size].candles.open.length -1] = incomingMessage.msg.close
                rates[active_id][size].candles.min[rates[active_id][size].candles.open.length -1]  = incomingMessage.msg.min
                rates[active_id][size].candles.max[rates[active_id][size].candles.open.length -1] = incomingMessage.msg.max
                rates[active_id][size].candles.volume[rates[active_id][size].candles.open.length -1] = incomingMessage.msg.volume
            }
            calcIndicators(active_id, size, rates[active_id][size])
}

function calcIndicators(active_id, size, arr){
    calcADX(active_id, size, arr)
    calcEightEMA(active_id, size, arr)
    calcThirteenEMA(active_id, size, arr)
    calcTwentyOneEMA(active_id, size, arr)
    io.sockets.emit("candle-generated", rates[active_id][size])
}

function calcADX(active_id, size, arr){
    const ADX = require('technicalindicators').ADX;
    var period = 14;
    var input = {
        close: arr.candles.close,
        high: arr.candles.max,
        low: arr.candles.min,
        period: period
      }
      rates[active_id][size].indicators.adx = ADX.calculate(input)
}

function calcEightEMA(active_id, size, arr){
    const EMA = require('technicalindicators').EMA
    let period = 8;
    let values = arr.candles.close;                    
    rates[active_id][size].indicators.EightEMA = EMA.calculate({period : period, values : values}) 
}

function calcThirteenEMA(active_id, size, arr){
    const EMA = require('technicalindicators').EMA
    let period = 13;
    let values = arr.candles.close;                    
    rates[active_id][size].indicators.ThirteenEMA = EMA.calculate({period : period, values : values}) 
}

function calcTwentyOneEMA(active_id, size, arr){
    const EMA = require('technicalindicators').EMA
    let period = 21;
    let values = arr.candles.close;                    
    rates[active_id][size].indicators.TwentyOneEMA = EMA.calculate({period : period, values : values}) 
}