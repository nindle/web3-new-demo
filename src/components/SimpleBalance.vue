<template>
  <div class="simple-balance">
    <h4>💰 简单余额显示</h4>

    <div v-if="isConnected" class="balance-display">
      <p><strong>ETH 余额:</strong> {{ formattedEthBalance }} ETH</p>
      <button @click="refreshBalance" :disabled="isLoading">
        {{ isLoading ? '获取中...' : '刷新余额' }}
      </button>
    </div>

    <div v-else class="not-connected">
      <p>请先连接钱包</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppKitBalance } from '../hooks/useAppKitBalance'

// 直接使用 AppKit 余额 Hook
const {
  isConnected,
  formattedEthBalance,
  isLoading,
  refreshBalances: refreshBalance
} = useAppKitBalance()
</script>

<style scoped>
.simple-balance {
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin: 16px 0;
  background: #f9f9f9;
}

.balance-display {
  display: flex;
  align-items: center;
  gap: 12px;
}

.balance-display p {
  margin: 0;
  font-size: 16px;
}

button {
  padding: 8px 16px;
  background: #007acc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.not-connected {
  text-align: center;
  color: #666;
}
</style>
