const BettingSystem = artifacts.require("BettingSystem.sol");

module.exports = function (deployer) {
  deployer.deploy(BettingSystem, ["Team A", "Team B"]);
}
