<template>
  <div class="overlay" @click.self="$emit('close')">
    <form class="card" @submit.prevent="onSubmit" novalidate>
      <h2>{{ initial?.id ? 'Edit contact' : 'Add contact' }}</h2>

      <label>Name *
        <input v-model.trim="form.name" required maxlength="255" />
        <small v-if="fieldErrors.name">{{ fieldErrors.name }}</small>
      </label>

      <label>Phone *
        <input v-model.trim="form.phoneNumber" required maxlength="50" @blur="checkUnique" />
        <small v-if="fieldErrors.phoneNumber">{{ fieldErrors.phoneNumber }}</small>
        <small v-if="phoneTaken" class="taken">This phone number is already used.</small>
      </label>

      <label>Email
        <input v-model.trim="form.email" type="email" maxlength="255" />
        <small v-if="fieldErrors.email">{{ fieldErrors.email }}</small>
      </label>

      <label>Address
        <textarea v-model.trim="form.address" rows="2"></textarea>
      </label>

      <p v-if="serverError" class="server-error">{{ serverError }}</p>

      <div class="row">
        <button type="button" @click="$emit('close')">Cancel</button>
        <button type="submit" class="primary" :disabled="busy || phoneTaken">
          {{ busy ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { checkPhone } from '../api.js';

const props = defineProps({
  initial: { type: Object, default: null },
  busy: { type: Boolean, default: false },
  serverError: { type: String, default: '' },
});
const emit = defineEmits(['close', 'submit']);

const form = reactive({
  name: props.initial?.name || '',
  phoneNumber: props.initial?.phoneNumber || '',
  email: props.initial?.email || '',
  address: props.initial?.address || '',
});
const fieldErrors = ref({});
const phoneTaken = ref(false);

watch(() => props.initial, (v) => {
  form.name = v?.name || '';
  form.phoneNumber = v?.phoneNumber || '';
  form.email = v?.email || '';
  form.address = v?.address || '';
  phoneTaken.value = false;
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+()\-.\s\d]{5,30}$/;

function validate() {
  const errors = {};
  if (!form.name) errors.name = 'Name is required.';
  if (!form.phoneNumber) errors.phoneNumber = 'Phone is required.';
  else if (!PHONE_RE.test(form.phoneNumber)) errors.phoneNumber = 'Phone format is invalid.';
  if (form.email && !EMAIL_RE.test(form.email)) errors.email = 'Email format is invalid.';
  fieldErrors.value = errors;
  return Object.keys(errors).length === 0;
}

async function checkUnique() {
  phoneTaken.value = false;
  if (!form.phoneNumber || !PHONE_RE.test(form.phoneNumber)) return;
  try {
    const res = await checkPhone(form.phoneNumber, props.initial?.id || null);
    phoneTaken.value = !!res.exists;
  } catch {
    // Non-blocking: server validation will catch real errors.
  }
}

function onSubmit() {
  if (!validate() || phoneTaken.value) return;
  emit('submit', {
    name: form.name,
    phoneNumber: form.phoneNumber,
    email: form.email || null,
    address: form.address || null,
  });
}
</script>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(16,24,40,.5); display: grid; place-items: center; padding: 16px; }
.card { background: #fff; border-radius: 12px; padding: 20px; width: min(480px, 100%); display: grid; gap: 12px; }
label { display: grid; gap: 4px; font-weight: 600; }
input, textarea { padding: 8px 10px; font: inherit; font-weight: 400; }
small { color: #b42318; font-weight: 400; }
.taken { color: #b42318; }
.server-error { color: #b42318; }
.row { display: flex; justify-content: flex-end; gap: 8px; }
.primary { background: #2563eb; color: #fff; border: none; border-radius: 6px; padding: 8px 14px; cursor: pointer; }
</style>
