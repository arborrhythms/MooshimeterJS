var utils = require('./utils.js');
print      = utils.print;

METER_SERVICE      = "1BC5FFA0-0200-62AB-E411-F254E005DBD4";
METER_SERIN        = "1BC5FFA1-0200-62AB-E411-F254E005DBD4";
METER_SEROUT       = "1BC5FFA2-0200-62AB-E411-F254E005DBD4"; 

OAD_SERVICE_UUID   = "1BC5FFC0-0200-62AB-E411-F254E005DBD4";
OAD_IMAGE_IDENTIFY = "1BC5FFC1-0200-62AB-E411-F254E005DBD4";
OAD_IMAGE_BLOCK    = "1BC5FFC2-0200-62AB-E411-F254E005DBD4";
OAD_REBOOT         = "1BC5FFC3-0200-62AB-E411-F254E005DBD4";

function MeterSerializer(p, meter, callback) {
    this.P         = p;
    this.meter     = meter;
    this.reader    = null;
    this.writer    = null;
    this.desc      = null;

    this.P.connect(connectCB.bind(this));

    function connectCB(err) {
        this.P.writeHandle(0x2902,new Buffer([0x01, 0x00]),true, discover.bind(this) );
        function discover(err) {
            console.log('BLE: '+err);
            this.P.discoverServices(null, serviceCB.bind(this));
        }
    }
    function serviceCB(err, services) {
        for(var i in services) {
            var service = services[i];
            if(service.uuid.toUpperCase()==METER_SERVICE.replace(/-/g,""))
                service.discoverCharacteristics(null, charCB.bind(this));
        }
    }
    function charCB(err, characteristics) {
        for(var i in characteristics) {
            var char = characteristics[i];
            if(char.uuid.toUpperCase()==METER_SERIN.replace(/-/g,"")) {
                this.writer = char;
            }
            else if(char.uuid.toUpperCase()==METER_SEROUT.replace(/-/g,"")) {
                this.reader = char;
                this.reader.on('data', this.onData.bind(this));
                this.reader.subscribe();
                //this.reader.read();
                //this.P.writeHandle('2902',new Buffer([0x03, 0x00]),false, function(err){} );
                //this.reader.notify(true, this.onNotify.bind(this));
            }
            else if(char.uuid.toUpperCase()==OAD_SERVICE_UUID.replace(/-/g,"")) {
                this.notify = char;
            }
            else {
            }
        }
        this.reader.discoverDescriptors(descCB.bind(this));
        callback();
    }
    function descCB(err, descriptors) {
        for(var i in descriptors) {
            var desc = descriptors[i];
            if(desc.uuid=="2902") {
                this.desc = desc;
                //this.desc.on('data', this.onDescData.bind(this));
                //this.reader.subscribe(this.subscribe.bind(this));
            }
        }
    }
}

MeterSerializer.prototype.handleError = function(err) {
    if(err) {
        print("Error: "+err);
    }
}

MeterSerializer.prototype.disconnect = function() {
    this.P.disconnect();
    this.P = {};
}
MeterSerializer.prototype.write = function(bytes) {
    this.writer.write(new Buffer(bytes), false);
}

MeterSerializer.prototype.onNotify = function(err) {
    //if(this.desc)
    //this.reader.readValue(this.meter.readFromMeter.bind(this));
}
MeterSerializer.prototype.onData = function(data, isNotification) {
    this.meter.readFromMeter(null,data);
}
/*
MeterSerializer.prototype.onDescData = function(data, isNotification) {
    //print(".\n");
    if(isNotification) {
        if(this.desc)
            this.desc.readValue(this.meter.readFromMeter.bind(this));
    }
}
*/
module.exports = MeterSerializer;
