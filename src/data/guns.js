const GUNS = [
  {
    name: 'Glock 17',
    type: 'Pistol',
    caliber: '9mm',
    price: 599,
    image: '/guns/pistol.svg',
    description:
      'The duty pistol everything else is measured against. Polymer frame, 17-round magazine, striker-fired trigger. Safe, boring, and it always goes bang.',
  },
  {
    name: 'AK-47',
    type: 'Rifle',
    caliber: '7.62mm',
    price: 899,
    image: '/guns/rifle.svg',
    description:
      'Gas-operated, loose tolerances, and famously indifferent to mud. Seven decades of service and still the benchmark for a rifle that will not quit.',
  },
  {
    name: 'Remington 870',
    type: 'Shotgun',
    caliber: '12 Gauge',
    price: 449,
    image: '/guns/shotgun.svg',
    description:
      'Pump-action workhorse. Five shells in the tube, a receiver that has taken more abuse than most trucks, and a sound that ends arguments.',
  },
  {
    name: 'AR-15',
    type: 'Rifle',
    caliber: '5.56mm',
    price: 799,
    image: '/guns/rifle.svg',
    description:
      'Light-recoiling, endlessly modular, and accurate well past the range most shooters can hold. The platform you can rebuild with one tool.',
  },
  {
    name: 'Desert Eagle',
    type: 'Pistol',
    caliber: '.50 AE',
    price: 1599,
    image: '/guns/pistol.svg',
    description:
      'Gas-operated hand cannon. Three and a half pounds of chromed steel that fires a round most pistols would refuse. Subtle it is not.',
  },
  {
    name: 'Mossberg 500',
    type: 'Shotgun',
    caliber: '12 Gauge',
    price: 399,
    image: '/guns/shotgun.svg',
    description:
      'The other pump gun. Twin action bars, a simple safety on the tang, and a price that leaves money for ammunition.',
  },
  {
    name: 'Glock 19', type: 'Pistol', caliber: '9mm', price: 549,
    image: '/guns/pistol.svg', description: 'A compact sporting pistol with a balanced profile and a straightforward, familiar layout.',
  },
  {
    name: 'Beretta 92FS', type: 'Pistol', caliber: '9mm', price: 699,
    image: '/guns/pistol.svg', description: 'A full-size, alloy-frame classic with a distinctive profile and a long sporting heritage.',
  },
  {
    name: 'CZ 75 B', type: 'Pistol', caliber: '9mm', price: 679,
    image: '/guns/pistol.svg', description: 'An all-steel sporting pistol admired for its comfortable grip and careful fit and finish.',
  },
  {
    name: 'SIG Sauer P320', type: 'Pistol', caliber: '9mm', price: 629,
    image: '/guns/pistol.svg', description: 'A modern modular design presented here as a catalogue display item.',
  },
  {
    name: 'Ruger 10/22', type: 'Rifle', caliber: '.22 LR', price: 329,
    image: '/guns/rifle.svg', description: 'A lightweight sporting rifle known for its approachable size and broad range heritage.',
  },
  {
    name: 'Springfield M1A', type: 'Rifle', caliber: '7.62mm', price: 1499,
    image: '/guns/rifle.svg', description: 'A traditional walnut-stock sporting rifle inspired by a familiar historic silhouette.',
  },
  {
    name: 'Inert Training Cartridge Set', type: 'Accessories', caliber: 'Display only', price: 29,
    image: '/guns/ammo.svg', description: 'A non-functional, inert display set for a classroom catalogue mock-up. Not live ammunition.',
  },
  {
    name: 'Leather Grip Panels', type: 'Accessories', caliber: 'Display prop', price: 42,
    image: '/guns/grip-panels.svg', description: 'Decorative, non-functional prop panels shown as an example accessory in this demo catalogue.',
  },
  {
    name: 'Brass Sight Mount', type: 'Accessories', caliber: 'Display prop', price: 36,
    image: '/guns/sight-mount.svg', description: 'A non-functional prop accessory for the Iron Vault classroom storefront demonstration.',
  },
]

export default GUNS
