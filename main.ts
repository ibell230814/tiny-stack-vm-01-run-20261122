// Tiny stack VM for make.fun's tiny stack ISA v1 (kit: ISA.md, vm.mjs).
// Runs every /input/<id>/program.bin on /input/<id>/input.bin and writes
// /output/<id>/stdout.bin + /output/<id>/exit.txt. Node 22, stdlib only.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const IN = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const OUT = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const enc = new TextEncoder();

// How many values each opcode byte pops / pushes, and whether it is known.
const pops = (b) =>
  b === 7 ? 3 : b === 5 || b === 6 || b === 65 ? 2
  : b === 3 || b === 4 || b === 23 || b === 27 || b === 49 || b === 50 || b === 64 || b === 80 || b === 81 || b === 83 ? 1
  : (b >= 16 && b <= 30 && b !== 23 && b !== 27) || (b >= 32 && b <= 34) ? 2 : 0;
const pushes = (b) =>
  b === 6 || b === 7 ? 3 : b === 4 || b === 5 ? 2
  : (b >= 1 && b <= 2) || (b >= 16 && b <= 34 && b !== 31) || b === 64 || b === 82 ? 1 : 0;
const valid = (b) =>
  b <= 7 || (b >= 16 && b <= 34 && b !== 31) || (b >= 48 && b <= 52) || b === 64 || b === 65 || (b >= 80 && b <= 83);
const imm = (b) => (b === 1 ? 1 : b === 2 ? 4 : b >= 48 && b <= 51 ? 2 : 0);

function run(p, q) {
  const D = new Int32Array(256), C = new Int32Array(64), M = new Int32Array(256);
  const out = new Uint8Array(65536);
  let sp = 0, cp = 0, pc = 0, st = 0, ol = 0, ip = 0;
  const done = (e) => ({ o: out.slice(0, ol), e });
  for (;;) {
    if (st === 1000000) return done(10);
    if (pc < 0 || pc >= p.length) return done(9);
    const b = p[pc];
    if (!valid(b)) return done(5);
    const im = imm(b);
    if (pc + im >= p.length) return done(9);
    st++;
    const n = pops(b), u = pushes(b);
    if (sp < n) return done(2);
    if (sp - n + u > 256) return done(3);
    const nx = pc + 1 + im;
    pc = nx;
    switch (b) {
      case 0: return done(0);
      case 1: D[sp++] = (p[nx - 1] << 24) >> 24; break;
      case 2: D[sp++] = p[nx - 4] | (p[nx - 3] << 8) | (p[nx - 2] << 16) | (p[nx - 1] << 24); break;
      case 3: sp--; break;
      case 4: D[sp] = D[sp - 1]; sp++; break;
      case 5: { const t = D[sp - 1]; D[sp - 1] = D[sp - 2]; D[sp - 2] = t; break; }
      case 6: D[sp] = D[sp - 2]; sp++; break;
      case 7: { const a = D[sp - 3]; D[sp - 3] = D[sp - 2]; D[sp - 2] = D[sp - 1]; D[sp - 1] = a; break; }
      case 0x17: D[sp - 1] = -D[sp - 1] | 0; break;
      case 0x1b: D[sp - 1] = ~D[sp - 1]; break;
      case 0x30: case 0x31: case 0x32: {
        const rel = ((p[nx - 2] | (p[nx - 1] << 8)) << 16) >> 16;
        if (b === 0x30 || (b === 0x31) === (D[--sp] === 0)) pc = nx + rel;
        break;
      }
      case 0x33:
        if (cp === 64) return done(7);
        C[cp++] = nx; pc = p[nx - 2] | (p[nx - 1] << 8); break;
      case 0x34:
        if (cp === 0) return done(8);
        pc = C[--cp]; break;
      case 0x40: {
        const a = D[sp - 1];
        if (a < 0 || a > 255) return done(6);
        D[sp - 1] = M[a]; break;
      }
      case 0x41: {
        const a = D[sp - 1], v = D[sp - 2];
        if (a < 0 || a > 255) return done(6);
        sp -= 2; M[a] = v; break;
      }
      case 0x50: {
        const t = enc.encode(String(D[sp - 1]));
        if (ol + t.length > 65536) return done(11);
        sp--; out.set(t, ol); ol += t.length; break;
      }
      case 0x51:
        if (ol + 1 > 65536) return done(11);
        out[ol++] = D[--sp] & 255; break;
      case 0x52: D[sp++] = ip < q.length ? q[ip++] : -1; break;
      case 0x53: return done(D[--sp] & 255);
      default: {
        const y = D[sp - 1], x = D[sp - 2];
        let r;
        if (b === 0x10) r = (x + y) | 0;
        else if (b === 0x11) r = (x - y) | 0;
        else if (b === 0x12) r = Math.imul(x, y);
        else if (b === 0x13) { if (y === 0) return done(4); r = x === -2147483648 && y === -1 ? x : (x / y) | 0; }
        else if (b === 0x14) { if (y === 0) return done(4); r = y === -1 ? 0 : (x % y) | 0; }
        else if (b === 0x15) { if (y === 0) return done(4); r = Math.floor((x >>> 0) / (y >>> 0)) | 0; }
        else if (b === 0x16) { if (y === 0) return done(4); r = ((x >>> 0) % (y >>> 0)) | 0; }
        else if (b === 0x18) r = x & y;
        else if (b === 0x19) r = x | y;
        else if (b === 0x1a) r = x ^ y;
        else if (b === 0x1c) r = x << (y & 31);
        else if (b === 0x1d) r = x >> (y & 31);
        else if (b === 0x1e) r = (x >>> (y & 31)) | 0;
        else if (b === 0x20) r = x === y ? 1 : 0;
        else if (b === 0x21) r = x < y ? 1 : 0;
        else r = (x >>> 0) < (y >>> 0) ? 1 : 0;
        sp -= 2; D[sp++] = r;
      }
    }
  }
}

for (const id of readdirSync(IN).sort()) {
  // One bad instance must never kill the whole set: fall back to an empty
  // answer for that instance alone if the interpreter ever throws.
  let r;
  try {
    r = run(new Uint8Array(readFileSync(join(IN, id, 'program.bin'))), new Uint8Array(readFileSync(join(IN, id, 'input.bin'))));
  } catch {
    r = { o: new Uint8Array(0), e: 1 };
  }
  mkdirSync(join(OUT, id), { recursive: true });
  writeFileSync(join(OUT, id, 'stdout.bin'), r.o);
  writeFileSync(join(OUT, id, 'exit.txt'), r.e + '\n');
}
