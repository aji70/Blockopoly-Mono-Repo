'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface GameRoomLoadingProps {
  action: 'join' | 'create';
}

const GameRoomLoading = ({ action }: GameRoomLoadingProps) => {
  const [dots, setDots] = useState('');
  const router = useRouter();

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
      <main className="w-full h-[calc(100dvh-87px)] flex flex-col items-center justify-center bg-gradient-to-b from-[#010F10] to-[#010F1033] px-4">
        <div className="w-full max-w-xl">
          <h2 className="text-3xl md:text-4xl font-bold font-orbitron mb-6 text-[#F0F7F7] text-center">Loading Game</h2>
          <p className="text-[12px] md:text-[14px] text-center text-[#869298] font-[500]">
            {action === 'join' ? 'Joining the game...' : 'Creating the game...'}
            <br />
            <span className="font-semibold text-center uppercase">show no mercy!</span>
          </p>
          <p className="mt-6 text-[12px] text-center md:text-[14px] text-[#869298] font-[500] animate-pulse">
            😈MUAHAHAHAHAHA{dots}😈
          </p>
          <button
            onClick={handleCancel}
            className="relative group w-full max-w-[227px] h-[40px] bg-transparent border-none mx-auto mt-6 block"
          >
            <svg
              width="227"
              height="40"
              viewBox="0 0 227 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute top-0 left-0 w-full h-full"
            >
              <path
                d="M6 1H221C225.373 1 227.996 5.85486 225.601 9.5127L207.167 37.5127C206.151 39.0646 204.42 40 202.565 40H6C2.96243 40 0.5 37.5376 0.5 34.5V6.5C0.5 3.46243 2.96243 1 6 1Z"
                fill="#0E1415"
                stroke="#FF0000"
                strokeWidth="1"
                className="group-hover:stroke-[#FF0000] transition-all duration-300 ease-in-out"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[#FF0000] capitalize text-[13px] font-dmSans font-medium z-10">
              Cancel
            </span>
          </button>
        </div>
      </main>
    </section>
  );
};

export default GameRoomLoading;