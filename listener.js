const HID = require('node-hid');

const devices = HID.devices().filter(d => d.vendorId === 5013);

devices.forEach((info, i) => {
  console.log(`\nÉcoute interface ${i+1} - usagePage: ${info.usagePage}`);
  try {
    const device = new HID.HID(info.path);
    device.on('data', (data) => {
      console.log(`[usagePage ${info.usagePage}] ${new Date().toISOString()}`);
      console.log('  HEX:', data.toString('hex'));
      console.log('  DEC:', Array.from(data).join(', '));
    });
    device.on('error', (err) => {
      console.log(`[usagePage ${info.usagePage}] Erreur: ${err.message}`);
    });
  } catch(e) {
    console.log(`Interface ${i+1} non accessible: ${e.message}`);
  }
});

console.log('\nEn écoute... Touche les boutons du B20 (Ctrl+C pour quitter)\n');
