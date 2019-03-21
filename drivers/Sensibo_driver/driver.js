'use strict';

const Homey = require('homey');
const request = require("request");
const config = require("./config");
class SensiboDriver extends Homey.Driver {

	onInit() {
	}
	// alternatively, use the shorthand meth
	onPairListDevices(data, callback) {
		let settings = this.getSettings();
		if (settings.APIKey == undefined || settings.APIKey == null || settings.APIKey == "")
			settings.APIKey = config.APIKey;
		request.get({
			method: 'GET',
			uri: 'https://home.sensibo.com/api/v2/users/me/pods?apiKey=' + settings.APIKey + '&fields=id,room',
		}, function (error, response, body) {
			if (error) this.log('error: ' + error);
			else
				if (config.IsJsonString(body)) {
					var listDevice = [];
					var lst = JSON.parse(body);
					for (var i = 0; i < lst.result.length; i++) {
						listDevice.push({ name: "Sensibo " + lst.result[i].room.name, data: { id: lst.result[i].id, room: lst.result[i].room } });
					}
					//console.log(listDevice);
					callback(null, listDevice);
				}
				else {
					callback(null, listDevice);
				}
		});
	}
	getSettings() {
		var settingsSensibo = {};
		settingsSensibo.APIKey = Homey.ManagerSettings.get("apikey");
		settingsSensibo.IntervalSync = Homey.ManagerSettings.get("interval");
		return settingsSensibo;
	}
	//}
}

module.exports = SensiboDriver;