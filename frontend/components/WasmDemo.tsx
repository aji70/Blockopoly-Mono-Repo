'use client';

import { House } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { IoIosAddCircle } from 'react-icons/io';
import { isWasmSupported, getWasmCapabilities } from '@/utils/wasm-loader';
import { useAccount, useConnect, useDisconnect } from '@starknet-react/core';
import { usePlayerActions } from '@/hooks/usePlayerActions';
import { useGameActions } from '@/hooks/useGameActions';
import { shortString } from 'starknet';

// Encode game ID to 5-letter string
const encodeGameId = (gameId: number): string => {
  if (gameId < 0 || gameId >= 26 ** 5) {
    throw new Error('Game ID out of range for 5-letter encoding');
  }
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let id = gameId;
  let code = '';
  for (let i = 0; i < 5; i++) {
    code = alphabet[id % 26] + code;
    id = Math.floor(id / 26);
  }
  return code.padStart(5, 'A');
};

// Decode 5-letter string to game ID
const decodeGameId = (code: string): number => {
  if (!/^[A-Z]{5}$/.test(code)) {
    throw new Error('Invalid 5-letter game code');
  }
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let id = 0;
  for (let i = 0; i < 5; i++) {
    id = id * 26 + alphabet.indexOf(code[i]);
  }
  return id;
};

// Interfaces for type safety
interface Token {
  name: string;
  emoji: string;
  value: number;
}

interface Player {
  address: `0x${string}` | undefined;
  tokenValue: number;
}

interface Game {
  id: number;
  creator: `0x${string}` | undefined;
  players: Player[];
  maxPlayers: number;
  availableTokens: Token[];
}

const tokens: Token[] = [
  { name: 'Top Hat', emoji: '🎩', value: 1 },
  { name: 'Car', emoji: '🚗', value: 2 },
  { name: 'Dog', emoji: '🐕', value: 3 },
  { name: 'Battleship', emoji: '🚢', value: 4 },
  { name: 'Wheelbarrow', emoji: '🛒', value: 5 },
  { name: 'Shoe', emoji: '👞', value: 6 },
  { name: 'Thimble', emoji: '🧵', value: 7 },
  { name: 'Iron', emoji: '🧼', value: 8 },
];

const JoinRoom = () => {
  const { account, address } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const game = useGameActions();
  const player = usePlayerActions();
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [gameType, setGameType] = useState('');
  const [selectedToken, setSelectedToken] = useState(''); // For Create Game modal
  const [joinTokenValue, setJoinTokenValue] = useState<number | ''>(''); // For Join Game number input
  const [numberOfPlayers, setNumberOfPlayers] = useState('');
  const [roomId, setRoomId] = useState<string>(''); // 5-letter game code
  const [continueGameId, setContinueGameId] = useState<string>(''); // 5-letter game code
  const [username, setUsername] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ongoingGames, setOngoingGames] = useState<string[]>([]); // Store 5-letter codes

  useEffect(() => {
    if (isWasmSupported()) {
      getWasmCapabilities();
    }
    if (address) {
      const checkRegistration = async () => {
        try {
          const registered = await player.isRegistered(address);
          setIsRegistered(registered);
          if (registered) {
            const user = await player.getUsernameFromAddress(address);
            setUsername(shortString.decodeShortString(user));
          }
        } catch (err: any) {
          setError(err?.message || 'Failed to check registration status');
        }
      };
      checkRegistration();

      const storedGames = JSON.parse(localStorage.getItem('ongoingGames') || '[]') as string[];
      setOngoingGames(storedGames);
    }
  }, [address, player]);

  const handleRequest = async (fn: () => Promise<any>, label: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fn();
      console.log(`${label} Response:`, res);
      return res;
    } catch (err: any) {
      console.error(`${label} Error:`, err);
      setError(err?.message || `Failed to ${label.toLowerCase()}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGame = async () => {
    if (!account || !address) return setError('Please connect your wallet');
    if (!isRegistered) return setError('Please register before creating a game');
    if (!gameType || !selectedToken || !numberOfPlayers) return setError('Please fill in all fields');

    const tokenValue = tokens.find((t) => t.name === selectedToken)?.value;
    if (!tokenValue) return setError('Invalid token selected');

    const res = await handleRequest(
      () => game.createGame(account, +gameType, tokenValue, +numberOfPlayers),
      'Create Game'
    );

    if (res) {
      const gameId = Number(res);
      const gameCode = encodeGameId(gameId);
      const updatedGames = [...new Set([...ongoingGames, gameCode])];
      setOngoingGames(updatedGames);
      localStorage.setItem('ongoingGames', JSON.stringify(updatedGames));
      setShowModal(false);
      router.push(`/game-play?gameId=${gameId}`);
    }
  };

  const handleJoinRoom = async (code?: string) => {
    if (!account || !address) return setError('Please connect your wallet');
    if (!isRegistered) return setError('Please register before joining a game');
    if (loading) return setError('Action in progress, please wait');

    const selectedCode = code || roomId;
    if (!selectedCode) return setError('Please enter a game code');

    let selectedId: number;
    try {
      selectedId = decodeGameId(selectedCode.toUpperCase());
    } catch (err: any) {
      return setError('Invalid 5-letter game code');
    }

    // if (!code && (isNaN(Number(joinTokenValue)) || joinTokenValue < 1 || joinTokenValue > 8)) {
    //   return setError('Please enter a valid token value (1-8)');
    // }

    const tokenValue = code ? 0 : Number(joinTokenValue); // Use 0 for ongoing games
    const res = await handleRequest(
      () => game.joinGame(account, selectedId, tokenValue),
      'Join Game'
    );

    if (res) {
      const updatedGames = [...new Set([...ongoingGames, selectedCode.toUpperCase()])];
      setOngoingGames(updatedGames);
      localStorage.setItem('ongoingGames', JSON.stringify(updatedGames));
      router.push(`/game-play?gameId=${selectedId}`);
    }
  };

  const handleContinueGame = async () => {
    if (!account || !address) return setError('Please connect your wallet');
    if (!isRegistered) return setError('Please register before continuing a game');
    if (loading) return setError('Action in progress, please wait');

    if (!continueGameId) return setError('Please enter a game code');

    let gameId: number;
    try {
      gameId = decodeGameId(continueGameId.toUpperCase());
    } catch (err: any) {
      return setError('Invalid 5-letter game code');
    }

    const res = await handleRequest(() => game.getGame(gameId), 'Continue Game');

    if (res) {
      router.push(`/game-play?gameId=${gameId}`);
    }
  };

  const clearOngoingGames = () => {
    localStorage.removeItem('ongoingGames');
    setOngoingGames([]);
  };

  return (
    <section className="w-full min-h-screen bg-settings bg-cover bg-fixed bg-center">
      <main className="w-full min-h-screen py-20 flex flex-col items-center justify-start bg-[#010F101F] backdrop-blur-[12px] px-4">
        <div className="w-full flex flex-col items-center">
          {isRegistered && (
            <p className="text-[#00F0FF] font-orbitron md:text-[20px] text-[16px] font-[700] text-center mb-4">
              Welcome, {username}!
            </p>
          )}
          <h2 className="text-[#F0F7F7] font-orbitron md:text-[24px] text-[20px] font-[700] text-center">Join Room</h2>
          <p className="text-[#869298] text-[16px] font-dmSans text-center">
            Enter the 5-letter game code and token value to join
          </p>
        </div>

        {ongoingGames.length > 0 && (
          <div className="w-full max-w-[792px] mt-10 bg-[#010F10] rounded-[12px] border border-[#003B3E] p-6">
            <h3 className="text-[#F0F7F7] font-orbitron text-[18px] font-[600] text-center mb-4">
              Ongoing Games
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ongoingGames.map((code) => (
                <button
                  key={code}
                  onClick={() => handleJoinRoom(code)}
                  className="relative group w-full h-[40px] bg-transparent border border-[#003B3E] rounded-[8px] overflow-hidden cursor-pointer"
                  disabled={loading}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[#00F0FF] text-[14px] font-dmSans font-medium z-10">
                    Join Game: {code}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="w-full max-w-[792px] mt-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="relative group w-full md:w-[227px] h-[40px] bg-transparent border-none p-0 overflow-hidden cursor-pointer"
            disabled={loading}
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
                stroke="#003B3E"
                strokeWidth="1"
                className="group-hover:stroke-[#00F0FF] transition-all duration-300 ease-in-out"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[#0FF0FC] capitalize text-[13px] font-dmSans font-medium z-10">
              <House className="mr-1 w-[14px] h-[14px]" />
              Go Back Home
            </span>
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="relative group w-full md:w-[227px] h-[40px] bg-transparent border-none p-0 overflow-hidden cursor-pointer"
            disabled={loading}
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
                d="M6 1H221C225.373 1 227.996 5.85486 225.601 9.5127L207.167 37.5127C206.151 39.0646 204.42 40 202.565 40H6C2.96243 40 0.5 37.5376 0.5 34.5V6.5C0.5 3.46243 2.96243 1 6 1Z"
                fill="#003B3E"
                stroke="#003B3E"
                strokeWidth="1"
                className="group-hover:stroke-[#00F0FF] transition-all duration-300 ease-in-out"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[#00F0FF] capitalize text-[12px] font-dmSans font-medium z-10">
              <IoIosAddCircle className="mr-1 w-[14px] h-[14px]" />
              Create New Room
            </span>
          </button>

          <button
            onClick={clearOngoingGames}
            className="relative group w-full md:w-[227px] h-[40px] bg-transparent border-none p-0 overflow-hidden cursor-pointer"
            disabled={loading}
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
              Clear Ongoing Games
            </span>
          </button>
        </div>

        <div className="w-full max-w-[792px] mt-10 bg-[#010F10] rounded-[12px] border border-[#003B3E] md:px-20 px-6 py-12 flex flex-col gap-4">
          <div className="w-full flex flex-col gap-4 mt-8">
            <div>
              <label className="block text-[#F0F7F7] font-dmSans text-[14px] mb-2">Game Code</label>
              <input
                type="text"
                placeholder="Enter game code (e.g., AAAAB)"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="w-full h-[52px] px-4 text-[#73838B] border border-[#0E282A] rounded-[12px] outline-none focus:border-[#00F0FF]"
                disabled={loading}
                maxLength={5}
              />
            </div>
            <div>
              <label className="block text-[#F0F7F7] font-dmSans text-[14px] mb-2">Token Value (1-8)</label>
              <input
                type="number"
                min={1}
                max={8}
                placeholder="Enter token value (e.g., 1)"
                value={joinTokenValue}
                onChange={(e) => setJoinTokenValue(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full h-[52px] px-4 text-[#73838B] border border-[#0E282A] rounded-[12px] outline-none focus:border-[#00F0FF]"
                disabled={loading}
              />
            </div>
            <button
              onClick={() => handleJoinRoom()}
              className="relative group w-full h-[52px] bg-transparent border-none p-0 overflow-hidden cursor-pointer"
              disabled={loading || !roomId || !joinTokenValue}
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
                  d="M10 1H250C254.373 1 256.996 6.85486 254.601 10.5127L236.167 49.5127C235.151 51.0646 233.42 52 231.565 52H10C6.96243 52 4.5 49.5376 4.5 46.5V6.5C4.5 3.46243 6.96243 1 10 1Z"
                  fill="#00F0FF"
                  stroke="#0E282A"
                  strokeWidth="1"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[#010F10] text-[18px] font-orbitron font-[700] z-10">
                Join Room
              </span>
            </button>
          </div>

          <div className="w-full flex flex-col gap-4 mt-8">
            <h3 className="text-[#F0F7F7] font-orbitron text-[18px] font-[600] text-center">
              Continue Existing Game
            </h3>
            <input
              type="text"
              placeholder="Enter game code (e.g., AAAAB)"
              value={continueGameId}
              onChange={(e) => setContinueGameId(e.target.value.toUpperCase())}
              className="w-full h-[52px] px-4 text-[#73838B] border border-[#0E282A] rounded-[12px] outline-none focus:border-[#00F0FF]"
              disabled={loading}
              maxLength={5}
            />
            <button
              onClick={handleContinueGame}
              className="relative group w-full h-[52px] bg-transparent border-none p-0 overflow-hidden cursor-pointer"
              disabled={loading || !continueGameId}
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
                  d="M10 1H250C254.373 1 256.996 6.85486 254.601 10.5127L236.167 49.5127C235.151 51.0646 233.42 52 231.565 52H10C6.96243 52 4.5 49.5376 4.5 46.5V6.5C4.5 3.46243 6.96243 1 10 1Z"
                  fill="#00F0FF"
                  stroke="#0E282A"
                  strokeWidth="1"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[#010F10] text-[18px] font-orbitron font-[700] z-10">
                Continue Game
              </span>
            </button>
          </div>

          {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
            <div className="bg-[#010F10] border border-[#00F0FF] rounded-xl p-6 w-full max-w-sm text-white">
              <h2 className="text-xl font-bold mb-4 text-center font-orbitron text-[#00F0FF]">
                Create New Game
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Game Type</label>
                  <input
                    type="number"
                    min={0}
                    value={gameType}
                    onChange={(e) => setGameType(e.target.value)}
                    className="w-full px-3 py-2 bg-transparent border border-[#003B3E] rounded"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Select Token</label>
                  <select
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value)}
                    className="w-full px-3 py-2 bg-transparent border border-[#003B3E] rounded"
                    disabled={loading}
                  >
                    <option value="" disabled>Select a token</option>
                    {tokens.map((token) => (
                      <option key={token.name} value={token.name}>
                        {token.emoji} {token.name}
                      </option>
                    ))}
                  </select>
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
                    disabled={loading}
                  />
                </div>
                <button
                  onClick={handleCreateGame}
                  className="w-full bg-[#00F0FF] text-[#010F10] py-2 rounded font-bold"
                  disabled={loading}
                >
                  Create Game
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full text-sm mt-2 text-center underline text-[#869298]"
                  disabled={loading}
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