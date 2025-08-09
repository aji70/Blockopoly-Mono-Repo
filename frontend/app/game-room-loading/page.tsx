'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const GameRoomLoading = () => {
  const [dots, setDots] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get('action') as 'join' | 'create' | null;

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length < 5 ? prev + 'A' : ''));
    }, 300);

    return () => clearInterval(dotInterval);
  }, []);

  const handleCancel = () => {
    router.push('/join-room?error=Operation cancelled');
  };

  return (
    <section className="w-full h-[calc(100dvh-87px)] bg-settings bg-cover bg-fixed bg-center">
      <main className="w-full h-[calc(100dvh-87px)] flex flex-col items-center justify-center bg-gradient-to-b from-[#010F10]/90 to-[#010F10]/50 px-4 sm:px-6">
        <div className="w-full max-w-md bg-[#0A1A1B]/80 p-6 sm:p-8 rounded-xl shadow-lg border border-[#00F0FF]/30 backdrop-blur-sm">
          <h2 className="text-2xl sm:text-3xl font-bold font-orbitron mb-6 text-[#F0F7F7] text-center tracking-wide">
            Loading Game
          </h2>
          <div className="text-center space-y-3">
            <p className="text-[#869298] text-sm font-orbitron">
              {action === 'join' ? 'Joining the game...' : action === 'create' ? 'Creating the game...' : 'Processing...'}
            </p>
            <p className="text-[#00F0FF] text-sm font-semibold font-orbitron uppercase">
              Show no mercy!
            </p>
            <p className="text-[#FF0000] text-sm font-orbitron animate-pulse">
              😈 MUAHAHAHAHA{dots} 😈
            </p>
          </div>

          <button
            onClick={handleCancel}
            className="relative group w-full max-w-[200px] h-[40px] mx-auto mt-6 block font-orbitron text-sm font-semibold text-[#FF0000] bg-[#0E1415] rounded-lg border border-[#FF0000] hover:bg-[#FF0000]/10 hover:text-[#FF3333] transition-all duration-300"
          >
            <span className="absolute inset-0 flex items-center justify-center">
              Cancel
            </span>
          </button>
        </div>
      </main>
    </section>
  );
};

export default GameRoomLoading;