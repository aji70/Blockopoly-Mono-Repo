import { useCallback } from "react";
import {
  Account,
  AccountInterface,
  BigNumberish,
  shortString,
  CairoCustomEnum,
} from "starknet";
import { stringToFelt } from "@/utils/starknet";
// import { Player, Game } from "../typescript/models.gen";
import { setupWorld } from "../../contract/bindings/typescript/contracts.gen";
import {Player, Game} from "../../contract/bindings/typescript/models.gen"
import { useDojoSDK } from "@dojoengine/sdk/react";
import { steps } from "framer-motion";

type ClientType = ReturnType<typeof setupWorld>;

interface UseMonopolyProps {
  client: ClientType;
  account: Account | AccountInterface;
}

export function usePlayer({ account }: UseMonopolyProps) {
const { client } = useDojoSDK();
console.log("client", client);
  const register = useCallback(
    (username: string) => {
      // const usernameFelt = stringToFelt(username);
      // return client.player.registerNewPlayer(account, username);
    },
    [account]
  );

  const movePlayer = useCallback(
    async (account: Account | AccountInterface, gameId: BigNumberish, steps: BigNumberish) => {
      try {
        if (!client || !client.game) return alert("No client found");
        return await client.movement.movePlayer(
          account,
          gameId,
          steps
        );
      } catch (error) {
        console.error("Error moving player:", error);
        throw error;
      }
    },
    [client, account]
  );

  const getPlayer = useCallback(
    async (address: string, gameId: BigNumberish) => {
      try {
        if (!client || !client.game) return alert("No client found");
        return await client.game.getGamePlayer(address, gameId);
      } catch (error) {
        console.error("Error getting player:", error);
        throw error;
      }
    },
    [client]
  );

  const createGame = useCallback(
    async (gameType: BigNumberish, playerSymbol:BigNumberish, numPlayers: BigNumberish) => {
      try {
        if (!client || !client.game) return alert("No client found");
        
        return await client.game.createGame(
          account,
          gameType,
          playerSymbol,
          numPlayers
        );
      } catch (error) {
        console.error("Error creating game:", error);
        throw error;
      }
    },
    [client, account]
  );

  const getGame = useCallback(
    async (gameId: BigNumberish) => {
      try {
        if (!client || !client.game) return alert("No client found");
        return await client.game.retrieveGame(gameId);
      } catch (error) {
        console.error("Error getting game:", error);
        throw error;
      }
    },
    [client]
  );

  return {
    register,
    getPlayer,
    createGame,
    getGame,
    movePlayer,
  };
}
