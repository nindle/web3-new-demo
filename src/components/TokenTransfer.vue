<template>
  <div class="token-transfer">
    <h2>代币转账</h2>

    <!-- 余额显示 -->
    <div class="balance-section">
      <p>当前余额: {{ formatBalance(balance) }} 代币</p>
      <button @click="refetchBalance" :disabled="isTransactionPending">刷新余额</button>
    </div>

    <!-- 授权额度显示 -->
    <div class="allowance-section">
      <p>授权额度: {{ formatBalance(allowance) }} 代币</p>
      <button @click="refetchAllowance" :disabled="isTransactionPending">刷新授权</button>
    </div>

    <!-- 转账表单 -->
    <div class="transfer-form">
      <div class="input-group">
        <label for="amount">转账金额:</label>
        <input
          id="amount"
          v-model="transferAmount"
          type="number"
          step="0.000001"
          min="0"
          placeholder="请输入转账金额"
          :disabled="isTransactionPending"
        />
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
      </div>

      <!-- 操作按钮 -->
      <div class="button-group">
        <button
          @click="handleApprove"
          :disabled="!transferAmount || isTransactionPending"
          class="approve-btn"
        >
          {{ isTransactionPending ? '处理中...' : '授权代币' }}
        </button>

        <button
          @click="handleDirectTransfer"
          :disabled="!transferAmount || !recipientAddress || isTransactionPending"
          class="transfer-btn"
        >
          {{ isTransactionPending ? '处理中...' : '直接转账' }}
        </button>

        <button
          @click="handleContractTransfer"
          :disabled="!transferAmount || isTransactionPending"
          class="contract-transfer-btn"
        >
          {{ isTransactionPending ? '处理中...' : '合约转账' }}
        </button>
      </div>
    </div>

    <!-- 交易状态 -->
    <div v-if="hash" class="transaction-status">
      <p>交易哈希: {{ hash }}</p>
      <p v-if="isConfirmed" class="success">✅ 交易已确认</p>
      <p v-else-if="isTransactionPending" class="pending">⏳ 交易确认中...</p>
    </div>

    <!-- 错误信息 -->
    <div v-if="transactionError" class="error">
      ❌ {{ transactionError }}
    </div>

    <!-- 地址信息 -->
    <div class="address-info">
      <h3>合约地址信息</h3>
      <div class="address-item">
        <span class="label">代币地址:</span>
        <span class="address">{{ CONTRACT_ADDRESSES.TOKEN_ADDRESS }}</span>
      </div>
      <div class="address-item">
        <span class="label">合约地址:</span>
        <span class="address">{{ CONTRACT_ADDRESSES.CONTRACT_ADDRESS }}</span>
      </div>
      <div class="address-item">
        <span class="label">默认收款地址:</span>
        <span class="address">{{ CONTRACT_ADDRESSES.RECIPIENT_ADDRESS }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTokenTransfer } from '../hooks/useTokenTransfer'
import { CONTRACT_ADDRESSES } from '../contracts/addresses'

const {
  transferAmount,
  recipientAddress,
  isLoading,
  error,
  hash,
  balance,
  allowance,
  isTransactionPending,
  transactionError,
  isConfirmed,
  approveToken,
  transferToken,
  transferFromContract,
  formatBalance,
  refetchBalance,
  refetchAllowance
} = useTokenTransfer()

// 处理授权
const handleApprove = async () => {
  if (!transferAmount.value) return
  await approveToken(transferAmount.value)
}

// 处理直接转账
const handleDirectTransfer = async () => {
  if (!transferAmount.value || !recipientAddress.value) return
  await transferToken(recipientAddress.value, transferAmount.value)
}

// 处理合约转账
const handleContractTransfer = async () => {
  if (!transferAmount.value) return
  await transferFromContract(transferAmount.value)
}
</script>

<style scoped>
.token-transfer {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.token-transfer h2 {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
}

.balance-section,
.allowance-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
}

.transfer-form {
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.input-group {
  margin-bottom: 15px;
}

.input-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

.input-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.input-group input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.button-group button {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.approve-btn {
  background-color: #4CAF50;
  color: white;
}

.approve-btn:hover:not(:disabled) {
  background-color: #45a049;
}

.transfer-btn {
  background-color: #2196F3;
  color: white;
}

.transfer-btn:hover:not(:disabled) {
  background-color: #1976D2;
}

.contract-transfer-btn {
  background-color: #FF9800;
  color: white;
}

.contract-transfer-btn:hover:not(:disabled) {
  background-color: #F57C00;
}

.button-group button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.transaction-status {
  background-color: #fff;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.transaction-status .success {
  color: #4CAF50;
  font-weight: bold;
}

.transaction-status .pending {
  color: #FF9800;
  font-weight: bold;
}

.error {
  background-color: #ffebee;
  color: #c62828;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 15px;
  border-left: 4px solid #c62828;
}

.address-info {
  background-color: #fff;
  padding: 15px;
  border-radius: 4px;
}

.address-info h3 {
  margin-top: 0;
  color: #333;
}

.address-item {
  display: flex;
  margin-bottom: 10px;
  align-items: center;
}

.address-item .label {
  font-weight: bold;
  min-width: 120px;
  color: #555;
}

.address-item .address {
  font-family: monospace;
  font-size: 14px;
  background-color: #f5f5f5;
  padding: 4px 8px;
  border-radius: 3px;
  word-break: break-all;
  flex: 1;
}

@media (max-width: 768px) {
  .balance-section,
  .allowance-section {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .button-group {
    flex-direction: column;
  }

  .button-group button {
    flex: none;
  }

  .address-item {
    flex-direction: column;
    align-items: stretch;
  }

  .address-item .label {
    min-width: auto;
    margin-bottom: 5px;
  }
}
</style>
