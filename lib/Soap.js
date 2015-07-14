/**
 * This deals with all SOAP related BS with Belkin WeMo
 */
var needle = require('needle');

var Soap = function() {
	var self = this;

	self.makeRequest = function(ip, port, path, param, actionservice, action, callback) {
		var data =
			'<?xml version="1.0" encoding="utf-8"?>\n' +
			'<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">\n' +
			' <s:Body>\n' +
					param +
			' </s:Body>\n' +
			'</s:Envelope>\n';

		var options = {
			headers: {
				'SOAPACTION'		 : '"urn:Belkin:service:' + actionservice +':1#' + action + '"',
				'Content-Length' : data.length,
				'Content-Type'	 : 'text/xml; charset="utf-8"',
				'User-Agent'		 : 'CyberGarage-HTTP/1.0'
			}
		};

		var url = 'http://' + ip + ':' + port + path;

		needle.post(url, data, options, callback);
	}
}

module.exports = new Soap();
