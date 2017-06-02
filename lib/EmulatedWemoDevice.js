var Soap = require('./Soap.js');

var Server = require('node-ssdp').Server;
var needle = require('needle');
var parseXmlString = require('xml2js').parseString;
var events = require("events");
var url = require('url');
var http = require('http');

var EmulatedWemoDevice = function(devOpts) {
	var self = this;
	events.EventEmitter.call(this);

	if (!devOpts) {
		devOpts = {};
	}

	self.server = false;

	self.friendlyName = devOpts.friendlyName;
	self.deviceType = devOpts.deviceType;

	function makeDiscoverable(callback) {
		if (self.server) {
			// Already discoverable
			return;
		}

		self.server = new Server();

    self.server.addUSN('upnp:rootdevice');
    self.server.addUSN('urn:schemas-upnp-org:device:MediaServer:1');
	}
}

EmulatedWemoDevice.prototype.__proto__ = events.EventEmitter.prototype;


module.exports = EmulatedWemoDevice;


var opts = {
	friendlyName: 'Penis Pump',
	deviceType: 'insightSwitch'
};

var dev = new EmulatedWemoDevice(opts); 

dev.makeDiscoverable();
