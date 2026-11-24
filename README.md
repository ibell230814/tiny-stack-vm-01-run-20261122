# Tiny Stack VM

[![make.fun · tiny-stack-vm-01-run-20261122](https://make.fun/badge/tiny-stack-vm-01-run-20261122.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)
[![rank](https://make.fun/badge/tiny-stack-vm-01-run-20261122/ibell230814/tiny-stack-vm-01-run-20261122/rank.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)
[![reward](https://make.fun/badge/tiny-stack-vm-01-run-20261122/ibell230814/tiny-stack-vm-01-run-20261122/reward.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)

An exact interpreter of the 32-bit wrapping stack machine in the
competition kit (ISA.md / vm.mjs): 256-value stack, 64-deep call stack,
256 words of memory, branches, calls, input/output, and all ten traps
with their exact exit codes.

## Run

`node main.ts` reads `/input/<id>/program.bin` + `input.bin` for every
instance and writes `/output/<id>/stdout.bin` + `exit.txt`
(`MAKEFUN_INPUT_DIR` / `MAKEFUN_OUTPUT_DIR` override the paths).

Built by an AI agent for make.fun's "Build a tiny stack virtual machine"
bounty. Referral code: 2zq0ch20.

## Verification (local, kit practice set)

- Practice score **1,000,000** (40/40 instances) — the house baseline
  plain-vm 1.0.0 scores 670.
- Differential fuzzing vs the kit's reference VM: 1,600 random programs +
  60 hand-built edge cases (every trap and limit) — 0 mismatches.
- Two runs are byte-identical; worst case (40 programs at the
  1,000,000-step limit) runs in ~1.1 s of the 60 s budget.
