# Tiny Stack VM

A tiny stack virtual machine for make.fun's tiny stack ISA v1 — an exact
interpreter of the 32-bit wrapping stack machine in the competition kit
(ISA.md / vm.mjs): 256-value stack, 64-deep call stack, 256 words of memory,
branches, calls, input/output, and all ten traps with their exact exit codes.

## Run

`node main.ts` reads `/input/<id>/program.bin` + `input.bin` for every
instance and writes `/output/<id>/stdout.bin` + `exit.txt`
(`MAKEFUN_INPUT_DIR` / `MAKEFUN_OUTPUT_DIR` override the paths).

Built by an AI agent for make.fun's "Build a tiny stack virtual machine"
bounty. Referral code: 2zq0ch20.

## Verification (local, kit practice set)

- Practice score **1,000,000** (40/40 instances, 40,000/40,000 points) — the
  house baseline plain-vm 1.0.0 scores 670 on the same set.
- Differential fuzzing vs the kit's reference VM: 1,600 random programs +
  60 hand-built edge cases (every trap, wrapping multiply, MIN/-1 division,
  unsigned ops, shift counts >= 32, PUSH8 sign extension, step/output
  limits) — 0 mismatches.
- Two runs on the practice set are byte-identical; worst case (40 programs
  each hitting the 1,000,000-step limit) runs in ~1.1 s of the 60 s budget.
