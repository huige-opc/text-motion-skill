<!-- ════════════════════════════════════════════════════════════════
 ⚠️ 强制执行。以下规则 AI 必须逐条遵守，不得绕过、不得简化。
═══════════════════════════════════════════════════════════════════ -->

═══════════════════════════════════════════════════════════════════ -->


# Visual Planning Contract

Pure-graphic SRT videos must stay visually diverse. Do not copy talking-head overlay restrictions into this mode.

## Planning Order

For every pure-graphic scene, decide these before choosing a concrete layout:

1. `semanticAction`: what this scene asks the viewer to understand.
2. `primaryVisualFamily`: the one visual family carrying the scene.
3. `layoutVariant`: the composition variant inside the family.
4. `dominantObject`: the largest object or text group the viewer should notice first.
5. `supportingObjects`: at most two secondary objects.

If a scene has no dominant object, the plan is not ready.

## Semantic Actions

Use one of:

- `claim`: a main assertion or takeaway.
- `mechanism`: why/how something works.
- `data-result`: a number, trend, ranking, growth, or result.
- `process`: steps, workflow, sequence, or operation.
- `comparison`: before/after, A/B, tradeoff, wrong/right.
- `definition`: what a term means or does not mean.
- `evidence`: proof, file, screenshot, case, source, example.
- `decision`: condition, threshold, route, criteria, shortlist.
- `error-fix`: symptom, cause, fix, rebuild.
- `formula`: inputs combine into an output.
- `chapter`: progress, section, current phase.

## Visual Families

Allowed values:

- `statement`: large title, quote, command, editorial type.
- `data`: dominant number, stat deck, cropped ruler, gauge.
- `chart`: trend, interval, marker, band, threshold window.
- `process`: horizontal spine, stepped rail, cascade, operation steps.
- `timeline`: milestones, compressed tempo, turning point.
- `list`: ranked stack, feature board, grouped catalog.
- `compare`: split, recommendation, option board, tradeoff matrix.
- `concept`: core-satellite, layered model, system cutaway.
- `definition`: term breakdown, not-this-that correction.
- `evidence`: proof card, annotation, final file proof.
- `example`: case card, annotated example.
- `transform`: fragments to block, before/after rebuild, compression.
- `rule`: threshold, zone map, correct/wrong example.
- `decision`: forked path, criteria funnel, elimination board.
- `error`: symptom diagnosis, root cause, before/fix/after.
- `formula`: input-to-result, key variable focus.
- `sequence`: command rail, current step zoom, stacked actions.
- `chapter`: progress rail, current chapter stack.

## Layout Quality

- Data/process/code/chart scenes should keep graphic diversity. The goal is not to remove graphics; the goal is to make them readable and dominant.
- Each graphic scene needs one primary object. Charts, process rails, code windows, evidence surfaces, or diagrams must not be tiny insets.
- SRT semantic Chinese text must not be hidden in captions, source labels, meta rails, or small mono labels.
- Kicker/meta text may be small only when it is true metadata: source, unit, index, section, short English category.
- If multiple layouts are needed for the same family, change `layoutVariant`, dominant object placement, or reading path.
- The same `layoutVariant` should not repeat in adjacent scenes.

## Talking-Head Boundary

`talking-head-overlay` is different: it uses safe text packaging because a real video is the primary image. These pure-graphic planning rules apply only when `videoMode !== "talking-head-overlay"`.
