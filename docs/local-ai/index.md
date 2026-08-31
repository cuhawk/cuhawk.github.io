# Local AI on one GPU

Running large models and a realtime photoreal avatar on a single consumer laptop: a 16 GB RTX 5080 Laptop, a Ryzen AI 9 HX 370, and 64 GB of RAM. Mixture-of-experts models that do not fit, contexts that should not fit, and lipsync on a face that will not hold still.

Every number in these posts was measured on that box. Where a result was later retracted, I have said so and left the retraction in.

## Posts

- **[DeepSeek-V4-Flash at 14 tok/s](deepseek-v4-flash.md)** — a 79 GiB MoE model on 16 GB of VRAM, from 7.1 to 14.05 tok/s. Expert pruning as a residency lever rather than an arithmetic one, why PCIe expert streaming is dead on this hardware, and the accounting artifact I chased for a week.

- **[Qwen3.8-27B at 127k context](qwen38-27b-16gb.md)** — a 27B hybrid MoE with a 126,976-token context in 16 GB, two warm agentic sessions, and a 36x session-switch speedup that came down to one missing flag.

- **[Lipsync on a moving face](lipsync-on-a-moving-face.md)** — MuseTalk and Ditto against real footage, why the obvious hybrid of the two is worthless, why a spline cannot close a mouth, and how a quality stack that ran at 0.6x realtime silently froze her mouth mid-sentence.

## Recurring themes

If you only take four things from this section:

**Benchmarks lie in specific, repeatable ways.** First-arm transients, instrumentation overhead that is not common-mode, environment leaking between arms, warm-up masquerading as throughput, and build systems that report success for a failed compile. I have been fooled by all five, and each produced a confident number I later had to retract.

**A default present in every arm is invisible.** It cancels out of every A/B you run, so your own data can never point at it. Two of these posts contain a lever worth more than 10% that hid exactly this way for weeks.

**Pick the metric that matches what you actually judge.** Sync correlation rewards the mouth opening when there is sound. The eye watches it *close*. A renderer scored better and looked worse, and both judgements were correct — the metric was measuring the wrong half of speech.

**Derive nothing you can measure, and always render the control arm.** A memory model built by subtraction was wrong by 749 MiB in the direction that approves configurations which silently fall off a cliff. A "guarantee violated" number turned out to read 5.667 with the feature completely disabled.
