<template>
  <div class="app">
    <header>
      <h1>Phonebook</h1>
      <p class="sub">CyberMax Solutions · Vue 3 SPA + Express JSON API</p>
    </header>

    <section class="toolbar">
      <input
        v-model="searchInput"
        @input="onSearchInput"
        type="search"
        placeholder="Search name, phone, email…"
        aria-label="Search contacts"
      />
      <select v-model.number="pageSize" @change="reload(1)" aria-label="Page size">
        <option :value="5">5 / page</option>
        <option :value="10">10 / page</option>
        <option :value="20">20 / page</option>
      </select>
      <button class="primary" @click="openAdd">+ Add contact</button>
    </section>

    <p v-if="loading" class="state">Loading…</p>
    <p v-else-if="error" class="state error">{{ error }}</p>

    <table v-if="!loading && contacts.length">
      <thead>
        <tr><th>Name</th><th>Phone</th><th>Email</th><th>Address</th><th></th></tr>
      </thead>
      <tbody>
        <tr v-for="contact in contacts" :key="contact.id">
          <td>{{ contact.name }}</td>
          <td>{{ contact.phoneNumber }}</td>
          <td>{{ contact.email || '—' }}</td>
          <td>{{ contact.address || '—' }}</td>
          <td class="actions">
            <button @click="openEdit(contact)">Edit</button>
            <button class="danger" @click="remove(contact)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-if="!loading && !error && !contacts.length" class="state">No contacts found.</p>

    <nav v-if="totalPages > 1" class="pager">
      <button :disabled="currentPage <= 1" @click="reload(currentPage - 1)">‹ Prev</button>
      <span>Page {{ currentPage }} of {{ totalPages }} · {{ totalCount }} contacts</span>
      <button :disabled="currentPage >= totalPages" @click="reload(currentPage + 1)">Next ›</button>
    </nav>
    <p v-else class="count">{{ totalCount }} contact(s)</p>

    <ContactForm
      v-if="showForm"
      :initial="editing"
      :busy="saving"
      :server-error="formError"
      @close="closeForm"
      @submit="save"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ContactForm from './components/ContactForm.vue';
import { fetchContacts, createContact, updateContact, deleteContact } from './api.js';

const contacts = ref([]);
const totalPages = ref(0);
const totalCount = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const searchInput = ref('');
const searchTerm = ref('');
const loading = ref(false);
const error = ref('');
const showForm = ref(false);
const editing = ref(null);
const saving = ref(false);
const formError = ref('');
let searchTimer = null;

async function loadContacts(pageNumber = 1, size = pageSize.value, term = searchTerm.value) {
  loading.value = true;
  error.value = '';
  try {
    const result = await fetchContacts(pageNumber, size, term);
    contacts.value = result.items;
    totalPages.value = result.totalPages;
    totalCount.value = result.totalCount;
    currentPage.value = result.currentPage;
  } catch (e) {
    error.value = e.message || 'Failed to load contacts';
  } finally {
    loading.value = false;
  }
}

function reload(page = 1) {
  loadContacts(page, pageSize.value, searchTerm.value);
}

function onSearchInput() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchTerm.value = searchInput.value.trim();
    reload(1);
  }, 300);
}

function openAdd() {
  editing.value = null;
  formError.value = '';
  showForm.value = true;
}

function openEdit(contact) {
  editing.value = { ...contact };
  formError.value = '';
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  editing.value = null;
  formError.value = '';
}

async function save(payload) {
  saving.value = true;
  formError.value = '';
  try {
    if (editing.value?.id) await updateContact(editing.value.id, payload);
    else await createContact(payload);
    closeForm();
    await reload(editing.value ? currentPage.value : 1);
  } catch (e) {
    formError.value = [...(e.errors || []), e.message].filter(Boolean).join(' ');
  } finally {
    saving.value = false;
  }
}

async function remove(contact) {
  if (!confirm(`Delete ${contact.name}?`)) return;
  try {
    await deleteContact(contact.id);
    if (contacts.value.length === 1 && currentPage.value > 1) await reload(currentPage.value - 1);
    else await reload(currentPage.value);
  } catch (e) {
    alert(e.message || 'Delete failed');
  }
}

onMounted(() => reload(1));
</script>

<style>
* { box-sizing: border-box; }
body { font-family: system-ui, sans-serif; margin: 0; background: #f6f7f9; color: #1c2430; }
.app { max-width: 960px; margin: 0 auto; padding: 24px; }
header h1 { margin: 0; }
.sub { color: #5b6b7f; margin-top: 4px; }
.toolbar { display: flex; gap: 8px; margin: 16px 0; flex-wrap: wrap; }
.toolbar input[type="search"] { flex: 1; min-width: 200px; padding: 8px 10px; }
.toolbar select, .toolbar button, td button, .pager button { padding: 8px 12px; }
button.primary { background: #2563eb; color: #fff; border: none; border-radius: 6px; cursor: pointer; }
button.danger { color: #b42318; }
table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; }
th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #eef1f4; }
.actions { white-space: nowrap; display: flex; gap: 6px; }
.state { padding: 12px; }
.error { color: #b42318; }
.pager { display: flex; gap: 12px; align-items: center; margin-top: 12px; }
.count { color: #5b6b7f; }
</style>
