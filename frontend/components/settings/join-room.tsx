// app/join-room/page.tsx
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
import GameRoomLoading from '@/components/game/game-room-loading';

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
  status: { variant: { Pending?: {}; Ongoing?: {} } };
  is_initialised: boolean;
  players_joined: string;
  number_of_players: string;
  dice_face: string;
  hat: string;
  car: string;
  dog: string;
  thimble: string;
  iron: string;
  battleship: string;
  boot: string;
  wheelbarrow: string;
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
  const { account, address, connector } = useAccount();
  const game = useGameActions();
  const player = usePlayerActions();
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState<number | null>(null);
  const [gameType, setGameType] = useState('');
  const [selectedToken, setSelectedToken] = useState('');
  const [joinToken, setJoinToken] = useState('');
  const [numberOfPlayers, setNumberOfPlayers] = useState('');
  const [roomId, setRoomId] = useState<number | null>(null);
  const [continueGameId, setContinueGameId] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [ongoingGames, setOngoingGames] = useState<number[]>([]);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [isJoiningGame, setIsJoiningGame] = useState(false);
  const [availableTokens, setAvailableTokens] = useState<Token[]>(tokens);

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
          `[waitForLastGameUpdate] Polled lastGame: ${lastGame}, Expected: ${expectedGameId}, Attempt: ${attempts + 1}`
        );
        if (lastGame >= expectedGameId && lastGame > 0) {
          return lastGame;
        }
      } catch (err: any) {
        console.warn(`[waitForLastGameUpdate] Error polling lastGame (Attempt ${attempts + 1}):`, err.message);
      }
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    console.warn(`[waitForLastGameUpdate] lastGame did not update. Last: ${await game.lastGame()}, Expected: ${expectedGameId}`);
    return null; // Trigger fallback
  };

  const waitForGameStatus = async (gid: number, maxAttempts: number = 5, delay: number = 2000) => {
    let attempts = 0;
    while (attempts < maxAttempts) {
      try {
        const gameData = await game.getGame(gid) as Game;
        if (!gameData) {
          throw new Error('Game data not found.');
        }
        console.log(`[waitForGameStatus] Game ${gid} status:`, gameData.status, `is_initialised: ${gameData.is_initialised}, dice_face: ${gameData.dice_face}`);
        return gameData;
      } catch (err: any) {
        console.warn(`[waitForGameStatus] Error checking game status, attempt ${attempts + 1}:`, err.message);
      }
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    throw new Error('Game data not available after multiple attempts.');
  };

  const fetchAvailableTokens = async (gameId: number) => {
    try {
      const gameData = await game.getGame(gameId) as Game;
      console.log('[fetchAvailableTokens] Raw gameData:', gameData);
      
      // Safely access token fields with fallback to '0'
      const usedTokens = [
        gameData.hat ?? '0',
        gameData.car ?? '0',
        gameData.dog ?? '0',
        gameData.thimble ?? '0',
        gameData.iron ?? '0',
        gameData.battleship ?? '0',
        gameData.boot ?? '0',
        gameData.wheelbarrow ?? '0',
      ].filter((v) => v !== '0' && v !== null && v !== undefined).map((v) => Number(v));
      
      const available = tokens.filter((t) => !usedTokens.includes(t.value));
      setAvailableTokens(available);
      console.log(`[fetchAvailableTokens] Available tokens for game ${gameId}:`, available);
      return available;
    } catch (err: any) {
      console.error('[fetchAvailableTokens] Error:', err.message);
      setError('Failed to fetch available tokens.');
      return tokens;
    }
  };

  const handleCreateGame = async () => {
    if (!account || !address) {
      setError('Please connect your wallet');
      console.log('[handleCreateGame] No wallet connected');
      return;
    }
    if (!isRegistered) {
      setError('Please register before creating a game');
      console.log('[handleCreateGame] User not registered');
      return;
    }
    if (!gameType || !selectedToken || !numberOfPlayers) {
      setError('Please fill in all fields');
      console.log('[handleCreateGame] Missing fields:', { gameType, selectedToken, numberOfPlayers });
      return;
    }

    const gameTypeNum = Number(gameType);
    const numPlayers = Number(numberOfPlayers);
    if (isNaN(gameTypeNum) || gameTypeNum < 0) {
      setError('Game type must be a non-negative number');
      console.log('[handleCreateGame] Invalid game type:', gameTypeNum);
      return;
    }
    if (isNaN(numPlayers) || numPlayers < 2 || numPlayers > 8) {
      setError('Number of players must be between 2 and 8');
      console.log('[handleCreateGame] Invalid number of players:', numPlayers);
      return;
    }

    const tokenValue = tokens.find((t) => t.name === selectedToken)?.value;
    if (!tokenValue) {
      setError('Invalid token selected');
      console.log('[handleCreateGame] Invalid token:', selectedToken);
      return;
    }

    setIsCreatingGame(true);
    setError(null);
    setSuccess(null);

    try {
      const initialLastGame = Number(await game.lastGame()) || 0;
      console.log(`[handleCreateGame] Initial lastGame: ${initialLastGame}`);

      console.log(`[handleCreateGame] Creating game with type: ${gameTypeNum}, token: ${tokenValue}, players: ${numPlayers}, wallet: ${connector?.name || 'unknown'}`);
      const tx = await game.createGame(account, gameTypeNum, tokenValue, numPlayers);
      console.log('[handleCreateGame] Create game transaction:', tx);

      if (!tx?.transaction_hash) {
        throw new Error('No transaction hash returned from createGame');
      }

      console.log('[handleCreateGame] Waiting 30 seconds for contract to update...');
      await new Promise((resolve) => setTimeout(resolve, 30000));

      const newGameId = initialLastGame + 1;
      console.log(`[handleCreateGame] Assumed new game ID: ${newGameId}`);

      const currentLastGame = await waitForLastGameUpdate(newGameId);
      console.log(`[handleCreateGame] Current lastGame: ${currentLastGame}`);

      if (currentLastGame === null) {
        throw new Error('Game creation not confirmed by lastGame update');
      }

      const gameData = await game.getGame(newGameId) as Game;
      if (!gameData || !gameData.is_initialised) {
        throw new Error('Game data not found or not initialized');
      }
      console.log('[handleCreateGame] Game data confirmed:', gameData);

      const updatedGames = [...new Set([...ongoingGames, newGameId])];
      setOngoingGames(updatedGames);
      localStorage.setItem('ongoingGames', JSON.stringify(updatedGames));
      setShowModal(false);
      console.log(`[handleCreateGame] Redirecting to /game-waiting?gameId=${newGameId}&creator=${address}`);
      router.push(`/game-waiting?gameId=${newGameId}&creator=${address}`);
    } catch (err: any) {
      console.error('[handleCreateGame] Error:', err.message);
      setError(err?.message || 'Failed to create game. Please try again.');
    } finally {
      setIsCreatingGame(false);
    }
  };

  const handleJoinRoom = async (id?: number, ongoingToken?: string) => {
    if (!account || !address) {
      setError('Please connect your wallet');
      console.log('[handleJoinRoom] No wallet connected');
      return;
    }
    if (!isRegistered) {
      setError('Please register before joining a game');
      console.log('[handleJoinRoom] User not registered');
      return;
    }
    if (loading) {
      setError('Action in progress, please wait');
      console.log('[handleJoinRoom] Action in progress');
      return;
    }

    const selectedId = id !== undefined ? id : roomId;
    if (!selectedId || isNaN(selectedId) || selectedId <= 0) {
      setError('Please enter a valid game ID');
      console.log('[handleJoinRoom] Invalid game ID:', selectedId);
      return;
    }

    if (id === undefined && !joinToken) {
      setError('Please select a valid token');
      console.log('[handleJoinRoom] No token selected');
      return;
    }

    setIsJoiningGame(true);
    setError(null);
    setSuccess(null);

    try {
      const available = await fetchAvailableTokens(selectedId);
      const tokenValue = id === undefined 
        ? tokens.find((t) => t.name === joinToken)?.value || 0 
        : ongoingToken 
          ? tokens.find((t) => t.name === ongoingToken)?.value || 0 
          : 0;
      if (!available.find((t) => t.value === tokenValue)) {
        setError('Selected token is already taken. Please choose another.');
        console.log('[handleJoinRoom] Token already taken:', tokenValue);
        setIsJoiningGame(false);
        return;
      }

      console.log(`[handleJoinRoom] Joining game with token: ${tokenValue}, ID: ${selectedId}, wallet: ${connector?.name || 'unknown'}`);
      const tx = await game.joinGame(account, tokenValue, selectedId);
      console.log('[handleJoinRoom] Join game transaction:', tx);

      if (!tx?.transaction_hash) {
        throw new Error('No transaction hash returned from joinGame');
      }

      const lastGame = await waitForLastGameUpdate(selectedId);
      const updatedGames = [...new Set([...ongoingGames, selectedId])];
      setOngoingGames(updatedGames);
      localStorage.setItem('ongoingGames', JSON.stringify(updatedGames));

      if (lastGame === selectedId) {
        console.log('[handleJoinRoom] Game joined successfully with gameId:', selectedId);
        router.push(`/game-waiting?gameId=${selectedId}`);
      } else {
        console.warn('[handleJoinRoom] lastGame check failed, proceeding with fallback');
        setError('Game joined, but lastGame update not confirmed. Proceeding to waiting room.');
        router.push(`/game-waiting?gameId=${selectedId}`);
      }
    } catch (err: any) {
      console.error('[handleJoinRoom] Error:', err.message);
      setError(err?.message || 'Failed to join game. Please try again.');
    } finally {
      setIsJoiningGame(false);
    }
  };

  const handleContinueGame = async () => {
    if (!account || !address) {
      setError('Please connect your wallet');
      console.log('[handleContinueGame] No wallet connected');
      return;
    }
    if (!isRegistered) {
      setError('Please register before continuing a game');
      console.log('[handleContinueGame] User not registered');
      return;
    }
    if (loading) {
      setError('Action in progress, please wait');
      console.log('[handleContinueGame] Action in progress');
      return;
    }
    if (!continueGameId || isNaN(continueGameId) || continueGameId <= 0) {
      setError('Please enter a valid game ID');
      console.log('[handleContinueGame] Invalid game ID:', continueGameId);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log(`[handleContinueGame] Checking status for game ID: ${continueGameId}`);
      const gameData = await waitForGameStatus(continueGameId);
      if (!gameData) {
        setError('Failed to fetch game data');
        console.log('[handleContinueGame] Game data not found');
        return;
      }

      const isPending = !!gameData.status?.variant?.Pending;
      const isOngoing = !!gameData.status?.variant?.Ongoing || Number(gameData.dice_face) > 0;

      console.log(`[handleContinueGame] Game status - Pending: ${isPending}, Ongoing: ${isOngoing}, dice_face: ${gameData.dice_face}`);

      if (isPending) {
        console.log(`[handleContinueGame] Redirecting to /game-waiting?gameId=${continueGameId}`);
        router.push(`/game-waiting?gameId=${continueGameId}`);
      } else if (isOngoing) {
        console.log(`[handleContinueGame] Redirecting to /game-play?gameId=${continueGameId}`);
        router.push(`/game-play?gameId=${continueGameId}`);
      } else {
        throw new Error('Invalid game status');
      }
    } catch (err: any) {
      console.error('[handleContinueGame] Error:', err.message);
      setError(err?.message || 'Failed to continue game. Please verify the game ID or try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGame = async () => {
    if (!account || !address) {
      setError('Please connect your wallet');
      console.log('[handleLeaveGame] No wallet connected');
      return;
    }
    if (!isRegistered) {
      setError('Please register before leaving a game');
      console.log('[handleLeaveGame] User not registered');
      return;
    }
    if (loading) {
      setError('Action in progress, please wait');
      console.log('[handleLeaveGame] Action in progress');
      return;
    }
    if (!continueGameId || isNaN(continueGameId) || continueGameId <= 0) {
      setError('Please enter a valid game ID');
      console.log('[handleLeaveGame] Invalid game ID:', continueGameId);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log(`[handleLeaveGame] Leaving game ID: ${continueGameId}`);
      const tx = await game.leaveGame(account, continueGameId);
      console.log('[handleLeaveGame] Leave game transaction:', tx);

      if (!tx?.transaction_hash) {
        throw new Error('No transaction hash returned from leaveGame');
      }

      const updatedGames = ongoingGames.filter((id) => id !== continueGameId);
      setOngoingGames(updatedGames);
      localStorage.setItem('ongoingGames', JSON.stringify(updatedGames));
      setContinueGameId(null);
      setSuccess('Successfully left game');
    } catch (err: any) {
      console.error('[handleLeaveGame] Error:', err.message);
      setError(err?.message || 'Failed to leave game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearOngoingGames = () => {
    localStorage.removeItem('ongoingGames');
    setOngoingGames([]);
    console.log('[clearOngoingGames] Cleared ongoing games from localStorage');
  };

  useEffect(() => {
    if (roomId && !isNaN(roomId) && roomId > 0) {
      fetchAvailableTokens(roomId);
    } else {
      setAvailableTokens(tokens);
    }
  }, [roomId]);

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
                  onClick={() => setShowJoinModal(id)}
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
              <label className="block text-[#F0F7F7] font-dmSans text-[14px] mb-2">Select Token</label>
              <select
                value={joinToken}
                onChange={(e) => setJoinToken(e.target.value)}
                className="w-full h-[52px] px-4 text-[#73838B] border border-[#0E282A] rounded-[12px] outline-none focus:border-[#00F0FF] bg-transparent"
                disabled={loading}
              >
                <option value="" disabled>Select a token</option>
                {availableTokens.map((token) => (
                  <option key={token.name} value={token.name}>
                    {token.emoji} {token.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => handleJoinRoom()}
              className="relative group w-full h-[52px] bg-transparent border-none p-0 overflow-hidden cursor-pointer"
              disabled={loading || !roomId || !joinToken}
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
            <div className="flex flex-col md:flex-row gap-4">
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
                    d="M10 1H250C254.373 1 256.996 6.85486 254.601 10.5127L236.167 49.5127C235.151 51.0646 233.42 52 231.565 52H10C6.96243 52 4.5 49.5376 4.5 46.5V6.5C0.5 3.46243 6.96243 1 10 1Z"
                    fill="#00F0FF"
                    stroke="#0E282A"
                    strokeWidth="1"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[#010F10] text-[18px] font-orbitron font-[700] z-10">
                  Continue Game
                </span>
              </button>
              <button
                onClick={handleLeaveGame}
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
                    d="M10 1H250C254.373 1 256.996 6.85486 254.601 10.5127L236.167 49.5127C235.151 51.0646 233.42 52 231.565 52H10C6.96243 52 4.5 49.5376 4.5 46.5V6.5C0.5 3.46243 6.96243 1 10 1Z"
                    fill="#FF4D4D"
                    stroke="#0E282A"
                    strokeWidth="1"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[#010F10] text-[18px] font-orbitron font-[700] z-10">
                  Leave Game
                </span>
              </button>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
          {success && <p className="text-green-400 text-sm text-center mt-4">{success}</p>}
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

        {showJoinModal !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
            <div className="bg-[#010F10] border border-[#00F0FF] rounded-xl p-6 w-full max-w-sm text-white">
              <h2 className="text-xl font-bold mb-4 text-center font-orbitron text-[#00F0FF]">
                Join Ongoing Game
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Game ID</label>
                  <input
                    type="number"
                    value={showJoinModal}
                    disabled
                    className="w-full px-3 py-2 bg-transparent border border-[#003B3E] rounded text-[#73838B]"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Select Token</label>
                  <select
                    value={joinToken}
                    onChange={(e) => setJoinToken(e.target.value)}
                    className="w-full px-3 py-2 bg-transparent border border-[#003B3E] rounded"
                    disabled={loading}
                  >
                    <option value="" disabled>Select a token</option>
                    {availableTokens.map((token) => (
                      <option key={token.name} value={token.name}>
                        {token.emoji} {token.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => {
                    handleJoinRoom(showJoinModal, joinToken);
                    setShowJoinModal(null);
                    setJoinToken('');
                  }}
                  className="w-full bg-[#00F0FF] text-[#010F10] py-2 rounded font-bold"
                  disabled={loading || !joinToken}
                >
                  Join Game
                </button>
                <button
                  onClick={() => {
                    setShowJoinModal(null);
                    setJoinToken('');
                  }}
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