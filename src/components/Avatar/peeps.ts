/**
 * Sixteen drawn faces, bundled as images.
 *
 * Open Peeps by Pablo Stanley (https://www.openpeeps.com/), CC0 1.0 — public
 * domain, no attribution required, credited here anyway. Generated once from
 * the DiceBear open-peeps style, rasterised, trimmed to content and squared so
 * every face frames identically in a circle.
 *
 * Images rather than the SVG strings they started as: react-native-svg drew
 * them at their intrinsic 704px inside a 32px circle whatever width and height
 * it was given, so every avatar showed the empty top-left corner of the
 * drawing. A PNG has no viewBox to disagree about.
 *
 * Bundled rather than fetched, so a handle never leaves the device to collect a
 * picture of its owner and the faces work with no signal. Metro resolves
 * require() at build time, which is why this list is written out rather than
 * indexed by a loop.
 */
export const PEEPS = [
  require('../../../assets/peeps/peep-00.png'),
  require('../../../assets/peeps/peep-01.png'),
  require('../../../assets/peeps/peep-02.png'),
  require('../../../assets/peeps/peep-03.png'),
  require('../../../assets/peeps/peep-04.png'),
  require('../../../assets/peeps/peep-05.png'),
  require('../../../assets/peeps/peep-06.png'),
  require('../../../assets/peeps/peep-07.png'),
  require('../../../assets/peeps/peep-08.png'),
  require('../../../assets/peeps/peep-09.png'),
  require('../../../assets/peeps/peep-10.png'),
  require('../../../assets/peeps/peep-11.png'),
  require('../../../assets/peeps/peep-12.png'),
  require('../../../assets/peeps/peep-13.png'),
  require('../../../assets/peeps/peep-14.png'),
  require('../../../assets/peeps/peep-15.png'),
];
