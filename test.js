var BelkinWemo = require('./lib/Wemo.js');
var Entities = require('html-entities').AllHtmlEntities;
 
entities = new Entities();

var foo = new BelkinWemo();
foo.startMonitoring();

foo.on('wemo-device', function(dev) {
//	console.log(dev);

  if (dev.WemoParams.friendlyName == 'HeaterB') {
    var heater = dev.Heater;
      heater.getAttributes(function(err, attributes) {
//        console.log(entities.decode(attributes));
      });
  }

	if (dev.WemoParams.friendlyName == 'WeMo Link') {
		dev.Link.getEndDevices(function(err, data) {
			
			data.forEach(function(d) {
	//			dev.Link.setLinkDeviceStatus(d.DeviceID, '10006', '2', function() { }); // Toggle
			});
		});
	}
	if (dev.WemoParams.friendlyName == 'Humidifier') {
//		console.log(dev);

//		dev.Humidifier.setAttributes(null, function(err, data) {
			dev.Humidifier.getAttributes(function(err, data) {
				console.log(err, data);
			})
	//	});
	}

});

//	console.log(dev.WemoParams.friendlyName);

/*
	if (dev.WemoParams.friendlyName == 'Washer') {
		foo.monitorDevice(dev);
		console.log(dev);
	}
//	dev.monitor();
	if (dev.WemoParams.friendlyName == 'WeMo Link') {
		console.log(dev);
//		console.log(dev);
//		console.log(dev.serviceList);
		dev.Link.getEndDevices(function(err, data) {
			console.log(data);
			data.forEach(function(d) {
				
				dev.Link.setLinkDeviceStatus(d.DeviceID, '10006', '2', function() { }); // Toggle
//				dev.Link.setLinkDeviceStatus(d.DeviceID, '10008', '255', function() { }); // Dim

				async.timesSeries(100, function(num, cab) {	
					dev.Link.setLinkDeviceStatus(d.DeviceID, '10300', '10501:2500:0', function() {  // Blue
						dev.Link.setLinkDeviceStatus(d.DeviceID, '10300', '46000:18000:0', function() { 
							dev.Link.setLinkDeviceStatus(d.DeviceID, '10300', '26760:31277:0', function() { return cab(); }); // Yellow
						}); // Red
					});
				});


			});
		});
	}


	if (dev.friendlyName == 'Washer') {
		console.log(dev);
		dev.getInsightParams(function(err, data) {
			console.log(err, data);
		});

//		foo.monitorDevice(dev);
	}

(
		if (dev.friendlyName == 'Air Conditioner')
		{
			dev.setCrockpotState(0, 0, function(err, res) {
				console.log(err, res);

				dev.getCrockpotState(function(ierr, ires) {
					console.log(ierr, ires);
				});

			});
//			dev.on('CrockpotState', function(data) {
	//			console.log(data);
		//	});
		}*/
//});
foo.search();
