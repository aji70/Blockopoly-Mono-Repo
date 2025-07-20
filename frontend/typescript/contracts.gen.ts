import { DojoProvider, DojoCall } from "@dojoengine/core";
import { Account, AccountInterface, BigNumberish, CairoOption, CairoCustomEnum, ByteArray } from "starknet";
import * as models from "./models.gen";

export function setupWorld(provider: DojoProvider) {

	const build_actions_acceptTrade_calldata = (tradeId: BigNumberish, gameId: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "accept_trade",
			calldata: [tradeId, gameId],
		};
	};

	const actions_acceptTrade = async (snAccount: Account | AccountInterface, tradeId: BigNumberish, gameId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_acceptTrade_calldata(tradeId, gameId),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_approveCounterTrade_calldata = (tradeId: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "approve_counter_trade",
			calldata: [tradeId],
		};
	};

	const actions_approveCounterTrade = async (snAccount: Account | AccountInterface, tradeId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_approveCounterTrade_calldata(tradeId),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_bankruptcyCheck_calldata = (player: models.GamePlayer, amountOwed: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "bankruptcy_check",
			calldata: [player, amountOwed],
		};
	};

	const actions_bankruptcyCheck = async (snAccount: Account | AccountInterface, player: models.GamePlayer, amountOwed: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_bankruptcyCheck_calldata(player, amountOwed),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_buyHouseOrHotel_calldata = (property: models.Property): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "buy_house_or_hotel",
			calldata: [property],
		};
	};

	const actions_buyHouseOrHotel = async (snAccount: Account | AccountInterface, property: models.Property) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_buyHouseOrHotel_calldata(property),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_buyProperty_calldata = (property: models.Property): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "buy_property",
			calldata: [property],
		};
	};

	const actions_buyProperty = async (snAccount: Account | AccountInterface, property: models.Property) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_buyProperty_calldata(property),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_calculateNetWorth_calldata = (player: models.GamePlayer): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "calculate_net_worth",
			calldata: [player],
		};
	};

	const actions_calculateNetWorth = async (snAccount: Account | AccountInterface, player: models.GamePlayer) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_calculateNetWorth_calldata(player),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_counterTrade_calldata = (gameId: BigNumberish, originalOfferId: BigNumberish, offeredPropertyIds: Array<BigNumberish>, requestedPropertyIds: Array<BigNumberish>, cashOffer: BigNumberish, cashRequest: BigNumberish, tradeType: CairoCustomEnum): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "counter_trade",
			calldata: [gameId, originalOfferId, offeredPropertyIds, requestedPropertyIds, cashOffer, cashRequest, tradeType],
		};
	};

	const actions_counterTrade = async (snAccount: Account | AccountInterface, gameId: BigNumberish, originalOfferId: BigNumberish, offeredPropertyIds: Array<BigNumberish>, requestedPropertyIds: Array<BigNumberish>, cashOffer: BigNumberish, cashRequest: BigNumberish, tradeType: CairoCustomEnum) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_counterTrade_calldata(gameId, originalOfferId, offeredPropertyIds, requestedPropertyIds, cashOffer, cashRequest, tradeType),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_createNewGame_calldata = (gameType: CairoCustomEnum, playerSymbol: CairoCustomEnum, numberOfPlayers: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "create_new_game",
			calldata: [gameType, playerSymbol, numberOfPlayers],
		};
	};

	const actions_createNewGame = async (snAccount: Account | AccountInterface, gameType: CairoCustomEnum, playerSymbol: CairoCustomEnum, numberOfPlayers: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_createNewGame_calldata(gameType, playerSymbol, numberOfPlayers),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_endGame_calldata = (game: models.Game): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "end_game",
			calldata: [game],
		};
	};

	const actions_endGame = async (snAccount: Account | AccountInterface, game: models.Game) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_endGame_calldata(game),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_finishTurn_calldata = (game: models.Game): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "finish_turn",
			calldata: [game],
		};
	};

	const actions_finishTurn = async (snAccount: Account | AccountInterface, game: models.Game) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_finishTurn_calldata(game),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_getPlayersBalance_calldata = (player: string, gameId: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "get_players_balance",
			calldata: [player, gameId],
		};
	};

	const actions_getPlayersBalance = async (player: string, gameId: BigNumberish) => {
		try {
			return await provider.call("dojo_starter", build_actions_getPlayersBalance_calldata(player, gameId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_getProperty_calldata = (id: BigNumberish, gameId: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "get_property",
			calldata: [id, gameId],
		};
	};

	const actions_getProperty = async (id: BigNumberish, gameId: BigNumberish) => {
		try {
			return await provider.call("dojo_starter", build_actions_getProperty_calldata(id, gameId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_getTrade_calldata = (tradeId: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "get_trade",
			calldata: [tradeId],
		};
	};

	const actions_getTrade = async (tradeId: BigNumberish) => {
		try {
			return await provider.call("dojo_starter", build_actions_getTrade_calldata(tradeId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_getUsernameFromAddress_calldata = (address: string): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "get_username_from_address",
			calldata: [address],
		};
	};

	const actions_getUsernameFromAddress = async (address: string) => {
		try {
			return await provider.call("dojo_starter", build_actions_getUsernameFromAddress_calldata(address));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_getWinnerByNetWorth_calldata = (players: Array<GamePlayer>): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "get_winner_by_net_worth",
			calldata: [players],
		};
	};

	const actions_getWinnerByNetWorth = async (snAccount: Account | AccountInterface, players: Array<GamePlayer>) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_getWinnerByNetWorth_calldata(players),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_handleChance_calldata = (gameId: BigNumberish, randomIndex: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "handle_chance",
			calldata: [gameId, randomIndex],
		};
	};

	const actions_handleChance = async (snAccount: Account | AccountInterface, gameId: BigNumberish, randomIndex: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_handleChance_calldata(gameId, randomIndex),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_handleCommunityChest_calldata = (gameId: BigNumberish, randomIndex: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "handle_community_chest",
			calldata: [gameId, randomIndex],
		};
	};

	const actions_handleCommunityChest = async (snAccount: Account | AccountInterface, gameId: BigNumberish, randomIndex: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_handleCommunityChest_calldata(gameId, randomIndex),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_isGameStarted_calldata = (gameId: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "is_game_started",
			calldata: [gameId],
		};
	};

	const actions_isGameStarted = async (gameId: BigNumberish) => {
		try {
			return await provider.call("dojo_starter", build_actions_isGameStarted_calldata(gameId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_isRegistered_calldata = (address: string): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "is_registered",
			calldata: [address],
		};
	};

	const actions_isRegistered = async (address: string) => {
		try {
			return await provider.call("dojo_starter", build_actions_isRegistered_calldata(address));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_joinGame_calldata = (playerSymbol: CairoCustomEnum, gameId: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "join_game",
			calldata: [playerSymbol, gameId],
		};
	};

	const actions_joinGame = async (snAccount: Account | AccountInterface, playerSymbol: CairoCustomEnum, gameId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_joinGame_calldata(playerSymbol, gameId),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_leaveGame_calldata = (gameId: BigNumberish, transferTo: string): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "leave_game",
			calldata: [gameId, transferTo],
		};
	};

	const actions_leaveGame = async (snAccount: Account | AccountInterface, gameId: BigNumberish, transferTo: string) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_leaveGame_calldata(gameId, transferTo),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_mint_calldata = (recepient: string, gameId: BigNumberish, amount: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "mint",
			calldata: [recepient, gameId, amount],
		};
	};

	const actions_mint = async (snAccount: Account | AccountInterface, recepient: string, gameId: BigNumberish, amount: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_mint_calldata(recepient, gameId, amount),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_mortgageProperty_calldata = (property: models.Property): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "mortgage_property",
			calldata: [property],
		};
	};

	const actions_mortgageProperty = async (snAccount: Account | AccountInterface, property: models.Property) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_mortgageProperty_calldata(property),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_movePlayer_calldata = (gameId: BigNumberish, steps: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "move_player",
			calldata: [gameId, steps],
		};
	};

	const actions_movePlayer = async (snAccount: Account | AccountInterface, gameId: BigNumberish, steps: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_movePlayer_calldata(gameId, steps),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_offerTrade_calldata = (gameId: BigNumberish, to: string, offeredPropertyIds: Array<BigNumberish>, requestedPropertyIds: Array<BigNumberish>, cashOffer: BigNumberish, cashRequest: BigNumberish, tradeType: CairoCustomEnum): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "offer_trade",
			calldata: [gameId, to, offeredPropertyIds, requestedPropertyIds, cashOffer, cashRequest, tradeType],
		};
	};

	const actions_offerTrade = async (snAccount: Account | AccountInterface, gameId: BigNumberish, to: string, offeredPropertyIds: Array<BigNumberish>, requestedPropertyIds: Array<BigNumberish>, cashOffer: BigNumberish, cashRequest: BigNumberish, tradeType: CairoCustomEnum) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_offerTrade_calldata(gameId, to, offeredPropertyIds, requestedPropertyIds, cashOffer, cashRequest, tradeType),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_payJailFine_calldata = (gameId: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "pay_jail_fine",
			calldata: [gameId],
		};
	};

	const actions_payJailFine = async (snAccount: Account | AccountInterface, gameId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_payJailFine_calldata(gameId),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_payRent_calldata = (property: models.Property): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "pay_rent",
			calldata: [property],
		};
	};

	const actions_payRent = async (snAccount: Account | AccountInterface, property: models.Property) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_payRent_calldata(property),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_processChanceCard_calldata = (game: models.Game, player: models.GamePlayer, card: ByteArray): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "process_chance_card",
			calldata: [game, player, card],
		};
	};

	const actions_processChanceCard = async (snAccount: Account | AccountInterface, game: models.Game, player: models.GamePlayer, card: ByteArray) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_processChanceCard_calldata(game, player, card),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_processCommunityChestCard_calldata = (game: models.Game, player: models.GamePlayer, card: ByteArray): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "process_community_chest_card",
			calldata: [game, player, card],
		};
	};

	const actions_processCommunityChestCard = async (snAccount: Account | AccountInterface, game: models.Game, player: models.GamePlayer, card: ByteArray) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_processCommunityChestCard_calldata(game, player, card),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_registerNewPlayer_calldata = (username: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "register_new_player",
			calldata: [username],
		};
	};

	const actions_registerNewPlayer = async (snAccount: Account | AccountInterface, username: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_registerNewPlayer_calldata(username),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_rejectTrade_calldata = (tradeId: BigNumberish, gameId: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "reject_trade",
			calldata: [tradeId, gameId],
		};
	};

	const actions_rejectTrade = async (snAccount: Account | AccountInterface, tradeId: BigNumberish, gameId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_rejectTrade_calldata(tradeId, gameId),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_retrieveGame_calldata = (gameId: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "retrieve_game",
			calldata: [gameId],
		};
	};

	const actions_retrieveGame = async (gameId: BigNumberish) => {
		try {
			return await provider.call("dojo_starter", build_actions_retrieveGame_calldata(gameId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_retrieveGamePlayer_calldata = (addr: string, gameId: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "retrieve_game_player",
			calldata: [addr, gameId],
		};
	};

	const actions_retrieveGamePlayer = async (addr: string, gameId: BigNumberish) => {
		try {
			return await provider.call("dojo_starter", build_actions_retrieveGamePlayer_calldata(addr, gameId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_retrievePlayer_calldata = (addr: string): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "retrieve_player",
			calldata: [addr],
		};
	};

	const actions_retrievePlayer = async (addr: string) => {
		try {
			return await provider.call("dojo_starter", build_actions_retrievePlayer_calldata(addr));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_rollDice_calldata = (): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "roll_dice",
			calldata: [],
		};
	};

	const actions_rollDice = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_rollDice_calldata(),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_sellHouseOrHotel_calldata = (propertyId: BigNumberish, gameId: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "sell_house_or_hotel",
			calldata: [propertyId, gameId],
		};
	};

	const actions_sellHouseOrHotel = async (snAccount: Account | AccountInterface, propertyId: BigNumberish, gameId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_sellHouseOrHotel_calldata(propertyId, gameId),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_startGame_calldata = (gameId: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "start_game",
			calldata: [gameId],
		};
	};

	const actions_startGame = async (snAccount: Account | AccountInterface, gameId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_startGame_calldata(gameId),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_transferFrom_calldata = (from: models.GamePlayer, to: models.GamePlayer, amount: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "transfer_from",
			calldata: [from, to, amount],
		};
	};

	const actions_transferFrom = async (snAccount: Account | AccountInterface, from: models.GamePlayer, to: models.GamePlayer, amount: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_transferFrom_calldata(from, to, amount),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_unmortgageProperty_calldata = (property: models.Property): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "unmortgage_property",
			calldata: [property],
		};
	};

	const actions_unmortgageProperty = async (snAccount: Account | AccountInterface, property: models.Property) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_unmortgageProperty_calldata(property),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_useGetoutOfJailChance_calldata = (gameId: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "use_getout_of_jail_chance",
			calldata: [gameId],
		};
	};

	const actions_useGetoutOfJailChance = async (snAccount: Account | AccountInterface, gameId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_useGetoutOfJailChance_calldata(gameId),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_useGetoutOfJailCommunityChest_calldata = (gameId: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "use_getout_of_jail_community_chest",
			calldata: [gameId],
		};
	};

	const actions_useGetoutOfJailCommunityChest = async (snAccount: Account | AccountInterface, gameId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_useGetoutOfJailCommunityChest_calldata(gameId),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_voteToKickPlayer_calldata = (gameId: BigNumberish, targetPlayer: string): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "vote_to_kick_player",
			calldata: [gameId, targetPlayer],
		};
	};

	const actions_voteToKickPlayer = async (snAccount: Account | AccountInterface, gameId: BigNumberish, targetPlayer: string) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_voteToKickPlayer_calldata(gameId, targetPlayer),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};



	return {
		actions: {
			acceptTrade: actions_acceptTrade,
			buildAcceptTradeCalldata: build_actions_acceptTrade_calldata,
			approveCounterTrade: actions_approveCounterTrade,
			buildApproveCounterTradeCalldata: build_actions_approveCounterTrade_calldata,
			bankruptcyCheck: actions_bankruptcyCheck,
			buildBankruptcyCheckCalldata: build_actions_bankruptcyCheck_calldata,
			buyHouseOrHotel: actions_buyHouseOrHotel,
			buildBuyHouseOrHotelCalldata: build_actions_buyHouseOrHotel_calldata,
			buyProperty: actions_buyProperty,
			buildBuyPropertyCalldata: build_actions_buyProperty_calldata,
			calculateNetWorth: actions_calculateNetWorth,
			buildCalculateNetWorthCalldata: build_actions_calculateNetWorth_calldata,
			counterTrade: actions_counterTrade,
			buildCounterTradeCalldata: build_actions_counterTrade_calldata,
			createNewGame: actions_createNewGame,
			buildCreateNewGameCalldata: build_actions_createNewGame_calldata,
			endGame: actions_endGame,
			buildEndGameCalldata: build_actions_endGame_calldata,
			finishTurn: actions_finishTurn,
			buildFinishTurnCalldata: build_actions_finishTurn_calldata,
			getPlayersBalance: actions_getPlayersBalance,
			buildGetPlayersBalanceCalldata: build_actions_getPlayersBalance_calldata,
			getProperty: actions_getProperty,
			buildGetPropertyCalldata: build_actions_getProperty_calldata,
			getTrade: actions_getTrade,
			buildGetTradeCalldata: build_actions_getTrade_calldata,
			getUsernameFromAddress: actions_getUsernameFromAddress,
			buildGetUsernameFromAddressCalldata: build_actions_getUsernameFromAddress_calldata,
			getWinnerByNetWorth: actions_getWinnerByNetWorth,
			buildGetWinnerByNetWorthCalldata: build_actions_getWinnerByNetWorth_calldata,
			handleChance: actions_handleChance,
			buildHandleChanceCalldata: build_actions_handleChance_calldata,
			handleCommunityChest: actions_handleCommunityChest,
			buildHandleCommunityChestCalldata: build_actions_handleCommunityChest_calldata,
			isGameStarted: actions_isGameStarted,
			buildIsGameStartedCalldata: build_actions_isGameStarted_calldata,
			isRegistered: actions_isRegistered,
			buildIsRegisteredCalldata: build_actions_isRegistered_calldata,
			joinGame: actions_joinGame,
			buildJoinGameCalldata: build_actions_joinGame_calldata,
			leaveGame: actions_leaveGame,
			buildLeaveGameCalldata: build_actions_leaveGame_calldata,
			mint: actions_mint,
			buildMintCalldata: build_actions_mint_calldata,
			mortgageProperty: actions_mortgageProperty,
			buildMortgagePropertyCalldata: build_actions_mortgageProperty_calldata,
			movePlayer: actions_movePlayer,
			buildMovePlayerCalldata: build_actions_movePlayer_calldata,
			offerTrade: actions_offerTrade,
			buildOfferTradeCalldata: build_actions_offerTrade_calldata,
			payJailFine: actions_payJailFine,
			buildPayJailFineCalldata: build_actions_payJailFine_calldata,
			payRent: actions_payRent,
			buildPayRentCalldata: build_actions_payRent_calldata,
			processChanceCard: actions_processChanceCard,
			buildProcessChanceCardCalldata: build_actions_processChanceCard_calldata,
			processCommunityChestCard: actions_processCommunityChestCard,
			buildProcessCommunityChestCardCalldata: build_actions_processCommunityChestCard_calldata,
			registerNewPlayer: actions_registerNewPlayer,
			buildRegisterNewPlayerCalldata: build_actions_registerNewPlayer_calldata,
			rejectTrade: actions_rejectTrade,
			buildRejectTradeCalldata: build_actions_rejectTrade_calldata,
			retrieveGame: actions_retrieveGame,
			buildRetrieveGameCalldata: build_actions_retrieveGame_calldata,
			retrieveGamePlayer: actions_retrieveGamePlayer,
			buildRetrieveGamePlayerCalldata: build_actions_retrieveGamePlayer_calldata,
			retrievePlayer: actions_retrievePlayer,
			buildRetrievePlayerCalldata: build_actions_retrievePlayer_calldata,
			rollDice: actions_rollDice,
			buildRollDiceCalldata: build_actions_rollDice_calldata,
			sellHouseOrHotel: actions_sellHouseOrHotel,
			buildSellHouseOrHotelCalldata: build_actions_sellHouseOrHotel_calldata,
			startGame: actions_startGame,
			buildStartGameCalldata: build_actions_startGame_calldata,
			transferFrom: actions_transferFrom,
			buildTransferFromCalldata: build_actions_transferFrom_calldata,
			unmortgageProperty: actions_unmortgageProperty,
			buildUnmortgagePropertyCalldata: build_actions_unmortgageProperty_calldata,
			useGetoutOfJailChance: actions_useGetoutOfJailChance,
			buildUseGetoutOfJailChanceCalldata: build_actions_useGetoutOfJailChance_calldata,
			useGetoutOfJailCommunityChest: actions_useGetoutOfJailCommunityChest,
			buildUseGetoutOfJailCommunityChestCalldata: build_actions_useGetoutOfJailCommunityChest_calldata,
			voteToKickPlayer: actions_voteToKickPlayer,
			buildVoteToKickPlayerCalldata: build_actions_voteToKickPlayer_calldata,
		},
	};
}