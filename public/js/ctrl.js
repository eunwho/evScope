
//--- start the client application
const I_SENS_VALUE = 1000.0;

// const NO_SCOPE_DATA = 400;

var noVac = 1;
var socket = io.connect();
var messages = 0;

const dataLength = 500;
var graphCount = 0;
var graphData = new Array();

graphData[0] = { channel:0,length:dataLength,sample:[dataLength]};
graphData[1] = { channel:1,length:dataLength,sample:[dataLength]};
graphData[2] = { channel:2,length:dataLength,sample:[dataLength]};
graphData[3] = { channel:3,length:dataLength,sample:[dataLength]};
graphData[4] = { channel:4,length:dataLength,sample:[dataLength]};
graphData[5] = { channel:5,length:dataLength,sample:[dataLength]};


function graphClear(){
   for( var j = 0 ; j < 6 ; j++){
      for( var i = 0 ; i < 499 ; i++ ) graphData[j].sample[i] = 2048;
   }
   graphCount = 0;
   graphInverter.onPaint(graphData);
}

var gaugeI1000 ={id:'gauge1',unit:'[A]',title:'I_ac',min:0,max:1000,
mTick:[0,250,500,750,1000],
alarm:'[ {"from": 0, "to":500.0,"color": "rgba(255,255,255,1.0)"},{"from": 500.0,  "to":750.0, "color": "rgba(255,0,0,.3)"},{"from": 750.0,  "to":1000.0, "color": "rgba(255,0,0,1.0)"}]'
}

var gaugeI500={id:'gauge1',unit:'[A]',title:'I_ac',min:0,max:500,
mTick:[0,100,200,300,400,500],
alarm:'[ {"from": 0, "to":300.0,"color": "rgba(255,255,255,1.0)"},{"from": 300.0,  "to":400.0, "color": "rgba(255,0,0,.3)"},{"from": 400.0,  "to":500.0, "color": "rgba(255,0,0,1.0)"}]'
}

var gaugeI100={id:'gauge1',unit:'[A]',title:'I_ac',min:0,max:100,
mTick:[0,25,50,75,100],
alarm:'[ {"from": 0, "to":50.0,"color": "rgba(255,255,255,1.0)"},{"from": 50.0,  "to":75.0, "color": "rgba(255,0,0,.3)"},{"from": 75.0,  "to":100.0, "color": "rgba(255,0,0,1.0)"}]'
}

var gaugeI50={id:'gauge1',unit:'[A]',title:'I_ac',min:0,max:50,
mTick:[0,10,20,30,40,50],
alarm:'[ {"from": 0, "to":30.0,"color": "rgba(255,255,255,1.0)"},{"from": 30.0,  "to":40.0, "color": "rgba(255,0,0,.3)"},{"from": 40.0,  "to":50.0, "color": "rgba(255,0,0,1.0)"}]'
}

var gaugeI10={id:'gauge1',unit:'[A]',title:'I_ac',min:0,max:10.0,
mTick:[0,2.5,5.0,7.5,10.0],
alarm:'[ {"from": 0, "to":5.0,"color": "rgba(255,255,255,1.0)"},{"from": 5.0,  "to":7.5, "color": "rgba(255,0,0,.3)"},{"from": 7.5,"to":10.0, "color": "rgba(255,0,0,1.0)"}]'
}

var gaugePower={id:'gauge2',unit:'[kW]',title:'Power',min:0,max:20,
mTick:[0,5,10,15,20],
alarm:'[ {"from": 0, "to":10,"color": "rgba(255,255,0,5.0)"},{"from": 10,  "to":15, "color": "rgba(255,0,0,.3)"},{"from": 15,  "to":20, "color": "rgba(255,0,0,1.0)"}]'
}

function gaugeInit(arg){
   var a = 'canvas[id=' + arg.id + ']';

   $(a).attr('data-units',arg.unit);
   $(a).attr('data-title',arg.title);
   $(a).attr('data-min-value',arg.min);
   $(a).attr('data-max-value',arg.max);
   $(a).attr('data-major-ticks',arg.mTick);
   $(a).attr('data-stroke-ticks',true);
   $(a).attr('data-highlights',arg.alarm);
}

$("document").ready(function() {

   graphInverter.init();

   gaugeInit(gaugeI500);
   gaugeInit(gaugePower);

});

function btnStartGraph(){

   graphClear();
   socket.emit('graph',1);
}

function btnStopGraph(){
   // onOff = 0 --> stop send grpah data 
   socket.emit('graph',0);
}

function btnRunMotor(){
   cmd = '9:4:905:0.000e+0';  // sciCmdStart
   socket.emit('codeEdit',cmd);
}

function btnStopMotor(){
   msgTx.selVac = 1;
   socket.emit('btnClick',msgTx);
   cmd = '9:4:905:1.000e+0';  // sciCmdStop
   socket.emit('codeEdit',cmd);
}

function btnSpeedUp(){
   cmd = '9:4:905:2.000e+0';  // sciCmdStart
   socket.emit('codeEdit',cmd);
}

function btnSpeedUp1(){
   cmd = '9:4:905:4.000e+0';  // sciCmdStart
   socket.emit('codeEdit',cmd);
}

function btnSpeedDown(){
   cmd = '9:4:905:3.000e+0';  // sciCmdStart
   socket.emit('codeEdit',cmd);
}

function btnShutDown(){
   msgTx.selVac = 6;
   socket.emit('btnClick',msgTx);
}

function btnRestart(){
   msgTx.selVac = 7;
   socket.emit('btnClick',msgTx);
}

function btnTripReset(){
   cmd = '9:4:902:5.000e+0';  // RESET
   socket.emit('codeEdit',cmd);
}


var msgTx = { selVac: 0};
var traceOnOff = 0;
var monitorOnOff = 0;


// '9:4:901:0.000e+0'
function getSciCmd( ){

   var returns = 'Invalid number';
   var tmp1 = document.getElementById('txtCodeEdit1').value;
   var tmp2 = document.getElementById('txtCodeEdit2').value;

   tmp1 = tmp1 * 1;
   tmp2 = tmp2 * 1;

   if(isNaN(tmp1)) return returns;
   if(isNaN(tmp2)) return returns;
   if(( tmp1 > 990 ) || ( tmp1 < 0 )) return returns;

   var sciCmd = '9:4:';
   if(tmp1 < 10){
      sciCmd = sciCmd + '00';
   } else if ( tmp1 < 100 ){ 
      sciCmd = sciCmd + '0';
   }

   sciCmd = sciCmd + tmp1 + ':';

   var codeData = tmp2.toExponential(3);
   
   sciCmd = sciCmd + codeData;

   if((sciCmd.length) != 16) return returns;

   return sciCmd;
}

function btnReadCode(){ 
   var returns = getSciCmd( );

   //console.log(returns);

   if( returns.length == 16 ){
      socket.emit('codeEdit',returns);
   } else {
      document.getElementById('codeEditResult').innerHTML = returns;
   }   
}

function btnWriteCode(){
   var returns = getSciCmd( );

   if( returns.length == 16 ){
      var test = returns.replace('4','6');
      socket.emit('codeEdit',test);
   } else {
      document.getElementById('codeEditResult').innerHTML = returns;
   }   
}

function btnOptionSendCmd(){
   var selector = document.getElementById("idCmdSelect");
   var value = selector[selector.selectedIndex].value;
   var cmd = '9:4:902:5.000e+0';

   if(value == 0 ){
      cmd = '9:4:910:0.000e+0';  // read adc
      socket.emit('codeEdit',cmd);
   } else if(value == 1) { 
      cmd = '9:4:909:0.000e+0';  // read Iout and 
      socket.emit('codeEdit',cmd);
   } else if(value == 2) {          // READ ALL CODE
      cmd = '9:4:901:0.000e+0';  
      socket.emit('codeEdit',cmd);
   } else if(value == 3) { 
      cmd = '9:4:908:0.000e+1';  // read INput state and pwm trip
      socket.emit('codeEdit',cmd);
   } else if(value == 4) { 
      cmd = '9:4:900:1.000e+1';  // read trip record
      socket.emit('codeEdit',cmd);
   }
}


 // =============================================
  // canvas mouse event for cursor drag
  // =============================================

socket.on('disconnect',function() {
  console.log('disconnected');
});

socket.on('message',function(msg){
	var tmp = document.getElementById('codeEditResult');
   tmp.value = tmp;
});   

socket.on('codeList', function (msg) {
	var tmp = document.getElementById('txtCodeTable');

   var msg1 = msg.substr(17);          // subtract uart command '9:6:900:5.000e+1:'
   var testIn = msg1.toString();
   var testIn1 = testIn.replace(/:/g,'\r\n');
   var testOut = testIn1.replace(/,/g,'\t');
   tmp.value = testOut;
});

socket.on('trace', function (msg) {

   console.log(msg);
  // oscope.onPaint(trace);

});


// power scale 10k, 50k, 100k 500k

socket.on('graph', function (msg) {
 
   graphCount = ( graphCount < 499 ) ? graphCount + 1 : 0 ;

   graphData[0].sample[graphCount] = msg.Graph1;
   graphData[1].sample[graphCount] = msg.Graph2; 
   graphData[2].sample[graphCount] = msg.Graph3; 
   graphData[3].sample[graphCount] = msg.Graph4;
   graphData[4].sample[graphCount] = msg.Graph5; 
   graphData[5].sample[graphCount] = msg.Graph6; 
   graphInverter.onPaint(graphData);

   var I_rms =   ((msg.Graph5 -2048)/ 2048) * 1000;
   var Power =   ((msg.Graph6 -2048)/ 2048) * 20;

	
   $('#gauge1').attr('data-value', I_rms);
   $('#gauge2').attr('data-value', Power);
});
//--- end of ctrl.js
