//"use strict";
// $sudo dmesg | grep tty
const NO_SCOPE_DATA = 400;
var inveStart = 0;
var digiOut = 0xff;
var graphOnOff = 0;
var scopeOnOff = 0;

//--- start of digital inout routine

var exec = require('child_process').exec;

// Create shutdown function
function shutdown(callback){
    exec('shutdown now', function(error, stdout, stderr){ callback(stdout); });
}

const eventEmitter = require('events');
class MyEmitter extends eventEmitter{};
const myEmitter = new MyEmitter();

var express      = require('express');
var path         = require('path');
var favicon      = require('serve-favicon');
var logger       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var cons         = require('consolidate');

var routes    = require('./routes/index');
var users     = require('./routes/users');
var receiver  = require('./lib/receiver');
var debug     = require('debug')('ploty:server');
var portAddr  = process.env.PORT || '7532';

//--- create express application
var app = express();
app.set('port', portAddr);

//--- create server
var server = require('http').Server(app);

//--- connect socket.io to server
var io = require('socket.io')(server);

//--- view engine setup
app.engine('html',cons.swig);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


var count = 0;
var channel = 0;
var dataLength = 600;
var traceOnOff =0;			// 1 --> send tarace data to client
var monitorOnOff =0;			// 1 --> send tarace data to client
var codeEditOnOff =0;			// 1 --> send tarace data to client
var getCodeList = 0;

//--- start server
console.log('http on : ' + portAddr.toString());
server.listen(portAddr);

//--- socket.io support

io.on('connection', function (socket) {
	var host  = socket.client.request.headers.host;
	//console.log('connected to : ' + host);
	socket.on('disconnect', function () {
  	//console.log('disconnected from : ' + host);
  	});

	socket.on('graph',function(msg){
		graphOnOff = msg;
	});

	socket.on('scope',function(msg){
		//console.log('scoket on scope =',msg);
		//console.log(msg);
		scopeOnOff = msg;
	});

	socket.on('codeEdit',function(msg){
		console.log('scoket on codeEdit =',msg);
//		myPort.on('readable',()=>console.log('Rxd gavage : ',myPort.read()));
		// console.log("Read Gavage buf:",myPort.read());
		myPort.write(msg);
	});

	socket.on('getCodeList',function(msg){
		console.log('scoket on codeList =',msg);
		// myPort.on('readable',()=>console.log('Rxd gavage : ',myPort.read()));
		// console.log("Read Gavage buf:",myPort.read());
		myPort.write('9:4:901:0.000e+0');
	});

/* use io */
	socket.on('btnClick',function(msgTx){
		//console.log(msgTx.selVac);
		var digitalOut = 1;
		if( msgTx.selVac == 0){
			inveStart = 1;
			//digiOut = digiOut & 0xfe;
			//writeMcp23017(ADDR1,0,digiOut);
		}else if( msgTx.selVac == 1){
			inveStart = 0;
			digiOut = digiOut | 1;
		} else if( msgTx.selVac == 2){
			testOn = true;
		} else if( msgTx.selVac == 3){
			testOn = false;
		} else if( msgTx.selVac == 4){
			digiOut = digiOut | 4;			// clear ArmOff;
			digiOut = digiOut & 0xfd;
		} else if( msgTx.selVac == 5){
			digiOut = digiOut | 2;			// clear ArmOff;
			digiOut = digiOut & 0xfb;
		} else if( msgTx.selVac == 6){
			shutdown(function(output){ console.log(output); });
		} else if( msgTx.selVac == 7){ 
			gracefulShutdown();
		}
  });

	//--- emitt graph proc
	myEmitter.on('mMessage',function(data){
		socket.emit('message',data);
	});

	myEmitter.on('mCodeList',function(data){
		socket.emit('codeList',data);
	});

	myEmitter.on('mGraph',function(data){
		socket.emit('graph',data);
	});

	myEmitter.on('mScope',function(data){
		socket.emit('scope',data);
	});
});

var graphData = { rpm:0,Irms:0,Power:0,Ref:0,Vdc:0,Graph1:0,Graph2:0,Graph3:0,Graph4:0};
var scopeData = {Ch:0,data:[]};
var graphProcCount = 0;

const {SerialPort} = require('serialport');
//const { ReadlineParser } = require('@serialport/parser-readline');
const {InterByteTimeoutParser} = require('@serialport/parser-inter-byte-timeout');

SerialPort.list().then(
	ports => {
	  ports.forEach(port => {
	  if(port.manufacturer === "Silicon Labs"){
		portName = port.path;
		myPort = new SerialPort({
			path:portName, 
			baudRate:115200, 
			dataBits : 8,
			parity : 'none',
			stopBits: 1,
			flowControl: 'hardware'
		});
		//const parser = myPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));
		const parser = myPort.pipe(new InterByteTimeoutParser({ interval: 100}));
		// myPort.pipe(parser);
		myPort.on('open', 
			() => console.log('COM open : '+portName+':'+'baudRate='+myPort.baudRate
		));
//		myPort.on('data', (rxdata) => console.log(rxdata.toString('utf-8')));
		//myPort.on('data', readSerialData);
		parser.on('data', readSerialData);

		myPort.on('close', ()=>console.log("port closed!"));
		myPort.on('error', (err)=>console.log('Error :',err));
	  }
  
	  })
	},
	err => {
	  console.error('Error listing ports', err)
    }
);

function readSerialData(data) {

	var temp1 = 0;
	var temp2 = 0;
	var y =0;

	// console.log(data);

	var buff = new Buffer.from(data);
	var command_addr = parseInt(buff.slice(4,7));
	var command_data = parseFloat(buff.slice(8,16));

	console.log(data.toString('utf-8'));
	console.log('addr = '+command_addr + ' : data =' + command_data);


	if(( buff.length < 16 ) || ( command_addr !== 900 )){
		if( command_addr == 901 ){
			// myEmitter.emit('mCodeList', data);
			myEmitter.emit('mCodeList', data.toString('utf-8'));
			return;
		} else {
			myEmitter.emit('mMessage', data.toString('utf-8'));
			return;
		}
	}

	if ( command_data == 0 ) {
		// 9:4:900:0.000e+0:9�9�9�9�9�9�9�9�

		if(data.length !== 33 ) return ;
		var rx_data = data.slice(-16);
		var buff = new Buffer.from(rx_data,'utf8');

		//console.log(buff.toString('utf-8'));

		var i = 7;
		var msb = ( buff[i*2] & 0x0f) * 256;
		var lsb = (buff[ i*2 + 1] & 0x7f) * 1;
 		lsb = ( (buff[i * 2 ] & 0x40 ) === 0x00 ) ? lsb  : lsb + 128;
		graphData.Vdc = msb + lsb;
		// console.log(graphData.Vdc);

		i = 6;
		msb = ( buff[i*2] & 0x0f) * 256;
		lsb = (buff[ i*2 + 1] & 0x7f) * 1;
 		lsb = ( (buff[i * 2 ] & 0x40 ) === 0x00 ) ? lsb  : lsb + 124;
		graphData.Ref = msb + lsb;

		i = 5;
		msb = ( buff[i*2] & 0x0f) * 256;
		lsb = (buff[ i*2 + 1] & 0x7f) * 1;
 		lsb = ( (buff[i * 2 ] & 0x40 ) === 0x00 ) ? lsb  : lsb + 124;
		 graphData.rpm = msb + lsb;
		 graphData.Graph6 = msb + lsb;

		i = 4;
		msb = ( buff[i*2] & 0x0f) * 256;
		lsb = (buff[ i*2 + 1] & 0x7f) * 1;
 		lsb = ( (buff[i * 2 ] & 0x40 ) === 0x00 ) ? lsb  : lsb + 124;
		 graphData.Irms = msb + lsb;
		 graphData.Graph5 = msb + lsb;

		i = 3;  
		msb = ( buff[i*2] & 0x0f) * 256;
		lsb = (buff[ i*2 + 1] & 0x7f) * 1;
 		lsb = ( (buff[i * 2 ] & 0x40 ) === 0x00 ) ? lsb  : lsb + 124;
		graphData.Graph4 = msb + lsb;

		i = 2;  
		msb = ( buff[i*2] & 0x0f) * 256;
		lsb = (buff[ i*2 + 1] & 0x7f) * 1;
 		lsb = ( (buff[i * 2 ] & 0x40 ) === 0x00 ) ? lsb  : lsb + 124;
		graphData.Graph3 = msb + lsb;

		i = 1;  
		msb = ( buff[i*2] & 0x0f) * 256;
		lsb = (buff[ i*2 + 1] & 0x7f) * 1;
 		lsb = ( (buff[i * 2 ] & 0x40 ) === 0x00 ) ? lsb  : lsb + 124;
		graphData.Graph2 = msb + lsb;

		i = 0;  
		msb = ( buff[i*2] & 0x0f) * 256;
		lsb = (buff[ i*2 + 1] & 0x7f) * 1;
 		lsb = ( (buff[i * 2 ] & 0x40 ) === 0x00 ) ? lsb  : lsb + 124;
		graphData.Graph1= msb + lsb;

		myEmitter.emit('mGraph', graphData);
		return;

	} else if( command_data > 99 ) {
		var i, j, lsb, msb, tmp;
		var offset = 4;

   	var buff2 = data.substr(17);
   	var buff = new Buffer.from(buff2,'utf8');
		var scope = {Ch:0,data:[]};

		scope.Ch = buff[2];

  		for ( i = 0; i < NO_SCOPE_DATA ; i++){
  			lsb = (buff[ i*3 + 2 + offset] & 0x0f) * 1 + (buff[i*3 + 1 + offset] & 0x0f) * 16;
  			msb = ( buff[i*3 + offset ] & 0x0f ) * 256;
  			//tmp = msb + lsb - 2048;
  			tmp = msb + lsb;
			scope.data.push(tmp);
		}
		// console.log(scope.data);
		myEmitter.emit('mScope', scope);
		return;
	}
}
// });

function sleepFor( sleepDuration ){
    var now = new Date().getTime();
    while(new Date().getTime() < now + sleepDuration){ /* do nothing */ }
}

//--- time interval

setInterval(function(){
	if(graphOnOff == 1) myPort.write('9:4:900:0.000e-0'); // read graph
},1000);


setInterval(function() {
	if(scopeOnOff == 1)	  myPort.write('9:4:900:1.000e+2');
},4000);

setInterval(function(){
	var stamp = new Date().toLocaleString();
	console.log(stamp);
},10000);


//--- processing

var exec = require('child_process').exec;

function shutdown(callback){
	exec('shutdown now', function(error, stdout, stderr){ callback(stdout); });
}

var gracefulShutdown = function() {
  console.log("Received kill signal, shutting down gracefully.");
  server.close(function() {
    console.log("Closed out remaining connections.");
    process.exit()
  });

   setTimeout(function() {
       console.error("Could not close connections in time, forcefully shutting down");
       process.exit()
  }, 10*1000);
}

process.on('SIGTERM', function () {
    process.exit(0);
});

process.on('SIGINT', function () {
    process.exit(0);
});

process.on('exit', (code) => {
	setTimeout(()=>{
	  console.log('\nShutting down, performing GPIO cleanup');
 
	}, 0);
    // process.exit(0);
});

//--- end of scope
