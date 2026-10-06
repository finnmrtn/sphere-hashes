# sphere-hashes

A sphere for every name. Give it a string, get a small SVG: a glass ball on a coloured ground, drawn from a hash of the string. Same seed, same sphere, on every machine. No network, no dependencies, about 6 KB of SVG per avatar.

Made for placeholder avatars, but it works for anything that needs a stable picture for an id: team members, API keys, documents, workspaces.

Docs with live examples at [studiosphere.co/avatar/docs](https://www.studiosphere.co/avatar/docs). Try it with the glass at [studiosphere.co/avatar](https://www.studiosphere.co/avatar).

## Install

```sh
npm i sphere-hashes
```

## Use

```js
import { sphereHash, sphereHashUrl } from 'sphere-hashes';

const svg = sphereHash('finn@studiosphere.co');
// '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" ...'

const src = sphereHashUrl('finn@studiosphere.co', { size: 64 });
// 'data:image/svg+xml;charset=utf-8,%3Csvg...'
```

React:

```jsx
import { sphereHashUrl } from 'sphere-hashes';

function Avatar({ id, size = 40 }) {
  return <img src={sphereHashUrl(id, { size })} width={size} height={size} alt="" />;
}
```

Plain HTML:

```js
document.querySelector('.avatar').innerHTML = sphereHash('jesse', { shape: 'rounded' });
```

## Options

| Option     | Values                                   | Default    |
| ---------- | ---------------------------------------- | ---------- |
| `style`    | `sphere`, `mesh`, `flat`, `dither`       | `sphere`   |
| `palette`  | `studio`, `warm`, `cool`, `mono`         | `studio`   |
| `shape`    | `circle`, `rounded`, `square`            | `circle`   |
| `size`     | any number, sets `width` and `height`    | `100`      |
| `initials` | `true` draws up to two letters on top    | `false`    |

`sphere` is the one in the demo. `mesh` is three blurred blobs, `flat` is a disc on a ground, `dither` is the same blobs through a Bayer matrix. The `mono` palette is greys with a hint of blue.

The viewBox is always `0 0 100 100`, so an avatar scales to any size without a re-render.

## Also exported

```js
import { sphereHashColors, hash, initials, STYLES, PALETTES, SHAPES } from 'sphere-hashes';

sphereHashColors('finn'); // ['#554ad7', '#1f2e34', '#2e4dd5', '#cca83c']
hash('finn');             // 2323125802, the 32 bit hash everything is drawn from
initials('finn.marten');  // 'FM'
```

## How it works

The string is hashed (two rounds of imul mixing, the usual cyrb53 shape) and the hash seeds a mulberry32 generator. The generator picks a hue in the palette's range, then the ground, the cap, the bands and the glow as offsets from it. The band colours are interpolated in OKLab and sampled forty times, so the gradient on the ball melts rather than steps. The glow under the ball is three blurred ellipses, and the ball itself is the sphere mark from the Studio Sphere logo.

The glass refraction in the demo is a WebGL pass on top of this SVG. It is not part of the package, the SVG is the thing that has to be the same everywhere.

## License

MIT, Studio Sphere BV.
