import { useCallback } from "react";
import {
  Account,
  AccountInterface,
  BigNumberish,
  CairoCustomEnum,
} from "starknet";
import { setupWorld } from "../typescript/contracts.gen";
import { Player, Game } from "../typescript/models.gen";
import { useDojoSDK } from "@dojoengine/sdk/react";

type ClientType = ReturnType<typeof setupWorld>;

interface UseAquaStarkProps {
  client: ClientType;
  account: Account | AccountInterface;
}

export function useAquaStark({ account }: UseAquaStarkProps) {
const { client } = useDojoSDK();
console.log("client", client);
  const register = useCallback(
    (username: BigNumberish) => {
      return client.actions.createNewGame(account, username);
    },
    [account]
  );

  return {
    register,
  };
}
