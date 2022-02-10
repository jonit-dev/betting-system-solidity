// SPDX-License-Identifier: MIT
 
pragma solidity ^0.8.11;

contract BettingSystem {

    /*
     Edge cases: DRAW => rollback all bets to refund all players
    */   
     
    struct Bet {
        address originAddress;
        string team;
        uint value;
    }

    struct TeamInfo {
        uint totalValue;
        uint totalBets;
        bool isSet;
    }

    mapping(string => Bet[]) bets;
    mapping(string => TeamInfo) teamInfo;

    bool isBetActive = true;
    address manager;
    string[] public allowedTeams;

    event PayoutTransfer(address to, uint value);
 
     constructor(string[] memory _allowedTeams) {

         manager = msg.sender;
         allowedTeams = _allowedTeams;

         for(uint i = 0; i < _allowedTeams.length; i++) {
            teamInfo[_allowedTeams[i]] = TeamInfo({
                totalValue: 0,
                totalBets: 0,
                isSet: true
            });
         }
     }

     function placeBet(string memory _team) public payable isActive {
         require(msg.value >= 100, "Your bet must be at least 100 WEI");
         require(bytes(_team).length > 0, "You must choose at least one team to bet on.");
 
         if(!teamInfo[_team].isSet) {
             revert("The team you choose is not allowed to bet on");
         }

         bets[_team].push(Bet({
             originAddress: msg.sender,
             team: _team,
             value: msg.value
         }));
         teamInfo[_team].totalValue += msg.value;
         teamInfo[_team].totalBets++;
     }

     function getTeamBets(string memory _team) public view returns (Bet[] memory) {
         return bets[_team];
     }

     function getTotalBetsBalance() public view returns (uint) {
         return address(this).balance;
     }

     function getTeamBetInfo(string memory _team) public view returns (TeamInfo memory) {
        return teamInfo[_team];
     }

     function pickWinner(string memory _winnerTeam) public isManager isActive {

         Bet[] memory winnerBets = bets[_winnerTeam];

         for(uint i = 0; i < winnerBets.length; i++) {

            Bet memory bet = winnerBets[i];
            
            uint ratio = percent(bet.value, teamInfo[_winnerTeam].totalValue, 4);
 
            uint payout = (getTotalBetsBalance() * ratio) / 10000;
            
            payable(bet.originAddress).transfer(payout);

            emit PayoutTransfer(bet.originAddress, payout);

            isBetActive = false;
         }
     }

     function percent(uint numerator, uint denominator, uint precision) private pure returns(uint quotient) {
         // caution, check safe-to-multiply here
        uint _numerator  = numerator * 10 ** (precision+1);
        // with rounding of last digit
        uint _quotient =  ((_numerator / denominator) + 5) / 10;
        return ( _quotient);
    }

    function emergencyWithdraw() public isManager {
        payable(manager).transfer(getTotalBetsBalance());
    }

     modifier isManager() {
         require(msg.sender == manager, "Sorry, only managers can call this function.");
         _;
     }

     modifier isActive() {
         require(isBetActive == true, "Sorry, the bet is already finished.");
         _;
     }

}
