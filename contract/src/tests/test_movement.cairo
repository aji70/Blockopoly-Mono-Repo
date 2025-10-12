#[cfg(test)]
mod tests {
    use dojo::model::{ModelStorage, ModelStorageTest};
    use dojo::world::WorldStorageTrait;
    use dojo_cairo_test::{
        ContractDef, ContractDefTrait, NamespaceDef, TestResource, WorldStorageTestTrait,
        spawn_test_world,
    };
    // use blockopoly::interfaces::IMovement::{IMovementDispatcher, IMovementDispatcherTrait};
// use blockopoly::model::game_model::{
//     Game, GameBalance, GameCounter, GameStatus, GameType, m_Game, m_GameBalance,
//     m_GameCounter,
// };
// use blockopoly::model::game_player_model::{GamePlayer, m_GamePlayer};
// use blockopoly::model::player_model::{
//     AddressToUsername, Player, UsernameToAddress, m_AddressToUsername,
//     m_Player, m_UsernameToAddress,
// };
// use blockopoly::model::property_model::{
//     Property, PropertyType, m_Property
// };
// use blockopoly::systems::movement::movement;
// use starknet::{contract_address_const, get_caller_address, testing};

    // // Setup test environment
// fn setup_test() -> (WorldStorageTest, IMovementDispatcher) {
//     // Spawn world and movement contract
//     let world = spawn_test_world(
//         array![
//             movement::TEST_CLASS_HASH,
//             m_Game::TEST_CLASS_HASH,
//             m_GamePlayer::TEST_CLASS_HASH,
//             m_Player::TEST_CLASS_HASH,
//             m_Property::TEST_CLASS_HASH
//         ]
//     );

    //     let movement_address = world.deploy(movement::TEST_CLASS_HASH, array![]);
//     let movement = IMovementDispatcher { contract_address: movement_address };

    //     (world, movement)
// }

    // // Helper function to setup a game with players
// fn setup_game_with_players(
//     world: WorldStorageTest,
//     num_players: u8
// ) -> (u256, Array<ContractAddress>) {
//     let mut players = ArrayTrait::new();
//     let game_id = 1_u256;

    //     // Create a game
//     let mut game = Game {
//         id: game_id,
//         created_by: 'creator',
//         is_initialised: true,
//         status: GameStatus::Ongoing,
//         mode: GameType::Classic,
//         ready_to_start: true,
//         winner: contract_address_const::<0>(),
//         next_player: contract_address_const::<0>(),
//         number_of_players: num_players,
//         rolls_count: 0,
//         rolls_times: 0,
//         dice_face: 0,
//         player_chance: contract_address_const::<0>(),
//         has_thrown_dice: false,
//         game_condition: ArrayTrait::new(),
//         hat: 0,
//         car: 0,
//         dog: 0,
//         thimble: 0,
//         iron: 0,
//         battleship: 0,
//         boot: 0,
//         wheelbarrow: 0,
//         player_hat: 0,
//         player_car: 0,
//         player_dog: 0,
//         player_thimble: 0,
//         player_iron: 0,
//         player_battleship: 0,
//         player_boot: 0,
//         player_wheelbarrow: 0,
//         players_joined: num_players,
//         game_players: ArrayTrait::new(),
//         chance: ArrayTrait::new(),
//         community: ArrayTrait::new(),
//     };

    //     // Add players
//     let mut i: u8 = 0;
//     while i < num_players {
//         let player_address = contract_address_const::<1>() + i.into();
//         players.append(player_address);
//         game.game_players.append(player_address);

    //         // Create player state
//         let player = GamePlayer {
//             address: player_address,
//             game_id,
//             position: 0,
//             balance: 1500,
//             dice_rolled: 0,
//             jailed: false,
//             jail_turns: 0,
//             chance_jail_card: false,
//             comm_free_card: false,
//             paid_rent: true,
//             total_houses_owned: 0,
//             total_hotels_owned: 0,
//         };
//         world.write_model((player_address, game_id), player);
//         i += 1;
//     };

    //     // Set first player as next player
//     game.next_player = *game.game_players[0];
//     game.player_chance = *game.game_players[0];

    //     // Write game state
//     world.write_model(game_id, game);

    //     (game_id, players)
// }

    // #[test]
// fn test_turn_management() {
//     let (world, movement) = setup_test();
//     let (game_id, players) = setup_game_with_players(world, 4);

    //     // Set caller as first player
//     testing::set_caller_address(*players[0]);

    //     // First player moves
//     movement.move_player(game_id, 6);

    //     // Try to move again (should fail)
//     let move_result = movement.move_player(game_id, 4);
//     assert(move_result.is_err(), 'Should not allow second move');

    //     // End turn
//     movement.finish_turn(game_id);

    //     // Try to move after ending turn (should fail)
//     let move_result = movement.move_player(game_id, 4);
//     assert(move_result.is_err(), 'Should not allow move after turn');

    //     // Next player should be able to move
//     testing::set_caller_address(*players[1]);
//     let result = movement.move_player(game_id, 5);
//     assert(result.is_ok(), 'Next player should move');
// }

    // #[test]
// fn test_turn_sequence() {
//     let (world, movement) = setup_test();
//     let (game_id, players) = setup_game_with_players(world, 3);

    //     // Test full round of turns
//     testing::set_caller_address(*players[0]);
//     movement.move_player(game_id, 6);
//     movement.finish_turn(game_id);

    //     testing::set_caller_address(*players[1]);
//     movement.move_player(game_id, 4);
//     movement.finish_turn(game_id);

    //     testing::set_caller_address(*players[2]);
//     movement.move_player(game_id, 3);
//     movement.finish_turn(game_id);

    //     // Should cycle back to first player
//     let game = world.read_model::<Game>(game_id);
//     assert(game.next_player == *players[0], 'Should return to first player');
//     assert(!game.has_thrown_dice, 'Dice should be reset');
// }

    // #[test]
// fn test_invalid_turn_actions() {
//     let (world, movement) = setup_test();
//     let (game_id, players) = setup_game_with_players(world, 2);

    //     // Try to play out of turn
//     testing::set_caller_address(*players[1]);
//     let move_result = movement.move_player(game_id, 6);
//     assert(move_result.is_err(), 'Should not allow out of turn move');

    //     // Try to end turn without moving
//     testing::set_caller_address(*players[0]);
//     let end_result = movement.finish_turn(game_id);
//     assert(end_result.is_err(), 'Should not end turn without moving');
// }

    // #[test]
// fn test_jailed_player_turn() {
//     let (world, movement) = setup_test();
//     let (game_id, players) = setup_game_with_players(world, 2);

    //     // Jail the first player
//     testing::set_caller_address(*players[0]);
//     let mut player = world.read_model::<GamePlayer>((*players[0], game_id));
//     player.jailed = true;
//     world.write_model((*players[0], game_id), player);

    //     // Try to move while jailed
//     let result = movement.move_player(game_id, 6);
//     assert(result == 10, 'Jailed player should stay in jail');  // 10 is jail position

    //     // Turn should still end and move to next player
//     movement.finish_turn(game_id);
//     let game = world.read_model::<Game>(game_id);
//     assert(game.next_player == *players[1], 'Should move to next player');
// }
}
