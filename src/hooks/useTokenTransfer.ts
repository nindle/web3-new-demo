import { ref, computed, watch } from 'vue'
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount, useBalance } from '@wagmi/vue'
import { parseUnits, formatUnits, isAddress } from 'viem'
import { TOKEN_ABI } from '../contracts/tokenABI'
import { CONTRACT_ADDRESSES } from '../contracts/addresses'
import { useAppKitAccount } from '@reown/appkit/vue'

// 扩展的ERC20 ABI，包含更多标准函数
const ERC20_ABI = [
  ...TOKEN_ABI,
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

export function useTokenTransfer(): any {
  // 基础状态
  const transferAmount = ref('')
  const recipientAddress = ref(CONTRACT_ADDRESSES.RECIPIENT_ADDRESS)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const txStatus = ref<'idle' | 'pending' | 'success' | 'error'>('idle')

  // 获取当前账户信息 - 使用 AppKit 和 Wagmi 双重状态
  const { address: wagmiAddress, isConnected: wagmiIsConnected } = useAccount()
  const appkitAccount = useAppKitAccount()

  // 检测是否为移动端
  const isMobile = computed(() => {
    if (typeof window === 'undefined') return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  })

  // 统一的连接状态和地址 - 移动端优先使用 AppKit
  const isConnected = computed(() => {
    const appkitConnected = appkitAccount.value?.isConnected || false
    const wagmiConnected = wagmiIsConnected.value || false

    // 移动端主要依赖 AppKit 状态
    if (isMobile.value) {
      return appkitConnected
    }

    // PC端优先使用 Wagmi 状态
    return wagmiConnected || appkitConnected
  })

  const userAddress = computed(() => {
    const appkitAddr = appkitAccount.value?.address
    const wagmiAddr = wagmiAddress.value

    // 移动端优先使用 AppKit 地址
    if (isMobile.value && appkitAddr) {
      return appkitAddr as `0x${string}`
    }

    return (wagmiAddr || appkitAddr) as `0x${string}` | undefined
  })

  // 代币转账合约写入
  const {
    writeContract,
    data: hash,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite
  } = useWriteContract()

  // 等待交易确认
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError
  } = useWaitForTransactionReceipt({
    hash
  })

  // 读取代币信息
  const { data: tokenName } = useReadContract({
    address: CONTRACT_ADDRESSES.TOKEN_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'name'
  })

  const { data: tokenSymbol } = useReadContract({
    address: CONTRACT_ADDRESSES.TOKEN_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'symbol'
  })

  const { data: tokenDecimals } = useReadContract({
    address: CONTRACT_ADDRESSES.TOKEN_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'decimals'
  })

  // 读取用户代币余额
  const {
    data: balance,
    refetch: refetchBalance,
    isLoading: isBalanceLoading
  } = useReadContract({
    address: CONTRACT_ADDRESSES.TOKEN_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: userAddress.value ? [userAddress.value as `0x${string}`] : undefined,
    query: {
      enabled: !!userAddress.value
    }
  })

  // 读取授权额度
  const {
    data: allowance,
    refetch: refetchAllowance,
    isLoading: isAllowanceLoading
  } = useReadContract({
    address: CONTRACT_ADDRESSES.TOKEN_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: userAddress.value ? [
      userAddress.value as `0x${string}`,
      CONTRACT_ADDRESSES.CONTRACT_ADDRESS as `0x${string}`
    ] : undefined,
    query: {
      enabled: !!userAddress.value
    }
  })

  // 读取ETH余额
  const { data: ethBalance } = useBalance({
    address: userAddress.value as `0x${string}` | undefined
  })

  // 计算状态
  const isTransactionPending = computed(() => isWritePending.value || isConfirming.value)
  const transactionError = computed(() => writeError.value || confirmError.value || error.value)
  const decimals = computed(() => tokenDecimals.value || 18)

  // 验证函数
  const validateTransfer = (amount: string, to?: string): string | null => {
    if (!isConnected.value) {
      return '请先连接钱包'
    }

    if (!amount || parseFloat(amount) <= 0) {
      return '请输入有效的转账金额'
    }

    if (to && !isAddress(to)) {
      return '收款地址格式无效'
    }

    try {
      const parsedAmount = parseUnits(amount.toString(), decimals.value)
      if (balance.value && parsedAmount > balance.value) {
        return '余额不足'
      }
    } catch {
      return '金额格式无效'
    }

    return null
  }

  // 格式化余额显示
  const formatBalance = (balance: bigint | undefined, showSymbol = true) => {
    if (!balance) return '0'
    const formatted = formatUnits(balance, decimals.value)
    return showSymbol ? `${formatted} ${tokenSymbol.value || 'TOKEN'}` : formatted
  }

  // 格式化ETH余额
  const formatEthBalance = (balance: any) => {
    if (!balance?.value) return '0 ETH'
    return `${formatUnits(balance.value, 18)} ETH`
  }

  // 检查是否有足够的授权
  const checkAllowance = (amount: string): boolean => {
    if (!allowance.value) return false
    try {
      const parsedAmount = parseUnits(amount, decimals.value)
      return allowance.value >= parsedAmount
    } catch {
      return false
    }
  }

  // 代币授权函数
  const approveToken = async (amount: string) => {
    const validationError = validateTransfer(amount)
    if (validationError) {
      error.value = validationError
      return false
    }

    try {
      error.value = null
      isLoading.value = true
      txStatus.value = 'pending'

      const parsedAmount = parseUnits(amount, decimals.value)

      await writeContract({
        address: CONTRACT_ADDRESSES.TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.CONTRACT_ADDRESS as `0x${string}`, parsedAmount]
      } as any)

      return true
    } catch (err: any) {
      error.value = err?.message || '授权失败'
      txStatus.value = 'error'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 代币直接转账函数
  const transferToken = async (to: string, amount: string) => {
    // 检查连接状态
    if (!isConnected.value) {
      const connectMsg = isMobile.value
        ? '请通过 AppKit 连接钱包（移动端模式）'
        : '请连接钱包'
      error.value = connectMsg
      return false
    }

    const validationError = validateTransfer(amount, to)
    if (validationError) {
      error.value = validationError
      return false
    }

    try {
      error.value = null
      isLoading.value = true
      txStatus.value = 'pending'

      console.log('🚀 Starting token transfer:', {
        isMobile: isMobile.value,
        appkitConnected: appkitAccount.value?.isConnected,
        wagmiConnected: wagmiIsConnected.value,
        userAddress: userAddress.value,
        amount,
        to
      })

      const parsedAmount = parseUnits(amount, decimals.value)

      await writeContract({
        address: CONTRACT_ADDRESSES.TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [to as `0x${string}`, parsedAmount]
      } as any)

      console.log('✅ Token transfer initiated successfully')
      return true
    } catch (err: any) {
      console.error('❌ Token transfer failed:', err)
      const errorMsg = isMobile.value && err.message?.includes('wagmi')
        ? '移动端转账失败，请尝试刷新页面重新连接'
        : err?.message || '转账失败'
      error.value = errorMsg
      txStatus.value = 'error'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 通过合约转账函数
  const transferFromContract = async (amount: string) => {
    const validationError = validateTransfer(amount)
    if (validationError) {
      error.value = validationError
      return false
    }

    // 检查授权额度
    if (!checkAllowance(amount)) {
      error.value = '授权额度不足，请先进行授权'
      return false
    }

    try {
      error.value = null
      isLoading.value = true
      txStatus.value = 'pending'

      const parsedAmount = parseUnits(amount, decimals.value)

      await writeContract({
        address: CONTRACT_ADDRESSES.CONTRACT_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'transferFrom',
        args: [
          CONTRACT_ADDRESSES.PERSONAL_WALLET as `0x${string}`,
          CONTRACT_ADDRESSES.RECIPIENT_ADDRESS as `0x${string}`,
          parsedAmount
        ]
      } as any)

      return true
    } catch (err: any) {
      error.value = err?.message || '合约转账失败'
      txStatus.value = 'error'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 重置所有状态
  const resetTransaction = () => {
    error.value = null
    txStatus.value = 'idle'
    resetWrite()
  }

  // 刷新所有数据
  const refreshData = async () => {
    if (userAddress.value) {
      await Promise.all([
        refetchBalance(),
        refetchAllowance()
      ])
    }
  }

  // 监听交易状态变化
  watch([isConfirmed, transactionError], () => {
    if (isConfirmed.value) {
      txStatus.value = 'success'
      // 交易成功后刷新数据
      setTimeout(refreshData, 2000)
    } else if (transactionError.value) {
      txStatus.value = 'error'
    }
  })

  // 监听用户地址变化，重新获取数据
  watch(userAddress, () => {
    if (userAddress.value) {
      refreshData()
    }
  })

  return {
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
    isMobile,

    // 代币信息
    tokenName,
    tokenSymbol,
    tokenDecimals: decimals,
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
  }
}