'use client';

import { useEffect, useState } from 'react';
import { loadWasmModule, isWasmSupported, getWasmCapabilities } from '@/utils/wasm-loader';
import { useAccount, useConnect, useDisconnect } from '@starknet-react/core';
import { usePlayer } from '@/hooks/index';

export default function WasmDemo() {
  const { account, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { register, getPlayer, createGame, getGame, movePlayer } = usePlayer(address);

  const [username, setUsername] = useState('');
  const [addressp, setAddress] = useState('');
  const [gameType, setGameType] = useState('');
  const [playerSymbol, setPlayerSymbol] = useState('');
  const [numPlayers, setNumPlayers] = useState('');
  const [gameId, setGameId] = useState('');
  const [diceRoll, setDiceRoll] = useState('');
  const [propertyId, setPropertyId] = useState('');

  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = async <T,>(fn: () => Promise<T>, label: string) => {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res = await fn();
      console.log(`${label} result:`, res);
      setResponse(res);
    } catch (err: any) {
      console.error(`${label} error:`, err);
      setError(err?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // const handleRegister = () => {
  //   handleRequest(() => client.actions.registerNewPlayer(username), 'registerNewPlayer');
  // };
    const handleRegister = async () => {
    // if (!address) return;
    // handleRequest(() => register(username), "register_new_player");
    // console.log("Registering player with username:", username);
    // console.log("Account address:", address);
  };

  const handleGetPlayer = () => {
    handleRequest(() => getPlayer(addressp, gameId), 'get_game_player');
    console.log("Getting player for address:", address);
  };


  const handleCreateGame = () => {
    // handleRequest(() => client.actions.createGame(gameType, playerSymbol, numPlayers), 'createGame');
  };

  const handleJoinGame = () => {
    // handleRequest(() => client.actions.joinGame(playerSymbol, gameId), 'joinGame');
  };

  const handleStartGame = () => {
    // handleRequest(() => client.actions.startGame(gameId), 'startGame');
  };

  const handleMovePlayer = () => {
    if (!account) return;
    handleRequest(() => movePlayer(account, Number(gameId), Number(diceRoll)), 'move_player');
  };

  const handleBuyProperty = () => {
    // handleRequest(() => client.actions.buyProperty(propertyId, gameId), 'buyProperty');
  };

  const handleEndGame = () => {
    // handleRequest(() => client.actions.endGame(gameId), 'endGame');
  };

  const handleGetAllGames = () => {
    // handleRequest(() => getGame(gameId), 'retrieve_game');
  };

    const handleGetGame = () => {
    handleRequest(() => getGame(gameId), 'retrieve_game');
  };

  const handleGetGameState = () => {
    // handleRequest(() => client.actions.getGameState(gameId), 'getGameState');
  };

  const handleGetPlayers = () => {
    // handleRequest(() => client.actions.getPlayers(gameId), 'getPlayers');
  };

  useEffect(() => {
    if (isWasmSupported()) {
      // loadWasmModule();s
      getWasmCapabilities();
    }
  }, []);

  return (
  <main className="max-w-7xl mx-auto p-4 space-y-6">
    <h1 className="text-3xl font-bold text-center text-blue-400 mb-6">Wasm Monopoly Demo</h1>

    {!address ? (
      <div className="text-center text-lg text-gray-300">
        Please connect your wallet to continue.
      </div>
    ) : (
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: All Forms */}
        <div className="flex-1 space-y-6 w-full lg:w-2/3">
          {/* Player */}
          <div className="bg-gray-800 p-4 rounded-lg space-y-2">
            <h2 className="text-xl text-blue-300 font-semibold">Player</h2>
            <input
              className="bg-gray-700 p-2 rounded w-full"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button
              className="bg-blue-600 hover:bg-blue-700 p-2 rounded w-full text-white"
              onClick={handleRegister}
              disabled={loading}
            >
              Register Player
            </button>
          </div>

               <div className="bg-gray-800 p-4 rounded-lg space-y-2">
            <h2 className="text-xl text-blue-300 font-semibold">Player</h2>
            <input
              className="bg-gray-700 p-2 rounded w-full"
              placeholder="address"
              value={addressp}
              onChange={(e) => setAddress(e.target.value)}
            />
                <input
              className="bg-gray-700 p-2 rounded w-full"
              placeholder="game_id"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
            />
            <button
              className="bg-blue-600 hover:bg-blue-700 p-2 rounded w-full text-white"
              onClick={handleGetPlayer}
              disabled={loading}
            >
              Get Player
            </button>
          </div>

          {/* Game Creation */}
          <div className="bg-gray-800 p-4 rounded-lg space-y-2">
            <h2 className="text-xl text-green-300 font-semibold">Game</h2>
            <input
              className="bg-gray-700 p-2 rounded w-full"
              placeholder="Game Type"
              value={gameType}
              onChange={(e) => setGameType(e.target.value)}
            />
            <input
              className="bg-gray-700 p-2 rounded w-full"
              placeholder="Player Symbol"
              value={playerSymbol}
              onChange={(e) => setPlayerSymbol(e.target.value)}
            />
            <input
              className="bg-gray-700 p-2 rounded w-full"
              placeholder="Number of Players"
              value={numPlayers}
              onChange={(e) => setNumPlayers(e.target.value)}
            />
            <button
              className="bg-green-600 hover:bg-green-700 p-2 rounded w-full text-white"
              onClick={handleCreateGame}
              disabled={loading}
            >
              Create Game
            </button>
          </div>

          {/* Join Game */}
          <div className="bg-gray-800 p-4 rounded-lg space-y-2">
            <h2 className="text-xl text-yellow-300 font-semibold">Join Game</h2>
            <input
              className="bg-gray-700 p-2 rounded w-full"
              placeholder="Game ID"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
            />
            <input
              className="bg-gray-700 p-2 rounded w-full"
              placeholder="Player Symbol"
              value={playerSymbol}
              onChange={(e) => setPlayerSymbol(e.target.value)}
            />
            <button
              className="bg-yellow-600 hover:bg-yellow-700 p-2 rounded w-full text-white"
              onClick={handleJoinGame}
              disabled={loading}
            >
              Join Game
            </button>
          </div>

          {/* Start Game */}
          <div className="bg-gray-800 p-4 rounded-lg space-y-2">
            <h2 className="text-xl text-purple-300 font-semibold">Game Control</h2>
            <button
              className="bg-purple-600 hover:bg-purple-700 p-2 rounded w-full text-white"
              onClick={handleStartGame}
              disabled={loading}
            >
              Start Game
            </button>
          </div>

          {/* Move Player */}
          <div className="bg-gray-800 p-4 rounded-lg space-y-2">
            <h2 className="text-xl text-teal-300 font-semibold">Move Player</h2>
            <input
              className="bg-gray-700 p-2 rounded w-full"
              placeholder="Dice Roll"
              value={diceRoll}
              onChange={(e) => setDiceRoll(e.target.value)}
            />
             <input
              className="bg-gray-700 p-2 rounded w-full"
              placeholder="game_id"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
            />
            <button
              className="bg-teal-600 hover:bg-teal-700 p-2 rounded w-full text-white"
              onClick={handleMovePlayer}
              disabled={loading}
            >
              Move Player
            </button>
          </div>

          {/* Buy Property */}
          <div className="bg-gray-800 p-4 rounded-lg space-y-2">
            <h2 className="text-xl text-pink-300 font-semibold">Buy Property</h2>
            <input
              className="bg-gray-700 p-2 rounded w-full"
              placeholder="Property ID"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
            />
            <button
              className="bg-pink-600 hover:bg-pink-700 p-2 rounded w-full text-white"
              onClick={handleBuyProperty}
              disabled={loading}
            >
              Buy Property
            </button>
          </div>

          {/* End Game */}
          <div className="bg-gray-800 p-4 rounded-lg space-y-2">
            <h2 className="text-xl text-red-300 font-semibold">End Game</h2>
            <button
              className="bg-red-600 hover:bg-red-700 p-2 rounded w-full text-white"
              onClick={handleEndGame}
              disabled={loading}
            >
              End Game
            </button>
          </div>

                  <div className="bg-gray-800 p-4 rounded-lg space-y-2">
            <h2 className="text-xl text-red-300 font-semibold">Get Game</h2>
                <input
              className="bg-gray-700 p-2 rounded w-full"
              placeholder="Property ID"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
            />
            <button
              className="bg-red-600 hover:bg-red-700 p-2 rounded w-full text-white"
              onClick={handleGetGame}
              disabled={loading}
            >
              End Game
            </button>
          </div>

          {/* Game Info */}
          <div className="bg-gray-800 p-4 rounded-lg space-y-2">
            <h2 className="text-xl text-cyan-300 font-semibold">Game Info</h2>
            <button
              className="bg-cyan-600 hover:bg-cyan-700 p-2 rounded w-full text-white"
              onClick={handleGetAllGames}
              disabled={loading}
            >
              Get All Games
            </button>
            <button
              className="bg-cyan-600 hover:bg-cyan-700 p-2 rounded w-full text-white"
              onClick={handleGetGameState}
              disabled={loading}
            >
              Get Game State
            </button>
            <button
              className="bg-cyan-600 hover:bg-cyan-700 p-2 rounded w-full text-white"
              onClick={handleGetPlayers}
              disabled={loading}
            >
              Get Players
            </button>
          </div>
        </div>

        {/* Right: Response Viewer */}
        <div className="w-full lg:w-1/3 bg-gray-900 p-4 rounded-lg h-fit">
          <h3 className="text-lg font-bold mb-2 text-green-300">Response</h3>
          {loading && <p className="text-blue-400">Loading...</p>}
          {error && <pre className="text-red-400 whitespace-pre-wrap">{error}</pre>}
          {response && (
            <pre className="text-green-400 whitespace-pre-wrap text-sm">
              {JSON.stringify(response, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2)}
            </pre>
          )}
          {!loading && !error && !response && (
            <p className="text-gray-500">Responses will appear here...</p>
          )}
        </div>
      </div>
    )}
  </main>
);

}
