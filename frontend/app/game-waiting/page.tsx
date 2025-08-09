'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount } from '@starknet-react/core';
import { useGameActions } from '@/hooks/useGameActions';

interface Game {
  status: { variant: { Pending?: {}; Ongoing?: {} } };
  players_joined: string;
  number_of_players: string;
  creator: `0x${string}` | undefined;
  is_initialised: boolean;
  hat: string;
  car: string;
  dog: string;
  thimble: string;
  iron: string;
  battleship: string;
  boot: string;
  wheelbarrow: string;
  game_players: string[];
  player_hat: string;
  player_car: string;
  player_dog: string;
  player_thimble: string;
  player_iron: string;
  player_battleship: string;
  player_boot: string;
  player_wheelbarrow: string;
}

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
  const [isPending, setIsPending] = useState<boolean | null>(null);
  const [isPlayerInGame, setIsPlayerInGame] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const numericGameId = gameId ? Number(gameId) : NaN;
  const isGameReady = playersJoined !== null && maxPlayers !== null && playersJoined === maxPlayers && isInitialised;
  const isCreator = address === creator;
  const showStartGame = playersJoined !== null && maxPlayers !== null && playersJoined === maxPlayers;
  const showGoToBoard = isGameReady && !!isPending && !!isPlayerInGame;

  const fetchGameData = useCallback(async () => {
    if (!gameId || isNaN(numericGameId)) return;

    try {
      const gameData = (await gameActions.getGame(numericGameId)) as Game;
      if (!gameData) {
        console.warn('No game data returned, keeping last state.');
        return;
      }

      const joined = Number(gameData.players_joined);
      const max = Number(gameData.number_of_players);
      const initialised = Boolean(gameData.is_initialised);
      const pending = !!gameData.status?.variant?.Pending;

      const tokenFields = [
        gameData.hat,
        gameData.car,
        gameData.dog,
        gameData.thimble,
        gameData.iron,
        gameData.battleship,
        gameData.boot,
        gameData.wheelbarrow,
      ];
      const playerInGame = address ? gameData.game_players.includes(address) : false;

      // Debugging logs
      console.log('[GameWaiting] fetchGameData:', {
        gameId,
        numericGameId,
        address,
        tokenFields,
        gamePlayers: gameData.game_players,
        playerInGame,
        playersJoined: joined,
        maxPlayers: max,
        isInitialised: initialised,
        isPending: pending,
        isGameReady,
        rawGameData: gameData,
      });

      setPlayersJoined(!isNaN(joined) ? joined : playersJoined);
      setMaxPlayers(!isNaN(max) ? max : maxPlayers);
      setIsInitialised(initialised);
      setIsPending(pending);
      setIsPlayerInGame(playerInGame);
      setLastUpdated(Date.now());
      setError(null);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching game data:', err.message);
      setError('Failed to load game data. Retrying...');
    }
  }, [gameId, numericGameId, gameActions, address, playersJoined, maxPlayers, router]);

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    fetchGameData();
    intervalId = setInterval(fetchGameData, 5000);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchGameData]);

  const handleStartGame = () => {
    if (!account || !address || !gameId) {
      setError('Please connect your wallet');
      return;
    }
    if (playersJoined === null || maxPlayers === null || playersJoined !== maxPlayers) {
      setError('Cannot start game until all players have joined');
      return;
    }

    console.log('[GameWaiting] Redirecting to /game-play');
    router.push(`/game-play?gameId=${numericGameId}`);
  };

  const handleGoToBoard = () => {
    if (!gameId || !isGameReady || !isPlayerInGame) {
      setError('Cannot proceed to game board');
      return;
    }
    console.log('[GameWaiting] Navigating to game board:', numericGameId);
    router.push(`/game-play?gameId=${numericGameId}`);
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
            Blockopoly Waiting Room
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
                {playersJoined === maxPlayers ? 'All players joined!' : 'Waiting for players to join...'}
              </p>
              <p className="text-[#00F0FF] text-lg font-semibold">
                Players: {playersJoined ?? '—'}/{maxPlayers ?? '—'}
              </p>
              <p className="text-[#FFD700] text-sm">
                Initialised: {isInitialised ? '✅ Yes' : '⏳ No'}
              </p>
              <p className="text-gray-400 text-xs">
                Player in game: {isPlayerInGame ? '✅ Yes' : '❌ No'}
              </p>
              <p className="text-gray-400 text-xs">
                Last updated: {timeAgo()}
              </p>
            </div>
          )}

          {showStartGame && (
            <button
              onClick={handleStartGame}
              className="w-full mt-6 bg-[#00F0FF] text-black text-sm font-orbitron font-semibold py-3 rounded-lg hover:bg-[#00D4E6] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              disabled={playersJoined !== maxPlayers}
            >
              Start Game
            </button>
          )}

          {showGoToBoard && (
            <button
              onClick={handleGoToBoard}
              className="w-full mt-6 bg-[#FFD700] text-black text-sm font-orbitron font-semibold py-3 rounded-lg hover:bg-[#FFCA28] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              disabled={loading}
            >
              Go to Board
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