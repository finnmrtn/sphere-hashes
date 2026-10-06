import test from 'node:test';
import assert from 'node:assert/strict';
import { sphereHash, sphereHashUrl, sphereHashColors, hash, initials, STYLES, PALETTES, SHAPES } from '../src/index.js';

test('same seed, same sphere', () => {
  assert.equal(sphereHash('finn'), sphereHash('finn'));
  assert.notEqual(sphereHash('finn'), sphereHash('jesse'));
});

test('is an svg', () => {
  const svg = sphereHash('hello@example.com');
  assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"'));
  assert.ok(svg.endsWith('</svg>'));
});

test('every style, palette and shape renders', () => {
  for (const style of STYLES) for (const palette of PALETTES) for (const shape of SHAPES) {
    assert.ok(sphereHash('x', { style, palette, shape }).includes('<svg'));
  }
});

test('size only changes the attributes', () => {
  const a = sphereHash('finn'), b = sphereHash('finn', { size: 256 });
  assert.ok(b.includes('width="256" height="256"'));
  assert.equal(a.replace('width="100" height="100"', ''), b.replace('width="256" height="256"', ''));
});

test('initials sit on top when asked', () => {
  assert.ok(sphereHash('Finn Marten', { initials: true }).includes('>FM<'));
  assert.ok(!sphereHash('Finn Marten').includes('<text'));
  assert.equal(initials('finn.marten@example.com'), 'FM');
});

test('data url and colours', () => {
  assert.ok(sphereHashUrl('finn').startsWith('data:image/svg+xml;charset=utf-8,%3Csvg'));
  const colors = sphereHashColors('finn');
  assert.equal(colors.length, 4);
  for (const c of colors) assert.match(c, /^#[0-9a-f]{6}$/);
});

test('unknown options fall back', () => {
  assert.equal(sphereHash('finn', { style: 'nope', palette: 'nope', shape: 'nope' }), sphereHash('finn'));
});

test('empty seeds still draw', () => {
  assert.ok(sphereHash('').includes('<svg'));
  assert.ok(sphereHash(undefined).includes('<svg'));
});

test('hash is a 32 bit unsigned number', () => {
  const h = hash('finn');
  assert.ok(Number.isInteger(h) && h >= 0 && h < 2 ** 32);
});
