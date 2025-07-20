'use client';

import { useEffect, useState } from 'react';
import { loadWasmModule, isWasmSupported, getWasmCapabilities } from '@/utils/wasm-loader';
import { useAccount, useConnect, useDisconnect } from '@starknet-react/core';
import { useDojoSDK } from '@dojoengine/sdk/react';
import { Connector } from '@starknet-react/core';

interface WasmDemoProps {
  className?: string;
}

export default function WasmDemo({ className = '' }: WasmDemoProps) {
  const [wasmSupported, setWasmSupported] = useState(false);
  const [capabilities, setCapabilities] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { client } = useDojoSDK();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();


    const isGameStarted = () => {
    try {
      if (!client || !client.actions.isGameStarted) return false;
      return client.actions.isGameStarted(1);
    } catch (error) {
      console.error("Error checking game status:", error);
      return false;
    }
  }

  const handleConnectWallet = async (connector: Connector) => {
    try {
      await connect({ connector });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      if (error instanceof Error) {
        if (error.message.includes("User rejected the request")) {
          alert("Connection was cancelled by user");
        } else {
          alert("Failed to connect: " + error.message);
        }
      }
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error("Error disconnecting:", error);
    }
  };

  useEffect(() => {
    async function checkWasmSupport() {
      try {
        setLoading(true);
        setError(null);
        const supported = isWasmSupported();
        setWasmSupported(supported);
        const caps = getWasmCapabilities();
        setCapabilities(caps);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
    checkWasmSupport();
  }, []);

  if (loading) {
    return (
      <div className={`p-4 border rounded-lg bg-blue-50 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-blue-800">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-white">
      <div className="flex flex-col items-center space-y-4">
        <h2 className="text-2xl font-bold">Wallet Connection</h2>

        {isConnected ? (
          <div className="flex flex-col items-center space-y-3">
            <div className="bg-gray-100 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Connected Address:</p>
              <p className="font-mono text-sm">{address}</p>
            </div>
            <button
                  onClick={isGameStarted}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                 check if game started
                </button>
            <button
              onClick={handleDisconnectWallet}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Disconnect Wallet
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3">
            <p className="text-gray-600">Connect your wallet to continue</p>
            <div className="flex flex-col space-y-2">
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => handleConnectWallet(connector)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Connect {connector.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
