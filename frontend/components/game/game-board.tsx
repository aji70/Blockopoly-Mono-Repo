'use client';

import React, { useState, useEffect } from 'react';
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

const PLAYER_TOKENS = ['🎩', '🚗', '🐕', '🛩️', '🚀', '🐱', '🛥️', '⛵️'];

const CHANCE_CARDS = [
  "Advance to Go (Collect $200)",
  "Advance to MakerDAO Avenue - If you pass Go, collect $200",
  "Advance to Arbitrium Avenue - If you pass Go, collect $200",
  "Advance token to nearest Utility. Pay 10x dice.",
  "Advance token to nearest Railroad. Pay 2x rent.",
  "Bank pays you dividend of $50",
  "Get out of Jail Free",
  "Go Back 3 Spaces",
  "Go to Jail",
  "Make general repairs - $25 house, $100 hotel",
  "Pay poor tax of $15",
  "Take a trip to IPFS Railroad",
  "Take a walk on the Bitcoin Lane",
  "Speeding fine $200",
  "Building loan matures - collect $150",
];

// Placeholder for Community Chest cards; update with actual cards
const COMMUNITY_CHEST_CARDS = [
  "Advance to Go (Collect $200)",
  "Bank pays you dividend of $50",
  "Get out of Jail Free",
  "Go to Jail",
  "Pay poor tax of $15",
  "Building loan matures - collect $150",
];

const GameBoard = () => {
  const { account, address } = useAccount();
  const gameActions = useGameActions();
  const playerActions = usePlayerActions();
  const movementActions = useMovementActions();
  const propertyActions = usePropertyActions();
  const searchParams = useSearchParams();

  const [players, setPlayers] = useState<any[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [lastRoll, setLastRoll] = useState<{ die1: number; die2: number; total: number } | null>(null);
  const [gameId, setGameId] = useState<number | null>(null);
  const [game, setGame] = useState<any | null>(null);
  const [player, setPlayer] = useState<any | null>(null);
  const [currentProperty, setCurrentProperty] = useState<any | null>(null);
  const [ownedProperties, setOwnedProperties] = useState<{ [key: number]: { owner: string; token: string } }>({});
  const [inputGameId, setInputGameId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  useEffect(() => {
    console.log('boardData:', boardData);
  }, []);

  useEffect(() => {
    const id = searchParams.get('gameId') || localStorage.getItem('gameId');
    if (id) {
      setGameId(Number(id));
      setInputGameId(id);
      localStorage.setItem('gameId', id);
    }
  }, [searchParams]);

  useEffect(() => {
    if (address && gameId !== null) {
      loadGameData(address, gameId.toString());
    }
  }, [address, gameId]);

  const loadGameData = async (playerAddress: string, gid: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const gameData = await gameActions.getGame(gid);
      console.log('Game Data:', gameData);
      const gamePlayers = await Promise.all(
        (gameData.game_players || []).map(async (addr: any, index: number) => {
          const player = await gameActions.getPlayer(addr, gid);
          console.log(`Player Data for ${addr}:`, player);
          const addrString = typeof addr === 'string' ? addr : String(addr);
          const decodedUsername = shortString.decodeShortString(player.username);

          return {
            id: index,
            address: addrString,
            name: decodedUsername,
            token: PLAYER_TOKENS[index % PLAYER_TOKENS.length],
            position: Number(player.position || 0),
            balance: Number(player.balance || 0),
            jailed: !!player.jailed,
            isBankrupt: !!player.is_bankrupt,
            propertiesOwned: player.properties_owned || [],
            isNext: !!player.is_next,
            // chanceJailCard: !!player.chance_jail_card,
            // communityJailCard: !!player.community_jail_card,
          };
        })
      );
      setPlayers(gamePlayers);
      setGame({
        id: Number(gameData.id || 0),
        nextPlayer:
          gameData.next_player && typeof gameData.next_player === 'string' && gameData.next_player !== '0'
            ? shortString.decodeShortString(gameData.next_player)
            : String(gameData.next_player) || 'Unknown',
      });

      const playerData = await gameActions.getPlayer(playerAddress, gid);
      console.log('Player Data:', playerData);
      const decodedPlayerUsername = shortString.decodeShortString(playerData.username);
      setPlayer({
        address: playerAddress,
        username: decodedPlayerUsername,
        balance: Number(playerData.balance || 0),
        position: Number(playerData.position || 0),
        jailed: !!playerData.jailed,
        is_bankrupt: !!playerData.is_bankrupt,
        propertiesOwned: playerData.properties_owned || [],
        // chanceJailCard: !!player.chance_jail_card,
        // communityJailCard: !!player.community_jail_card,
      });

      const ownershipMap: { [key: number]: { owner: string; token: string } } = {};
      for (const square of boardData) {
        if (square.type === 'property') {
          const propertyData = await propertyActions.getProperty(square.id, gid);
          console.log(`Property Data for ID ${square.id}:`, propertyData);
          if (propertyData.owner) {
            const ownerAddress = typeof propertyData.owner === 'string' ? propertyData.owner : String(propertyData.owner);
            const ownerPlayer = gamePlayers.find((p) => p.address === ownerAddress);
            ownershipMap[square.id] = {
              owner: ownerAddress,
              token: ownerPlayer ? ownerPlayer.token : '❓',
            };
          }
        }
      }
      setOwnedProperties(ownershipMap);

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
          owner:
            propertyData.owner && typeof propertyData.owner === 'string'
              ? propertyData.owner
              : String(propertyData.owner) || null,
          rent_site_only: propertyData.rent_site_only
            ? Number(propertyData.rent_site_only)
            : boardData[position]?.rent_site_only || 0,
        });

        if (account && (propertyData.type === 'Chance' || propertyData.type === 'CommunityChest')) {
          const cardList = propertyData.type === 'Chance' ? CHANCE_CARDS : COMMUNITY_CHEST_CARDS;
          const randomCard = cardList[Math.floor(Math.random() * cardList.length)];
          setSelectedCard(randomCard);
          await handleAction(
            () =>
              propertyData.type === 'Chance'
                ? movementActions.processChanceCard(account, gid, byteArray.byteArrayFromString(randomCard))
                : movementActions.processCommunityChestCard(account, gid, byteArray.byteArrayFromString(randomCard)),
            propertyData.type === 'Chance' ? 'processChanceCard' : 'processCommunityChestCard'
          );
        } else {
          setSelectedCard(null);
        }
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
        loadGameData(address, gid.toString());
      }
    } else {
      setError('Please enter a valid Game ID.');
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
      const result = await movementActions.movePlayer(account, gameId.toString(), roll);
      console.log('movePlayer Contract Position:', result);

      const updatedPlayers = [...players];
      const newPos = (updatedPlayers[currentPlayerIndex].position + roll) % boardData.length;
      console.log('UI Calculated Position:', newPos);
      updatedPlayers[currentPlayerIndex].position = newPos;
      setPlayers(updatedPlayers);
      setCurrentPlayerIndex((prev) => (prev + 1) % players.length);

      if (address && gameId !== null) {
        await loadGameData(address, gameId.toString());
      }
    } catch (err: any) {
      console.error('rollDice Error:', err);
      setError(err.message || 'Error rolling dice.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (fn: () => Promise<any>, label: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fn();
      console.log(`${label} Response:`, res);
      if (address && gameId !== null) {
        await loadGameData(address, gameId.toString());
      }
    } catch (err: any) {
      console.error(`${label} Error:`, err);
      setError(err.message || `Error in ${label}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayTax = async () => {
    if (!account || !gameId || !currentProperty) return;
    await handleAction(
      () => movementActions.payTax(account, currentProperty.id, gameId.toString()),
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
      <div className="lg:w-2/3 flex justify-center items-center">
        <div className="w-full max-w-[900px] bg-[#010F10] aspect-square rounded-lg">
          <div className="grid grid-cols-11 grid-rows-11 w-full h-full gap-[2px]">
            <div className="col-start-2 col-span-9 row-start-2 row-span-9 bg-[#010F10] flex flex-col justify-center items-center p-4">
              <h1 className="text-3xl lg:text-5xl font-bold text-[#F0F7F7] font-orbitron text-center mb-4">
                BLOCKOPOLY
              </h1>
              <div className="bg-gray-800 p-4 rounded-lg w-full max-w-sm">
                <h2 className="text-base font-semibold text-cyan-300 mb-3">Game Actions</h2>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={rollDice}
                    disabled={!gameId || isLoading}
                    className="px-4 py-2 bg-cyan-600 text-white text-sm rounded-md hover:bg-cyan-700 disabled:opacity-50 transition-all"
                  >
                    🎲 Roll Dice
                  </button>
                  {lastRoll !== null && (
                    <p className="text-gray-300 text-sm">
                      Rolled: <span className="font-bold text-white">{lastRoll.die1} + {lastRoll.die2} = {lastRoll.total}</span>
                    </p>
                  )}
                  <div className="flex flex-row gap-2 flex-wrap">
                    <button
                      onClick={() =>
                        account &&
                        gameId !== null &&
                        handleAction(
                          () => propertyActions.buyProperty(account, currentProperty?.id || 0, gameId.toString()),
                          'buyProperty'
                        )
                      }
                      disabled={!account || gameId === null || !currentProperty || isLoading || currentProperty?.type !== 'property'}
                      className="px-1.5 py-0.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 disabled:opacity-50 transition-all"
                    >
                      Buy Property
                    </button>
                    <button
                      onClick={() =>
                        account &&
                        gameId !== null &&
                        handleAction(
                          () => propertyActions.payRent(account, currentProperty?.id || 0, gameId.toString()),
                          'payRent'
                        )
                      }
                      disabled={!account || gameId === null || !currentProperty || isLoading || currentProperty?.type !== 'property'}
                      className="px-1.5 py-0.5 bg-orange-600 text-white text-xs rounded-md hover:bg-orange-700 disabled:opacity-50 transition-all"
                    >
                      Pay Rent
                    </button>
                    <button
                      onClick={() =>
                        account &&
                        gameId !== null &&
                        handleAction(
                          () => propertyActions.finishTurn(account, gameId.toString()),
                          'finishTurn'
                        )
                      }
                      disabled={!account || gameId === null || isLoading}
                      className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50 transition-all"
                    >
                      Finish Turn
                    </button>
                    <button
                      onClick={handlePayTax}
                      disabled={!account || gameId === null || !currentProperty || isLoading || currentProperty?.type !== 'special' || currentProperty?.name !== 'Tax'}
                      className="px-1.5 py-0.5 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700 disabled:opacity-50 transition-all"
                    >
                      Pay Tax
                    </button>
                  </div>
                  {error && (
                    <p className="text-red-400 text-sm mt-2">{error}</p>
                  )}
                </div>
              </div>
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
                      <span key={p.id} className="text-2xl">{p.token}</span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
              className="px-2 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 disabled:opacity-50 transition-all"
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
                {selectedCard && (currentProperty.type === 'special' && (currentProperty.name === 'Chance' || currentProperty.name === 'CommunityChest')) && (
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
                <p className="text-sm">
                  <strong>Username:</strong> {player.username}
                </p>
                <p className="text-sm"><strong>Balance:</strong> {player.balance}</p>
                <p className="text-sm"><strong>Position:</strong> {player.position}</p>
                <p className="text-sm"><strong>Jailed:</strong> {player.jailed ? 'Yes' : 'No'}</p>
                <p className="text-sm"><strong>Bankrupt:</strong> {player.is_bankrupt ? 'Yes' : 'No'}</p>
                {/* <p className="text-sm"><strong>Chance Jail Card:</strong> {player.chanceJailCard ? 'Yes' : 'No'}</p>
                <p className="text-sm"><strong>Community Jail Card:</strong> {player.communityJailCard ? 'Yes' : 'No'}</p> */}
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