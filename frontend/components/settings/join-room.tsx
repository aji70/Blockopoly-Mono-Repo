'use client';

import { House } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { IoIosAddCircle } from 'react-icons/io';
import { isWasmSupported, getWasmCapabilities } from '@/utils/wasm-loader';

import { useAccount, useConnect, useDisconnect } from '@starknet-react/core';
import { usePlayerActions } from '@/hooks/usePlayerActions';
import { useGameActions } from '@/hooks/useGameActions';
import { useMovementActions } from '@/hooks/useMovementActions';
import { usePropertyActions } from '@/hooks/usePropertyActions';
import { useTradeActions } from '@/hooks/useTradeActions';

const JoinRoom = () => {
  const { account, address } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const game = useGameActions();
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [gameType, setGameType] = useState('');
  const [playerSymbol, setPlayerSymbol] = useState('');
  const [numberOfPlayers, setNumberOfPlayers] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = async (fn: () => Promise<any>, label: string) => {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res = await fn();
      console.log(label, res);
      setResponse(res);
      return res;
    } catch (err: any) {
      console.error(label, err);
      setError(err?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isWasmSupported()) {
      getWasmCapabilities();
    }
  }, []);

  if (!address) {
    return (
      <main className="p-8 text-center">
        Please connect your wallet to continue.
      </main>
    );
  }


    const handleJoinRoom = async () => {
  if (!account) return alert('Wallet not connected');
  if (!roomCode || !playerSymbol) return alert('Enter both room code and player symbol');

  const res = await handleRequest(
    () => game.joinGame(account, Number(roomCode), Number(playerSymbol)),
    'joinGame'
  );

  if (res) {
    alert('Joined game with ID: ' + roomCode);
    // Optionally redirect to the game page
    // router.push(`/game-settings?room=${roomCode}`);
  }
};


  const handleCreateGame = async () => {
    if (!account) return alert('Wallet not connected');
    if (!gameType || !playerSymbol || !numberOfPlayers) return alert('Fill in all fields');

    const res = await handleRequest(
      () => game.createGame(account, +gameType, +playerSymbol, +numberOfPlayers),
      'createGame'
    );

    if (res) {
      alert('Game created with ID: ' + res);
      setShowModal(false);
    }
  };

  return (
    <section className="w-full min-h-screen bg-settings bg-cover bg-fixed bg-center">
      <main className="w-full min-h-screen py-20 flex flex-col items-center justify-start bg-[#010F101F] backdrop-blur-[12px] px-4">
        <div className="w-full flex flex-col items-center">
          <h2 className="text-[#F0F7F7] font-orbitron md:text-[24px] text-[20px] font-[700] text-center">Join Room</h2>
          <p className="text-[#869298] text-[16px] font-dmSans text-center">
            Select the room you would like to join
          </p>
        </div>

        {/* buttons */}
        <div className="w-full max-w-[792px] mt-10 flex justify-between items-center">
          {/* Home button */}
          <button
            onClick={() => router.push('/')}
            className="relative group w-[227px] h-[40px] bg-transparent border-none p-0 overflow-hidden cursor-pointer"
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
                d="M6 1H221C225.373 1 227.996 5.85486 225.601 9.5127L207.167 37.5127C206.151 39.0646 204.42 40 202.565 40H6C2.96244 40 0.5 37.5376 0.5 34.5V6.5C0.5 3.46243 2.96243 1 6 1Z"
                fill="#0E1415"
                stroke="#003B3E"
                strokeWidth={1}
                className="group-hover:stroke-[#00F0FF] transition-all duration-300 ease-in-out"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[#0FF0FC] capitalize text-[13px] font-dmSans font-medium z-10">
              <House className="mr-1 w-[14px] h-[14px]" />
              Go Back Home
            </span>
          </button>

          {/* Create Room Button */}
          <button
            onClick={() => setShowModal(true)}
            className="relative group w-[227px] h-[40px] bg-transparent border-none p-0 overflow-hidden cursor-pointer"
          >
            <svg
              width="227"
              height="40"
              viewBox="0 0 227 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute top-0 left-0 w-full h-full transform scale-x-[-1] scale-y-[-1]"
            >
              <path
                d="M6 1H221C225.373 1 227.996 5.85486 225.601 9.5127L207.167 37.5127C206.151 39.0646 204.42 40 202.565 40H6C2.96244 40 0.5 37.5376 0.5 34.5V6.5C0.5 3.46243 2.96243 1 6 1Z"
                fill="#003B3E"
                stroke="#003B3E"
                strokeWidth={1}
                className="group-hover:stroke-[#00F0FF] transition-all duration-300 ease-in-out"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[#00F0FF] capitalize text-[12px] font-dmSans font-medium z-10">
              <IoIosAddCircle className="mr-1 w-[14px] h-[14px]" />
              Create New Room
            </span>
          </button>
        </div>

        {/* Room Join Section */}
        <div className="w-full max-w-[792px] mt-10 bg-[#010F10] rounded-[12px] border border-[#003B3E] md:px-20 px-6 py-12 flex flex-col gap-4">
      <div className="w-full flex flex-col gap-4 mt-8">

  {/* Room Code */}
  <input
    type="text"
    placeholder="Enter room code"
    value={roomCode}
    onChange={(e) => setRoomCode(e.target.value)}
    className="w-full h-[52px] px-4 text-[#73838B] border border-[#0E282A] rounded-[12px] outline-none focus:border-[#00F0FF]"
  />

  {/* Player Symbol */}
  <input
    type="number"
    placeholder="Enter your player symbol (e.g., 1)"
    value={playerSymbol}
    onChange={(e) => setPlayerSymbol(e.target.value)}
    className="w-full h-[52px] px-4 text-[#73838B] border border-[#0E282A] rounded-[12px] outline-none focus:border-[#00F0FF]"
  />

  {/* Join Button */}
  <button
    onClick={handleJoinRoom}
    className="relative group w-full h-[52px] bg-transparent border-none p-0 overflow-hidden cursor-pointer"
  >
    <svg
      width="260"
      height="52"
      viewBox="0 0 260 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute top-0 left-0 w-full h-full transform scale-x-[-1]"
    >
      <path
        d="M10 1H250C254.373 1 256.996 6.85486 254.601 10.5127L236.167 49.5127C235.151 51.0646 233.42 52 231.565 52H10C6.96244 52 4.5 49.5376 4.5 46.5V9.5C4.5 6.46243 6.96243 4 10 4Z"
        fill="#00F0FF"
        stroke="#0E282A"
        strokeWidth={1}
      />
    </svg>
    <span className="absolute inset-0 flex items-center justify-center text-[#010F10] text-[18px] font-orbitron font-[700] z-10">
      Join Room
    </span>
  </button>
</div>

        </div>

        {/* Modal for Creating Room */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
            <div className="bg-[#010F10] border border-[#00F0FF] rounded-xl p-6 w-full max-w-sm text-white">
              <h2 className="text-xl font-bold mb-4 text-center font-orbitron text-[#00F0FF]">Create New Game</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Game Type</label>
                  <input
                    type="number"
                    min={0}
                    value={gameType}
                    onChange={(e) => setGameType(e.target.value)}
                    className="w-full px-3 py-2 bg-transparent border border-[#003B3E] rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Player Symbol</label>
                  <input
                    type="number"
                    min={0}
                    value={playerSymbol}
                    onChange={(e) => setPlayerSymbol(e.target.value)}
                    className="w-full px-3 py-2 bg-transparent border border-[#003B3E] rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Number of Players</label>
                  <input
                    type="number"
                    min={2}
                    max={6}
                    value={numberOfPlayers}
                    onChange={(e) => setNumberOfPlayers(e.target.value)}
                    className="w-full px-3 py-2 bg-transparent border border-[#003B3E] rounded"
                  />
                </div>
                <button
                  onClick={handleCreateGame}
                  className="w-full bg-[#00F0FF] text-[#010F10] py-2 rounded font-bold"
                >
                  Create Game
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full text-sm mt-2 text-center underline text-[#869298]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </section>
  );
};

export default JoinRoom;
