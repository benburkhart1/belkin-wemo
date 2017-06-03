var Client = require('node-ssdp').Client;
var needle = require('needle');
var parseXmlString = require('xml2js').parseString;
var events = require("events");
var util = require('util');
var http = require('http');
var async = require('async');

var WemoDevice = require('./WemoDevice.js');

var BelkinWemo = function() {
	var self = this;
	events.EventEmitter.call(this);

	self.ssdpKnownByUSN = {};
	self.ssdpKnown = [];

	self.deviceBySid = {};

	self.deviceByType = {};
	self.deviceByUSN = {};
	self.deviceByFriendlyName = {};

	self.searching = false;
	self.client = new Client();

	self.ip = '192.168.0.2';
	self.port = 0;

	self.eventServer = false;

	self.discoverDevice = function(device) {
		needle.get(device.location, function(err, resp, body) {
			if (body instanceof Buffer) {
			} else {
				var wInfo = body.root.device;
				var wDevice = new WemoDevice(wInfo, device);

				self.deviceByType[wInfo.deviceType] = wDevice;
				self.deviceByFriendlyName[wInfo.friendlyName] = wDevice;
				self.deviceByUSN[device.usn] = wDevice;

				self.emit('wemo-device', wDevice);
			} 
		});
	};

	self.search = function() {
		if (self.searching)
			return;

		self.searching = true;
		self.client.search('urn:Belkin:service:basicevent:1');
	};
	
	self.ssdpMSearchResponse = function(headers, statusCode, rInfo) {
	  //console.log('Got a response to an m-search');

		if (self.ssdpKnownByUSN[headers.USN])
			return;

		var target = {};

		target.usn = headers.USN;
		target.location = headers.LOCATION;
		target.nls = headers['01-NLS']; // This changes when the network state does according to spec
		target.address = rInfo.address;
		target.port = rInfo.port;


		self.ssdpKnownByUSN[target.usn] = target;
		self.ssdpKnown.push(target);

		self.discoverDevice(target);
	};

	self.handleEvent = function(req, res) {
		console.log("EVENT!");
		var payload = "";
		req.on('data', function (chunk) {
			payload += chunk;
		});

		req.on('end', function() {
			if (self.deviceBySid[req.headers.sid])
				self.deviceBySid[req.headers.sid].notifyStateChange(req.headers, payload);
		});
	};

	self.monitorDevice = function(dev) {
		if (!dev || !dev.ip || !dev.port)
			return;

		self.subscribe(dev);
	};

	self.subscribe = function(dev, path) {
		var options = {
			hostname: dev.ip,
			port: dev.port,
			path: path || '/upnp/event/basicevent1',
			method: 'SUBSCRIBE',
			headers: {
				"CALLBACK": "<http://"+self.ip+":"+self.port+"/>",// Bad
				"TIMEOUT": "Second-600",
				'NT': 'upnp:event'
			}
		};

		var req = http.request(options, function(res) {
			console.log('STATUS: ' + res.statusCode);
			console.log('HEADERS: ' + JSON.stringify(res.headers));

			self.deviceBySid[res.headers.sid] = dev;
		});

		req.on('error', function(e) {
			console.log('problem with request: ' + e.message);
		});


		setTimeout(function() {
			self.subscribe(dev);
		}, 5000);

		// write data to request body
		req.end();
	};

	self.ssdpNotify = function(header, data) {
		console.log('NOTIFICATION');
		console.log(a, b, c);
	};
	self.startMonitoring = function() {
		if (self.eventServer)
			return false;

		self.eventServer = http.createServer(self.handleEvent);
		self.eventServer.listen(0, function() { self.port = self.eventServer.address().port; console.log("Now listening for events on port " + self.port); });
		self.client.on('response', self.ssdpMSearchResponse);
		self.client.on('notify', self.ssdpNotify);
	};
}

BelkinWemo.prototype.__proto__ = events.EventEmitter.prototype;


module.exports = BelkinWemo;
