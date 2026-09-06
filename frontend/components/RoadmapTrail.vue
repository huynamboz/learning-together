<script setup lang="ts">
import { roadmapLayout, stageProgressLabel, type EvaluatedRoadmap, type EvaluatedStage } from '~/utils/roadmap';

const props = defineProps<{
  roadmap: EvaluatedRoadmap;
  accent: string;
  /** A planned track has no lessons behind its stages, so nodes are shown but not offered. */
  interactive: boolean;
  learnerInitial: string;
}>();

/**
 * The canvas is measured and the road drawn in real pixels, one user unit to one device pixel.
 * Stretching a viewBox instead bends the curve out of shape and, worse, makes dash lengths disagree
 * with the path's own measured length — which is exactly what reveals the walked stretch.
 */
const canvas = ref<HTMLElement | null>(null);
const road = ref<SVGPathElement | null>(null);
const width = ref(620);
const roadLength = ref(0);
let observer: ResizeObserver | null = null;

const layout = computed(() => roadmapLayout(props.roadmap.stages.length, { width: width.value }));

const walked = computed(() => {
  const { stages, doneCount, total } = props.roadmap;
  if (total < 2) return 0;
  const partial = stages[doneCount]?.status === 'current' ? stages[doneCount].ratio : 0;
  return Math.min(1, (doneCount + partial) / (total - 1));
});

onMounted(() => {
  const measure = () => { width.value = Math.max(280, canvas.value?.clientWidth ?? 620); };
  measure();
  observer = new ResizeObserver(measure);
  if (canvas.value) observer.observe(canvas.value);
});

// The road is redrawn whenever the canvas changes width, so its length has to be re-measured.
watch(() => layout.value.path, async () => {
  await nextTick();
  roadLength.value = road.value?.getTotalLength() ?? 0;
}, { immediate: true });

onBeforeUnmount(() => observer?.disconnect());

/** Labels sit on the outside of each bend so they never cover the road. */
function labelSide(index: number): 'left' | 'right' {
  return index % 2 === 0 ? 'right' : 'left';
}

const currentNode = ref<HTMLElement | null>(null);

/** The parent's "where am I" button calls this; on a long track the marker is often off-screen. */
function scrollToCurrent() {
  currentNode.value?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

defineExpose({ scrollToCurrent });

function stageLabel(stage: EvaluatedStage): string {
  return stageProgressLabel(stage);
}
</script>

<template>
  <div
    ref="canvas"
    class="roadmap-trail relative"
    :style="{ '--accent': accent, '--trail-width': `${width}px`, height: `${layout.height}px` }"
  >
    <svg class="absolute inset-0" :width="width" :height="layout.height" :viewBox="`0 0 ${width} ${layout.height}`" aria-hidden="true" focusable="false">
      <!-- Three strokes make a road rather than a line: a soft edge, the surface, and a centre line. -->
      <path :d="layout.path" class="road-edge" />
      <path :d="layout.path" class="road-surface" />
      <path
        ref="road"
        :d="layout.path"
        class="road-walked"
        :style="{ strokeDasharray: `${roadLength} ${roadLength}`, strokeDashoffset: roadLength * (1 - walked) }"
      />
      <path :d="layout.path" class="road-centre" />
    </svg>

    <ol class="relative">
      <li
        v-for="stage in roadmap.stages"
        :key="stage.key"
        :ref="(el) => { if (stage.status === 'current') currentNode = el as HTMLElement; }"
        class="stage"
        :style="{ left: `${layout.nodes[stage.index].x}px`, top: `${layout.nodes[stage.index].y}px` }"
        :data-status="stage.status"
      >
        <component
          :is="interactive && stage.status !== 'locked' ? 'NuxtLink' : 'div'"
          :to="interactive && stage.status !== 'locked' ? stage.to : undefined"
          :class="['stage-node grid place-items-center rounded-full focus-ring', `is-${stage.status}`]"
          :aria-label="`${stage.index + 1}. ${stage.title} — ${stageLabel(stage)}`"
        >
          <svg v-if="stage.status === 'current'" class="stage-ring" viewBox="0 0 100 100" aria-hidden="true">
            <circle class="stage-ring-track" cx="50" cy="50" r="45" />
            <circle class="stage-ring-value" cx="50" cy="50" r="45" :style="{ strokeDasharray: 283, strokeDashoffset: 283 * (1 - stage.ratio) }" />
          </svg>
          <AppIcon v-if="stage.status === 'locked'" icon="solar:lock-keyhole-bold" :size="20" aria-hidden="true" />
          <AppIcon v-else-if="stage.status === 'done'" icon="solar:check-read-bold" :size="22" aria-hidden="true" />
          <AppIcon v-else-if="stage.isFinal" icon="solar:cup-star-bold" :size="22" aria-hidden="true" />
          <span v-else class="text-lg font-black">{{ stage.index + 1 }}</span>
        </component>

        <div class="stage-card" :class="labelSide(stage.index) === 'left' ? 'is-left' : 'is-right'">
          <p v-if="stage.status === 'current'" class="stage-eyebrow">ĐANG CHINH PHỤC</p>
          <p v-else-if="stage.isFinal" class="stage-eyebrow is-quiet">CHẶNG CUỐI</p>
          <p class="stage-title">{{ stage.title }}</p>
          <p class="stage-meta">{{ stageLabel(stage) }}</p>
          <p class="stage-detail">{{ stage.detail }}</p>
        </div>

        <div v-if="stage.status === 'current'" class="you-are-here">
          <span class="you-are-here-flag">Bạn đang ở đây</span>
          <span class="you-are-here-avatar">{{ learnerInitial }}</span>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.roadmap-trail { --road: #FFFFFF; --road-edge: #E7E2D6; --ink-soft: rgba(38, 50, 56, .5); --node: 66px; }

.road-edge, .road-surface, .road-walked, .road-centre { fill: none; stroke-linecap: round; }

.road-edge { stroke: var(--road-edge); stroke-width: 30; }
.road-surface { stroke: var(--road); stroke-width: 26; }
/* The walked stretch is the same road, tinted — progress reads as distance covered. */
.road-walked { stroke: color-mix(in srgb, var(--accent) 34%, white); stroke-width: 26; transition: stroke-dashoffset .8s cubic-bezier(.22, 1, .36, 1); }
.road-centre { stroke: color-mix(in srgb, var(--road-edge) 80%, white); stroke-width: 2; stroke-dasharray: 2 12; }

/* A zero-size anchor sitting exactly on the road, so the circle cannot drift off it. */
.stage { position: absolute; height: 0; width: 0; }

.stage-node {
  position: absolute;
  left: 0;
  top: 0;
  height: var(--node);
  width: var(--node);
  translate: -50% -50%;
  border: 4px solid #FFFFFF;
  background: #F1EFE9;
  color: var(--ink-soft);
  box-shadow: 0 6px 14px rgba(38, 50, 56, .12);
  transition: scale .18s cubic-bezier(.22, 1, .36, 1), box-shadow .18s ease;
}

a.stage-node:hover { scale: 1.07; box-shadow: 0 12px 24px rgba(38, 50, 56, .2); }

.stage-node.is-done { background: color-mix(in srgb, var(--accent) 16%, white); color: color-mix(in srgb, var(--accent) 72%, #263238); }

.stage-node.is-current {
  --node: 78px;
  background: var(--accent);
  color: #FFFFFF;
  box-shadow: 0 10px 24px color-mix(in srgb, var(--accent) 38%, transparent);
}

.stage-node.is-locked { cursor: default; }

.stage-ring { position: absolute; inset: -9px; height: calc(100% + 18px); width: calc(100% + 18px); rotate: -90deg; }
.stage-ring-track { fill: none; stroke: rgba(255, 255, 255, .35); stroke-width: 5; }
.stage-ring-value { fill: none; stroke: #FFFFFF; stroke-width: 5; stroke-linecap: round; transition: stroke-dashoffset .8s cubic-bezier(.22, 1, .36, 1); }

/* Width comes from the measured canvas, so a card can never reach past the opposite edge. */
.stage-card {
  position: absolute;
  top: 0;
  width: min(270px, calc(var(--trail-width) * .62 - 52px));
  translate: 0 -50%;
}

.stage-card.is-right { left: 52px; }
.stage-card.is-left { right: 52px; text-align: right; }

.stage-eyebrow { font-size: .625rem; font-weight: 800; letter-spacing: .08em; color: var(--accent); }
.stage-eyebrow.is-quiet { color: rgba(38, 50, 56, .4); }
.stage-title { margin-top: .15rem; font-size: .9375rem; font-weight: 800; color: #263238; text-wrap: balance; }
.stage-meta { margin-top: .1rem; font-size: .6875rem; font-weight: 700; color: var(--ink-soft); font-variant-numeric: tabular-nums; }
.stage-detail { margin-top: .35rem; font-size: .6875rem; line-height: 1.4; color: rgba(38, 50, 56, .45); }

.stage[data-status="locked"] .stage-title { color: rgba(38, 50, 56, .5); }
.stage[data-status="locked"] .stage-detail { color: rgba(38, 50, 56, .35); }

.you-are-here {
  position: absolute;
  left: 0;
  /* Sits clear above the current node rather than on top of it: half the node plus a gap. */
  bottom: 47px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .3rem;
  translate: -50% 0;
  pointer-events: none;
}

.you-are-here-flag {
  border-radius: 999px;
  background: #FFFFFF;
  padding: .25rem .6rem;
  font-size: .625rem;
  font-weight: 800;
  color: var(--accent);
  box-shadow: 0 4px 12px rgba(38, 50, 56, .14);
  white-space: nowrap;
}

.you-are-here-avatar {
  display: grid;
  height: 34px;
  width: 34px;
  place-items: center;
  border-radius: 999px;
  border: 3px solid var(--accent);
  background: #FFFFFF;
  font-size: .75rem;
  font-weight: 900;
  color: var(--accent);
}

@media (max-width: 640px) {
  .roadmap-trail { --node: 52px; }
  .stage-node.is-current { --node: 60px; }
  .stage-card { width: min(270px, calc(var(--trail-width) * .62 - 44px)); }
  .stage-card.is-right { left: 44px; }
  .stage-card.is-left { right: 44px; }
  .stage-detail { display: none; }
  .you-are-here { bottom: 38px; }
}

@media (prefers-reduced-motion: reduce) {
  .road-walked, .stage-ring-value, .stage-node { transition: none; }
}
</style>
