const Betting = artifacts.require("BettingSystem");
const truffleAssert = require('truffle-assertions');

let betting;

contract("Betting", async (accounts) => {
  beforeEach(async () => {
    betting = await Betting.deployed();
  });

  it("should deploy smart contract properly", async () => {
    assert.ok(betting.address);
  });

  it("Should create a contract with Team A and team B", async () => {
    // deploy betting contract

    const teamA = await betting.allowedTeams.call(0);
    const teamB = await betting.allowedTeams.call(1);

    assert.ok(teamA === "Team A");
    assert.ok(teamB === "Team B");
  });

  it("should have manager associated", async () => {
    const manager = await betting.manager.call();

    assert.ok(manager);
  });

  it("should allow us to place a bet", async () => {
    await betting.placeBet("Team A", { from: accounts[0], value: web3.utils.toWei("1", "ether") });

    const [totalValue, totalBets, isSet] = await betting.getTeamBetInfo("Team A");

    assert.equal(totalValue, web3.utils.toWei("1", "ether"));
    assert.equal(totalBets, 1);
    assert.equal(isSet, true);

    const [bets] = await betting.getTeamBets("Team A");

    const [originAddress, team, value] = bets;

    assert.equal(originAddress, accounts[0]);
    assert.equal(team, "Team A");
    assert.equal(value, web3.utils.toWei("1", "ether"));

    const totalBetsBalance = await betting.getTotalBetsBalance();

    assert.equal(totalBetsBalance, web3.utils.toWei("1", "ether"));
  });

  it("only managers can pick a bet winner", async () => {
    
    // check if pickWinner is rejected 
    await truffleAssert.fails(betting.pickWinner("Team A", { from: accounts[1] }));

  });
});
