# Qwen3.8-27B at 127k context on a 16 GB card

Fitting a 27B mixture-of-experts model with a 126,976-token context into 16 GB of VRAM, keeping two agentic sessions warm at once, and getting 51 tok/s out of it. What follows is measured on one box, with the configuration that won and the several that looked like they should have.

**The box.** RTX 5080 Laptop (16303 MiB), Ryzen AI 9 HX 370, 64 GB RAM, Windows 11 on WDDM.
**The model.** `Qwen3.8-27B-UD-Q3_K_XL`, arch `qwen35`, 866 tensors. Optionally a 133 MiB BF16 LoRA.

## The results

Benchmark workload: single request, single sequence, deterministic prompt, 8192 prompt tokens, 512 generated.

| config | TG tok/s | PP tok/s | VRAM | power | MTP acceptance | mean accepted |
|---|---:|---:|---:|---:|---:|---:|
| **MTP n=3, q8 KV, b2048/ub512** | **51.15** | 972.7 | 13686 MiB | 109.4 W | 0.567 | 2.70 |
| MTP n=4 | 48.55 | 972.5 | 13836 MiB | 108.8 W | 0.505 | 3.02 |
| MTP n=2 | 47.27 | 976.7 | 13536 MiB | 109.5 W | 0.643 | 2.29 |
| 64k ctx, q4_0 KV | 45.01 | 926.4 | 15319 MiB | 104.8 W | 0.556 | 2.66 |

And the long-context agentic profile, which trades peak throughput for context and warm-session capacity:

| arm | ctx | VRAM | cold prefill | decode | warm return |
|---|---:|---:|---:|---:|---:|
| agentic, no LoRA | 131072 | 15632 MiB | 1007.3 | 30.30 | 116.9 ms |
| agentic + LoRA | 126976 | 15668 MiB | 967.6 | 28.55 | 115.7 ms |

## Why a 27B model fits at 127k at all

The naive arithmetic says it cannot. Multiply 64 layers by a 127k KV cache and the model is unrunnable on this card.

But **only 16 of the 64 layers actually cache KV**. Qwen3.8 is a hybrid architecture, and the other 48 layers use a recurrent/linear mechanism that carries fixed-size state rather than a growing per-token cache. KV cost is therefore about a quarter of what a uniform-attention estimate predicts.

If you size a hybrid model with the dense formula you will conclude it does not fit and never try. This was the single most important number to get right, and it is not something the model card tells you.

## Tiered KV already existed. It needed one flag.

The goal was to keep the active session in VRAM and page idle sessions out to host RAM. `llama.cpp` implements exactly this at session granularity, and every arm I had measured before finding it had the feature silently disabled.

Three conditions must all hold, and missing any one is a silent no-op:

1. `--cache-idle-slots` — enabled by default, fine.
2. `-cram` / `--cache-ram` non-zero. It defaults to 8192, but the server disables the whole path outright if it is 0, so anything that zeroes it kills the feature quietly.
3. `-kvu` / `--kv-unified` — **the one that was missing.** Without it the code saves the prompt to host RAM but never calls `prompt_clear()`, so the VRAM cells are never actually freed.

The gate comment explains why condition 3 exists: without a unified cache, clearing a slot frees no reusable room, because in a partitioned cache slot 1 cannot address slot 2 cells. Freeing them buys nothing. So the feature is correctly gated. It just fails closed and says nothing.

Measured with two 3000-token sessions alternating across two slots:

```
A  first  : prompt_n=3893  ms=4204    <- cold
B  first  : prompt_n=3893  ms=4093    <- B evicts A to host RAM
A  RETURN : prompt_n=4     ms=115     <- 36x faster than reprefill
B  RETURN : prompt_n=4     ms=118
```

**36x on session switch.** Both slots then report `prompt_tokens=0`, confirming the cells genuinely returned to the pool rather than being merely bookkept.

## MTP tuning: the optimum is interior

Multi-token prediction is the largest single throughput lever here, but the depth that wins is not the one either obvious metric predicts.

Going from n=2 to n=4, the **acceptance rate falls monotonically** (0.643, 0.567, 0.505) while the **mean tokens accepted per step rises monotonically** (2.29, 2.70, 3.02). Neither series has a maximum in the middle. The throughput does: n=3 at 51.15, with n=2 and n=4 both below it.

The lesson is that you cannot tune this from either counter alone. Acceptance rate alone says use n=2; mean-accepted alone says use n=4; both are wrong. Only end-to-end tok/s picks n=3, and the gap between best and worst here is 8%.

MTP also has a memory cost that is easy to mis-model. With MTP on, **every extra slot costs 467 MiB**, because each slot carries its own draft state. That was measured directly: `-c 65536 -np 2` booted at 15789 MiB against a 13850 base plus 1472 of KV. I had originally guessed 150 MiB, so the real tax is three times my estimate. With MTP off the per-slot tax is not merely smaller, it is **zero**, which is what makes a 131072 context across two slots fit on this card at all.

## The 15.7 GiB cliff

Both agentic arms land at 15632 and 15668 MiB. That is not a coincidence, it is the whole design constraint.

Past roughly **15.7 GiB** on this 16 GB card, WDDM stops failing allocations and starts silently backing them with host RAM instead. There is no OOM and no error. What you get is halved prefill throughput and conspicuously low GPU power draw, which reads like a bad configuration rather than an allocation problem.

If you are tuning near the top of a consumer card on Windows, watch power and prefill rate as your cliff detector, not the allocator.

## Traps worth knowing

**`iq4_nl` KV silently runs on CPU.** There is no CUDA flash-attention kernel for it, so the attention path falls back to CPU. Six times slower at 28 W. The tell is the graph split count: 34 with the fallback versus 2 without. Nothing in the log says the word "fallback".

**The default context eats your commit budget.** Left unset, the server allocates a 3.5 GiB KV cache you are not using. On Windows the commit limit (RAM plus pagefile), not free RAM, is what caps how many instances you can run, and exceeding it surfaces as an allocation failure that reads exactly like OOM.

**Windows lets two servers bind the same port.** Unlike Linux, a second `llama-server` on an occupied port does not fail. It starts, and you now have two processes serving one port. Every VRAM reading and every A/B result taken in that state is poisoned, and nothing tells you. I lost a set of measurements to this before checking process lists became reflex.

## Configuration

The winning long-context profile, for reference:

```
-c 126976 --no-mtp --kv-unified --parallel 2 --cache-ram 24576
```

MTP is off here deliberately. It wins on single-stream benchmark throughput, but it carries a draft base plus that 467 MiB per-slot tax, and removing both is what lifts the resident context ceiling from about 82k to roughly 206k with no offload. On real agentic work a 36x warm return beats 8% of decode rate.

One last measurement note, because it nearly cost me the card. My first VRAM model for the MTP-off case was **derived by subtracting the draft from the MTP-on numbers** rather than measured. It predicted 14719 MiB at ctx 131072 against an actual 15468, under by 749 MiB. A fit that is wrong in that direction is worse than no fit at all: it waves through exactly the configurations that spill past the cliff, which is the one failure the check exists to catch. Refitting against three genuinely measured MTP-off arms fixed it.

That is the summary of the whole exercise. The benchmark-optimal configuration and the actually-useful configuration were not the same, and no benchmark could have told me which to ship.
