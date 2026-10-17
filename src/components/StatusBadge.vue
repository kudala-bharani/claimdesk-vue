<script setup lang="ts">
import { statusClass } from '../lib/format'
import type { ClaimStatus } from '../types/claim'
defineProps<{ status: ClaimStatus }>()
</script>

<template>
  <span class="status-badge" :class="statusClass(status)"><span class="status-dot" aria-hidden="true"></span>{{ status }}</span>
</template>
