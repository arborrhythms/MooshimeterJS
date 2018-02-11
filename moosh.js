var noble           = require('noble');
var Mooshimeter     = require('./mooshimeter.js');
var utils           = require('./mooshiUtils.js');
var MeterSerializer = utils.MeterSerializer;


noble.on('stateChange', stateChange);
//stateChange("poweredOn");

var scanning = false;
function stateChange(state) {
    console.log("State: " + state);
    if (state === 'poweredOn') {
        noble.on('discover', discover);
        var serviceUUIDs = []; // default: [] => all
        //var serviceUUIDs = [moo.METER_SERVICE];
        try {
            scanning = true;
            console.log("Starting...");
            noble.startScanning(serviceUUIDs);
        }
        catch(err) {
        }
        setTimeout(stopScan, 4000);
    } 
    else {
        //stopScan();
    }
}

function stopScan() {
    if(scanning) {
        console.log("Stopping scan");
        noble.stopScanning();
    }
    scanning = false;
}

function discover(p) {
    var m=null, serializer=null;
    console.log("Found device: " + p.advertisement.localName);
    if(Mooshimeter.isMooshimeter(p)) {
        console.log("Found mooshimeter: " + p.advertisement.localName);
        stopScan();
        m = new Mooshimeter();
        serializer = new MeterSerializer(p, m, connect.bind(this));        
    }
    else {
        console.log("Found device: " + p.advertisement.localName);
    }    
    function connect() {
        m.connect(serializer, run.bind(this,m));
    }
}

function run(m) {
    m.sendCommand('sampling:rate 0');       // Rate 125Hz
    m.sendCommand('sampling:depth 2');      // Depth 256
    m.sendCommand('ch1:mapping 1');         // CH1 select current input
    m.sendCommand('ch1:range_i 0');         // CH1 10A range
    m.sendCommand('ch2:mapping 1');         // CH2 select voltage input
    m.sendCommand('ch2:range_i 1');         // CH2 Voltage 600V range
    m.sendCommand('sampling:trigger 2');    // Trigger continuous

    m.attachCallback('ch1:value', printCH1Value);
    m.attachCallback('ch2:value', printCH2Value);

    setInterval(periodic.bind(this,m), 4000);
}

function periodic(m) {
    m.sendCommand('pcb_version');
}

function exit(m) {
    console.log("Disconnecting...");
    m.disconnect();
}
function printCH1Value(m,val) {
    console.log("CH1: " + val);
}
function printCH2Value(m,val) {
    console.log("CH2: " + val);
}