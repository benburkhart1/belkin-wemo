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
var parseString = require('xml2js').parseString;
var entities = new (require('html-entities')).AllHtmlEntities();

var WemoDevice = function(wInfo, sInfo) {
	var self = this;

	events.EventEmitter.call(this);
	
	// Info from querying WeMo services page
	self.WemoParams = {};
	Object.keys(wInfo).forEach(function(k) { self.WemoParams[k] = wInfo[k]; });

	self.lastStatus = false;

	self.Ssdp = sInfo;

	self.ip = self.Ssdp.address;

	// Get port
	var parse = url.parse(self.Ssdp.location);
	self.port = parse.port;

	self.notifyStateChange = function(headers, change) {
		if (!headers || !headers.nts) {
			console.log("Unhandled ", headers, change);
			return;
		}

	
		if (headers.nts == 'upnp:propchange') {
			console.log('PROPERTY CHANGED');
			console.log(headers);
			console.log(change);	
			parseString(change, function(err, data) {
				console.log(data['e:propertyset']['e:property'][0].BinaryState);
				if (!data || !data['e:propertyset'] || !data['e:propertyset']['e:property'] || !data['e:propertyset']['e:property'][0]) {
					console.log(err, data);
					return;
				}
				var bs = data['e:propertyset']['e:property'][0];

	
				var src = bs.BinaryState || bs.InsightParams;

				if (src) {
					var energyParams = src[0].split('|');

					if (energyParams.length == 1) {
						return self.emit('BinaryState', { status: energyParams[0] });
					}

					var energyObj = {
						status: energyParams[0],
						lastOnTs: energyParams[1],
						secondsSinceLastOn: energyParams[2],
						secondsOnToday: energyParams[3],
						secondsOnTwoWeeks: energyParams[4],
						averagePowerWatts: energyParams[6],
						instantPowerMw: energyParams[7]
					};

					console.log(energyObj);

					self.emit('BinaryState', energyObj);
				} else if (bs.EnergyPerUnitCost) {
					console.log(bs.EnergyPerUnitCost);
					var energyParams = bs.EnergyPerUnitCost[0].split('|');

				
					console.log(energyParams);
				}
//				process.exit(0);
			});
		}
	};

	self.Heater = new function() {
		/**
		 * fanMode is one of the following:
		 * 2 - High
		 * 3 - Low
     * 4 - Eco
		 */
		this.setMode = function(mode, callback) {
			var path = '/upnp/control/deviceevent1';

			var param = 
				'  <u:SetAttributes xmlns:u="urn:Belkin:service:deviceevent:1">\n' +
				' <attributeList>&lt;attribute&gt;&lt;name&gt;Mode&lt;/name&gt;&lt;value&gt;' + mode + '&lt;/value&gt;&lt;/attribute&gt;</attributeList> ' + 
				'  </u:SetAttributes>\n';

			Soap.makeRequest(self.ip, self.port, path, param, 'deviceevent', 'SetAttributes', function(err, resp, body) {
				if (err) {
					console.log(err);
					return callback(err);
				}

				return callback(null, null);
			});
		};

		this.setTemperature = function(temperature, callback) {
			var path = '/upnp/control/deviceevent1';

			var param = 
				'  <u:SetAttributes xmlns:u="urn:Belkin:service:deviceevent:1">\n' +
				' <attributeList>&lt;attribute&gt;&lt;name&gt;SetTemperature&lt;/name&gt;&lt;value&gt;' + temperature + '&lt;/value&gt;&lt;/attribute&gt;</attributeList> ' + 
				'  </u:SetAttributes>\n';

			Soap.makeRequest(self.ip, self.port, path, param, 'deviceevent', 'SetAttributes', function(err, resp, body) {
				if (err) {
					console.log(err);
					return callback(err);
				}

				return callback(null, null);
			});
		};



		this.getAttributes = function(callback) {
			var path = '/upnp/control/deviceevent1';

			var param = 
				'  <u:GetAttributes xmlns:u="urn:Belkin:service:deviceevent:1">\n' +
				'  </u:GetAttributes>\n';

			Soap.makeRequest(self.ip, self.port, path, param, 'deviceevent', 'GetAttributes', function(err, resp, body) {
				if (err) {
					console.log(err);
					return callback(err);
				}

        var data = entities.decode(body['s:Envelope']['s:Body']['u:GetAttributesResponse'].attributeList);

				return callback(null, data);
			});

		};
	};



	self.Humidifier = new function() {
		/**
		 * fanMode is one of the following:
		 * 0 - Off
		 * 1 - Min
		 * 2 - Low
		 * 3 - Medium
		 * 4 - High
		 * 5 - Max
		 */
		this.setFanMode = function(fanMode, callback) {
			var path = '/upnp/control/deviceevent1';

			var param = 
				'  <u:SetAttributes xmlns:u="urn:Belkin:service:deviceevent:1">\n' +
				' <attributeList>&lt;attribute&gt;&lt;name&gt;FanMode&lt;/name&gt;&lt;value&gt;' + fanMode + '&lt;/value&gt;&lt;/attribute&gt;</attributeList> ' + 
				'  </u:SetAttributes>\n';

			Soap.makeRequest(self.ip, self.port, path, param, 'deviceevent', 'SetAttributes', function(err, resp, body) {
				if (err) {
					console.log(err);
					return callback(err);
				}

				return callback(null, null);
			});


		};

		this.getAttributes = function(callback) {
			var path = '/upnp/control/deviceevent1';

			var param = 
				'  <u:GetAttributes xmlns:u="urn:Belkin:service:deviceevent:1">\n' +
				'  </u:GetAttributes>\n';

			Soap.makeRequest(self.ip, self.port, path, param, 'deviceevent', 'GetAttributes', function(err, resp, body) {
				if (err) {
					console.log(err);
					return callback(err);
				}

				var data = entities.decode(body['s:Envelope']['s:Body']['u:GetAttributesResponse']['attributeList']);

				return callback(null, data);
			});

		};
	};

	self.Crockpot = new function() {
		// Crock pot state
		// mode = 0 - Off
		// mode = 1 - Warm
		// mode = 2 - ?
		// mode = 3 - Hot
		this.setCrockpotState = function(mode, time, callback) {
			var path = '/upnp/control/basicevent1';

			var param = 
				'  <u:SetCrockpotState xmlns:u="urn:Belkin:service:basicevent:1">\n' +
				'    <mode>' + mode + '</mode>\n' +
				'    <time>' + time + '</time>\n' +
				'  </u:SetCrockpotState>\n';

			Soap.makeRequest(self.ip, self.port, path, param, 'basicevent', 'SetCrockpotState', function(err, resp, body) {
				console.log(err, body);

				if (err)
					return callback(err);

				return callback(null, null/*data*/);
			});
		};

		this.getCrockpotState = function(callback) {
			var path = '/upnp/control/basicevent1';

			var param = 
				'  <u:GetCrockpotState xmlns:u="urn:Belkin:service:basicevent:1">\n' +
				'  </u:GetCrockpotState>\n';

			Soap.makeRequest(self.ip, self.port, path, param, 'basicevent', 'GetCrockpotState', function(err, resp, body) {
				if (err)
					return callback(err);

				var data = body['s:Envelope']['s:Body']['u:GetCrockpotStateResponse'];

				return callback(null, null/*data*/);
			});
		};
	};

	
	self.Insight = new function() {
		this.getInsightParams = function(callback) {
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
		};
	};

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
	};


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
	};


	// WeMo Link Related Functions
	self.Link = new function() {
		this.getEndDevices = function(callback) {
			var path = '/upnp/control/bridge1';
			
			var param = 
				' <u:GetEndDevices xmlns:u="urn:Belkin:service:bridge:1">\n' +
				'   <DevUDN>' + self.WemoParams.UDN + '</DevUDN>' +
				'   <ReqListType>PAIRED_LIST</ReqListType>' + 
				' </u:GetEndDevices>\n';

			Soap.makeRequest(self.ip, self.port, path, param, 'bridge', 'GetEndDevices', function(err, resp, body) {
				if (err)
					return callback(err);

				if (!body || !body['s:Envelope'] || !body['s:Envelope']['s:Body'] || !body['s:Envelope']['s:Body']['u:GetEndDevicesResponse'] || !body['s:Envelope']['s:Body']['u:GetEndDevicesResponse']['DeviceLists']) {
					return callback("Packet not in expected format");
				}

				var rawXml = body['s:Envelope']['s:Body']['u:GetEndDevicesResponse']['DeviceLists'];

				parseString(rawXml, function(err, data) {
					var dl = data.DeviceLists.DeviceList;

					var ds = [];

					dl[0].DeviceInfos[0].DeviceInfo.forEach(function(d) {
						ds.push(d);
					});
					
					return callback(null, ds);
				});
			});
		};

		// Underlying function used for dimming, turning on and off, and changing colors
		this.setLinkDeviceStatus = function(deviceId, capabilityId, capabilityValue, callback) {
			var path = '/upnp/control/bridge1';
			
			var param = 
				' <u:SetDeviceStatus xmlns:u="urn:Belkin:service:bridge:1">\n' +
				'   <DeviceStatusList>' +
				'&lt;?xml version=&quot;1.0&quot; encoding=&quot;UTF-8&quot;?&gt;&lt;DeviceStatus&gt;&lt;IsGroupAction&gt;NO&lt;/IsGroupAction&gt;&lt;DeviceID available=&quot;YES&quot;&gt;' + deviceId + '&lt;/DeviceID&gt;&lt;CapabilityID&gt;'+capabilityId+'&lt;/CapabilityID&gt;&lt;CapabilityValue&gt;'+capabilityValue+'&lt;/CapabilityValue&gt;&lt;/DeviceStatus&gt;' +
				'   <DevUDN>' + self.WemoParams.UDN + '</DevUDN>' +
				'   <ReqListType>PAIRED_LIST</ReqListType>' + 
				'   </DeviceStatusList> ' +
				' </u:SetDeviceStatus>\n';

			Soap.makeRequest(self.ip, self.port, path, param, 'bridge', 'SetDeviceStatus', function(err, resp, body) {
				var rawXml = body['s:Envelope']['s:Body'];

				return callback();
				console.log(rawXml);
			});
		};

	};


};

WemoDevice.prototype.__proto__ = events.EventEmitter.prototype;

module.exports = WemoDevice;
