<script setup lang="ts">
import { RouterView } from 'vue-router'
import DynamicDialog from 'primevue/dynamicdialog';</script>

<template>
  <DynamicDialog/>
  <RouterView />
</template>

<style>
@import '@/assets/base.css';

</style>
