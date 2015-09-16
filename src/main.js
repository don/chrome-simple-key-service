var noble = require('noble');
const $ = require('jquery');

const element = document.querySelector("#greeting");
element.innerText = "SensorTag - Simple Key Service";

const scanButton = $('#scanButton');

// noble.on('stateChange', function(state) {
//   if (state === 'poweredOn') {
//     noble.startScanning(); // any service UUID
//   } else {
//     console.log('Please power-on the Bluetooth Adapter.');
//   }
// });

function doScan(){
  console.log("doScan");
  $('#progress').show();
  // SensorTag CC2451 does not advertise any services
  //noble.startScanning();

  // SensorTag CC2650 advertises (but does not provide) AA10
  //noble.startScanning(['AA10'], false);
  //noble.startScanning(['0000AA10-0000-1000-8000-00805F9B34FB'], false);

  // FakeSensorTag can advertise the simple key service
  // ffe0 - chrome wants the long UUID version and insists on lower case
  noble.startScanning(['0000ffe0-0000-1000-8000-00805f9b34fb'], false);

}

noble.on('discover', function(peripheral) {
    console.log(peripheral);
 // advertising data or local name is not implemented
 //  var localName = peripheral.advertisement.localName;

  // find SensorTag based on local name
//  if (localName && localName.match(/Sensor/)) {
    noble.stopScanning();
    $('#progress').hide();
    console.log('Attempting to connect'); // to ' + localName);
    connectAndSetUpSensorTag(peripheral);
//  }
});

function connectAndSetUpSensorTag(peripheral) {
  console.log("connectAndSetUpSensorTag");
  peripheral.connect(function(error) {
    console.log('Connected to ' + peripheral); //.advertisement.localName);
    if (error) {
      console.log('There was an error connecting ' + error);
      return;
    }

    var serviceUUIDs = ['FFE0'];
    var characteristicUUIDs = ['FFE1'];

    peripheral.discoverSomeServicesAndCharacteristics(
    serviceUUIDs, characteristicUUIDs, onServicesAndCharacteristicsDiscovered);
  });

  // attach disconnect handler
  peripheral.on('disconnect', onDisconnect);
}

function onDisconnect() {
  console.log('Peripheral disconnected!');
}

function onServicesAndCharacteristicsDiscovered(error, services, characteristics) {
  console.log('onServicesAndCharacteristicsDiscovered');
  if (error) {
    console.log('Error discovering services and characteristics ' + error);
    return;
  }

  var characteristic = characteristics[0];

  // subscribe for notifications
  characteristic.notify(true);

  // called when notification state changes
  characteristic.on('notify', function(isNotifying) {
    if (isNotifying) {
      console.log('SensorTag remote is ready');
    }
  });

  // called when the data changes
  characteristic.on('data', onCharacteristicData);
}

function onCharacteristicData(data, isNotification) {
  switch (data[0]) {
  case 0:
    buttonState.innerHTML = "No buttons are pressed";
    break;
  case 1:
    buttonState.innerHTML = "Right button is pressed";
    break;
  case 2:
    buttonState.innerHTML = "Left button is pressed";
    break;
  case 3:
    buttonState.innerHTML = "Both buttons are pressed";
    break;
  default:
    buttonState.innerHTML = "Error " + data[0];
  }
}

scanButton.click(doScan);
