<script setup lang="ts">
import { useAttrs, useId } from 'vue';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{
  modelValue?: string | number | null;
  label?: string;
  hint?: string;
  error?: string;
  id?: string;
  name?: string;
  type?: string;
  placeholder?: string;
  autocomplete?: string;
  disabled?: boolean;
  maxlength?: number | string;
  minlength?: number | string;
}>(), {
  modelValue: '',
  type: 'text',
  disabled: false
});

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const generatedId = useId();
const inputId = computed(() => props.id || generatedId);
const attrs = useAttrs();
const inputAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest;
});
</script>

<template>
  <div class="app-input-field" :class="attrs.class" :style="attrs.style">
    <label v-if="label" :for="inputId" class="mb-2 block text-xs font-extrabold text-ink/60">{{ label }}</label>
    <input
      :id="inputId"
      :name="name"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :disabled="disabled"
      :maxlength="maxlength"
      :minlength="minlength"
      v-bind="inputAttrs"
      class="app-input w-full rounded-2xl border border-line px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink/35 disabled:cursor-not-allowed disabled:opacity-60"
      :class="error ? 'border-[#D66B5D]' : ''"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >
    <p v-if="error" class="mt-1.5 text-xs font-bold text-[#B5473A]">{{ error }}</p>
    <p v-else-if="hint" class="mt-1.5 text-xs leading-5 text-ink/45">{{ hint }}</p>
  </div>
</template>
