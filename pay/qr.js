// A small QR code encoder (byte mode, error correction level M, versions 1-40) for the EPC "scan to pay" code on the
// pay page. No dependencies and nothing leaves the page: the IBAN never goes to a QR service. Follows ISO/IEC 18004
// (the same structure as Project Nayuki's reference encoder). Exposes window.SplitSmartQR.svg(text, darkColour).
(function () {
  'use strict';
  // Level M tables, index = version.
  var ECC_PER_BLOCK = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28,
    28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28];
  var NUM_BLOCKS = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26,
    28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49];
  var FORMAT_ECC_M = 0;

  function rawDataModules(ver) {
    var r = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      var n = Math.floor(ver / 7) + 2;
      r -= (25 * n - 10) * n - 55;
      if (ver >= 7) r -= 36;
    }
    return r;
  }
  function dataCodewords(ver) { return Math.floor(rawDataModules(ver) / 8) - ECC_PER_BLOCK[ver] * NUM_BLOCKS[ver]; }

  function gfMul(x, y) {
    var z = 0;
    for (var i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; }
    return z & 0xFF;
  }
  function rsDivisor(degree) {
    var res = []; for (var i = 0; i < degree - 1; i++) res.push(0); res.push(1);
    var root = 1;
    for (var k = 0; k < degree; k++) {
      for (var j = 0; j < degree; j++) { res[j] = gfMul(res[j], root); if (j + 1 < degree) res[j] ^= res[j + 1]; }
      root = gfMul(root, 0x02);
    }
    return res;
  }
  function rsRemainder(data, divisor) {
    var res = divisor.map(function () { return 0; });
    data.forEach(function (b) {
      var factor = b ^ res.shift(); res.push(0);
      divisor.forEach(function (coef, i) { res[i] ^= gfMul(coef, factor); });
    });
    return res;
  }

  function utf8(text) {
    var out = [], s = unescape(encodeURIComponent(text));
    for (var i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
    return out;
  }

  function encode(text) {
    var bytes = utf8(text), ver, cap;
    for (ver = 1; ver <= 40; ver++) {
      var ccBits = ver <= 9 ? 8 : 16;
      cap = dataCodewords(ver) * 8;
      if (4 + ccBits + bytes.length * 8 <= cap) break;
    }
    if (ver > 40) throw new Error('too long');
    var bits = [];
    function put(val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
    put(4, 4); put(bytes.length, ver <= 9 ? 8 : 16);
    bytes.forEach(function (b) { put(b, 8); });
    put(0, Math.min(4, cap - bits.length));
    put(0, (8 - bits.length % 8) % 8);
    for (var pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) put(pad, 8);
    var data = [];
    for (var i = 0; i < bits.length; i += 8) {
      var v = 0; for (var j = 0; j < 8; j++) v = (v << 1) | bits[i + j]; data.push(v);
    }
    return { ver: ver, codewords: interleave(ver, data) };
  }

  function interleave(ver, data) {
    var numBlocks = NUM_BLOCKS[ver], eccLen = ECC_PER_BLOCK[ver];
    var raw = Math.floor(rawDataModules(ver) / 8);
    var numShort = numBlocks - raw % numBlocks, shortLen = Math.floor(raw / numBlocks);
    var div = rsDivisor(eccLen), blocks = [], k = 0;
    for (var i = 0; i < numBlocks; i++) {
      var dat = data.slice(k, k + shortLen - eccLen + (i < numShort ? 0 : 1));
      k += dat.length;
      var ecc = rsRemainder(dat, div);
      if (i < numShort) dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    var out = [];
    for (var c = 0; c < blocks[0].length; c++) {
      for (var b = 0; b < blocks.length; b++) {
        if (c !== shortLen - eccLen || b >= numShort) out.push(blocks[b][c]);
      }
    }
    return out;
  }

  function Matrix(ver) {
    var size = ver * 4 + 17, m = [], f = [];
    for (var y = 0; y < size; y++) { m.push(new Array(size).fill(false)); f.push(new Array(size).fill(false)); }
    this.size = size; this.m = m; this.f = f; this.ver = ver;
  }
  Matrix.prototype.fn = function (x, y, dark) { this.m[y][x] = dark; this.f[y][x] = true; };
  Matrix.prototype.drawFunction = function () {
    var size = this.size, self = this, i;
    for (i = 0; i < size; i++) { this.fn(6, i, i % 2 === 0); this.fn(i, 6, i % 2 === 0); }
    [[3, 3], [size - 4, 3], [3, size - 4]].forEach(function (c) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var d = Math.max(Math.abs(dx), Math.abs(dy)), xx = c[0] + dx, yy = c[1] + dy;
        if (xx >= 0 && xx < size && yy >= 0 && yy < size) self.fn(xx, yy, d !== 2 && d !== 4);
      }
    });
    var pos = alignmentPositions(this.ver, size), n = pos.length;
    for (i = 0; i < n; i++) for (var j = 0; j < n; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
      for (var ay = -2; ay <= 2; ay++) for (var ax = -2; ax <= 2; ax++) {
        this.fn(pos[i] + ax, pos[j] + ay, Math.max(Math.abs(ax), Math.abs(ay)) !== 1);
      }
    }
    this.drawFormat(0);
    if (this.ver >= 7) {
      var rem = this.ver;
      for (i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
      var vbits = (this.ver << 12) | rem;
      for (i = 0; i < 18; i++) {
        var bit = ((vbits >>> i) & 1) !== 0, a = size - 11 + i % 3, b = Math.floor(i / 3);
        this.fn(a, b, bit); this.fn(b, a, bit);
      }
    }
  };
  Matrix.prototype.drawFormat = function (mask) {
    var data = (FORMAT_ECC_M << 3) | mask, rem = data, i, size = this.size;
    for (i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    var bits = ((data << 10) | rem) ^ 0x5412;
    function bit(k) { return ((bits >>> k) & 1) !== 0; }
    for (i = 0; i <= 5; i++) this.fn(8, i, bit(i));
    this.fn(8, 7, bit(6)); this.fn(8, 8, bit(7)); this.fn(7, 8, bit(8));
    for (i = 9; i < 15; i++) this.fn(14 - i, 8, bit(i));
    for (i = 0; i < 8; i++) this.fn(size - 1 - i, 8, bit(i));
    for (i = 8; i < 15; i++) this.fn(8, size - 15 + i, bit(i));
    this.fn(8, size - 8, true);
  };
  Matrix.prototype.drawCodewords = function (cw) {
    var size = this.size, i = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) for (var j = 0; j < 2; j++) {
        var x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
        if (!this.f[y][x] && i < cw.length * 8) { this.m[y][x] = ((cw[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0; i++; }
      }
    }
  };
  function maskHit(mask, x, y) {
    switch (mask) {
      case 0: return (x + y) % 2 === 0;
      case 1: return y % 2 === 0;
      case 2: return x % 3 === 0;
      case 3: return (x + y) % 3 === 0;
      case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
      case 5: return x * y % 2 + x * y % 3 === 0;
      case 6: return (x * y % 2 + x * y % 3) % 2 === 0;
      default: return ((x + y) % 2 + x * y % 3) % 2 === 0;
    }
  }
  Matrix.prototype.applyMask = function (mask) {
    for (var y = 0; y < this.size; y++) for (var x = 0; x < this.size; x++) {
      if (!this.f[y][x] && maskHit(mask, x, y)) this.m[y][x] = !this.m[y][x];
    }
  };
  // ISO 18004 §7.8.3 penalty: runs, 2x2 blocks, finder-like patterns, dark balance.
  Matrix.prototype.penalty = function () {
    var size = this.size, m = this.m, p = 0, x, y, dark = 0;
    function lines(get) {
      for (var a = 0; a < size; a++) {
        var run = 1, line = [];
        for (var b = 0; b < size; b++) {
          line.push(get(a, b) ? 1 : 0);
          if (b > 0) { if (get(a, b) === get(a, b - 1)) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; }
        }
        var s = line.join('');
        var pats = ['10111010000', '00001011101'];
        pats.forEach(function (pat) { for (var k = s.indexOf(pat); k !== -1; k = s.indexOf(pat, k + 1)) p += 40; });
      }
    }
    lines(function (a, b) { return m[a][b]; });
    lines(function (a, b) { return m[b][a]; });
    for (y = 0; y < size - 1; y++) for (x = 0; x < size - 1; x++) {
      var c = m[y][x];
      if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3;
    }
    for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (m[y][x]) dark++;
    var total = size * size;
    p += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
    return p;
  };

  function alignmentPositions(ver, size) {
    if (ver === 1) return [];
    var n = Math.floor(ver / 7) + 2;
    var step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2;
    var res = [6];
    for (var pos = size - 7; res.length < n; pos -= step) res.splice(1, 0, pos);
    return res;
  }

  function modules(text) {
    var enc = encode(text), best = null, bestPenalty = Infinity;
    for (var mask = 0; mask < 8; mask++) {
      var mx = new Matrix(enc.ver);
      mx.drawFunction(); mx.drawCodewords(enc.codewords); mx.applyMask(mask); mx.drawFormat(mask);
      var pen = mx.penalty();
      if (pen < bestPenalty) { bestPenalty = pen; best = mx; }
    }
    return best;
  }

  // An SVG string: quiet zone of 4 modules, crisp edges, one path. Colour comes from the caller (CSS variable value).
  function svg(text, label) {
    var mx = modules(text), size = mx.size, q = 4, d = '';
    for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) {
      if (mx.m[y][x]) d += 'M' + (x + q) + ',' + (y + q) + 'h1v1h-1z';
    }
    var full = size + q * 2;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + full + ' ' + full + '" shape-rendering="crispEdges"' +
      ' role="img" aria-label="' + String(label || '').replace(/[&<>"]/g, '') + '">' +
      '<rect width="' + full + '" height="' + full + '" fill="#FFFFFF"/><path d="' + d + '" fill="#000000"/></svg>';
  }

  window.SplitSmartQR = { svg: svg, modules: modules };
})();
