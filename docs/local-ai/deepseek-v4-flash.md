# Running DeepSeek-V4-Flash at 14 tok/s on a 16 GB laptop

A 79 GiB mixture-of-experts model on a card with 16 GB of VRAM. This is what I tried over several weeks, what worked, what I killed with measurement, and the mistakes that cost me the most time.

**The box.** RTX 5080 Laptop (16303 MiB), Ryzen AI 9 HX 370, 64 GB RAM, Windows 11, NVMe. Engine is a local build of `llama.cpp` with the MoE-direct expert cache.

## The result

| config | decode tok/s |
|---|---:|
| as-found, `--moe-cache 4096` | ~7.1 |
| fully tuned, original weights | 8.012 |
| REAP-150B, same knobs | 12.549 |
| **REAP + `-ub 512` + budget 49152** | **14.046** |

**+75% end to end**, on an 8-turn agentic workload. Every number is A/B/B/A with the first pair discarded, identical prompt stream, and the mechanism confirmed in engine metrics each time.

## What actually worked

### 1. Expert pruning, REAP-150B (+56.6%)

By far the dominant lever, and the reason it works is not the obvious one.

Pruning did **not** reduce the arithmetic per token. Top-k is still 6, the per-token expert record is still 13,369,344 B, and bytes/token stays invariant at **3.45 GB**. What changed is **residency**: with fewer total experts, a much larger fraction of the working set fits in the RAM pool, so the same bytes come from memory instead of NVMe.

This is worth internalising if you are sizing a prune. Active parameters set your token rate, so a prune that halves total parameters while leaving top-k alone does not make each token cheaper. It makes each token more likely to hit cache. Those are different mechanisms with different scaling.

### 2. `--moe-cache 6144` (+12.8%)

Every DeepSeek number I had measured for weeks was taken at `--moe-cache 4096`, which turned out to be leaving 12.8% on the table. `8192` grants the same VRAM (14814 MiB) and buys exactly nothing, because the grant saturates.

Worth a general point: an inherited default that appears in every one of your benchmark arms is invisible. It cancels out of every A/B you run, so nothing in your own data will ever point at it.

### 3. `-ub 512` with budget 49152 (12.549 to 14.046)

The interesting part is that `-ub 2048` had been the *winner* on the original model, and the reversal is not noise. It is coverage-dependence.

Prefill cost is sweep-count times whole-model-sweep. On the original weights, coverage was low enough that a bigger microbatch genuinely paid. After pruning, coverage rises to 67.9%, sweeps mostly hit the pool (prefill hit rate **85.8% to 97.22%**, prefill read **181 GB to 56 GB**), so the large-ubatch penalty evaporates and the smaller microbatch buys back the host memory the bigger pool needs.

Right at low coverage, wrong at high coverage. One knob, sign flipped by a change elsewhere.

Note the pairing constraint: budget 49152 with `-ub 2048` crashes mid-run on **host** memory, not VRAM, with `decode() failed: bad allocation` followed by `GGML_ASSERT(galloc->node_allocs != NULL)`.

## What I killed with measurement

This is the more useful half, and it is the half nobody publishes.

### PCIe expert streaming: dead

The idea: the Gen4 x8 link sits idle during the compute phase (verified live, `pcie.link.gen=4`, width 8), so stream experts over it. Predicted 10 to 17 ms/token.

I wrote three CUDA probes and measured it. Host-to-device is fast and robust, **13.5 to 14.4 GB/s**, unchanged by CPU load, pageable within 4% of pinned. But the DMA draws on the **same memory controller** as the CPU MoE gather:

- **0.88 to 0.97 GB/s of CPU DRAM bandwidth lost per 1 GB/s streamed**, from two independent tests.
- Combined CPU+H2D ceiling 74 to 78 GB/s, against 72.9 to 77.5 GB/s CPU-only. A net gain of about 2%.

The tax does fall at low CPU pressure (0.26 at 44.7 GB/s), but the CPU phase is DRAM-bound at ~54 GB/s during its own window, so the saturated tax is the one that applies.

**The link is idle. The controller feeding it is not.** Verdict: do not fund the patch.

### The "31 ms gap": an accounting artifact I chased for a week

I had a headline finding that the CPU MoE engine was extracting only ~65% of its own kernel rate, leaving a ~31 ms/token gap. A whole workstream was priced against it.

It was not real. The `cmp` counter is not CPU-MoE time. It contains **every millisecond the CPU sits idle waiting for the GPU**. The tell was sitting in my own CSV the whole time: `gpu_util_mean x ms_per_tok` is flat at **32 to 42 ms** while `ms_per_tok` swings 135.8 to 207.1 and thread count swings 2 to 24. A thread-invariant GPU term was hiding inside a counter I had labelled as CPU work.

Corrected decomposition per token: **wait ~35 ms, CPU MoE GEMV ~48 to 52 ms, serialized GPU graph/launch ~26 ms**.

That ~26 ms is 24% of the token and had never been examined by anyone, including me. 43 layers of MLA attention over 89.75 MiB of device KV cannot exceed ~2 to 4 ms of real kernel work; the rest is launch overhead and split-boundary synchronisation. The single largest block on the box turned out to be the one my instrumentation had been quietly attributing elsewhere.

Everything priced against the phantom gap was over-priced, including an entire threadpool dimension (libomp, `GGML_OPENMP=OFF`, devirtualising `vec_dot`, fusing the add chain) that collapsed to 1 to 2 ms combined once the accounting was fixed.

### Also measured dead

- **`MOE_DIRECT_SPLIT_READ` above 3.** Measured in-source: 1-way 3.48 ms, 3-way 2.69, then 4/6/12-way at 3.13/3.37/4.12. Split-read is fully cashed at 3.
- **Control-queue batching.** `control_q_max_depth=1` and `control_q_full_waits=0` in all 29 runs. There is no queue to batch.
- **Round-trip elimination** as anything above 2 ms. Residual is 4 to 6 microseconds over ~260 round-trips, so the whole family tops out near 1.5 ms. The earlier "~366 round-trips" figure was also wrong; measured `dispatcher_demand_cmd/token` is 129.5 to 131.0 in 29 of 29 rows.
- **TLB, page-walk and DRAM page thrash.** 846k pages/token times ~25 cycles is a **5.1 ms ceiling** even fully serial. A probe using the identical 4 KiB random-slab layout hit 98.6% of that ceiling, so large pages stay dead.
- **False sharing in `mul_mat_id`.** The chunk counters are already cache-line padded.
- **AVX-512 512-bit rewrite** (Zen 5 mobile double-pumps), **LPDDR5X tuning** (soldered, already at rated 7500), **CPU clock droop** (3.2%).

## The traps that cost me the most

**A build wrapper that exits 0 regardless.** `build-bg.cmd` reports real status in `build.exit`, but the wrapper itself always exits 0. A failed compile sailed through and produced a confident, fully-retracted -6.1% result: I had "measured" a binary that was never rebuilt. Now I check `build.exit`, the artifact mtime, **and** grep the built DLL for a string I know exists only in the new code.

**Environment variables leaking across A/B arms.** My harness cleared `MOE_DIRECT_*` between arms but not `GGML_CUDA_MOE_CACHE_*`. Anything set for one arm silently persisted into every later arm in the same session. An A/B with leaked state is not a slow A/B, it is a worthless one.

**A first-arm transient large enough to invent findings.** 17 of 17 arm families show a 10 to 21 ms intra-run transient over a 192-token window even after a 128-token warmup. My 110.6 ms headline was transient-contaminated; late-window steady state is ~102.4 ms (n=5, three of five runs at or below 100.8 ms). Interleave arms and discard the first pair, or a real +8% reads as noise and a fast configuration reads 31% slow.

**Instrumentation overhead that is not common-mode.** I had assumed the ~6% metrics cost cancelled across arms. It does not: 3.9% on one arm against 1.6% on another. Every metrics-enabled comparison carries arm-dependent bias.

**A metrics path that is a filename, not a flag.** `MOE_DIRECT_METRICS` takes a path and is exclusive-create. Setting it to `1` writes JSONL to a file literally named `1`, and startup aborts if the file already exists. I spent a session concluding counters were missing when they were sitting in a file called `1`.

## What is still open, honestly

**Quality is unmeasured on my workload, and it is the one thing that could invalidate the whole result.** Published REAP evals are near-parity (mean +0.80 across GSM8K, MATH-500, HumanEval+, MBPP+) but say nothing about security or code work specifically. Renormalised routing makes cache statistics *improve* while output quality drops, so throughput physically cannot detect the failure mode.

The plan is top-k logprob agreement under teacher forcing: generate with the original model, then score that exact token sequence under REAP and compare per-position. Greedy outputs diverge, and after the divergence point a naive per-position comparison is meaningless, which is why teacher forcing rather than free generation.

Until that runs, treat the 14.05 as a throughput result and nothing more.

The other open item is that ~26 ms serialized GPU term. A fused gate-times-SwiGLU CUDA path already exists in the tree and is never called. If launch overhead dominates the way the arithmetic suggests, it is worth more than every remaining lever combined.
