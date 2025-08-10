use starknet::ContractAddress;

#[derive(Drop, Serde, Clone, Introspect)]
#[dojo::model]
pub struct GamePlayer {
    #[key]
    pub address: ContractAddress, // links to Player
    #[key]
    pub game_id: u256, // unique per game
    pub username: felt252,
    pub player_symbol: PlayerSymbol,
    pub is_next: bool,
    pub dice_rolled: u8,
    pub position: u8,
    pub jailed: bool,
    pub balance: u256,
    pub properties_owned: Array<u8>,
    pub chance_jail_card: bool,
    pub comm_free_card: bool,
    pub total_houses_owned: u8,
    pub total_hotels_owned: u8,
    pub no_of_utilities: u8,
    pub no_of_railways: u8,
    pub no_section1: u8,
    pub no_section2: u8,
    pub no_section3: u8,
    pub no_section4: u8,
    pub no_section5: u8,
    pub no_section6: u8,
    pub no_section7: u8,
    pub no_section8: u8,
    pub is_bankrupt: bool,
    pub is_active: bool,
    pub jail_turns: u8,
    pub strikes: u8,
    pub paid_rent: bool,
    pub joined: bool,
}


// the GamePlayerTrait tell imposes the actions a player can perform within a game

pub trait GamePlayerTrait {
    fn create_game_player(
        username: felt252, address: ContractAddress, game_id: u256, player_symbol: PlayerSymbol,
    ) -> GamePlayer;
    fn move(player: GamePlayer, steps: u8) -> GamePlayer;
    fn pay_game_player(ref self: GamePlayer, amount: u256) -> bool;
    fn deduct_game_player(ref self: GamePlayer, amount: u256) -> bool;
    fn add_property_to_game_player(ref self: GamePlayer, property_id: u8) -> bool;
    fn remove_property_from_game_player(ref self: GamePlayer, property_id: u8) -> bool;
    fn declare_bankruptcy(ref self: GamePlayer) -> bool;
    fn jail_game_player(ref self: GamePlayer) -> bool;
}

impl GamePlayerImpl of GamePlayerTrait {
    fn create_game_player(
        username: felt252, address: ContractAddress, game_id: u256, player_symbol: PlayerSymbol,
    ) -> GamePlayer {
        GamePlayer {
            address,
            game_id,
            username,
            dice_rolled: 0,
            player_symbol: player_symbol,
            balance: 0,
            is_next: true,
            position: 0,
            jailed: false,
            is_bankrupt: false,
            is_active: true,
            properties_owned: array![],
            chance_jail_card: false,
            comm_free_card: false,
            total_houses_owned: 0,
            total_hotels_owned: 0,
            no_of_utilities: 0,
            no_of_railways: 0,
            no_section1: 0,
            no_section2: 0,
            no_section3: 0,
            no_section4: 0,
            no_section5: 0,
            no_section6: 0,
            no_section7: 0,
            no_section8: 0,
            jail_turns: 0,
            strikes: 0,
            paid_rent: false,
            joined: false,
        }
    }

    fn move(mut player: GamePlayer, steps: u8) -> GamePlayer {
        // ensure steps is not more than 12 , two faced sized dice each die 6 faces
        assert(steps <= 12, 'Steps cannot be more than 12');
        player.position = (player.position + steps) % 40; // since the board has 40 positions
        player.dice_rolled = steps;
        player
    }

    fn pay_game_player(ref self: GamePlayer, amount: u256) -> bool {
        self.balance += amount;
        true
    }

    fn deduct_game_player(ref self: GamePlayer, amount: u256) -> bool {
        assert!(self.balance >= amount, "Insufficient funds");
        self.balance -= amount;
        true
    }

    fn add_property_to_game_player(ref self: GamePlayer, property_id: u8) -> bool {
        true
    }

    fn remove_property_from_game_player(ref self: GamePlayer, property_id: u8) -> bool {
        true
    }

    fn declare_bankruptcy(ref self: GamePlayer) -> bool {
        true
    }

    fn jail_game_player(ref self: GamePlayer) -> bool {
        true
    }
}

#[derive(Serde, Copy, Introspect, Drop, PartialEq)]
pub enum PlayerSymbol {
    Hat,
    Car,
    Dog,
    Thimble,
    Iron,
    Battleship,
    Boot,
    Wheelbarrow,
}



#[cfg(test)]
mod tests {
    use super::{GamePlayerTrait, GamePlayer, PlayerSymbol, GamePlayerImpl};
    use starknet::ContractAddress;
    use core::pedersen::pedersen;
    // use array::ArrayTrait;
    // use option::OptionTrait;
    // use traits::TryInto;

    #[test]
    #[available_gas(1000000)]
    fn test_create_player() {
        let username = 'test_player';
        let address: ContractAddress = 12345.try_into().unwrap();
        let game_id = 67890_u256;
        let symbol = PlayerSymbol::Dog;

        let player = GamePlayerTrait::create_game_player(username, address, game_id, symbol);

        assert(player.username == username, 'Username mismatch');
        assert(player.address == address, 'Address mismatch');
        assert(player.game_id == game_id, 'Game ID mismatch');
        assert(player.player_symbol == symbol, 'Symbol mismatch');
        // assert(player.balance == 1500_u256, 'Default balance incorrect');
        assert(player.position == 0, 'Starting position not 0');
    }

    fn setup_test_player() -> GamePlayer {
        GamePlayerImpl::create_game_player(
            'test_player',
            12345.try_into().unwrap(),
            1_u256,
            PlayerSymbol::Car,
        )
    }

     #[test]
    #[available_gas(1000000)]
    fn test_player_movement() {
        let mut player = setup_test_player();
        
        // Test normal movement
        player = GamePlayerTrait::move(player, 5);
        assert(player.position == 5, 'Movement failed');

        // Test board wrapping (assuming 40 positions)
        player = GamePlayerTrait::move(player, 12);
        assert(player.position == 17, 'Board wrap failed');

        // Test dice roll tracking
        assert(player.dice_rolled == 12, 'Dice not recorded');
    }

    #[test]
    #[available_gas(1000000)]
    fn test_money_operations() {
        let mut player = setup_test_player();

        // Test successful payment
        let paid = GamePlayerTrait::pay_game_player(ref player, 500_u256);
        assert(paid, 'Payment failed');
        assert(player.balance == 500_u256, 'Balance incorrect after payment');

        // Test successful deduction
        let deducted = GamePlayerTrait::deduct_game_player(ref player, 300_u256);
        assert(deducted, 'Deduction failed');
        assert!(player.balance == 200, "Balance incorrect after deduction");

    }

    // #[test]
    // #[available_gas(1000000)]
    // fn test_property_management() {
    //     let mut player = setup_test_player();

    //     // Test adding properties
    //     assert(
    //         GamePlayerTrait::add_property_to_game_player(ref player, 12_u8),
    //         'Failed to add property'
    //     );
    //     assert(
    //         player.properties_owned.len() == 1,
    //         'Property not added to array'
    //     );

    //     // Test removing properties
    //     assert(
    //         GamePlayerTrait::remove_property_from_game_player(ref player, 12_u8),
    //         'Failed to remove property'
    //     );
    //     assert(
    //         player.properties_owned.len() == 0,
    //         'Property not removed from array'
    //     );

    //     // Test invalid property ID
    //     assert!(
    //         !GamePlayerTrait::add_property_to_game_player(ref player, 45_u8),
    //         "Should reject invalid property ID"
    //     );
    // }

    // #[test]
    // #[available_gas(1000000)]
    // fn test_jail_operations() {
    //     let mut player = setup_test_player();

    //     // Test jailing
    //     assert(
    //         GamePlayerImpl::jail_game_player(ref player),
    //         'Failed to jail player'
    //     );
    //     assert(player.jailed, 'Jail status not set');
    //     assert(player.position == 10, 'Position not set to jail');

    //     // Test duplicate jailing
    //     assert(
    //         !GamePlayerImpl::jail_game_player(ref player),
    //         'Should reject duplicate jailing'
    //     );
    // }

    // #[test]
    // #[available_gas(1000000)]
    // fn test_bankruptcy() {
    //     let mut player = setup_test_player();

    //     // Test bankruptcy
    //     assert(
    //         GamePlayerImpl::declare_bankruptcy(ref player),
    //         'Failed to declare bankruptcy'
    //     );
    //     assert(player.is_bankrupt, 'Bankrupt status not set');
    //     assert(!player.is_active, 'Player still active after bankruptcy');

    //     // Test operations after bankruptcy
    //     assert(
    //         !GamePlayerImpl::pay_game_player(ref player, 100_u256),
    //         'Should reject transactions after bankruptcy'
    //     );
    // }

    // #[test]
    // #[available_gas(1000000)]
    // fn test_player_id_generation() {
    //     let player = setup_test_player();
    //     let player_id = GamePlayerImpl::get_player_id(ref player);

    //     // ID should be deterministic based on address and game_id
    //     let recomputed_id = pedersen(
    //         player.address.into(),
    //         u256_to_felt(player.game_id)
    //     );
    //     assert(player_id == recomputed_id, 'ID generation mismatch');
    // }

    // // Helper function to create a test player
    // fn setup_test_player() -> GamePlayer {
    //     GamePlayerImpl::create_game_player(
    //         'test',
    //         12345.try_into().unwrap(),
    //         1_u256,
    //         PlayerSymbol::Car
    //     )
    // }

    // // Helper function for u256 → felt252 conversion
    // fn u256_to_felt(num: u256) -> felt252 {
    //     let low: felt252 = num.low.try_into().unwrap();
    //     let high: felt252 = num.high.try_into().unwrap();
    //     pedersen(low, high)
    // }
}
