'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { useSearchParams } from 'next/navigation';
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
  "Advance to Go (Collect $200)",
  "Advance to MakerDAO Avenue - If you pass Go, collect $200",
  "Advance to Arbitrium Avenue - If you pass Go, collect $200",
  "Advance token to nearest Utility. Pay 10x dice.",
  "Advance token to nearest Railroad. Pay 2x rent.",
  "Bank pays you dividend of $50",
  "Get out of Jail Free",
  "Go Back 3 Spaces",
  "Go to Jail dirctly do not pass Go do not collect $200",
  "Make general repairs - $25 house, $100 hotel",
  "Pay poor tax of $15",
  "Take a trip to Reading Railroad",
  "Take a walk on the Bitcoin Lane",
  "Speeding fine $200",
  "Building loan matures - collect $150",
];

const COMMUNITY_CHEST_CARDS = [
  "Advance to Go (Collect $200)",
  "Bank error in your favor - Collect $200",
  "Doctor fee - Pay $50",
  "From sale of stock - Collect $50",
  "Get Out of Jail Free",
  "Go to Jail",
  "Grand Opera Night - collect $50 from every player",
  "Holiday Fund matures - Receive $100",
  "Income tax refund - Collect $20",
  "Life insurance matures - Collect $100",
  "Pay hospital fees of $100",
  "Pay school fees of $150",
  "Receive $25 consultancy fee",
  "Street repairs - $40 per house, $115 per hotel",
  "Won second prize in beauty contest - Collect $10",
  "You inherit $100",
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
  const [hasGameStarted, setHasGameStarted] = useState(false);

  useEffect(() => {
    console.log('boardData:', boardData);
  }, []);

  useEffect(() => {
    const id = searchParams.get('gameId') || localStorage.getItem('gameId');
    if (id) {
      const numId = Number(id);
      setGameId(numId);
      setInputGameId(id);
      localStorage.setItem('gameId', id);
    }
  }, [searchParams]);

  useEffect(() => {
    if (address && gameId !== null) {
      loadGameData(address, gameId);
    }
  }, [address, gameId]);

  const loadGameData = async (playerAddress: string, gid: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const gameData = await gameActions.getGame(gid);
      console.log('Game Data:', gameData);

      // Check if game has started (optional, for robustness)
      const gameStarted = gameData.next_player && gameData.next_player !== '0';
      setHasGameStarted(gameStarted);

      const currentPlayerAddress = await movementActions.getCurrentPlayer(gid);
      console.log('Current Player Address:', currentPlayerAddress);

      const gamePlayers = await Promise.all(
        (gameData.game_players || []).map(async (addr: any, index: number) => {
          const player = await gameActions.getPlayer(addr, gid);
          console.log(`Player Data for ${addr}:`, player);
          const addrString = typeof addr === 'string' ? addr : String(addr);
          const username = await playerActions.getUsernameFromAddress(addrString);
          const decodedUsername = shortString.decodeShortString(username);
          const tokenValue = Number(player.token_value || (index + 1));
          const token = tokenValueToEmoji[tokenValue] || PLAYER_TOKENS[index % PLAYER_TOKENS.length] || '❓';

          return {
            id: index,
            address: addrString,
            name: decodedUsername || `Player ${index + 1}`,
            token: token,
            position: Number(player.position || 0),
            balance: Number(player.balance || 0),
            jailed: !!player.jailed,
            isBankrupt: !!player.is_bankrupt,
            propertiesOwned: player.properties_owned || [],
            isNext: addrString === currentPlayerAddress,
          };
        })
      );
      setPlayers(gamePlayers);

      let nextPlayerUsername = 'Unknown';
      if (gameData.next_player && gameData.next_player !== '0') {
        const nextPlayerAddress = typeof gameData.next_player === 'string' ? gameData.next_player : String(gameData.next_player);
        const username = await playerActions.getUsernameFromAddress(nextPlayerAddress);
        nextPlayerUsername = shortString.decodeShortString(username) || 'Unknown';
      }

      setGame({
        id: Number(gameData.id || 0),
        currentPlayer: gamePlayers.find((p) => p.isNext)?.name || 'Unknown',
        nextPlayer: nextPlayerUsername,
      });

      const playerData = await gameActions.getPlayer(playerAddress, gid);
      console.log('Player Data:', playerData);
      const decodedPlayerUsername = shortString.decodeShortString(playerData.username);
      setPlayer({
        address: playerAddress,
        username: decodedPlayerUsername || 'Unknown',
        balance: Number(playerData.balance || 0),
        position: Number(playerData.position || 0),
        jailed: !!playerData.jailed,
        is_bankrupt: !!playerData.is_bankrupt,
        propertiesOwned: playerData.properties_owned || [],
      });

      const ownershipMap: { [key: number]: { owner: string; ownerUsername: string; token: string } } = {};
      for (const square of boardData) {
        if (square.type === 'property') {
          const propertyData = await propertyActions.getProperty(square.id, gid);
          console.log(`Property Data for ID ${square.id}:`, propertyData);
          if (propertyData.owner && propertyData.owner !== '0') {
            const ownerAddress = typeof propertyData.owner === 'string' ? propertyData.owner : String(propertyData.owner);
            const ownerPlayer = gamePlayers.find((p) => p.address === ownerAddress);
            ownershipMap[square.id] = {
              owner: ownerAddress,
              ownerUsername: ownerPlayer ? ownerPlayer.name : 'Unknown',
              token: ownerPlayer ? ownerPlayer.token : '❓',
            };
          }
        }
      }
      setOwnedProperties(ownershipMap);
      console.log('Updated ownedProperties:', ownershipMap);

      const position = Number(playerData?.position || 0);
      console.log('Fetching property for position:', position);
      const propertyId = boardData[position]?.id;
      if (propertyId !== undefined) {
        const propertyData = await propertyActions.getProperty(propertyId, gid);
        console.log('Property Data:', propertyData);
        const decodedPropertyName =
          propertyData.name && typeof propertyData.name === 'string' && propertyData.name !== '0'
            ? shortString.decodeShortString(propertyData.name)
            : propertyData.name?.variant || boardData[position]?.name || 'Unknown';
        const ownerAddress = propertyData.owner && propertyData.owner !== '0'
          ? (typeof propertyData.owner === 'string' ? propertyData.owner : String(propertyData.owner))
          : null;
        const ownerPlayer = ownerAddress ? gamePlayers.find((p) => p.address === ownerAddress) : null;
        setCurrentProperty({
          id: Number(propertyData.id || propertyId),
          name: decodedPropertyName,
          type:
            propertyData.type === 'Go' ||
            propertyData.type === 'VisitingJail' ||
            propertyData.type === 'FreeParking' ||
            propertyData.type === 'Jail'
              ? 'corner'
              : propertyData.type === 'Property' ||
                propertyData.type === 'RailRoad' ||
                propertyData.type === 'Utility'
              ? 'property'
              : propertyData.type === 'Chance' ||
                propertyData.type === 'CommunityChest' ||
                propertyData.type === 'Tax'
              ? 'special'
              : boardData[position]?.type || 'Unknown',
          owner: ownerPlayer ? ownerPlayer.name : null,
          ownerAddress: ownerAddress,
          rent_site_only: propertyData.rent_site_only
            ? Number(propertyData.rent_site_only)
            : boardData[position]?.rent_site_only || 0,
        });
        console.log('Updated currentProperty:', {
          id: Number(propertyData.id || propertyId),
          name: decodedPropertyName,
          owner: ownerPlayer ? ownerPlayer.name : null,
        });
        setSelectedCard(null);
      } else {
        console.log('No property found for position:', position);
        setCurrentProperty(null);
        setSelectedCard(null);
      }

      setError(null);
    } catch (error: any) {
      console.error('Failed to load game data:', error);
      setError(error.message || 'Failed to load game data.');
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

  const handleStartGame = async () => {
    if (!account || !gameId) {
      setError('Please connect your wallet and provide a valid Game ID.');
      return;
    }

    const res = await handleAction(
      () => gameActions.startGame(account, gameId),
      'startGame'
    );
    if (res) {
      setHasGameStarted(true);
    }
  };

  const rollDice = async () => {
    if (!account || players.length === 0 || gameId === null) {
      setError('Please provide a valid Game ID and connect your account.');
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
      console.log('movePlayer Contract Position:', result);

      const updatedPlayers = [...players];
      const newPos = (updatedPlayers[currentPlayerIndex].position + roll) % boardData.length;
      console.log('UI Calculated Position:', newPos);
      updatedPlayers[currentPlayerIndex].position = newPos;
      setPlayers(updatedPlayers);
      setCurrentPlayerIndex((prev) => (prev + 1) % players.length);

      if (address && gameId !== null) {
        await loadGameData(address, gameId);
      }
    } catch (err: any) {
      console.error('rollDice Error:', err);
      setError(err.message || 'Error rolling dice.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrawCard = async (type: 'Chance' | 'CommunityChest') => {
    if (!account || !gameId || !currentProperty || currentProperty.name !== type) {
      setError(`You must be on a ${type} square to draw a card.`);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const cardList = type === 'Chance' ? CHANCE_CARDS : COMMUNITY_CHEST_CARDS;
      const randomCard = cardList[Math.floor(Math.random() * cardList.length)];
      setSelectedCard(randomCard);

      await handleAction(
        () =>
          type === 'Chance'
            ? movementActions.processChanceCard(account, gameId, byteArray.byteArrayFromString(randomCard))
            : movementActions.processCommunityChestCard(account, gameId, byteArray.byteArrayFromString(randomCard)),
        `process${type}Card`
      );
    } catch (err: any) {
      console.error(`Draw ${type} Card Error:`, err);
      setError(err.message || `Error drawing ${type} card.`);
      setSelectedCard(null);
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
      console.log('Game Ended:', gameId);

      setGameId(null);
      setInputGameId('');
      setPlayers([]);
      setGame(null);
      setPlayer(null);
      setCurrentProperty(null);
      setOwnedProperties({});
      setSelectedCard(null);
      setLastRoll(null);
      setHasGameStarted(false);
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
    if (!account || !gameId) {
      setError('Please connect your wallet and provide a valid Game ID.');
      return null;
    }
    try {
      setIsLoading(true);
      setError(null);
      const res = await fn();
      console.log(`${label} Response:`, res);
      if (address && gameId !== null) {
        await loadGameData(address, gameId);
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
    if (!account || !gameId || !currentProperty) {
      setError('Please connect your wallet and ensure a valid game and property.');
      return;
    }
    await handleAction(
      () => movementActions.payTax(account, currentProperty.id, gameId),
      'payTax'
    );
  };

  const currentPlayer = players[currentPlayerIndex];
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
                BLOCKOPOLY
              </h1>
              <div className="bg-gray-800 p-4 rounded-lg w-full max-w-sm">
                <h2 className="text-base font-semibold text-cyan-300 mb-3">Game Actions</h2>
                <div className="flex flex-col gap-2">
                  {!hasGameStarted && (
                    <button
                      onClick={handleStartGame}
                      disabled={!account || !gameId || isLoading}
                      className="px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs rounded-full shadow-md hover:from-purple-600 hover:to-indigo-600 transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                    >
                      Start
                    </button>
                  )}
                  <button
                    onClick={rollDice}
                    disabled={!account || !gameId || isLoading}
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
                      onClick={() =>
                        handleAction(
                          () => propertyActions.buyProperty(account!, currentProperty?.id || 0, gameId!),
                          'buyProperty'
                        )
                      }
                      disabled={!account || !gameId || !currentProperty || isLoading || currentProperty?.type !== 'property' || currentProperty?.owner}
                      className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs rounded-full shadow-md hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                    >
                      Buy
                    </button>
                    <button
                      onClick={() =>
                        handleAction(
                          () => propertyActions.payRent(account!, currentProperty?.id || 0, gameId!),
                          'payRent'
                        )
                      }
                      disabled={!account || !gameId || !currentProperty || isLoading || currentProperty?.type !== 'property' || !currentProperty?.owner}
                      className="px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs rounded-full shadow-md hover:from-orange-600 hover:to-amber-600 transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                    >
                      Pay Rent
                    </button>
                    <button
                      onClick={() =>
                        handleAction(
                          () => propertyActions.finishTurn(account!, gameId!),
                          'finishTurn'
                        )
                      }
                      disabled={!account || !gameId || isLoading}
                      className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs rounded-full shadow-md hover:from-blue-600 hover:to-indigo-600 transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                    >
                      End Turn
                    </button>
                    <button
                      onClick={handlePayTax}
                      disabled={!account || !gameId || !currentProperty || isLoading || currentProperty?.type !== 'special' || currentProperty?.name !== 'Tax'}
                      className="px-3 py-1 bg-gradient-to-r from-purple-500 to-violet-500 text-white text-xs rounded-full shadow-md hover:from-purple-600 hover:to-violet-600 transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                    >
                      Pay Tax
                    </button>
                    <button
                      onClick={() => handleDrawCard('Chance')}
                      disabled={!account || !gameId || !currentProperty || isLoading || currentProperty.name !== 'Chance'}
                      className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-lime-500 text-white text-xs rounded-full shadow-md hover:from-yellow-600 hover:to-lime-600 transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                    >
                      Draw Chance
                    </button>
                    <button
                      onClick={() => handleDrawCard('CommunityChest')}
                      disabled={!account || !gameId || !currentProperty || isLoading || currentProperty.name !== 'CommunityChest'}
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
                  <button
                    onClick={() => setSelectedCard(null)}
                    className="mt-2 px-2 py-1 bg-red-600 text-white text-xs rounded-full hover:bg-red-700 transform hover:scale-105 transition-all duration-200"
                  >
                    Dismiss
                  </button>
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
                <p className="text-sm"><strong>Name:</strong> {currentProperty.name || boardData[player?.position || 0]?.name || 'Unknown'}</p>
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
                <p className="text-sm"><strong>Bankrupt:</strong> {player.is_bankrupt ? 'Yes' : 'No'}</p>
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