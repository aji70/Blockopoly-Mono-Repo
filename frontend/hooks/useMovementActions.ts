import { useCallback } from "react";
import { Account, AccountInterface, BigNumberish } from "starknet";
import { useDojoSDK } from "@dojoengine/sdk/react";

export function useMovementActions() {
  const { client } = useDojoSDK();

  const movePlayer = useCallback((account: Account | AccountInterface, gameId: BigNumberish, steps: BigNumberish) => {
    return client.movement.movePlayer(account, gameId, steps);
  }, [client]);

  const payJailFine = useCallback((account: Account | AccountInterface, gameId: BigNumberish) => {
    return client.movement.payJailFine(account, gameId);
  }, [client]);

  const payGetoutOfJailChance = useCallback((account: Account | AccountInterface, gameId: BigNumberish) => {
    return client.movement.payGetoutOfJailChance(account, gameId);
  }, [client]);

  const payGetoutOfJailCommunity = useCallback((account: Account | AccountInterface, gameId: BigNumberish) => {
    return client.movement.payGetoutOfJailCommunity(account, gameId);
  }, [client]);

  const getCurrentPlayer = useCallback((gameId: BigNumberish) => {
    return client.movement.currentPlayer(gameId);
  }, [client]);

  const getCurrentPlayerName = useCallback((gameId: BigNumberish) => {
    return client.movement.currentPlayername(gameId);
  }, [client]);

  return {
    movePlayer,
    payJailFine,
    payGetoutOfJailChance,
    payGetoutOfJailCommunity,
    getCurrentPlayer,
    getCurrentPlayerName,
  };
}
