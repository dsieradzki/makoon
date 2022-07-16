<template>
  <Block
      :title="node.name"
      :selected="selected"
      @select="onSelectBlock">
    <div class="bg-stone-700 rounded-xl p-4 mt-3">

      <table class="w-full">
        <tr>
          <td class="w-1/2 pt-1 font-bold">Vmid</td>
          <td class="w-1/2 pt-1 text-center">
            <div class="ml-1 bg-stone-600 px-1 py-1 rounded-xl min-h-[33px]">{{ node.vmid }}</div>
          </td>
        </tr>

        <tr>
          <td class="w-1/2 pt-1 font-bold">Cores</td>
          <td class="w-1/2 pt-1 text-center">
            <div class="ml-1 bg-stone-600 px-1 py-1 rounded-xl min-h-[33px]">{{ node.cores }}</div>
          </td>
        </tr>
        <tr>
          <td class="w-1/2 pt-1  font-bold">Memory</td>
          <td class="w-1/2 pt-1 text-center">
            <div class="ml-1 bg-stone-600 px-2 py-1 rounded-xl min-h-[33px]">{{ node.memory }} MB</div>
          </td>
        </tr>
        <tr>
          <td class="w-1/2 pt-1  font-bold">IP</td>
          <td class="w-1/2 pt-1 text-center">
            <div class="ml-1 bg-stone-600 px-2 py-1 rounded-xl min-h-[33px]">
              {{ node.ipAddress ? node.ipAddress : '[REQUIRED]' }}
            </div>
          </td>
        </tr>

      </table>

    </div>
  </Block>
</template>
<script lang="ts" setup>
import Block from "@/components/Block.vue";
import type {k4p} from "@wails/models";

const props = defineProps<{
  node: k4p.KubernetesNode
  selected?: boolean
}>();

const emits = defineEmits<{
  (e: "select", node: k4p.KubernetesNode): void
}>();

const onSelectBlock = function (): void {
  emits('select', props.node);
}
</script>