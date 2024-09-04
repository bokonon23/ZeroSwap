'use client'

import { useEffect, useState, useMemo } from 'react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider, useWallet, useWalletModal } from '@solana/wallet-adapter-react'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js'

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css'

function WalletConnectButton() {
  const { wallet, connect, disconnect, connected, publicKey } = useWallet()
  const { setVisible } = useWalletModal()
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    if (connected) {
      disconnect()
    } else {
      setError(null)
      try {
        if (typeof window !== 'undefined' && !window.solana) {
          throw new Error('Phantom wallet not detected')
        }
        setVisible(true)
      } catch (err) {
        console.error('Failed to connect:', err)
        setError('Failed to connect. Is Phantom wallet installed?')
      }
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
      >
        {connected ? `Disconnect ${publicKey?.toBase58().slice(0, 4)}...${publicKey?.toBase58().slice(-4)}` : 'Connect Wallet'}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  )
}

function ExchangeUI() {
  const { publicKey } = useWallet()
  const [balance, setBalance] = useState<number | null>(null)
  const [price, setPrice] = useState<number | null>(null)

  useEffect(() => {
    if (publicKey) {
      const connection = new Connection('https://api.mainnet-beta.solana.com')
      connection.getBalance(publicKey).then((bal) => {
        setBalance(bal / LAMPORTS_PER_SOL)
      })
    } else {
      setBalance(null)
    }
  }, [publicKey])

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        // Note: This is a mock price fetch. In a real scenario, you'd fetch the price for the ZERO token.
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
        const data = await response.json()
        setPrice(data.solana.usd)
      } catch (error) {
        console.error('Failed to fetch ZERO price:', error)
      }
    }
    fetchPrice()
    const interval = setInterval(fetchPrice, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">ZERO SWAP</h1>
        <div className="mb-6">
          <WalletConnectButton />
        </div>
        {publicKey && (
          <div className="mb-6">
            <p className="text-gray-600">Connected: {publicKey.toBase58()}</p>
            <p className="text-gray-600">Balance: {balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...'}</p>
          </div>
        )}
        <div className="mb-6">
          <p className="text-gray-600">ZERO Price: {price !== null ? `$${price.toFixed(2)}` : 'Loading...'}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            placeholder="Amount"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
            Buy Zero
          </button>
        </div>
      </div>
    </div>
  )
}

function CustomWalletProvider({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Mainnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])
  
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    []
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default function ExchangeComponent() {
  return (
    <CustomWalletProvider>
      <ExchangeUI />
    </CustomWalletProvider>
  )
}