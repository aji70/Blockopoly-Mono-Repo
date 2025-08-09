'use client';

import { House } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { IoIosAddCircle } from 'react-icons/io';
import { isWasmSupported, getWasmCapabilities } from '@/utils/wasm-loader';
import { useAccount } from '@starknet-react/core';
import { usePlayerActions } from '@/hooks/usePlayerActions';
import { useGameActions } from '@/hooks/useGameActions';
import { shortString } from 'starknet';
import GameRoomLoading from './game-room-loading';

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
  const game = useGameActions();
  const player = usePlayerActions();
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [gameType, setGameType] = useState('');
  const [selectedToken, setSelectedToken] = useState('');
  const [joinTokenValue, setJoinTokenValue] = useState<number | null>(null);
  const [numberOfPlayers, setNumberOfPlayers] = useState('');
  const [roomId, setRoomId] = useState<number | null>(null);
  const [continueGameId, setContinueGameId] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ongoingGames, setOngoingGames] = useState<number[]>([]);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [isJoiningGame, setIsJoiningGame] = useState(false);

  useEffect(() => {
    if (isWasmSupported()) {
      getWasmCapabilities();
    }
    if (address) {
      let isMounted = true;
      const checkRegistration = async () => {
        try {
          const registered = await player.isRegistered(address);
          if (!isMounted) return;
          setIsRegistered(registered);
          if (registered) {
            const user = await player.getUsernameFromAddress(address);
            if (!isMounted) return;
            setUsername(shortString.decodeShortString(user) || 'Unknown');
          }
        } catch (err: any) {
          if (!isMounted) return;
          setError(err?.message || 'Failed to check registration status');
        }
      };
      checkRegistration();
      return () => {
        isMounted = false;
      };
    }
    const storedGames = JSON.parse(localStorage.getItem('ongoingGames') || '[]') as number[];
    setOngoingGames(storedGames);
  }, [address, player]);

  const waitForLastGameUpdate = async (
    expectedGameId: number,
    maxWait: number = 90000
  ) => {
    const startTime = Date.now();
    const delay = 2000;
    const maxAttempts = 45; // 90s / 2s per attempt
    let attempts = 0;

    while (attempts < maxAttempts && Date.now() - startTime < maxWait) {
      try {
        const lastGame = Number(await game.lastGame());
        console.log(
          `Polled lastGame: ${lastGame}, Expected: ${expectedGameId}, Attempt: ${attempts + 1}`
        );
        if (lastGame === expectedGameId && lastGame > 0) {
          return lastGame;
        }
      } catch (err: any) {
        console.warn(`Error polling lastGame (Attempt ${attempts + 1}):`, err.message);
      }
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    console.warn(`lastGame did not update. Last: ${await game.lastGame()}, Expected: ${expectedGameId}`);
    return null; // Trigger fallback
  };

  const handleCreateGame = async () => {
    if (!account || !address) {
      setError('Please connect your wallet');
      return;
    }
    if (!isRegistered) {
      setError('Please register before creating a game');
      return;
    }
    if (!gameType || !selectedToken || !numberOfPlayers) {
      setError('Please fill in all fields');
      return;
    }

    const gameTypeNum = Number(gameType);
    const numPlayers = Number(numberOfPlayers);
    if (isNaN(gameTypeNum) || gameTypeNum < 0) {
      setError('Game type must be a non-negative number');
      return;
    }
    if (isNaN(numPlayers) || numPlayers < 2 || numPlayers > 8) {
      setError('Number of players must be between 2 and 8');
      return;
    }

    const tokenValue = tokens.find((t: Token) => t.name === selectedToken)?.value;
    if (!tokenValue) {
      setError('Invalid token selected');
      return;
    }

    setIsCreatingGame(true);
    setError(null);

    try {
      // Step 1: Get initial lastGame value
      const initialLastGame = Number(await game.lastGame());
      console.log(`Initial lastGame before create: ${initialLastGame}`);

      // Step 2: Call createGame once
      console.log(`Creating game with type: ${gameTypeNum}, token: ${tokenValue}, players: ${numPlayers}`);
      const tx = await game.createGame(account, gameTypeNum, tokenValue, numPlayers);
      console.log('Create game transaction:', tx);

      if (!tx?.transaction_hash) {
        throw new Error('No transaction hash returned from createGame');
      }

      // Step 3: Wait 30 seconds for contract to process
      console.log('Waiting 30 seconds for contract to update...');
      await new Promise((resolve) => setTimeout(resolve, 30000));

      // Step 4: Assume new game ID is initialLastGame + 1
      const newGameId = initialLastGame + 1;
      console.log(`Assuming new game ID: ${newGameId}`);

      // Step 5: Verify lastGame for debugging
      try {
        const currentLastGame = Number(await game.lastGame());
        console.log(`Current lastGame after create: ${currentLastGame}`);
        if (currentLastGame !== newGameId) {
          console.warn(`Warning: lastGame (${currentLastGame}) does not match assumed gameId (${newGameId})`);
        }
      } catch (err: any) {
        console.warn('Error verifying lastGame:', err.message, err.stack);
      }

      const updatedGames = [...new Set([...ongoingGames, newGameId])];
      setOngoingGames(updatedGames);
      localStorage.setItem('ongoingGames', JSON.stringify(updatedGames)); // Fixed JSON error
      setShowModal(false);
      router.push(`/game-waiting?gameId=${newGameId}&creator=${address}`);
    } catch (err: any) {
      console.error('Create game error:', err.message, err.stack);
      setError(err?.message || 'Failed to create game. Please try again.');
    } finally {
      setIsCreatingGame(false);
    }
  };

  const handleJoinRoom = async (id?: number) => {
    if (!account || !address) {
      setError('Please connect your wallet');
      return;
    }
    if (!isRegistered) {
      setError('Please register before joining a game');
      return;
    }
    if (loading) {
      setError('Action in progress, please wait');
      return;
    }

    const selectedId = id !== undefined ? id : roomId;
    if (!selectedId || isNaN(selectedId) || selectedId <= 0) {
      setError('Please enter a valid game ID');
      return;
    }

    if (id === undefined && (!joinTokenValue || joinTokenValue < 1 || joinTokenValue > 8)) {
      setError('Please enter a valid token value (1-8)');
      return;
    }

    const tokenValue = id === undefined ? joinTokenValue! : 0;
    setIsJoiningGame(true);
    setError(null);

    try {
      console.log(`Joining game with ID: ${selectedId}, token: ${tokenValue}`);
      const tx = await game.joinGame(account, selectedId, tokenValue);
      console.log('Join game transaction:', tx);

      if (!tx?.transaction_hash) {
        throw new Error('No transaction hash returned from joinGame');
      }

      const lastGame = await waitForLastGameUpdate(selectedId);
      const updatedGames = [...new Set([...ongoingGames, selectedId])];
      setOngoingGames(updatedGames);
      localStorage.setItem('ongoingGames', JSON.stringify(updatedGames));

      if (lastGame === selectedId) {
        console.log('Game joined successfully with gameId:', selectedId);
        router.push(`/game-waiting?gameId=${selectedId}`);
      } else {
        console.warn('lastGame check failed, proceeding with fallback');
        setError('Game joined, but lastGame update not confirmed. Proceeding to waiting room.');
        router.push(`/game-waiting?gameId=${selectedId}`);
      }
    } catch (err: any) {
      console.error('Join game error:', err.message, err.stack);
      setError(err?.message || 'Failed to join game. Please try again.');
    } finally {
      setIsJoiningGame(false);
    }
  };

  const handleContinueGame = async () => {
    if (!account || !address) {
      setError('Please connect your wallet');
      return;
    }
    if (!isRegistered) {
      setError('Please register before continuing a game');
      return;
    }
    if (loading) {
      setError('Action in progress, please wait');
      return;
    }
    if (!continueGameId || isNaN(continueGameId) || continueGameId <= 0) {
      setError('Please enter a valid game ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`Continuing game with ID: ${continueGameId}`);
      router.push(`/game-waiting?gameId=${continueGameId}`);
    } catch (err: any) {
      console.error('Continue game error:', err.message, err.stack);
      setError(err?.message || 'Failed to continue game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearOngoingGames = () => {
    localStorage.removeItem('ongoingGames');
    setOngoingGames([]);
  };

  if (isCreatingGame || isJoiningGame) {
    return <GameRoomLoading action={isCreatingGame ? 'create' : 'join'} />;
  }

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
            Enter the numeric game ID to join
          </p>
        </div>

        {ongoingGames.length > 0 && (
          <div className="w-full max-w-[792px] mt-10 bg-[#010F10] rounded-[12px] border border-[#003B3E] p-6">
            <h3 className="text-[#F0F7F7] font-orbitron text-[18px] font-[600] text-center mb-4">
              Ongoing Games
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ongoingGames.map((id) => (
                <button
                  key={id}
                  onClick={() => handleJoinRoom(id)}
                  className="relative group w-full h-[40px] bg-transparent border border-[#003B3E] rounded-[8px] overflow-hidden cursor-pointer"
                  disabled={loading}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[#00F0FF] text-[14px] font-dmSans font-medium z-10">
                    Join Game: {id}
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
            <input
              type="number"
              placeholder="Enter game ID (e.g., 1)"
              value={roomId ?? ''}
              onChange={(e) => setRoomId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full h-[52px] px-4 text-[#73838B] border border-[#0E282A] rounded-[12px] outline-none focus:border-[#00F0FF]"
              disabled={loading}
            />
            <div>
              <label className="block text-[#F0F7F7] font-dmSans text-[14px] mb-2">Enter Token Value (1-8)</label>
              <input
                type="number"
                min={1}
                max={8}
                placeholder="Enter token value (e.g., 1)"
                value={joinTokenValue ?? ''}
                onChange={(e) => setJoinTokenValue(e.target.value ? parseInt(e.target.value) : null)}
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
              type="number"
              placeholder="Enter game ID (e.g., 1)"
              value={continueGameId ?? ''}
              onChange={(e) => setContinueGameId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full h-[52px] px-4 text-[#73838B] border border-[#0E282A] rounded-[12px] outline-none focus:border-[#00F0FF]"
              disabled={loading}
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
                    max={8}
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