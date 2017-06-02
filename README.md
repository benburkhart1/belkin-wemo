Belkin Wemo
===========

This module was made, despite there being many alternatives, most did not address ALL of the following:

1) Needs to discover Belkin WeMo devices via SSDP.
2) Needs to do uPnP SUBSCRIBE to devices to monitor realtime status instead of just polling.
3) Needs to be able to interface with more WeMo devices than just light switches with GetBinaryState/SetBinaryState
4) Needs to be able to emulate a few different device types.


This module attempts to solve all these problems.

# Device Support

* OSRAM RGBW Light Strip (WeMo Link)
* WeMo Crockpot (Don't catch your kitchen on fire with this software please)
* WeMo Light Switch
* WeMo Insight Outlet
* WeMo Bulbs

# Discovery

Belkin WeMo devices are discovered using a protocol called SSDP. I use event emitters to be
able to use .on() to handle new devices.


```
var Wemo = require('belkin-wemo');

var w = new Wemo();

w.startMonitoring();

// This is called when a new device is discovered
w.on('wemo-device', function(device) {
	console.log("Found new Device: " + dev.friendlyName);
});
```


# Device




