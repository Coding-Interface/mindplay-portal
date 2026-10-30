/**
 * SpiceTable
 * The eight spices. Each has its own colour AND texture (powder, seeds,
 * crystals, lentils, pieces) so children who cannot tell colours apart
 * can still sort by look.
 */
class SpiceTable {
  static get(i) { return SpiceTable.LIST[i]; }
}

SpiceTable.LIST = [
  { key: 'haldi', name: 'Haldi', english: 'Turmeric', color: '#f2b705', texture: 'powder' },
  { key: 'mirchi', name: 'Mirchi', english: 'Red chilli', color: '#c62d1f', texture: 'powder' },
  { key: 'dhania', name: 'Dhania', english: 'Coriander', color: '#7a8f2e', texture: 'powder' },
  { key: 'namak', name: 'Namak', english: 'Salt', color: '#f4f2ec', texture: 'crystals' },
  { key: 'rai', name: 'Rai', english: 'Mustard seeds', color: '#2a201b', texture: 'round-seeds' },
  { key: 'jeera', name: 'Jeera', english: 'Cumin', color: '#9a6b3c', texture: 'long-seeds' },
  { key: 'masoor', name: 'Masoor dal', english: 'Red lentils', color: '#e8763a', texture: 'lentils' },
  { key: 'kokum', name: 'Kokum', english: 'Kokum', color: '#5c1f3d', texture: 'pieces' }
];

if (typeof module !== 'undefined') module.exports = SpiceTable;
