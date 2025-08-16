
<template>
   <div class="pages">
      <img src="/reown.svg" alt="Reown" width="150" height="150" />
      <h1> Web3 代币转账系统 demo </h1>
      <p>用户地址: {{ userAddress }}</p>
      <p>是否连接: {{ isConnected }}</p>
      <div style="background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; font-size: 12px;">
        <strong>调试信息:</strong><br>
        设备类型: {{ isMobile ? '移动端' : 'PC端' }}<br>
        AppKit 连接: {{ appkitAccount?.isConnected }} | 地址: {{ appkitAccount?.address?.slice(0, 10) }}...<br>
        Wagmi 连接: {{ wagmiIsConnected }} | 地址: {{ wagmiAddress?.slice(0, 10) }}...<br>
        <span v-if="isMobile && appkitAccount?.isConnected && !wagmiIsConnected"
              style="color: orange;">
          📱 移动端模式：使用 AppKit 状态（Wagmi 同步失败属正常现象）
        </span>
        <span v-if="!isMobile && wagmiIsConnected"
              style="color: green;">
          💻 PC端模式：Wagmi 连接正常
        </span>
      </div>

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
  useAppKitAccount
} from '@reown/appkit/vue'
import {  useAccount, useConnect  } from '@wagmi/vue'
import {wagmiAdapter , networks, projectId } from './config/index'
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import ActionButtonList from "./components/ActionButton.vue";
import InfoList from "./components/InfoList.vue";
import TokenTransfer from "./components/TokenTransfer.vue";

// Initialize AppKit


const isAppkitReady = ref(false)

// 检测是否为移动端
const isMobile = computed(() => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
})

// 获取 AppKit 和 Wagmi 的连接状态
const { address: wagmiAddress, isConnected: wagmiIsConnected } = useAccount()
const appkitAccount = useAppKitAccount()
const { connectors, connectAsync } = useConnect()

// 统一的连接状态 - 优先使用 AppKit 状态，因为移动端更可靠
const isConnected = computed(() => {
  const appkitConnected = appkitAccount.value?.isConnected || false
  const wagmiConnected = wagmiIsConnected.value || false
  console.log('Connection status check:', {
    appkit: appkitConnected,
    wagmi: wagmiConnected
  })
  return appkitConnected || wagmiConnected
})

const userAddress = computed(() => {
  const appkitAddr = appkitAccount.value?.address
  const wagmiAddr = wagmiAddress.value
  const address = appkitAddr || wagmiAddr
  console.log('Address check:', {
    appkit: appkitAddr,
    wagmi: wagmiAddr,
    final: address
  })
  return address
})



// 监听 AppKit 状态变化和同步
onMounted(async () => {

  const appkit =  createAppKit({
    adapters: [wagmiAdapter],
    networks,
    projectId,
    themeMode: 'light',
    features: {
      connectMethodsOrder: ['wallet'],
      analytics: true, // Optional - defaults to your Cloud configuration
    },
    metadata: {
      name: 'AppKit Vue Example',
      description: 'AppKit Vue Example',
      url: 'https://nindle.github.io/web3-new-demo/',
      icons: ['https://avatars.githubusercontent.com/u/179229932?s=200&v=4']
    },
    themeVariables: {
      '--w3m-accent': '#000000',
    }
  })
  console.log('🚀 App mounted, setting up connection sync')

  // 等待 AppKit 完全初始化
  await nextTick()

  if (appkit) {
    setTimeout(() => {
      isAppkitReady.value = true
    }, 1000)
  }

  // 监听 AppKit 账户状态变化
  watch(appkitAccount, async (newAccount, oldAccount) => {
    console.log('📊 AppKit account changed:', {
      old: oldAccount,
      new: newAccount
    })

    // 当 AppKit 连接状态变为 true 时，尝试同步到 Wagmi
    if (newAccount?.isConnected && !oldAccount?.isConnected) {
      console.log('🔗 AppKit connected, syncing to Wagmi')

      try {
        // 等待一小段时间确保状态完全更新
        await new Promise(resolve => setTimeout(resolve, 500))

        // 尝试同步到 Wagmi - 改进连接器选择逻辑
        if (connectors && connectors.length > 0 && !wagmiIsConnected.value) {
          console.log('🔍 Available connectors:', connectors.map((c: any) => c.name))

          // 更智能的连接器选择策略
          let targetConnector = null

          // 1. 优先寻找 WalletConnect 相关连接器
          targetConnector = connectors.find((c: any) =>
            c.name.toLowerCase().includes('walletconnect') ||
            c.name.toLowerCase().includes('wallet connect') ||
            c.id?.toLowerCase().includes('walletconnect')
          )

          // 2. 如果没找到，寻找 AppKit 相关连接器
          if (!targetConnector) {
            targetConnector = connectors.find((c: any) =>
              c.name.toLowerCase().includes('appkit') ||
              c.name.toLowerCase().includes('reown')
            )
          }

          // 3. 最后兜底使用第一个可用连接器
          if (!targetConnector && connectors.length > 0) {
            targetConnector = connectors[0]
          }

          if (targetConnector) {
            console.log('🔄 Syncing to Wagmi with connector:', {
              name: targetConnector.name,
              id: targetConnector.id,
              type: targetConnector.type
            })

            try {
              await connectAsync({ connector: targetConnector })
              console.log('✅ Wagmi sync completed successfully')
            } catch (syncError: any) {
              console.warn('⚠️ Wagmi sync failed, trying alternative approach:', syncError.message)

              // 尝试其他连接器
              for (const altConnector of connectors) {
                if (altConnector !== targetConnector) {
                  try {
                    console.log('🔄 Trying alternative connector:', altConnector.name)
                    await connectAsync({ connector: altConnector })
                    console.log('✅ Alternative connector sync successful')
                    break
                  } catch (altError) {
                    console.log('❌ Alternative connector failed:', altError)
                  }
                }
              }
            }
          } else {
            console.warn('⚠️ No suitable connector found for Wagmi sync')
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to sync to Wagmi (this is OK for mobile):', error)
        // 移动端即使 Wagmi 同步失败，AppKit 状态仍然可用
      }
    }

    if (!newAccount?.isConnected && oldAccount?.isConnected) {
      console.log('🔌 AppKit disconnected')
    }
  }, { deep: true, immediate: true })

  // 监听 Wagmi 状态变化
  watch([wagmiIsConnected, wagmiAddress], ([connected, address]) => {
    console.log('⚙️ Wagmi state changed:', { connected, address })
  }, { immediate: true })
})
</script>