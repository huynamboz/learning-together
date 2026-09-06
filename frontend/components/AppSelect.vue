<script setup lang="ts">
import { useAttrs, useId } from 'vue';

defineOptions({ inheritAttrs: false });

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
const generatedId = useId();
const selectId = computed(() => props.id || generatedId);
const focused = ref(false);
const value = computed({
  get: () => props.modelValue,
  set: (nextValue: unknown) => emit('update:modelValue', nextValue)
});
const selectAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest;
});
</script>

<template>
  <div class="app-select-field" :class="attrs.class" :style="attrs.style">
    <label v-if="label" :for="selectId" class="mb-2 block text-xs font-extrabold text-ink/60">{{ label }}</label>
    <div class="relative">
      <select
        :id="selectId"
        :name="name"
        :disabled="disabled"
        v-bind="selectAttrs"
        v-model="value"
        class="app-select w-full appearance-none rounded-2xl border border-line bg-[#F5F6F7] px-4 py-3 pr-11 text-sm font-bold text-ink outline-none transition duration-200 hover:border-iris/40 focus:border-iris focus:ring-4 focus:ring-iris/10 disabled:cursor-not-allowed disabled:opacity-60"
        @focus="focused = true"
        @blur="focused = false"
      >
        <slot />
      </select>
      <span class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink/45 transition duration-200" :class="focused ? 'rotate-180 text-iris' : ''" aria-hidden="true"><AppIcon icon="solar:alt-arrow-down-linear" :size="18" /></span>
    </div>
    <p v-if="hint" class="mt-1.5 text-xs leading-5 text-ink/45">{{ hint }}</p>
  </div>
</template>
