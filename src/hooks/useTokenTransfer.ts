import { ref, computed } from 'vue'
import { useWriteContract, useWaitForTransactionReceipt } from '@wagmi/vue'
import { parseUnits, formatUnits } from 'viem'
import { TOKEN_ABI } from '../contracts/tokenABI'
import { CONTRACT_ADDRESSES } from '../contracts/addresses'

export function useTokenTransfer(): any {
  const transferAmount = ref('')
  const recipientAddress = ref(CONTRACT_ADDRESSES.RECIPIENT_ADDRESS)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 代币转账合约写入
  const {
    writeContract,
    data: hash,
    isPending: isWritePending,
    error: writeError
  } = useWriteContract()

  // 等待交易确认
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError
  } = useWaitForTransactionReceipt({
    hash
  })

  // 模拟余额和授权数据
  const balance = ref<bigint | undefined>(undefined)
  const allowance = ref<bigint | undefined>(undefined)

  const refetchBalance = () => {
    console.log('刷新余额')
  }

  const refetchAllowance = () => {
    console.log('刷新授权')
  }

  // 计算状态
  const isTransactionPending = computed(() => isWritePending.value || isConfirming.value)
  const transactionError = computed(() => writeError.value || confirmError.value || error.value)

  // 代币授权函数
  const approveToken = async (amount: string) => {
    try {
      error.value = null
      isLoading.value = true

      const parsedAmount = parseUnits(amount, 18) // 假设是18位精度

      await writeContract({
        address: CONTRACT_ADDRESSES.TOKEN_ADDRESS as `0x${string}`,
        abi: TOKEN_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.CONTRACT_ADDRESS as `0x${string}`, parsedAmount]
      } as any)
    } catch (err: any) {
      error.value = err?.message || '授权失败'
    } finally {
      isLoading.value = false
    }
  }

  // 代币转账函数
  const transferToken = async (to: string, amount: string) => {
    try {
      error.value = null
      isLoading.value = true

      const parsedAmount = parseUnits(amount, 18) // 假设是18位精度

      await writeContract({
        address: CONTRACT_ADDRESSES.TOKEN_ADDRESS as `0x${string}`,
        abi: TOKEN_ABI,
        functionName: 'transfer',
        args: [to as `0x${string}`, parsedAmount]
      } as any)
    } catch (err: any) {
      error.value = err?.message || '转账失败'
    } finally {
      isLoading.value = false
    }
  }

  // 通过合约转账函数
  const transferFromContract = async (amount: string) => {
    try {
      error.value = null
      isLoading.value = true

      const parsedAmount = parseUnits(amount, 18) // 假设是18位精度

      await writeContract({
        address: CONTRACT_ADDRESSES.CONTRACT_ADDRESS as `0x${string}`,
        abi: TOKEN_ABI,
        functionName: 'transferFrom',
        args: [
          CONTRACT_ADDRESSES.PERSONAL_WALLET as `0x${string}`,
          CONTRACT_ADDRESSES.RECIPIENT_ADDRESS as `0x${string}`,
          parsedAmount
        ]
      } as any)
    } catch (err: any) {
      error.value = err?.message || '合约转账失败'
    } finally {
      isLoading.value = false
    }
  }

  // 格式化余额显示
  const formatBalance = (balance: bigint | undefined) => {
    if (!balance) return '0'
    return formatUnits(balance, 18)
  }

  return {
    // 状态
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

    // 方法
    approveToken,
    transferToken,
    transferFromContract,
    formatBalance,
    refetchBalance,
    refetchAllowance
  }
}