
<template>
   <div class="pages">
      <img src="/reown.svg" alt="Reown" width="150" height="150" />
      <h1> Web3 代币转账系统 demo </h1>

      <appkit-button v-if="isAppkitReady" />
      <ActionButtonList v-if="isAppkitReady" />

      <!-- 代币转账组件 -->
      <TokenTransfer v-if="isAppkitReady" />

      <InfoList v-if="isAppkitReady" />
    </div>
</template>


<script setup lang="ts">
import {
  createAppKit,
} from '@reown/appkit/vue'
import {wagmiAdapter , networks, projectId } from './config/index'
import { ref } from 'vue'
import ActionButtonList from "./components/ActionButton.vue";
import InfoList from "./components/InfoList.vue";
import TokenTransfer from "./components/TokenTransfer.vue";

// Initialize AppKit
const appkit =  createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  themeMode: 'light',
  features: {
    connectMethodsOrder: ['email', 'social', 'wallet'],
    analytics: true, // Optional - defaults to your Cloud configuration
  },
  metadata: {
    name: 'AppKit Vue Example',
    description: 'AppKit Vue Example',
    url: 'https://reown.com/appkit',
    icons: ['https://avatars.githubusercontent.com/u/179229932?s=200&v=4']
  },
  themeVariables: {
    '--w3m-accent': '#000000',
  }
})

const isAppkitReady = ref(false)
if (appkit) {
  setTimeout(() => {
    isAppkitReady.value = true
  }, 1000)

}

</script>