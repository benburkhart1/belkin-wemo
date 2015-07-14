var Client = require('node-ssdp').Client;
var needle = require('needle');
var parseXmlString = require('xml2js').parseString;
var events = require("events");
var util = require('util');
var http = require('http');

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

	self.ip = '192.168.0.52';
	self.port = 18694;

	self.eventServer = false;

	self.discoverDevice = function(device) {
		needle.get(device.location, function(err, resp, body) {
			var wDevice = new WemoDevice(self, body.root.device, device);

			self.deviceByType[wDevice.deviceType] = wDevice;
			self.deviceByFriendlyName[wDevice.friendlyName] = wDevice;
			self.deviceByUSN[device.usn] = wDevice;

			self.emit('wemo-device', wDevice);
		});
	}

	self.search = function() {
		if (self.searching)
			return;

		self.searching = true;
		self.client.search('urn:Belkin:service:basicevent:1');
	}
	
	self.ssdpMSearchResponse = function(headers, statusCode, rInfo) {
	  console.log('Got a response to an m-search');

		if (self.ssdpKnownByUSN[headers.USN])
			return

		var target = {};

		target.usn = headers.USN;
		target.location = headers.LOCATION;
		target.nls = headers['01-NLS']; // This changes when the network state does according to spec
		target.address = rInfo.address;
		target.port = rInfo.port;


		self.ssdpKnownByUSN[target.usn] = target;
		self.ssdpKnown.push(target);

		self.discoverDevice(target);
	}

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
	}

	self.monitorDevice = function(dev) {
		if (!dev || !dev.ip || !dev.port)
			return;
		
		var options = {
			hostname: dev.ip,
			port: dev.port,
			path: '/upnp/event/basicevent1',
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

		// write data to request body
		req.end();
	}

	self.ssdpNotify = function() {
		
	}
	self.startMonitoring = function() {
		if (self.eventServer)
			return false;

		self.eventServer = http.createServer(self.handleEvent);
		self.eventServer.listen(self.port, function() { console.log("Now listening for events"); });
	}

	
	self.startMonitoring();
	self.client.on('response', self.ssdpMSearchResponse);
	self.client.on('notify', self.ssdpNotify);
}

BelkinWemo.prototype.__proto__ = events.EventEmitter.prototype;

var foo = new BelkinWemo();

foo.on('wemo-device', function(dev) {
//	dev.monitor();
		//console.log(dev);

		if (dev.friendlyName == 'Office Fan')
		{
			foo.monitorDevice(dev);
		}
//	dev.getInsightParams(function(err, res) {
	//	console.log(res);
//	});
//	console.log(dev);
});
foo.search();
