// sphere-hashes
// A deterministic avatar for any string. The seed is hashed, the hash drives
// a small random generator, and the generator picks the colours and the
// shape. Same seed, same sphere, on every machine.

function hash(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h1 ^ h2) >>> 0;
}
function rng(seed) { let a = seed; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const lerp = (a, b, t) => a + (b - a) * t;

const FAMILIES = {
  studio: { hue: [0, 360], sat: [24, 44], light: [46, 84], spread: 38 },
  warm:   { hue: [8, 52],  sat: [48, 72], light: [52, 84], spread: 22 },
  cool:   { hue: [180, 250], sat: [34, 58], light: [46, 84], spread: 30 },
  mono:   { hue: [210, 230], sat: [3, 8],  light: [30, 90], spread: 0 }
};

function hslToRgb(h, s, l) {
  s /= 100; l /= 100; const k = n => (n + h / 30) % 12; const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)].map(v => Math.round(v * 255));
}
const hex = rgb => '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('');
const lum = ([r, g, b]) => { const c = [r, g, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };

function palette(seed, fam) {
  const F = FAMILIES[fam], r = rng(hash(seed + '|' + fam));
  const h0 = lerp(F.hue[0], F.hue[1], r());
  const out = [];
  for (let i = 0; i < 4; i++) {
    const h = (h0 + (i === 0 ? 0 : (r() * 2 - 1) * F.spread * (1 + i * 0.4)) + 360) % 360;
    const s = lerp(F.sat[0], F.sat[1], r());
    const l = lerp(F.light[0], F.light[1], i === 0 ? r() * 0.6 : r());
    const rgb = hslToRgb(h, s, l);
    out.push({ hex: hex(rgb), rgb, L: lum(rgb) });
  }
  return out;
}

/* Sphere fill: flat ground, dark cap on top, bright bands low on the body, soft glow spilling below. */
function sphereColors(seed, fam) {
  const r = rng(hash(seed + '|sphere|' + fam)), F = FAMILIES[fam];
  const mono = fam === 'mono', k = fam === 'studio' ? 0.85 : 1;
  const sat = v => mono ? Math.min(v, 6) : v * k;
  const H = h => ((h % 360) + 360) % 360;
  const hsl = (h, s, l) => hslToRgb(H(h), sat(s), l);
  const side = r() < 0.5 ? 1 : -1;
  const hBg = lerp(F.hue[0], F.hue[1], r());
  const loud = r() < 0.5;
  // Two harmony modes: the band echoes the ground and the glow answers it, or the reverse.
  const echo = r() < 0.5;
  const hBand = echo ? hBg + side * lerp(10, 35, r()) : hBg + 180 + side * lerp(0, 30, r());
  const hGlow = echo ? hBg + 180 + side * lerp(0, 25, r()) : hBg - side * lerp(5, 25, r());
  const hCap = hBg + side * lerp(25, 55, r());
  const bg = loud ? hsl(hBg, lerp(62, 78, r()), lerp(54, 62, r())) : hsl(hBg, lerp(30, 48, r()), lerp(79, 87, r()));
  const cap = hsl(hCap, lerp(30, 45, r()), lerp(14, 20, r()));
  const cap2 = hsl(lerpHue(hCap, hBand, 0.4), 32, lerp(28, 36, r()));
  const band = hsl(hBand, lerp(62, 80, r()), lerp(50, 58, r()));
  const hi = hsl(lerpHue(hBand, 50, 0.45), 45, lerp(84, 90, r()));
  const band2 = hsl(lerpHue(hBand, hGlow, 0.5), lerp(55, 72, r()), lerp(56, 64, r()));
  const glow = hsl(hGlow, lerp(62, 80, r()), loud ? lerp(50, 58, r()) : lerp(62, 72, r()));
  const rim = hsl(lerpHue(hBand, hGlow, 0.3), lerp(55, 70, r()), lerp(68, 78, r()));
  const keys = [[0, cap], [0.22, cap], [0.46, cap2], [0.64, band], [0.79, hi], [0.92, band2], [1, glow]];
  const stops = smoothStops(keys, 40);
  const sw = [bg, cap, band, glow].map(rgb => ({ hex: hex(rgb), rgb, L: lum(rgb) }));
  return { bg: hex(bg), glow: hex(glow), rim: hex(rim), stops, swatch: sw };
}
function lerpHue(a, b, t) { const d = ((((b - a) % 360) + 540) % 360) - 180; return a + d * t; }
/* OKLab interpolation, sampled densely, so bands melt instead of stepping. */
function toLin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function toSrgb(c) { c = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; return Math.round(Math.max(0, Math.min(1, c)) * 255); }
function oklab([r8, g8, b8]) {
  const r = toLin(r8), g = toLin(g8), b = toLin(b8);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
function fromOklab([L, A, B]) {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3, m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3, s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [toSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), toSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), toSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)];
}
function smoothStops(keys, n) {
  const labs = keys.map(([o, c]) => [o, oklab(c)]), out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n; let j = 0; while (j < labs.length - 2 && t > labs[j + 1][0]) j++;
    const [o0, a] = labs[j], [o1, b] = labs[j + 1];
    let u = o1 === o0 ? 0 : Math.min(1, Math.max(0, (t - o0) / (o1 - o0)));
    out.push([+t.toFixed(3), hex(fromOklab(a.map((v, k) => v + (b[k] - v) * u)))]);
  }
  return out;
}

function build(seed, o) {
  const id = 'sh' + hash(seed + '|' + o.palette + '|' + o.shape).toString(36);
  const pal = palette(seed, o.palette);
  const clip = o.shape === 'circle' ? `<circle cx="50" cy="50" r="50"/>` : `<rect width="100" height="100" rx="${o.shape === 'rounded' ? 24 : 0}"/>`;
  let fill = '', sphereDefs = '';

  {
    const S = sphereColors(seed, o.palette);
    pal.splice(0, 4, ...S.swatch);
    const cx = 50, cy = 50, R = 28;
    const DOT = 'M0 98.2859C0 130.253 8.41248 154.509 25.2374 171.334C42.0624 188.159 66.4586 196.572 98.2859 196.572C130.113 196.572 154.509 188.159 171.334 171.334C188.159 154.509 196.572 130.113 196.572 98.2859C196.572 66.4586 188.159 42.0624 171.334 25.2375C154.509 8.41249 130.113 0 98.2859 0C66.4586 0 42.0624 8.41249 25.2374 25.2375C8.41248 42.0624 0 66.4586 0 98.2859Z';
    const dot = f => `<path transform="translate(${cx - R} ${cy - R}) scale(${(2 * R / 196.572).toFixed(5)})" d="${DOT}" fill="${f}"/>`;
    const body = dot(`url(#${id}s)`) + dot(`url(#${id}e)`);
    fill = `<rect width="100" height="100" fill="${S.bg}"/>` +
      `<rect width="100" height="100" fill="url(#${id}v)"/>` +
      `<g filter="url(#${id}g0)"><ellipse cx="${cx}" cy="${cy + 18}" rx="${R * 1.45}" ry="${R * 1.5}" fill="${S.glow}" fill-opacity="0.38"/></g>` +
      `<g filter="url(#${id}g1)"><ellipse cx="${cx}" cy="${cy + 12}" rx="${R * 1.15}" ry="${R * 1.22}" fill="${S.glow}" fill-opacity="0.6"/></g>` +
      `<g filter="url(#${id}g2)"><ellipse cx="${cx}" cy="${cy + 4}" rx="${R * 1.03}" ry="${R * 1.05}" fill="${S.rim}" fill-opacity="0.55"/></g>` +
      `<g mask="url(#${id}m2)"><g filter="url(#${id}g3)">${body}</g></g>` +
      `<g mask="url(#${id}m)">${body}</g>`;
    sphereDefs = `<linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1">` +
      S.stops.map(([o2, c]) => `<stop offset="${o2}" stop-color="${c}"/>`).join('') + `</linearGradient>` +
      `<radialGradient id="${id}e" cx="0.5" cy="0.42" r="0.6"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.3"/></radialGradient>` +
      `<linearGradient id="${id}v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.06"/><stop offset="1" stop-color="#000" stop-opacity="0.06"/></linearGradient>` +
      `<filter id="${id}g0" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="14"/></filter>` +
      `<filter id="${id}g1" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="9"/></filter>` +
      `<filter id="${id}g2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>` +
      `<filter id="${id}g3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2"/></filter>` +
      `<linearGradient id="${id}mg" x1="0" y1="0" x2="0" y2="1"><stop offset="0.55" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>` +
      `<mask id="${id}m" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect x="${cx - R}" y="${cy - R}" width="${2 * R}" height="${2 * R}" fill="url(#${id}mg)"/></mask>` +
      /* the blurred body under the sphere: the mask used to stop ten units
         under it in a straight edge, which cut the spill off in a line; it
         now runs on past the spill and fades to nothing at its end */
      `<linearGradient id="${id}mg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0.4" stop-color="#000"/><stop offset="0.62" stop-color="#fff"/><stop offset="0.8" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>` +
      `<mask id="${id}m2" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect x="${cx - R - 20}" y="${cy - R}" width="${2 * R + 40}" height="${2 * R + 34}" fill="url(#${id}mg2)"/></mask>`;
  }

  const defs = `<defs><clipPath id="${id}c">${clip}</clipPath>${sphereDefs}</defs>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" role="img" aria-label="${esc(seed)}">${defs}<g clip-path="url(#${id}c)">${fill}</g></svg>`;
  return { svg, pal };
}
function esc(s) { return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]); }

const PALETTES = Object.keys(FAMILIES);
const SHAPES = ['circle', 'rounded', 'square'];

function normalise(seed, options = {}) {
  const o = {
    palette: PALETTES.includes(options.palette) ? options.palette : 'studio',
    shape: SHAPES.includes(options.shape) ? options.shape : 'circle',
    size: options.size > 0 ? options.size : 100,
  };
  return [String(seed ?? '').trim() || ' ', o];
}

/**
 * The avatar as an SVG string.
 * @param {string} seed  any string: a name, an email, an id
 * @param {object} [options]
 * @param {'studio'|'warm'|'cool'|'mono'} [options.palette='studio']
 * @param {'circle'|'rounded'|'square'} [options.shape='circle']
 * @param {number} [options.size=100]  width and height attributes, the viewBox stays 100
 */
export function sphereHash(seed, options) {
  const [s, o] = normalise(seed, options);
  const { svg } = build(s, o);
  return o.size === 100 ? svg : svg.replace('width="100" height="100"', `width="${o.size}" height="${o.size}"`);
}

/** The same avatar as a data URL, ready for an <img src> or a CSS background. */
export function sphereHashUrl(seed, options) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sphereHash(seed, options));
}

/** The four swatches behind an avatar, as hex strings. */
export function sphereHashColors(seed, options) {
  const [s, o] = normalise(seed, options);
  return build(s, o).pal.map((c) => c.hex);
}

export { hash, PALETTES, SHAPES };
