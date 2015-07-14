/**
 * This encapsulates the functionality provided by remote APIs for
 * Belkin WeMo devices.
 */
var Soap = require('./Soap.js');

var Client = require('node-ssdp').Client;
var needle = require('needle');
var parseXmlString = require('xml2js').parseString;
var events = require("events");
var url = require('url');
var http = require('http');

var WemoDevice = function(context, wInfo, sInfo) {
	var self = this;
	self.context = context;

	events.EventEmitter.call(this);
	
	Object.keys(wInfo).forEach(function(k) { self[k] = wInfo[k]; });

	self.lastStatus = false;

	self.ssdp = sInfo;

	self.ip = self.ssdp.address;

	// Get port
	var parse = url.parse(self.ssdp.location);
	self.port = parse.port;

	self.notifyStateChange = function(headers, change) {
		console.log(headers);
		console.log(change);
	}

	self.getInsightParams = function(callback) {
		var path = '/upnp/control/insight1';
		var param =
			'  <u:GetInsightParams xmlns:u="urn:Belkin:service:insight:1">\n' +
			'  </u:GetInsightParams>\n';

		Soap.makeRequest(self.ip, self.port, path, param, 'insight', 'GetInsightParams', function(err, resp, body) {
			if (err)
				return callback(err);

			var data = body['s:Envelope']['s:Body']['u:GetInsightParamsResponse']['InsightParams'];
			var energyParams = data.split('|');

			var energyObj = {
				status: energyParams[0],
				lastOnTs: energyParams[1],
				secondsSinceLastOn: energyParams[2],
				secondsOnToday: energyParams[3],
				secondsOnTwoWeeks: energyParams[4],
				averagePowerWatts: energyParams[6],
				instantPowerMw: energyParams[7]
			}


			return callback(null, energyObj);	
		});

	}

	self.setBinaryState = function(state, callback) {
		var path = '/upnp/control/basicevent1';
		var param =
				'	<u:SetBinaryState xmlns:u="urn:Belkin:service:basicevent:1">\n' +
				'   <BinaryState>' + state + '</BinaryState>'+
				'	</u:SetBinaryState>\n';
		
		Soap.makeRequest(self.ip, self.port, path, param, 'basicevent', 'SetBinaryState', function(err, resp, body) {
			if (err)
				return callback(err);

			console.log(body['s:Envelope']['s:Body']);

			return callback(null, null);	
		});
	}


	self.getBinaryState = function(callback) {
		var path = '/upnp/control/basicevent1';
		var param =
				'	<u:GetBinaryState xmlns:u="urn:Belkin:service:basicevent:1">\n' +
				'	</u:GetBinaryState>\n';
		
		Soap.makeRequest(self.ip, self.port, path, param, 'basicevent', 'GetBinaryState', function(err, resp, body) {
			if (err)
				return callback(err);

			var binaryState = body['s:Envelope']['s:Body']['u:GetBinaryStateResponse']['BinaryState'];

			return callback(null, binaryState);	
		});
	}

};

WemoDevice.prototype.__proto__ = events.EventEmitter.prototype;

module.exports = WemoDevice;
