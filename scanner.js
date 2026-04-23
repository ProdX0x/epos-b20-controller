const HID = require('node-hid');

console.log('=== EPOS B20 HID Scanner ===\n');

// Lister tous les périphériques HID
const devices = HID.devices();

// Filtrer par Vendor ID EPOS (5013)
const eposDevices = devices.filter(d => d.vendorId === 5013);

if (eposDevices.length === 0) {
  console.log('Aucun périphérique EPOS trouvé.');
  console.log('\nTous les périphériques disponibles :');
  devices.forEach(d => console.log(`  ${d.vendorId}:${d.productId} - ${d.manufacturer} ${d.product}`));
} else {
  console.log(`${eposDevices.length} interface(s) EPOS trouvée(s) :\n`);
  eposDevices.forEach((d, i) => {
    console.log(`--- Interface ${i + 1} ---`);
    console.log(JSON.stringify(d, null, 2));
    console.log('');
  });
}
