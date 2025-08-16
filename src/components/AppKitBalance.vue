<template>
  <div class="appkit-balance">
    <h3>💰 AppKit 钱包余额</h3>

    <!-- 连接状态 -->
    <div v-if="!isConnected" class="not-connected">
      <p>⚠️ 请先连接钱包以查看余额</p>
    </div>

    <!-- 余额信息 -->
    <div v-else class="balance-info">
      <!-- 用户地址 -->
      <div class="address-section">
        <span class="label">钱包地址:</span>
        <span class="address">{{ userAddress?.slice(0, 6) }}...{{ userAddress?.slice(-4) }}</span>
      </div>

      <!-- 网络信息 -->
      <div class="network-section">
        <span class="label">当前网络:</span>
        <span class="network">Chain ID: {{ currentChainId || '未知' }}</span>
      </div>

      <!-- ETH 余额 -->
      <div class="eth-balance-section">
        <div class="balance-row">
          <span class="token-name">ETH</span>
          <span v-if="isLoading" class="balance loading">获取中...</span>
          <span v-else class="balance">{{ formattedEthBalance }} ETH</span>
        </div>
        <button @click="refreshBalances" :disabled="isLoading" class="refresh-btn">
          🔄 {{ isLoading ? '刷新中...' : '刷新余额' }}
        </button>
      </div>

      <!-- 代币余额测试 -->
      <div class="token-section">
        <h4>🪙 代币余额测试</h4>
        <div class="token-input">
          <input
            v-model="testTokenAddress"
            placeholder="输入代币合约地址 (0x...)"
            class="token-address-input"
          />
          <input
            v-model.number="testTokenDecimals"
            placeholder="精度"
            type="number"
            min="0"
            max="18"
            class="token-decimals-input"
          />
          <button
            @click="fetchTestTokenBalance"
            :disabled="!testTokenAddress || isLoading"
            class="fetch-btn"
          >
            获取
          </button>
        </div>

        <!-- 显示代币余额 -->
        <div v-if="Object.keys(tokenBalances).length > 0" class="token-balances">
          <div
            v-for="(balance, address) in tokenBalances"
            :key="address"
            class="token-balance-item"
          >
            <span class="token-address">{{ address.slice(0, 6) }}...{{ address.slice(-4) }}</span>
            <span class="token-balance">{{ getFormattedTokenBalance(address) }}</span>
          </div>
        </div>
      </div>

      <!-- 错误信息 -->
      <div v-if="error" class="error-section">
        <p class="error">❌ {{ error }}</p>
        <button @click="error = null" class="clear-error-btn">清除错误</button>
      </div>

      <!-- 调试信息 -->
      <details class="debug-section">
        <summary>🔧 调试信息</summary>
        <pre class="debug-info">{{ debugInfo }}</pre>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppKitBalance } from '../hooks/useAppKitBalance'

// 使用 AppKit 余额 Hook
const {
  ethBalance,
  tokenBalances,
  isLoading,
  error,
  userAddress,
  isConnected,
  currentChainId,
  formattedEthBalance,
  fetchTokenBalance,
  refreshBalances,
  getFormattedTokenBalance
} = useAppKitBalance()

// 测试代币地址输入
const testTokenAddress = ref('')
const testTokenDecimals = ref(18)

// 获取测试代币余额
const fetchTestTokenBalance = async () => {
  if (!testTokenAddress.value) return

  await fetchTokenBalance(testTokenAddress.value, testTokenDecimals.value)

  // 清空输入框
  testTokenAddress.value = ''
  testTokenDecimals.value = 18
}

// 调试信息
const debugInfo = computed(() => ({
  userAddress: userAddress.value,
  isConnected: isConnected.value,
  currentChainId: currentChainId.value,
  ethBalance: ethBalance.value,
  tokenBalances: tokenBalances.value,
  isLoading: isLoading.value,
  error: error.value
}))
</script>

<style scoped>
.appkit-balance {
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 20px;
  margin: 16px 0;
  background: #ffffff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.appkit-balance h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 18px;
}

.not-connected {
  text-align: center;
  padding: 20px;
  color: #666;
}

.balance-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.address-section,
.network-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 14px;
}

.label {
  font-weight: 600;
  color: #555;
}

.address {
  font-family: monospace;
  color: #007acc;
}

.network {
  color: #28a745;
  font-weight: 500;
}

.eth-balance-section {
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
}

.balance-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.token-name {
  font-size: 16px;
  font-weight: 600;
}

.balance {
  font-size: 18px;
  font-weight: 700;
}

.balance.loading {
  opacity: 0.7;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

.refresh-btn {
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.3);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.token-section {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.token-section h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 14px;
}

.token-input {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.token-address-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

.token-decimals-input {
  width: 80px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
}

.fetch-btn {
  background: #007acc;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.fetch-btn:hover:not(:disabled) {
  background: #005a9e;
}

.fetch-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.token-balances {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.token-balance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e1e5e9;
}

.token-address {
  font-family: monospace;
  font-size: 12px;
  color: #666;
}

.token-balance {
  font-weight: 600;
  color: #333;
}

.error-section {
  padding: 12px;
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 6px;
}

.error {
  color: #e53e3e;
  margin: 0 0 8px 0;
  font-size: 14px;
}

.clear-error-btn {
  background: none;
  border: 1px solid #e53e3e;
  color: #e53e3e;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.debug-section {
  margin-top: 16px;
  padding: 8px;
  background: #f1f3f4;
  border-radius: 4px;
}

.debug-section summary {
  cursor: pointer;
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.debug-info {
  font-size: 11px;
  background: white;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #e1e5e9;
  overflow-x: auto;
  margin: 0;
}
</style>
