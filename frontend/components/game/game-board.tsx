'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BoardSquare } from '@/types/game';
import PropertyCard from './property-card';
import SpecialCard from './special-card';
import CornerCard from './corner-card';
import { boardData } from '@/data/board-data';
import { useAccount } from '@starknet-react/core';
import { useGameActions } from '@/hooks/useGameActions';
import { usePlayerActions } from '@/hooks/usePlayerActions';
import { useMovementActions } from '@/hooks/useMovementActions';
import { usePropertyActions } from '@/hooks/usePropertyActions';
import { shortString, byteArray } from 'starknet';

const PLAYER_TOKENS = ['🎩', '🚗', '🐕', '🚢', '🛒', '👞', '🧵', '🧼'];

const tokenValueToEmoji: { [key: number]: string } = {
  1: '🎩',
  2: '🚗',
  3: '🐕',
  4: '🚢',
  5: '🛒',
  6: '👞',
  7: '🧵',
  8: '🧼',
};

const CHANCE_CARDS = [
  'Advance to Go (Collect $200)',
  'Advance to MakerDAO Avenue - If you pass Go, collect $200',
  'Advance to Arbitrium Avenue - If you pass Go, collect $200',
  'Advance token to nearest Utility. Pay 10x dice.',
  'Advance token to nearest Railroad. Pay 2x rent.',
  'Bank pays you dividend of $50',
  'Get out of Jail Free',
  'Go Back 3 Spaces',
  'Go to Jail dirctly do not pass Go do not collect $200', // Note: Typo in wasmdemo, fixed here to match
  'Make general repairs - $25 house, $100 hotel',
  'Pay poor tax of $15',
  'Take a trip to Reading Railroad',
  'Take a walk on the Bitcoin Lane',
  'Speeding fine $200',
  'Building loan matures - collect $150',
];

const COMMUNITY_CHEST_CARDS = [
  'Advance to Go (Collect $200)',
  'Bank error in your favor - Collect $200',
  'Doctor fee - Pay $50',
  'From sale of stock - Collect $50',
  'Get Out of Jail Free',
  'Go to Jail',
  'Grand Opera Night - collect $50 from every player',
  'Holiday Fund matures - Receive $100',
  'Income tax refund - Collect $20',
  'Life insurance matures - Collect $100',
  'Pay hospital fees of $100',
  'Pay school fees of $150',
  'Receive $25 consultancy fee',
  'Street repairs - $40 per house, $115 per hotel',
  'Won second prize in beauty contest - Collect $10',
  'You inherit $100',
];

const GameBoard = () => {
  const { account, address } = useAccount();
  const gameActions = useGameActions();
  const playerActions = usePlayerActions();
  const movementActions = useMovementActions();
  const propertyActions = usePropertyActions();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [players, setPlayers] = useState<any[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [lastRoll, setLastRoll] = useState<{ die1: number; die2: number; total: number } | null>(null);
  const [gameId, setGameId] = useState<number | null>(null);
  const [game, setGame] = useState<any | null>(null);
  const [player, setPlayer] = useState<any | null>(null);
  const [currentProperty, setCurrentProperty] = useState<any | null>(null);
  const [ownedProperties, setOwnedProperties] = useState<{ [key: number]: { owner: string; ownerUsername: string; token: string } }>({});
  const [inputGameId, setInputGameId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('gameId') || localStorage.getItem('gameId');
    if (id) {
      const numId = Number(id);
      if (!isNaN(numId)) {
        setGameId(numId);
        setInputGameId(id);
        localStorage.setItem('gameId', id);
      } else {
        setError('Invalid Game ID provided.');
        router.push('/join-room');
      }
    } else {
      setError('No Game ID provided. Please join a game.');
      router.push('/join-room');
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (address && gameId !== null) {
      loadGameData(address, gameId);
    }
  }, [address, gameId]);

  const waitForGameStatus = async (gid: number, maxAttempts: number = 5, delay: number = 2000) => {
    let attempts = 0;
    while (attempts < maxAttempts) {
      try {
        const gameData = await gameActions.getGame(gid);
        if (!gameData) {
          throw new Error('Game data not found.');
        }
        // Check status.variant.Ongoing or is_initialised
        const isOngoing = 
          (gameData.status && gameData.status.variant && gameData.status.variant.Ongoing !== undefined) || 
          gameData.is_initialised === true || 
          Number(gameData.status) === 1;
        if (isOngoing) {
          return gameData;
        }
        console.log(`Game ${gid} not yet ongoing, attempt ${attempts + 1}/${maxAttempts}`);
      } catch (err: any) {
        console.warn(`Error checking game status, attempt ${attempts + 1}:`, err.message);
      }
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    throw new Error('Game is not ongoing after multiple attempts. Please verify the game ID or try again later.');
  };

  const loadGameData = async (playerAddress: string, gid: number) => {
    setIsLoading(true);
    setError(null);
    try {
      // Poll for game status to handle contract update delays
      const gameData = await waitForGameStatus(gid);
      
      const currentPlayerAddress = await movementActions.getCurrentPlayer(gid);
      const gamePlayers = await Promise.all(
        (gameData.game_players || []).map(async (addr: any, index: number) => {
          const playerData = await gameActions.getPlayer(addr, gid);
          const addrString = typeof addr === 'string' ? addr : String(addr);
          const username = await playerActions.getUsernameFromAddress(addrString);
          const decodedUsername = shortString.decodeShortString(username) || `Player ${index + 1}`;
          const tokenValue = Number(playerData.token_value || (index + 1));
          const token = tokenValueToEmoji[tokenValue] || PLAYER_TOKENS[index % PLAYER_TOKENS.length] || '❓';

          return {
            id: index,
            address: addrString,
            name: decodedUsername,
            token,
            position: Number(playerData.position || 0),
            balance: Number(playerData.balance || 0),
            jailed: Boolean(playerData.jailed),
            isBankrupt: Boolean(playerData.is_bankrupt),
            propertiesOwned: playerData.properties_owned || [],
            isNext: addrString === currentPlayerAddress,
          };
        })
      );
      setPlayers(gamePlayers);

      // Sync currentPlayerIndex with contract's next_player
      const currentPlayerIdx = gamePlayers.findIndex((p) => p.address === currentPlayerAddress);
      if (currentPlayerIdx !== -1) {
        setCurrentPlayerIndex(currentPlayerIdx);
      }

      const nextPlayerAddress = gameData.next_player && gameData.next_player !== '0' ? String(gameData.next_player) : null;
      const nextPlayerUsername = nextPlayerAddress
        ? shortString.decodeShortString(await playerActions.getUsernameFromAddress(nextPlayerAddress)) || 'Unknown'
        : 'Unknown';

      setGame({
        id: Number(gameData.id || gid),
        currentPlayer: gamePlayers.find((p) => p.isNext)?.name || 'Unknown',
        nextPlayer: nextPlayerUsername,
      });

      const playerData = await gameActions.getPlayer(playerAddress, gid);
      const decodedPlayerUsername = shortString.decodeShortString(playerData.username) || 'Unknown';
      setPlayer({
        address: playerAddress,
        username: decodedPlayerUsername,
        balance: Number(playerData.balance || 0),
        position: Number(playerData.position || 0),
        jailed: Boolean(playerData.jailed),
        isBankrupt: Boolean(playerData.is_bankrupt),
        propertiesOwned: playerData.properties_owned || [],
      });

      const ownershipMap: { [key: number]: { owner: string; ownerUsername: string; token: string } } = {};
      for (const square of boardData) {
        if (square.type === 'property') {
          const propertyData = await propertyActions.getProperty(square.id, gid);
          if (propertyData.owner && propertyData.owner !== '0') {
            const ownerAddress = String(propertyData.owner);
            const ownerPlayer = gamePlayers.find((p) => p.address === ownerAddress);
            ownershipMap[square.id] = {
              owner: ownerAddress,
              ownerUsername: ownerPlayer?.name || 'Unknown',
              token: ownerPlayer?.token || '❓',
            };
          }
        }
      }
      setOwnedProperties(ownershipMap);

      const position = Number(playerData.position || 0);
      const square = boardData[position];
      if (square) {
        const propertyData = await propertyActions.getProperty(square.id, gid);
        const decodedPropertyName = propertyData.name && propertyData.name !== '0'
          ? shortString.decodeShortString(propertyData.name)
          : square.name || 'Unknown';
        const ownerAddress = propertyData.owner && propertyData.owner !== '0' ? String(propertyData.owner) : null;
        const ownerPlayer = ownerAddress ? gamePlayers.find((p) => p.address === ownerAddress) : null;

        setCurrentProperty({
          id: Number(propertyData.id || square.id),
          name: decodedPropertyName,
          type: square.type,
          owner: ownerPlayer?.name || null,
          ownerAddress,
          rent_site_only: Number(propertyData.rent_site_only || square.rent_site_only || 0),
        });
      } else {
        setCurrentProperty(null);
      }
      setSelectedCard(null);
    } catch (err: any) {
      console.error('Failed to load game data:', err);
      setError(err.message || 'Failed to load game data. Please try again or check the game ID.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGameIdSubmit = () => {
    const gid = parseInt(inputGameId);
    if (!isNaN(gid)) {
      setGameId(gid);
      localStorage.setItem('gameId', inputGameId);
      if (address) {
        loadGameData(address, gid);
      }
    } else {
      setError('Please enter a valid Game ID.');
    }
  };

  const rollDice = async () => {
    if (!account || !gameId || !players.find((p) => p.address === address && p.isNext)) {
      setError('Not your turn or invalid game state.');
      return;
    }

    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const roll = die1 + die2;
    setLastRoll({ die1, die2, total: roll });

    try {
      setIsLoading(true);
      setError(null);
      const result = await movementActions.movePlayer(account, gameId, roll);
      setCurrentPlayerIndex((prev) => (prev + 1) % players.length); // Update locally
      if (address && gameId !== null) {
        await loadGameData(address, gameId); // Sync with contract
      }
    } catch (err: any) {
      console.error('rollDice Error:', err);
      setError(err.message || 'Error rolling dice.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrawCard = async (type: 'Chance' | 'CommunityChest') => {
    if (!account || !gameId || !currentProperty || currentProperty.name !== type || !players.find((p) => p.address === address && p.isNext)) {
      setError(`Not your turn or you must be on a ${type} square to draw a card.`);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const cardList = type === 'Chance' ? CHANCE_CARDS : COMMUNITY_CHEST_CARDS;
      const randomCard = cardList[Math.floor(Math.random() * cardList.length)];
      setSelectedCard(randomCard);
    } catch (err: any) {
      console.error(`Draw ${type} Card Error:`, err);
      setError(err.message || `Error drawing ${type} card.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessCard = async (type: 'Chance' | 'CommunityChest') => {
    if (!account || !gameId || !currentProperty || !selectedCard || currentProperty.name !== type || !players.find((p) => p.address === address && p.isNext)) {
      setError(`Not your turn or no ${type} card to process.`);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await handleAction(
        () =>
          type === 'Chance'
            ? movementActions.processChanceCard(account, gameId, byteArray.byteArrayFromString(selectedCard))
            : movementActions.processCommunityChestCard(account, gameId, byteArray.byteArrayFromString(selectedCard)),
        `process${type}Card`
      );
      setCurrentPlayerIndex((prev) => (prev + 1) % players.length); // Update locally
      setSelectedCard(null);
    } catch (err: any) {
      console.error(`Process ${type} Card Error:`, err);
      setError(err.message || `Error processing ${type} card.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndGame = async () => {
    if (!account || !gameId) {
      setError('Please connect your account and provide a valid Game ID.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await gameActions.endGame(account, gameId);
      setGameId(null);
      setInputGameId('');
      setPlayers([]);
      setGame(null);
      setPlayer(null);
      setCurrentProperty(null);
      setOwnedProperties({});
      setSelectedCard(null);
      setLastRoll(null);
      localStorage.removeItem('gameId');
      router.push('/');
    } catch (err: any) {
      console.error('End Game Error:', err);
      setError(err.message || 'Error ending game.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (fn: () => Promise<any>, label: string) => {
    if (!account || !gameId || !players.find((p) => p.address === address && p.isNext)) {
      setError('Not your turn or invalid game state.');
      return null;
    }
    try {
      setIsLoading(true);
      setError(null);
      const res = await fn();
      setCurrentPlayerIndex((prev) => (prev + 1) % players.length); // Update locally
      if (address && gameId !== null) {
        await loadGameData(address, gameId); // Sync with contract
      }
      return res;
    } catch (err: any) {
      console.error(`${label} Error:`, err);
      setError(err.message || `Error in ${label}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayTax = async () => {
    if (!account || !gameId || !currentProperty || !players.find((p) => p.address === address && p.isNext)) {
      setError('Not your turn or invalid game state.');
      return;
    }
    await handleAction(
      () => movementActions.payTax(account, currentProperty.id, gameId),
      'payTax'
    );
  };

  const currentPlayer = players[currentPlayerIndex] || null;
  const currentSquare = boardData[currentPlayer?.position || 0];

  const getGridPosition = (square: BoardSquare) => ({
    gridRowStart: square.gridPosition.row,
    gridColumnStart: square.gridPosition.col,
  });

  return (
    <div className="w-full min-h-screen bg-black text-white p-4 flex flex-col lg:flex-row gap-4">
      {/* Board Section */}
      <div className="lg:w-2/3 flex justify-center items-center">
        <div className="w-full max-w-[900px] bg-[#010F10] aspect-square rounded-lg relative">
          <div className="grid grid-cols-11 grid-rows-11 w-full h-full gap-[2px]">
            <div className="col-start-2 col-span-9 row-start-2 row-span-9 bg-[#010F10] flex flex-col justify-center items-center p-4">
              <h1 className="text-3xl lg:text-5xl font-bold text-[#F0F7F7] font-orbitron text-center mb-4">
                Blockopoly
              </h1>
              <div className="bg-gray-800 p-4 rounded-lg w-full max-w-sm">
                <h2 className="text-base font-semibold text-cyan-300 mb-3">Game Actions</h2>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={rollDice}
                    disabled={!account || !gameId || isLoading || !players.find((p) => p.address === address && p.isNext)}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm rounded-full shadow-lg hover:from-cyan-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                  >
                    🎲 Roll Dice
                  </button>
                  {lastRoll && (
                    <p className="text-gray-300 text-sm text-center">
                      Rolled: <span className="font-bold text-white">{lastRoll.die1} + {lastRoll.die2} = {lastRoll.total}</span>
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button
                      onClick={() => handleAction(() => propertyActions.buyProperty(account!, currentProperty?.id || 0, gameId!), 'buyProperty')}
                      disabled={!account || !gameId || !currentProperty || isLoading || currentProperty?.type !== 'property' || currentProperty?.owner || !players.find((p) => p.address === address && p.isNext)}
                      className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs rounded-full shadow-md hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                    >
                      Buy
                    </button>
                    <button
                      onClick={() => handleAction(() => propertyActions.payRent(account!, currentProperty?.id || 0, gameId!), 'payRent')}
                      disabled={!account || !gameId || !currentProperty || isLoading || currentProperty?.type !== 'property' || !currentProperty?.owner || !players.find((p) => p.address === address && p.isNext)}
                      className="px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs rounded-full shadow-md hover:from-orange-600 hover:to-amber-600 transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                    >
                      Pay Rent
                    </button>
                    <button
                      onClick={() => handleAction(() => propertyActions.finishTurn(account!, gameId!), 'finishTurn')}
                      disabled={!account || !gameId || isLoading || !players.find((p) => p.address === address && p.isNext)}
                      className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs rounded-full shadow-md hover:from-blue-600 hover:to-indigo-600 transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                    >
                      End Turn
                    </button>
                    <button
                      onClick={handlePayTax}
                      disabled={!account || !gameId || !currentProperty || isLoading || currentProperty?.type !== 'special' || currentProperty?.name !== 'Tax' || !players.find((p) => p.address === address && p.isNext)}
                      className="px-3 py-1 bg-gradient-to-r from-purple-500 to-violet-500 text-white text-xs rounded-full shadow-md hover:from-purple-600 hover:to-violet-600 transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                    >
                      Pay Tax
                    </button>
                    <button
                      onClick={() => handleDrawCard('Chance')}
                      disabled={!account || !gameId || !currentProperty || isLoading || currentProperty.name !== 'Chance' || !players.find((p) => p.address === address && p.isNext)}
                      className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-lime-500 text-white text-xs rounded-full shadow-md hover:from-yellow-600 hover:to-lime-600 transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                    >
                      Draw Chance
                    </button>
                    <button
                      onClick={() => handleDrawCard('CommunityChest')}
                      disabled={!account || !gameId || !currentProperty || isLoading || currentProperty.name !== 'CommunityChest' || !players.find((p) => p.address === address && p.isNext)}
                      className="px-3 py-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs rounded-full shadow-md hover:from-teal-600 hover:to-cyan-600 transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                    >
                      Draw CChest
                    </button>
                    <button
                      onClick={handleEndGame}
                      disabled={!account || !gameId || isLoading}
                      className="px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full shadow-md hover:from-red-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                    >
                      End Game
                    </button>
                  </div>
                  {error && (
                    <p className="text-red-400 text-sm mt-2 text-center">{error}</p>
                  )}
                </div>
              </div>
              {selectedCard && currentProperty && (currentProperty.name === 'Chance' || currentProperty.name === 'CommunityChest') && (
                <div className="mt-4 bg-[#0E282A] p-3 rounded-lg w-full max-w-sm">
                  <h3 className="text-base font-semibold text-cyan-300 mb-2">
                    {currentProperty.name === 'CommunityChest' ? 'Community Chest' : 'Chance'} Card
                  </h3>
                  <p className="text-sm text-gray-300">{selectedCard}</p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleProcessCard(currentProperty.name)}
                      disabled={isLoading || !players.find((p) => p.address === address && p.isNext)}
                      className="px-2 py-1 bg-green-600 text-white text-xs rounded-full hover:bg-green-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                    >
                      Process
                    </button>
                    <button
                      onClick={() => setSelectedCard(null)}
                      className="px-2 py-1 bg-red-600 text-white text-xs rounded-full hover:bg-red-700 transform hover:scale-105 transition-all duration-200"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>

            {boardData.map((square, index) => (
              <div
                key={square.id}
                style={getGridPosition(square)}
                className="w-full h-full p-[2px] relative"
              >
                {square.type === 'property' && (
                  <PropertyCard
                    square={square}
                    owner={ownedProperties[square.id]?.owner || null}
                    ownerUsername={ownedProperties[square.id]?.ownerUsername || null}
                    playerToken={ownedProperties[square.id]?.token}
                    isConnectedPlayer={ownedProperties[square.id]?.owner === address}
                  />
                )}
                {square.type === 'special' && <SpecialCard square={square} />}
                {square.type === 'corner' && <CornerCard square={square} />}
                <div className="absolute bottom-1 left-1 flex flex-wrap gap-1 z-10">
                  {players
                    .filter((p) => p.position === index)
                    .map((p) => (
                      <span key={p.id} className={`text-2xl ${p.isNext ? 'border-2 border-cyan-300 rounded' : ''}`}>
                        {p.token}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar Section */}
      <div className="lg:w-1/3 flex flex-col gap-2">
        <div className="bg-[#0E282A] p-3 rounded-lg">
          <h2 className="text-base font-semibold text-cyan-300 mb-2">Game ID</h2>
          <div className="flex flex-row gap-2">
            <input
              type="number"
              placeholder="Enter game ID"
              value={inputGameId}
              onChange={(e) => setInputGameId(e.target.value)}
              className="px-2 py-1 bg-gray-200 text-black text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 flex-grow"
              disabled={isLoading}
            />
            <button
              onClick={handleGameIdSubmit}
              disabled={isLoading}
              className="px-2 py-1 bg-green-600 text-white text-xs rounded-full hover:bg-green-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
            >
              Submit
            </button>
          </div>
        </div>

        <div className="bg-[#0E282A] p-3 rounded-lg">
          <h2 className="text-base font-semibold text-cyan-300 mb-2">Connected Wallet</h2>
          <p className="text-sm text-gray-300">
            Address: <span className="text-blue-300 font-mono break-all">{address || 'Not connected'}</span>
          </p>
        </div>

        <div className="bg-[#0E282A] p-3 rounded-lg">
          <h2 className="text-base font-semibold text-cyan-300 mb-2">Current Game</h2>
          {isLoading ? (
            <p className="text-gray-300 text-sm">Loading game data...</p>
          ) : game ? (
            <div className="space-y-1">
              <p className="text-sm"><strong>ID:</strong> {game.id}</p>
              <p className="text-sm"><strong>Current Player:</strong> {game.currentPlayer}</p>
              <p className="text-sm"><strong>Next Player:</strong> {game.nextPlayer}</p>
            </div>
          ) : (
            <p className="text-gray-300 text-sm">No game data available.</p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-2">
          <div className="bg-[#0E282A] p-3 rounded-lg lg:w-1/2">
            <h2 className="text-base font-semibold text-cyan-300 mb-2">Current Property</h2>
            {isLoading ? (
              <p className="text-gray-300 text-sm">Loading property data...</p>
            ) : currentProperty ? (
              <div className="space-y-1">
                <p className="text-sm"><strong>ID:</strong> {currentProperty.id}</p>
                <p className="text-sm"><strong>Name:</strong> {currentProperty.name || 'Unknown'}</p>
                <p className="text-sm"><strong>Current Owner:</strong> {currentProperty.owner || 'None'}</p>
                <p className="text-sm"><strong>Current Rent:</strong> {currentProperty.rent_site_only || 0}</p>
                {selectedCard && (currentProperty.name === 'Chance' || currentProperty.name === 'CommunityChest') && (
                  <p className="text-sm"><strong>Card Drawn:</strong> {selectedCard}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-300 text-sm">No property data available.</p>
            )}
          </div>

          <div className="bg-[#0E282A] p-3 rounded-lg lg:w-1/2">
            <h2 className="text-base font-semibold text-cyan-300 mb-2">Player Info</h2>
            {isLoading ? (
              <p className="text-gray-300 text-sm">Loading player data...</p>
            ) : player ? (
              <div className="space-y-1">
                <p className="text-sm"><strong>Username:</strong> {player.username}</p>
                <p className="text-sm"><strong>Balance:</strong> {player.balance}</p>
                <p className="text-sm"><strong>Position:</strong> {player.position}</p>
                <p className="text-sm"><strong>Jailed:</strong> {player.jailed ? 'Yes' : 'No'}</p>
                <p className="text-sm"><strong>Bankrupt:</strong> {player.isBankrupt ? 'Yes' : 'No'}</p>
              </div>
            ) : (
              <p className="text-gray-300 text-sm">No player data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;