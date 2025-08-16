<template>
  <div class="token-transfer">
    <h2>代币转账系统</h2>

    <!-- 连接状态 -->
    <div v-if="!isConnected" class="connection-warning">
      <p>⚠️ 请先连接钱包以使用代币转账功能</p>
    </div>

    <div v-else class="connected-content">
      <!-- 账户信息 -->
      <div class="account-section">
        <h3>账户信息</h3>
        <div class="account-info">
          <div class="info-item">
            <span class="label">钱包地址:</span>
            <span class="address">{{ userAddress?.slice(0, 6) }}...{{ userAddress?.slice(-4) }}</span>
          </div>
          <div class="info-item">
            <span class="label">ETH余额:</span>
            <span class="balance">{{ formatEthBalance(ethBalance) }}</span>
          </div>
        </div>
      </div>

      <!-- 代币信息 -->
      <div class="token-section">
        <h3>代币信息</h3>
        <div class="token-info">
          <div class="info-item">
            <span class="label">代币名称:</span>
            <span class="value">{{ tokenName || '加载中...' }}</span>
          </div>
          <div class="info-item">
            <span class="label">代币符号:</span>
            <span class="value">{{ tokenSymbol || '加载中...' }}</span>
          </div>
          <div class="info-item">
            <span class="label">当前余额:</span>
            <span class="balance" :class="{ loading: isBalanceLoading }">
              {{ isBalanceLoading ? '加载中...' : formatBalance(balance) }}
            </span>
            <button @click="refetchBalance" :disabled="isBalanceLoading" class="refresh-btn">
              {{ isBalanceLoading ? '⟳' : '🔄' }}
            </button>
          </div>
          <div class="info-item">
            <span class="label">授权额度:</span>
            <span class="balance" :class="{ loading: isAllowanceLoading }">
              {{ isAllowanceLoading ? '加载中...' : formatBalance(allowance) }}
            </span>
            <button @click="refetchAllowance" :disabled="isAllowanceLoading" class="refresh-btn">
              {{ isAllowanceLoading ? '⟳' : '🔄' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 转账表单 -->
      <div class="transfer-form">
        <h3>代币转账</h3>

        <div class="input-group">
          <label for="amount">转账金额 ({{ tokenSymbol || 'TOKEN' }}):</label>
          <div class="amount-input">
            <input
              id="amount"
              v-model="transferAmount"
              type="text"
              placeholder="请输入转账金额 (例如: 1.5, 0.001)"
              :disabled="isTransactionPending"
              @input="handleAmountInput"
              @blur="formatAmountInput"
            />
            <button
              @click="setMaxAmount"
              :disabled="!balance || isTransactionPending"
              class="max-btn"
            >
              MAX
            </button>
          </div>
          <div class="amount-validation">
            <div v-if="validationError" class="error-text">
              ❌ {{ validationError }}
            </div>
            <div v-else-if="transferAmount" class="valid-text">
              ✓ 转账金额: {{ transferAmount }} {{ tokenSymbol }}
            </div>
            <div v-else class="hint-text">
              💡 支持格式: 1, 1.5, 0.001 等。最多支持 {{ tokenDecimals }} 位小数
            </div>
          </div>
        </div>

        <div class="input-group">
          <label for="recipient">收款地址:</label>
          <input
            id="recipient"
            v-model="recipientAddress"
            type="text"
            placeholder="请输入收款地址"
            :disabled="isTransactionPending"
          />
          <div class="preset-addresses">
            <button
              @click="recipientAddress = CONTRACT_ADDRESSES.RECIPIENT_ADDRESS"
              class="preset-btn"
            >
              默认收款地址
            </button>
            <button
              @click="recipientAddress = CONTRACT_ADDRESSES.PERSONAL_WALLET"
              class="preset-btn"
            >
              个人钱包
            </button>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="button-group">
          <div class="action-section">
            <h4>1. 授权代币 (如需要)</h4>
            <div class="action-info">
              <span v-if="transferAmount && checkAllowance(transferAmount)" class="success-text">
                ✓ 授权额度充足
              </span>
              <span v-else-if="transferAmount" class="warning-text">
                ⚠️ 需要授权 {{ transferAmount }} {{ tokenSymbol }}
              </span>
            </div>
            <button
              @click="handleApprove"
              :disabled="!transferAmount || validationError || isTransactionPending"
              class="approve-btn"
            >
              {{ isTransactionPending ? '处理中...' : `授权 ${transferAmount || '0'} ${tokenSymbol || 'TOKEN'}` }}
            </button>
          </div>

          <div class="action-section">
            <h4>2. 执行转账</h4>
            <div class="transfer-options">
              <button
                @click="handleDirectTransfer"
                :disabled="!transferAmount || !recipientAddress || validationError || isTransactionPending"
                class="transfer-btn"
              >
                {{ isTransactionPending ? '处理中...' : '直接转账' }}
              </button>

              <button
                @click="handleContractTransfer"
                :disabled="!transferAmount || validationError || isTransactionPending || !checkAllowance(transferAmount)"
                class="contract-transfer-btn"
              >
                {{ isTransactionPending ? '处理中...' : '合约转账' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 交易状态 -->
      <div v-if="hash" class="transaction-status">
        <h3>交易状态</h3>
        <div class="status-content">
          <div class="status-item">
            <span class="label">交易哈希:</span>
            <span class="hash">{{ hash.slice(0, 10) }}...{{ hash.slice(-8) }}</span>
            <a :href="`https://etherscan.io/tx/${hash}`" target="_blank" class="view-link">查看</a>
          </div>
          <div class="status-indicator">
            <div v-if="txStatus === 'pending'" class="status pending">
              <span class="spinner">⏳</span>
              <span>交易确认中...</span>
            </div>
            <div v-else-if="txStatus === 'success'" class="status success">
              <span>✅</span>
              <span>交易成功完成!</span>
            </div>
            <div v-else-if="txStatus === 'error'" class="status error">
              <span>❌</span>
              <span>交易失败</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 错误信息 -->
      <div v-if="transactionError || error" class="error-section">
        <h3>错误信息</h3>
        <div class="error-content">
          <p>{{ transactionError || error }}</p>
          <button @click="resetTransaction" class="retry-btn">重试</button>
        </div>
      </div>

      <!-- 合约地址信息 -->
      <div class="address-info">
        <h3>合约信息</h3>
        <div class="address-grid">
          <div class="address-item">
            <span class="label">代币地址:</span>
            <span class="address">{{ CONTRACT_ADDRESSES.TOKEN_ADDRESS }}</span>
            <button @click="copyToClipboard(CONTRACT_ADDRESSES.TOKEN_ADDRESS)" class="copy-btn">📋</button>
          </div>
          <div class="address-item">
            <span class="label">合约地址:</span>
            <span class="address">{{ CONTRACT_ADDRESSES.CONTRACT_ADDRESS }}</span>
            <button @click="copyToClipboard(CONTRACT_ADDRESSES.CONTRACT_ADDRESS)" class="copy-btn">📋</button>
          </div>
          <div class="address-item">
            <span class="label">个人钱包:</span>
            <span class="address">{{ CONTRACT_ADDRESSES.PERSONAL_WALLET }}</span>
            <button @click="copyToClipboard(CONTRACT_ADDRESSES.PERSONAL_WALLET)" class="copy-btn">📋</button>
          </div>
          <div class="address-item">
            <span class="label">收款地址:</span>
            <span class="address">{{ CONTRACT_ADDRESSES.RECIPIENT_ADDRESS }}</span>
            <button @click="copyToClipboard(CONTRACT_ADDRESSES.RECIPIENT_ADDRESS)" class="copy-btn">📋</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTokenTransfer } from '../hooks/useTokenTransfer'
import { CONTRACT_ADDRESSES } from '../contracts/addresses'
import { formatUnits } from 'viem'

const {
  // 基础状态
  transferAmount,
  recipientAddress,
  isLoading,
  error,
  txStatus,
  hash,

  // 账户信息
  userAddress,
  isConnected,

  // 代币信息
  tokenName,
  tokenSymbol,
  tokenDecimals,
  balance,
  allowance,
  ethBalance,

  // 加载状态
  isTransactionPending,
  transactionError,
  isConfirmed,
  isBalanceLoading,
  isAllowanceLoading,

  // 工具函数
  formatBalance,
  formatEthBalance,
  checkAllowance,
  validateTransfer,

  // 核心方法
  approveToken,
  transferToken,
  transferFromContract,

  // 数据刷新
  refetchBalance,
  refetchAllowance,
  refreshData,
  resetTransaction
} = useTokenTransfer()

// 验证错误信息
const validationError = computed(() => {
  if (!transferAmount.value) return null
  return validateTransfer(transferAmount.value, recipientAddress.value)
})

// 处理金额输入
const handleAmountInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  let value = target?.value

  // 确保value是字符串并进行安全检查
  if (value === null || value === undefined) {
    value = ''
  } else if (typeof value !== 'string') {
    value = String(value)
  }

  // 只允许数字、小数点
  value = value.replace(/[^0-9.]/g, '')

  // 防止多个小数点
  if (value.includes('.')) {
    const parts = value.split('.')
    if (Array.isArray(parts) && parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('')
    }
  }

  // 防止以多个0开头（除非是0.xxx格式）
  if (value.length > 1 && value.startsWith('0') && value[1] !== '.') {
    value = value.replace(/^0+/, '') || '0'
  }

  // 限制长度，防止过长的输入
  if (value.length > 30) {
    value = value.substring(0, 30)
  }

  transferAmount.value = value
}

// 格式化金额输入（失去焦点时）
const formatAmountInput = () => {
  if (!transferAmount.value) return

  const numValue = parseFloat(transferAmount.value)
  if (!isNaN(numValue)) {
    // 移除尾随的零和小数点
    transferAmount.value = numValue.toString()
  }
}

// 设置最大金额
const setMaxAmount = () => {
  if (balance.value) {
    const maxAmount = formatUnits(balance.value, tokenDecimals.value)
    // 移除尾随的零
    const numValue = parseFloat(maxAmount)
    transferAmount.value = numValue.toString()
  }
}

// 处理授权
const handleApprove = async () => {
  if (!transferAmount.value) return
  const success = await approveToken(transferAmount.value)
  if (success) {
    console.log('授权成功')
  }
}

// 处理直接转账
const handleDirectTransfer = async () => {
  if (!transferAmount.value || !recipientAddress.value) return
  const success = await transferToken(recipientAddress.value, transferAmount.value)
  if (success) {
    console.log('转账成功')
  }
}

// 处理合约转账
const handleContractTransfer = async () => {
  if (!transferAmount.value) return
  const success = await transferFromContract(transferAmount.value)
  if (success) {
    console.log('合约转账成功')
  }
}

// 复制到剪贴板
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    console.log('已复制到剪贴板')
  } catch (err) {
    console.error('复制失败:', err)
  }
}
</script>

<style scoped>
.token-transfer {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.token-transfer h2 {
  text-align: center;
  color: #1a202c;
  margin-bottom: 30px;
  font-size: 28px;
  font-weight: 700;
}

.connection-warning {
  background: #fed7e2;
  border: 1px solid #f56565;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  color: #c53030;
  font-weight: 600;
}

.connected-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.account-section,
.token-section,
.transfer-form,
.transaction-status,
.error-section,
.address-info {
  background: white;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.account-section h3,
.token-section h3,
.transfer-form h3,
.transaction-status h3,
.error-section h3,
.address-info h3 {
  margin: 0 0 16px 0;
  color: #2d3748;
  font-size: 20px;
  font-weight: 600;
}

.account-info,
.token-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f7fafc;
  border-radius: 8px;
}

.info-item .label {
  font-weight: 600;
  color: #4a5568;
}

.info-item .address,
.info-item .balance,
.info-item .value {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 14px;
  color: #2d3748;
}

.refresh-btn {
  margin-left: 8px;
  padding: 4px 8px;
  border: none;
  background: #edf2f7;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #e2e8f0;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2d3748;
  font-size: 16px;
}

.amount-input {
  display: flex;
  gap: 8px;
  align-items: center;
}

.input-group input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.input-group input:focus {
  outline: none;
  border-color: #3182ce;
}

.input-group input:disabled {
  background-color: #f7fafc;
  cursor: not-allowed;
}

.max-btn {
  padding: 12px 16px;
  background: #3182ce;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.max-btn:hover:not(:disabled) {
  background: #2c5aa0;
}

.max-btn:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

.amount-validation {
  margin-top: 8px;
  font-size: 14px;
}

.error-text {
  color: #e53e3e;
  font-weight: 600;
}

.valid-text {
  color: #38a169;
  font-weight: 600;
}

.warning-text {
  color: #d69e2e;
}

.success-text {
  color: #38a169;
}

.hint-text {
  color: #718096;
  font-size: 13px;
  font-style: italic;
}

.preset-addresses {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.preset-btn {
  padding: 6px 12px;
  background: #edf2f7;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  background: #e2e8f0;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.action-section {
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f7fafc;
}

.action-section h4 {
  margin: 0 0 8px 0;
  color: #2d3748;
  font-size: 16px;
}

.action-info {
  margin-bottom: 12px;
  font-size: 14px;
}

.transfer-options {
  display: flex;
  gap: 12px;
}

.approve-btn,
.transfer-btn,
.contract-transfer-btn {
  flex: 1;
  padding: 14px 20px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.approve-btn {
  background: #48bb78;
  color: white;
}

.approve-btn:hover:not(:disabled) {
  background: #38a169;
}

.transfer-btn {
  background: #4299e1;
  color: white;
}

.transfer-btn:hover:not(:disabled) {
  background: #3182ce;
}

.contract-transfer-btn {
  background: #ed8936;
  color: white;
}

.contract-transfer-btn:hover:not(:disabled) {
  background: #dd6b20;
}

.approve-btn:disabled,
.transfer-btn:disabled,
.contract-transfer-btn:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

.status-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-item .hash {
  font-family: monospace;
  color: #4a5568;
}

.view-link {
  color: #3182ce;
  text-decoration: none;
  font-weight: 600;
}

.view-link:hover {
  text-decoration: underline;
}

.status-indicator {
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}

.status.pending {
  color: #d69e2e;
  background: #faf089;
}

.status.success {
  color: #38a169;
  background: #9ae6b4;
}

.status.error {
  color: #e53e3e;
  background: #fed7e2;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-content {
  text-align: center;
}

.error-content p {
  color: #e53e3e;
  margin-bottom: 16px;
}

.retry-btn {
  padding: 8px 16px;
  background: #e53e3e;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.retry-btn:hover {
  background: #c53030;
}

.address-grid {
  display: grid;
  gap: 12px;
}

.address-item {
  display: grid;
  grid-template-columns: 120px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  background: #f7fafc;
  border-radius: 8px;
}

.address-item .address {
  font-family: monospace;
  font-size: 13px;
  word-break: break-all;
  color: #4a5568;
}

.copy-btn {
  padding: 4px 8px;
  border: none;
  background: #edf2f7;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.copy-btn:hover {
  background: #e2e8f0;
}

@media (max-width: 768px) {
  .token-transfer {
    padding: 16px;
  }

  .transfer-options {
    flex-direction: column;
  }

  .address-item {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .amount-input {
    flex-direction: column;
  }

  .preset-addresses {
    flex-direction: column;
  }
}
</style>