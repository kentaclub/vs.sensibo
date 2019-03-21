'use strict';

const Homey = require('homey');
const request = require("request");
const config = require("./config");
const POLL_INTERVAL = 1000*5;
var lstKey = [];
var checkTime = 0;
class SensiboDevice extends Homey.Device {

	// this method is called when the Device is inited
	onInit() {

		//flow ===========
		let device = this; // We're in a Device instance
		let tokens = {};
		let state = {};

		this._driver = this.getDriver();
		this._driver.ready(() => {
			console.log("Driver is ready")
		});
		//=========
		// register a capability listener
		this.getSettings.bind(this);
		this.registerCapabilityListener('thermostat_mode', this.onCapabilityThermoMode.bind(this));
		this.registerCapabilityListener('target_temperature', this.onCapabilityThermoTarget.bind(this));
		this.registerCapabilityListener('fan_rate', this.onCapabilityFanRate.bind(this));
		this.registerCapabilityListener('fan_direction', this.onCapabilitySwing.bind(this));
		// load info sensibo the first time
		this.loadInfo.bind(this);

		// sync Temperature with sensibo
		let settings = this.getSettings();
		var interval = 5;
		if (settings.IntervalSync != undefined && settings.IntervalSync != null && Number(settings.IntervalSync) >= 5) {
			interval = Number(settings.IntervalSync);
		}
		this._syncInterval = setInterval(this._sync.bind(this), POLL_INTERVAL * interval);

	}

	// this method is called when the Device is added
	onAdded() {
		this.log('device added');
		let settings = this.getSettings();
		var interval = 5;
		if (settings.IntervalSync != undefined && settings.IntervalSync != null && Number(settings.IntervalSync) >= 5) {
			interval = Number(settings.IntervalSync);
		}
		this._syncInterval = setInterval(this._sync.bind(this), POLL_INTERVAL * interval);
		this.loadInfo();
		checkTime = 0;
	}

	// this method is called when the Device is deleted
	onDeleted() {
		this.log('device deleted');
		clearInterval(this._syncInterval);
	}


	onCapabilityThermoMode(value, opts, callback) {
		let settingsApp = this.getSettings();
		if (settingsApp.APIKey == undefined || settingsApp.APIKey == null || settingsApp.APIKey == "")
			settingsApp.APIKey = config.APIKey;
		var onoff = false;
		if (value == "off") {
			onoff = false;
			value = "auto"
		}
		else
			onoff = true;
		var temperature = Number(this.getCapabilityValue("target_temperature"));
		request.post({
			method: 'POST',
			uri: 'https://home.sensibo.com/api/v2/pods/' + this.getData().id + '/acStates?apiKey=' + settingsApp.APIKey,
			json: true,
			body: { "acState": { "on": onoff, "mode": value.toString(), "fanLevel": this.getCapabilityValue("fan_rate"), "targetTemperature": temperature, "swing": this.getCapabilityValue("fan_direction") } }
		}, function (error, response, body) {
			if (error) console.log('error: ' + error);
			else {
				callback(null);
			}
		});
	}

	onCapabilityThermoTarget(value, opts, callback) {
		let settingsApp = this.getSettings();
		if (settingsApp.APIKey == undefined || settingsApp.APIKey == null || settingsApp.APIKey == "")
			settingsApp.APIKey = config.APIKey;
		console.log("SetTempurature: " + value);
		var mode = this.getCapabilityValue("thermostat_mode");
		var onoff = false;
		if (mode == "off") {
			onoff = false;
			mode = "auto"
		}
		else
			onoff = true;
		request.post({
			method: 'POST',
			uri: 'https://home.sensibo.com/api/v2/pods/' + this.getData().id + '/acStates?apiKey=' + settingsApp.APIKey,
			json: true,
			body: { "acState": { "on": onoff, "mode": mode, "fanLevel": this.getCapabilityValue("fan_rate"), "targetTemperature": Number(value), "swing": this.getCapabilityValue("fan_direction") } }
		}, function (error, response, body) {
			if (error) console.log('error: ' + error);
			else
				callback(null);
		});
	}

	onCapabilityFanRate(value, opts, callback) {
		let settingsApp = this.getSettings();
		if (settingsApp.APIKey == undefined || settingsApp.APIKey == null || settingsApp.APIKey == "")
			settingsApp.APIKey = config.APIKey;
		console.log("fanlevel: " + value);
		var mode = this.getCapabilityValue("thermostat_mode");
		var onoff = false;
		if (mode == "off") {
			onoff = false;
			mode = "auto"
		}
		else
			onoff = true;
		var temperature = Number(this.getCapabilityValue("target_temperature"));
		request.post({
			method: 'POST',
			uri: 'https://home.sensibo.com/api/v2/pods/' + this.getData().id + '/acStates?apiKey=' + settingsApp.APIKey,
			json: true,
			body: { "acState": { "on": onoff, "mode": mode, "fanLevel": value, "targetTemperature": temperature, "swing": this.getCapabilityValue("fan_direction") } }
		}, function (error, response, body) {
			if (error) console.log('error: ' + error);
			else
				callback(null);
		});

	}

	onCapabilitySwing(value, opts, callback) {
		let settingsApp = this.getSettings();
		if (settingsApp.APIKey == undefined || settingsApp.APIKey == null || settingsApp.APIKey == "")
			settingsApp.APIKey = config.APIKey;
		console.log("Swing: " + value);
		var mode = this.getCapabilityValue("thermostat_mode");
		var onoff = false;
		if (mode == "off") {
			onoff = false;
			mode = "auto"
		}
		else
			onoff = true;
		var temperature = Number(this.getCapabilityValue("target_temperature"));
		request.post({
			method: 'POST',
			uri: 'https://home.sensibo.com/api/v2/pods/' + this.getData().id + '/acStates?apiKey=' + settingsApp.APIKey,
			json: true,
			body: { "acState": { "on": onoff, "mode": mode, "fanLevel": this.getCapabilityValue("fan_rate"), "targetTemperature": temperature, "swing": value } }
		}, function (error, response, body) {
			if (error) {
				console.log('error: ' + error);
				return Promise.reject(new Error('Switching the device failed!'));
			}
			else {
				callback(null);
			}
		});

	}
	getSettings() {
		var settingsSensibo = {};
		settingsSensibo.APIKey = Homey.ManagerSettings.get("apikey");
		settingsSensibo.IntervalSync = Homey.ManagerSettings.get("interval");
		return settingsSensibo;
	}
	loadInfo() {
		let settingsApp = this.getSettings();
		if (settingsApp.APIKey == undefined || settingsApp.APIKey == null || settingsApp.APIKey == "")
			settingsApp.APIKey = config.APIKey;
		var info = {};
		var this_item = this;
		request.get({
			method: 'GET',
			uri: 'https://home.sensibo.com/api/v2/pods/' + this.getData().id + '?apiKey=' + settingsApp.APIKey + '&fields=id,acState,measurements',
		}, function (error, response, body) {
			if (error) {
				console.log('error: ' + error);
				return Promise.reject(new Error('Switching the device failed!'));
			}
			else {
				if (!config.IsJsonString(body)) {
					console.log('error: ' + body);
				}
				else {
					var lst = JSON.parse(body);
					info = lst.result;
					var valuemode = info.acState.on == false ? "off" : info.acState.mode;
					this_item.setCapabilityValue("thermostat_mode", valuemode, function (err, result) {
						if (error) {
							console.log('error: ' + error);
						}
					});
					this_item.setCapabilityValue("fan_rate", info.acState.fanLevel, function (err, result) {
						if (error) {
							console.log('error: ' + error);
						}
					});
					this_item.setCapabilityValue("fan_direction", info.acState.swing, function (err, result) {
						if (error) {
							console.log('error: ' + error);
						}
					});
					this_item.setCapabilityValue("target_temperature", info.acState.targetTemperature, function (err, result) {
						if (error) {
							console.log('error: ' + error);
						}
					});
					this_item.setCapabilityValue("measure_temperature", info.measurements.temperature, function (err, result) {
						if (error) {
							console.log('error: ' + error);
						}
					});
					this_item.setCapabilityValue("measure_humidity", info.measurements.humidity, function (err, result) {
						if (error) {
							console.log('error: ' + error);
						}
					});
				}
			}
		});

	}
	_sync() {
		var info = {};
		let settings = this.getSettings();
		if (settings.APIKey == undefined || settings.APIKey == null || settings.APIKey == "")
			settings.APIKey = config.APIKey;
		var this_item = this;
		var data = this.getData();
		request.get({
			method: 'GET',
			uri: 'https://home.sensibo.com/api/v2/pods/' + this.getData().id + '?apiKey=' + settings.APIKey + '&fields=id,acState,measurements',
		}, function (error, response, body) {
			if (error) {
				console.log('error: ' + error);
				return Promise.reject(new Error('Switching the device failed!'));
			}
			else {
				if (!config.IsJsonString(body)) {
					console.log('error: ' + body);
				}
				else {
					var lst = JSON.parse(body);
					info = lst.result;
					var valuemode = info.acState.on == false ? "off" : info.acState.mode;
					this_item.setCapabilityValue("thermostat_mode", valuemode, function (err, result) {
						if (error) {
							console.log('error: ' + error);
						}
					});
					this_item.setCapabilityValue("fan_rate", info.acState.fanLevel, function (err, result) {
						if (error) {
							console.log('error: ' + error);
						}
					});
					this_item.setCapabilityValue("fan_direction", info.acState.swing, function (err, result) {
						if (error) {
							console.log('error: ' + error);
						}
					});
					this_item.setCapabilityValue("target_temperature", info.acState.targetTemperature, function (err, result) {
						if (error) {
							console.log('error: ' + error);
						}
					});
					this_item.setCapabilityValue("measure_temperature", info.measurements.temperature, function (err, result) {
						if (error) {
							console.log('error: ' + error);
						}
					});
					this_item.setCapabilityValue("measure_humidity", info.measurements.humidity, function (err, result) {
						if (error) {
							console.log('error: ' + error);
						}
					});

				}
			}
		});
	}
}
module.exports = SensiboDevice;