import { ref, computed, watch, onMounted } from 'vue'
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/vue'
import { formatUnits } from 'viem'

/**
 * 使用 AppKit 获取钱包余额的 Hook
 * 支持 ETH 和 ERC20 代币余额获取
 */
export function useAppKitBalance() {
  // AppKit 账户和网络信息
  const appkitAccount = useAppKitAccount()
  const appkitNetwork = useAppKitNetwork()

  // 余额状态
  const ethBalance = ref<string>('0')
  const tokenBalances = ref<Record<string, string>>({})
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const userAddress = computed(() => appkitAccount.value?.address)
  const isConnected = computed(() => appkitAccount.value?.isConnected || false)
  const currentChainId = computed(() => appkitNetwork.value?.chainId)

  // 格式化 ETH 余额
  const formattedEthBalance = computed(() => {
    if (!ethBalance.value || ethBalance.value === '0') return '0.0000'
    try {
      return parseFloat(formatUnits(BigInt(ethBalance.value), 18)).toFixed(4)
    } catch {
      return '0.0000'
    }
  })

  /**
   * 获取 ETH 余额
   */
  const fetchEthBalance = async () => {
    if (!userAddress.value || !currentChainId.value) {
      console.log('❌ 缺少用户地址或链 ID，无法获取余额')
      return
    }

    try {
      console.log('🔍 正在获取 ETH 余额...', {
        address: userAddress.value,
        chainId: currentChainId.value
      })

      // 使用 window.ethereum 提供商获取余额
      if (typeof window !== 'undefined' && window.ethereum) {
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [userAddress.value, 'latest']
        })

        ethBalance.value = balance
        console.log('✅ ETH 余额获取成功:', {
          raw: balance,
          formatted: formattedEthBalance.value
        })
      } else {
        throw new Error('未找到 ethereum 提供商')
      }
    } catch (err: any) {
      console.error('❌ 获取 ETH 余额失败:', err)
      error.value = err.message || '获取余额失败'
    }
  }

  /**
   * 获取 ERC20 代币余额
   */
  const fetchTokenBalance = async (tokenAddress: string, decimals: number = 18) => {
    if (!userAddress.value || !currentChainId.value) {
      console.log('❌ 缺少用户地址或链 ID，无法获取代币余额')
      return
    }

    try {
      console.log('🔍 正在获取代币余额...', {
        token: tokenAddress,
        address: userAddress.value,
        chainId: currentChainId.value
      })

      // ERC20 balanceOf 方法的调用数据
      const data = `0x70a08231000000000000000000000000${userAddress.value.slice(2)}`

      if (typeof window !== 'undefined' && window.ethereum) {
        const result = await window.ethereum.request({
          method: 'eth_call',
          params: [{
            to: tokenAddress,
            data: data
          }, 'latest']
        })

        const balance = result
        const formattedBalance = formatUnits(BigInt(balance), decimals)

        tokenBalances.value[tokenAddress] = formattedBalance

        console.log('✅ 代币余额获取成功:', {
          token: tokenAddress,
          raw: balance,
          formatted: formattedBalance
        })

        return formattedBalance
      } else {
        throw new Error('未找到 ethereum 提供商')
      }
    } catch (err: any) {
      console.error('❌ 获取代币余额失败:', err)
      error.value = err.message || '获取代币余额失败'
      return '0'
    }
  }

  /**
   * 刷新所有余额
   */
  const refreshBalances = async () => {
    if (!isConnected.value) {
      console.log('❌ 钱包未连接，无法刷新余额')
      return
    }

    isLoading.value = true
    error.value = null

    try {
      await fetchEthBalance()
    } catch (err: any) {
      console.error('刷新余额失败:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 获取格式化的代币余额
   */
  const getFormattedTokenBalance = (tokenAddress: string, decimals: number = 18) => {
    const balance = tokenBalances.value[tokenAddress]
    if (!balance || balance === '0') return '0.0000'
    try {
      return parseFloat(balance).toFixed(4)
    } catch {
      return '0.0000'
    }
  }

  // 监听账户变化
  watch([userAddress, currentChainId], ([newAddress, newChainId], [oldAddress, oldChainId]) => {
    console.log('👀 账户或网络变化:', {
      address: { old: oldAddress, new: newAddress },
      chainId: { old: oldChainId, new: newChainId }
    })

    if (newAddress && newChainId && isConnected.value) {
      // 清空之前的余额
      ethBalance.value = '0'
      tokenBalances.value = {}

      // 延迟获取余额，确保网络切换完成
      setTimeout(refreshBalances, 1000)
    }
  }, { immediate: true })

  // 监听连接状态变化
  watch(isConnected, (connected) => {
    console.log('👀 连接状态变化:', connected)
    if (connected) {
      setTimeout(refreshBalances, 500)
    } else {
      // 断开连接时清空余额
      ethBalance.value = '0'
      tokenBalances.value = {}
    }
  })

  // 组件挂载时初始化
  onMounted(() => {
    console.log('🚀 AppKit Balance Hook 初始化')
    if (isConnected.value && userAddress.value) {
      refreshBalances()
    }
  })

  return {
    // 状态
    ethBalance,
    tokenBalances,
    isLoading,
    error,

    // 计算属性
    userAddress,
    isConnected,
    currentChainId,
    formattedEthBalance,

    // 方法
    fetchEthBalance,
    fetchTokenBalance,
    refreshBalances,
    getFormattedTokenBalance
  }
}

// 扩展 Window 接口以支持 ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      isConnected: () => boolean
    }
  }
}
