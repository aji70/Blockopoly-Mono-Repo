'use client';

import { ReactNode, useEffect, useState } from 'react';
import { DojoSdkProvider } from '@dojoengine/sdk/react';

import { dojoConfig } from '../dojoConfig';
import { setupWorld } from '../typescript/contracts.gen';
import { SchemaType } from '../typescript/models.gen';

interface DojoProviderProps {
  children: ReactNode;
}

export function DojoProvider({ children }: DojoProviderProps) {
  const [sdk, setSdk] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initializeSdk() {
      try {
        setIsLoading(true);
        setError(null);

        // Dynamic import with error handling for WASM modules
        const { init } = await import('@dojoengine/sdk');

        const sdkInstance = await init<SchemaType>({
          client: {
            toriiUrl: dojoConfig.toriiUrl,
            relayUrl: dojoConfig.relayUrl,
            worldAddress: dojoConfig.manifest.world.address,
          },
          domain: {
            name: 'Blockopoly',
            revision: '1.0.0',
            chainId: 'KATANA',
            version: '1.0.0',
          },
        });

        setSdk(sdkInstance);
      } catch (error) {
        console.error('Failed to initialize Dojo SDK:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    initializeSdk();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading Dojo SDK...</div>
      </div>
    );
  }

//   if (error) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-red-500">
//           <h2 className="text-xl font-bold mb-2">Failed to load Dojo gfgfhfhfhfjfjgjgjgjgjgjgkg</h2>
//           <p>{error}</p>
//           <button
//             onClick={() => window.location.reload()}
//             className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   if (!sdk) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-lg">Initializing...</div>
//       </div>
//     );
//   }

  return (
    <DojoSdkProvider sdk={sdk} dojoConfig={dojoConfig} clientFn={setupWorld}>
      {children}
    </DojoSdkProvider>
  );
}
