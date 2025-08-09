'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGameActions } from '@/hooks/useGameActions';
import { useAccount } from '@starknet-react/core';

const GameWaiting = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = searchParams.get('gameId');
  const creator = searchParams.get('creator');
  const { account, address } = useAccount();
  const gameActions = useGameActions();

  const [playersJoined, setPlayersJoined] = useState<number | null>(null);
  const [maxPlayers, setMaxPlayers] = useState<number | null>(null);
  const [isInitialised, setIsInitialised] = useState<boolean | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isCreator =
    address && creator && address.toLowerCase() === creator.toLowerCase();
  const numericGameId = gameId ? Number(gameId) : NaN;

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    const fetchGameData = async () => {
      if (!gameId || isNaN(numericGameId)) return;

      try {
        const gameData = await gameActions.getGame(numericGameId);
        if (!isMounted || !gameData) {
          console.warn('No game data returned, keeping last state.');
          return;
        }

        const joined = Number(gameData.players_joined);
        const max = Number(gameData.number_of_players);
        const initialised = Boolean(gameData.is_initialised);

        setPlayersJoined(!isNaN(joined) ? joined : playersJoined);
        setMaxPlayers(!isNaN(max) ? max : maxPlayers);
        setIsInitialised(initialised);
        setLastUpdated(Date.now());
        setError(null);
        setLoading(false);

        if (initialised && joined >= 0 && max > 0 && joined === max) {
          router.push(`/game?gameId=${numericGameId}`);
        }
      } catch (err: any) {
        console.error('Error fetching game data:', err.message);
        if (isMounted) {
          setError('Failed to load game data. Retrying...');
        }
      }
    };

    fetchGameData();
    intervalId = setInterval(fetchGameData, 5000);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [gameId, numericGameId, gameActions, router, playersJoined, maxPlayers]);

  const handleStartGame = async () => {
    if (!account || !gameId) {
      setError('Please connect your wallet');
      return;
    }
    if (!isCreator) {
      setError('Only the game creator can start the game');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await gameActions.startGame(account, numericGameId);
      router.push(`/game?gameId=${numericGameId}`);
    } catch (err: any) {
      console.error('Error starting game:', err.message);
      setError(err?.message || 'Failed to start game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const timeAgo = () => {
    if (!lastUpdated) return 'Never';
    const seconds = Math.floor((Date.now() - lastUpdated) / 1000);
    return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  };

  if (!gameId || isNaN(numericGameId)) {
    return (
      <section className="w-full h-[calc(100dvh-87px)] flex items-center justify-center bg-gray-900">
        <p className="text-red-500 text-xl font-semibold font-orbitron animate-pulse">
          Invalid Game ID
        </p>
      </section>
    );
  }

  return (
    <section className="w-full h-[calc(100dvh-87px)] bg-settings bg-cover bg-fixed bg-center">
      <main className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#010F10]/90 to-[#010F10]/50 px-4 sm:px-6">
        <div className="w-full max-w-md bg-[#0A1A1B]/80 p-6 sm:p-8 rounded-xl shadow-lg border border-[#00F0FF]/30 backdrop-blur-sm">
          <h2 className="text-2xl sm:text-3xl font-bold font-orbitron mb-6 text-[#F0F7F7] text-center tracking-wide">
            CHAINOPOLY Waiting Room
            <span className="block text-sm text-[#00F0FF] mt-1">
              Game ID: {gameId}
            </span>
          </h2>

          {loading && playersJoined === null ? (
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00F0FF]"></div>
              <p className="ml-3 text-[#00F0FF] font-orbitron">
                Loading game data...
              </p>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <p className="text-[#869298] text-sm">
                Waiting for players to join...
              </p>
              <p className="text-[#00F0FF] text-lg font-semibold">
                Players: {playersJoined ?? '—'}/{maxPlayers ?? '—'}
              </p>
              <p className="text-[#FFD700] text-sm">
                Initialised: {isInitialised ? '✅ Yes' : '⏳ No'}
              </p>
              <p className="text-gray-400 text-xs">
                Last updated: {timeAgo()}
              </p>
            </div>
          )}

          {isCreator && (
            <button
              onClick={handleStartGame}
              className="w-full mt-6 bg-[#00F0FF] text-black text-sm font-orbitron font-semibold py-3 rounded-lg hover:bg-[#00D4E6] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              disabled={loading}
            >
              {loading ? 'Starting...' : 'Start Game'}
            </button>
          )}

          <button
            onClick={() => router.push('/join-room')}
            className="w-full mt-3 text-[#0FF0FC] text-sm font-orbitron hover:text-[#00D4E6] transition-colors duration-200"
          >
            Back to Join Room
          </button>

          {error && (
            <p className="text-red-500 text-xs mt-4 text-center animate-pulse">
              {error}
            </p>
          )}
        </div>
      </main>
    </section>
  );
};

export default GameWaiting;