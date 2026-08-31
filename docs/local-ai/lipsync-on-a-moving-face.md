# Lipsync on a moving face: MuseTalk, Ditto, and why the obvious hybrid fails

Most lipsync work assumes a still head. Mine does not: the body is real footage from a precomputed loop bank, so she is turning, gesturing and shifting while the generated mouth has to land on the right pixels every frame. This is what I learned making that work with two renderers, including the hybrid that looked obvious and was worthless.

## Two renderers, measured against each other and against reality

One body loop, five WAVs, 115 seconds of speech, mouth aperture against audio envelope at zero lag:

| renderer | per-clip correlation | mean | cost |
|---|---|---:|---|
| MuseTalk | +0.132 +0.100 +0.014 -0.199 +0.090 | **+0.027** | 0.27x realtime |
| Ditto | +0.162 +0.148 +0.192 +0.025 +0.197 | **+0.145** | 2.37-3.24x realtime |
| real footage | | +0.358 and +0.743 | |

Ditto wins 5 of 5 and is roughly 5x better than MuseTalk. It is also still only about 40% of the way to real footage, and roughly 10x slower, so the live path cannot simply swap to it.

A theory I want to record as **dead**, because it is tempting and I wasted time on it: MuseTalk does not have a fixed timing offset. A single 13-second clip showed an enticing -7 frame lead. Across five clips the best lag scatters -2, -12, -7, -11, -11, with three sitting at the edge of the ±12 search window. That is not an offset, that is maximising over lags on short audio. If your best-lag search keeps returning the window edge, you are fitting noise.

## The metric was wrong, and both my judgements were right

Ditto measured better on sync correlation and read *worse* by eye. That contradiction turned out to be the most useful thing I found.

Correlation rewards "the mouth opens when there is sound." The eye does not watch openings. It locks timing onto **closures** — /m/, /b/, /p/, word boundaries. A renderer can track the envelope beautifully and still look wrong if the lips never actually shut.

Ditto's default `relative_d=True` computes `x_d_info[k] = x_s_info[k] + (v - d0[k]) * alpha`. With a video source, `x_s_info["exp"]` is the body loop's own expression — and every loop is footage of someone *talking*. So it adds generated lip motion on top of an already-open mouth:

| config | closed frames | closures/s | p5 aperture | corr@0 |
|---|---:|---:|---:|---:|
| real footage | 23.6% | 1.65 | 0.0053 | +0.358 |
| MuseTalk | 15.6% | 1.23 | 0.0050 | +0.014 |
| Ditto `relative_d=True` | 1.2% | 0.23 | 0.0551 | +0.184 |
| Ditto `relative_d=False` | 15.2% | 1.14 | 0.0043 | +0.322 |
| + `use_d_keys {"exp":1.2}` | 17.1% | 1.45 | 0.0035 | +0.350 |

**1.2% closed frames against real footage's 23.6%.** The fix is `relative_d=False`, which drops the `x_s_info[k] +` term and uses the model's absolute motion, trained on real speakers who do close their mouths.

Note the trap in the row above it: scaling `exp` alone makes closure *worse* (1.2% to 0.6%). Alpha multiplies only the delta, never the open base, so it widens every opening and never shuts anything. A parameter that improves your headline metric while destroying the thing you actually care about is the normal case, not the exception.

## The hybrid that fails, and why the reason generalises

The obvious idea: Ditto has the better jaw, MuseTalk has the speed, so composite Ditto's jaw with MuseTalk's lips.

The cheap version is a one-line change — substitute Ditto's frame for `ori_frame` in MuseTalk's realtime path. It composites cleanly. It is also worthless:

| arm | corr@0 | closed% | closures/s | p5 ap | jaw~DITTO | jaw~PLAIN |
|---|---:|---:|---:|---:|---:|---:|
| DITTO | 0.311 | 13.3 | 1.16 | 0.0013 | 1.000 | 0.434 |
| PLAIN (MuseTalk) | 0.020 | 8.0 | 0.85 | 0.0064 | 0.434 | 1.000 |
| v0 (cheap hybrid) | 0.001 | 8.3 | 1.08 | 0.0082 | 0.503 | 0.878 |
| v1 (re-prep) | 0.147 | 4.9 | 0.62 | 0.0103 | 0.721 | 0.769 |

**MuseTalk's mask covers the whole lower face, not the lips.** Everything Ditto uniquely contributes — jaw, expression — is inside that mask and gets overwritten. Everything outside it — head pose, body, hands — Ditto already took from the loop unchanged, because it runs `use_d_keys=("exp",)`. There is no region left for Ditto to own. v0 is PLAIN with extra steps: `jaw~DITTO` 0.503 against a floor of 0.434.

That floor matters. Two renders of the same loop share a head pose, so "no jaw preserved at all" scores 0.434, not 0. Without computing the floor, 0.503 looks like partial success.

Only v1 works: re-prep MuseTalk on Ditto's *output* frames, so landmarks, coords, masks and latents are all measured on Ditto's geometry and it inpaints lips into the already-moved jaw. That prep is per-utterance and can never be cached, which makes the hybrid **permanently offline-only** — and kills the live route, because v0 was the only cacheable arm that speed work could have rescued.

**Measure lips and jaw separately.** Jaw as nose-base to chin over face width. One mouth metric cannot distinguish a lost jaw from a changed lip shape, and v0 would have sailed through it.

## Tuned constants are per-frame-set, not per-project

Two of my own carefully tuned numbers became wrong the moment the pipeline changed underneath them, without anything erroring.

`UPPER_RATIO 0.54`, fitted to the loop's crop geometry, is *worse* in a v1 prep (closures/s 0.85 to 0.69). A v1 prep measures landmarks on Ditto's frames, where the anatomically correct boundary is simply a different number. The stock 0.5 won by accident.

`GAIN_BOT 0.95` was tuned when `src` in `src + g*(gen - src)` meant the loop pixel. In the hybrid, `src` is the Ditto pixel — so g=0 is pure Ditto and g=1 is pure MuseTalk, and 0.95 means "5% of Ditto," which is 5% of an already-open mouth. It closed worst of every arm tested.

Also settled by sweep: `jaw~DITTO` sits at ~0.71 in *every* gain arm. **Jaw preservation is a prep-time property and nothing the paste blend can reach.** Do not sweep the ramp for jaw.

## Closing the lips is a seam, not a warp

Neither renderer will shut the mouth on bilabials, so it ends up as an image-space warp applied after both. Worst-case bilabial aperture 0.0263 to 0.0102, with jaw amplitude and non-bilabial motion unchanged.

**A thin-plate spline cannot close a mouth.** The upper and lower inner lip edges must both arrive at the midline from opposite sides, so any continuous map is asked to send one destination point to two source points. A TPS averages them, the midline samples the middle of the gap — the dark interior — and the gap is *reinforced*: 0.0263 becomes 0.0699. The discontinuity at the lip line is the thing being modelled, not an artefact to smooth away. The correct construction is two half-warps cross-faded in image space over about one row; averaging their maps hits exactly the same trap.

Three failure modes on the way, each of which looked like a different bug: extrapolating past the outer-lip anchors tore a rectangle with white smears; a scalar midline drew a hard black bar, because the seam was straight and a mouth is curved (it needs a per-column midline); and a whole-row `np.where` switch staircased.

**All three were invisible to the aperture metric and immediately obvious in a 4x mouth crop.** When tuning a warp, look at the pixels.

## Making it run live

The full quality stack was offline-only, and switching it on before pipelining cost a session:

| configuration | speed |
|---|---|
| bare, serial (historical default) | 1.06x |
| full stack, serial | 0.58-0.61x |
| bare, pipelined | 1.17-1.23x |
| full stack, pipelined + landmark pool | 1.09-1.17x |

Below 1.0x the presenter exhausts its composited frames and falls back to the idle bank, so **her mouth freezes mid-reply while the audio keeps playing.** It presents as nothing at all: complete transcript, no error, no dead process, just ten utterances quietly logging 0.46 to 0.65.

**The cost was the per-frame landmark pass, not the quality layers.** With everything off, mediapipe never runs. The seal needs it on ~7% of frames; coupling and the stabiliser need it on every frame.

Three things I got wrong about optimising that:

**mediapipe's cost is per call, not per pixel.** Detection is 6.69 ms at 0.5 scale and 8.13 ms at full resolution — +22% for 4x the pixels. Three consumers each detecting on the same composited frame were paying three full prices, and lowering the detect scale was never going to help. Sharing one detection: 10.46 to 6.69 ms/frame, with every quality ratio 0.99-1.00 against base.

**Frame-skipping is capped by the seal, and that cap is correct.** Any frame carrying seal weight is forced to a real detection, because the warp must never run on estimated lip corners. On the bilabial corpus that is 52 of 92 frames, 57%. So `every=2` skips only 22 detections and the curve is flat past 2. Landmark tracking is 4x cheaper than detection but carries 0.79 px of lip-ring error, which is not worth 11% when it feeds a 1-3 px geometric warp.

**Cascading the GPU stage buys nothing.** VAE decode is 83% of GPU time (2.61 s against UNet's 0.54 s) and ends in a device-to-host copy, so a third pipeline stage looked free. It is not: cascaded, UNet time goes 0.58 to 2.98 s because the main thread blocks on a device the decoder thread is already saturating. Bit-identical output, zero gain. Two threads do not make one card wider.

Only detection parallelises here. The stabiliser is causal and the tracker is stateful, so the pass has to be composite, then detect in parallel, then seal to stabiliser to coupling strictly in order.

## Benchmark traps specific to this pipeline

**End-to-end FPS cannot measure any of the above.** In the A/B harness the base arm read 12.4 fps and a strictly-more-work arm read 15.1. Reversing the arm order flipped the ranking, because the first arm of every run absorbs the warm-up. Three repeats did not fix it. Use a direct interleaved microbenchmark plus deterministic call counts.

**Both "slow first utterance" bugs were warm-up, not throughput.** The thread pool built lazily, and the forced-aligner's first call compiles CUDA kernels: 1.33 s on line one against 0.07 s afterwards, dragging a 2.64-second line from 1.05x to 0.68x. Warming both at startup with a throwaway alignment moved the minimum across 16 lines from 0.68 to 0.96.

**Always render the control arm with the feature disabled.** The stabiliser's lip-edge deviation is exactly 0.000 offline, where it is the last operation, but non-zero in the pipeline. The arm with the stabiliser entirely *off* reads 5.667 — because a later warp resamples the same region. I nearly attributed that number to the stabiliser.

## Freezing what works

Once a look is approved by eye, it needs a tripwire, because every constant above is silently reinterpretable.

**Hash the functions that produce pixels, not the files.** My first verifier hashed whole modules and failed immediately on a docstring edit and a one-line change to *where* a component sourced its landmarks — nothing in the warp itself. A tripwire that fires on prose gets ignored, and an ignored tripwire is worse than none. It now hashes the source of the specific functions that touch pixels, keeping the module hash alongside as information rather than as a gate.

Fidelity of the frozen stack: bare output is bit-identical, max difference 0. The full stack differs by at most one luma level on 27% of frames, because a second mediapipe instance returns landmarks 1.5e-5 px apart in float32 and that crosses a uint8 rounding boundary after a spline. Every quality ratio measures exactly 1.000.

## Where it landed

The live path is MuseTalk with the tuned stack, a lip seal for bilabials, a mild causal stabiliser and shared landmarks, running at 1.09-1.17x realtime. Ditto is the offline quality reference and the source for anything rendered ahead of time.

The honest summary is that the hybrid did not work the cheap way, the metric that drove early decisions was measuring the wrong half of speech, and most of the wins came from finding out what could not work rather than from tuning what could.
