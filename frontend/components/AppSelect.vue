<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, useSlots, type VNode } from 'vue';

defineOptions({ inheritAttrs: false });

type SelectOption = {
  value: unknown;
  label: string;
  disabled?: boolean;
};

const props = withDefaults(defineProps<{
  modelValue?: unknown;
  label?: string;
  hint?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
}>(), {
  modelValue: undefined,
  disabled: false
});

const emit = defineEmits<{ 'update:modelValue': [value: unknown] }>();
const attrs = useAttrs();
const slots = useSlots();
const generatedId = useId();
const selectId = computed(() => props.id || generatedId);
const menuId = computed(() => `${selectId.value}-menu`);
const accessibleLabel = computed(() => typeof attrs['aria-label'] === 'string' ? attrs['aria-label'] : props.label);
const root = ref<HTMLElement | null>(null);
const open = ref(false);
const highlightedIndex = ref(-1);

const selectAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest;
});

function textFromVNode(node: VNode): string {
  if (typeof node.children === 'string') return node.children;
  if (Array.isArray(node.children)) return node.children.map((child) => typeof child === 'string' ? child : textFromVNode(child as VNode)).join('');
  return '';
}

function flattenOptionNodes(nodes: VNode[]): VNode[] {
  return nodes.flatMap((node) => {
    if (typeof node.type === 'symbol' && Array.isArray(node.children)) return flattenOptionNodes(node.children as VNode[]);
    return node.type === 'option' ? [node] : [];
  });
}

const options = computed<SelectOption[]>(() => flattenOptionNodes(slots.default?.() ?? []).map((node) => {
  const nodeProps = (node.props ?? {}) as Record<string, unknown>;
  return {
    value: 'value' in nodeProps ? nodeProps.value : textFromVNode(node).trim(),
    label: textFromVNode(node).trim(),
    disabled: Boolean(nodeProps.disabled)
  };
}));

const selectedOption = computed(() => options.value.find((option) => Object.is(option.value, props.modelValue)) ?? null);
const displayLabel = computed(() => selectedOption.value?.label || 'Chọn một lựa chọn');

function enabledIndexes() {
  return options.value.map((option, index) => option.disabled ? -1 : index).filter((index) => index >= 0);
}

function findNextIndex(direction: 1 | -1) {
  const indexes = enabledIndexes();
  if (!indexes.length) return -1;
  const currentPosition = indexes.indexOf(highlightedIndex.value);
  const nextPosition = currentPosition === -1
    ? (direction === 1 ? 0 : indexes.length - 1)
    : (currentPosition + direction + indexes.length) % indexes.length;
  return indexes[nextPosition];
}

function openMenu() {
  if (props.disabled || !options.value.length) return;
  open.value = true;
  highlightedIndex.value = Math.max(0, options.value.findIndex((option) => Object.is(option.value, props.modelValue)));
  if (options.value[highlightedIndex.value]?.disabled) highlightedIndex.value = findNextIndex(1);
  nextTick(() => root.value?.querySelector<HTMLElement>(`[data-option-index="${highlightedIndex.value}"]`)?.scrollIntoView({ block: 'nearest' }));
}

function closeMenu() {
  open.value = false;
}

function choose(option: SelectOption, index: number) {
  if (option.disabled) return;
  emit('update:modelValue', option.value);
  highlightedIndex.value = index;
  closeMenu();
}

function onKeydown(event: KeyboardEvent) {
  if (props.disabled) return;
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    if (!open.value) return openMenu();
    highlightedIndex.value = findNextIndex(event.key === 'ArrowDown' ? 1 : -1);
    return;
  }
  if (event.key === 'Home' || event.key === 'End') {
    if (!open.value) return;
    event.preventDefault();
    const indexes = enabledIndexes();
    highlightedIndex.value = event.key === 'Home' ? indexes[0] ?? -1 : indexes.at(-1) ?? -1;
    return;
  }
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    if (!open.value) return openMenu();
    const option = options.value[highlightedIndex.value];
    if (option) choose(option, highlightedIndex.value);
    return;
  }
  if (event.key === 'Escape') {
    event.preventDefault();
    closeMenu();
  }
}

function handleOutsideClick(event: MouseEvent) {
  if (root.value && !root.value.contains(event.target as Node)) closeMenu();
}

onMounted(() => document.addEventListener('mousedown', handleOutsideClick));
onBeforeUnmount(() => document.removeEventListener('mousedown', handleOutsideClick));
</script>

<template>
  <div ref="root" class="app-select-field relative min-w-[180px]" :class="attrs.class" :style="attrs.style">
    <label v-if="label" :for="selectId" class="mb-2 block text-xs font-extrabold text-ink/60">{{ label }}</label>
    <input v-if="name" type="hidden" :name="name" :value="typeof modelValue === 'string' || typeof modelValue === 'number' ? modelValue : ''" />
    <button
      :id="selectId"
      type="button"
      role="combobox"
      :aria-expanded="open"
      :aria-controls="menuId"
      :aria-label="accessibleLabel"
      :disabled="disabled"
      v-bind="selectAttrs"
      class="app-select-trigger group flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-[#F5F6F7] px-4 py-3 text-left text-sm font-bold text-ink outline-none transition duration-200 hover:border-iris/40 focus:border-iris focus:ring-4 focus:ring-iris/10 disabled:cursor-not-allowed disabled:opacity-60"
      @click="open ? closeMenu() : openMenu()"
      @keydown="onKeydown"
    >
      <span class="min-w-0 truncate" :class="selectedOption ? 'text-ink' : 'text-ink/45'">{{ displayLabel }}</span>
      <AppIcon icon="solar:alt-arrow-down-linear" :size="18" class="shrink-0 text-ink/45 transition duration-200 group-hover:text-iris" :class="open ? 'rotate-180 text-iris' : ''" aria-hidden="true" />
    </button>
    <Transition name="app-select-menu">
      <div v-if="open" :id="menuId" class="app-select-menu absolute left-0 right-0 z-50 mt-2 max-h-72 origin-top overflow-y-auto rounded-[18px] border border-line bg-white p-1.5 shadow-[0_12px_24px_rgba(38,50,56,.12)]" role="listbox" :aria-label="label || 'Danh sách lựa chọn'">
        <button
          v-for="(option, index) in options"
          :key="`${index}-${option.label}`"
          type="button"
          role="option"
          :aria-selected="Object.is(option.value, modelValue)"
          :data-option-index="index"
          :disabled="option.disabled"
          :class="[
            'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition',
            option.disabled ? 'cursor-not-allowed text-ink/30' : 'cursor-pointer',
            highlightedIndex === index && !option.disabled ? 'bg-[#EAF8EF] text-ink' : 'text-ink/75 hover:bg-[#F3FBF5] hover:text-ink',
            Object.is(option.value, modelValue) ? 'text-[#46A900]' : ''
          ]"
          @mouseenter="highlightedIndex = index"
          @click="choose(option, index)"
        >
          <span class="min-w-0 truncate">{{ option.label }}</span>
          <AppIcon v-if="Object.is(option.value, modelValue)" icon="solar:check-circle-bold" :size="17" class="shrink-0 text-[#58CC02]" aria-hidden="true" />
        </button>
        <p v-if="!options.length" class="px-3 py-2 text-xs text-ink/45">Chưa có lựa chọn.</p>
      </div>
    </Transition>
    <p v-if="hint" class="mt-1.5 text-xs leading-5 text-ink/45">{{ hint }}</p>
  </div>
</template>

<style scoped>
.app-select-menu-enter-active,
.app-select-menu-leave-active {
  transition: opacity .16s ease, transform .16s cubic-bezier(.22, 1, .36, 1);
}

.app-select-menu-enter-from,
.app-select-menu-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(.98);
}
</style>
