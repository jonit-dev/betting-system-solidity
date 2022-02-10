const _ = require('lodash');
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
    await truffleAssert.fails(betting.pickWinner("Team B", { from: accounts[1] }));
  });

  it("calculates payout correctly", async () => {

    // redeploy contract so we can start bets over.
    betting = await Betting.new(["Team A", "Team B"], { from: accounts[0] });

    await betting.placeBet("Team A", { from: accounts[0], value: web3.utils.toWei("1", "ether") });
    await betting.placeBet("Team B", { from: accounts[1], value: web3.utils.toWei("1", "ether") });
    await betting.placeBet("Team A", { from: accounts[2], value: web3.utils.toWei("1", "ether") });
    await betting.placeBet("Team B", { from: accounts[3], value: web3.utils.toWei("2", "ether") });
 
    const initialAccount1Balance = await web3.eth.getBalance(accounts[1]);

    await betting.pickWinner("Team B", { from: accounts[0] });

    const finalAccount1Balance = await web3.eth.getBalance(accounts[1]);

    const initialBalanceInETH = web3.utils.fromWei(initialAccount1Balance);
    const finalBalanceInETH = web3.utils.fromWei(finalAccount1Balance);

    const payout = _.floor(finalBalanceInETH - initialBalanceInETH, 2);

    assert.ok(Number(finalAccount1Balance) > Number(initialAccount1Balance));
    // check if the balance of account 1 has increased by 2 ether
    
    // balance should increase 1.66 ETH under these conditions
    assert.equal(payout, 1.66);
  });

  it("should not allow a bet in a unexistent team", async () => {
    await truffleAssert.fails(betting.placeBet("Team C", { from: accounts[0], value: web3.utils.toWei("1", "ether") }));
  });

  it("should require at least one team to be selected", async () => {
    await truffleAssert.fails(betting.placeBet("", { from: accounts[0], value: web3.utils.toWei("1", "ether") }));
  });


  it("only managers can call emergencyWithdraw", async () => {
    await truffleAssert.fails(betting.emergencyWithdraw({ from: accounts[1] }));
  });

  it("should transfer all money back to the manager, if emergencyWithdraw is called", async() => {

    betting = await Betting.new(["Team A", "Team B"], { from: accounts[0] });

    await betting.placeBet("Team A", { from: accounts[0], value: web3.utils.toWei("1", "ether") });

    const initialManagerBalance = await web3.eth.getBalance(accounts[0]);

    await betting.emergencyWithdraw({ from: accounts[0] });

    const finalManagerBalance = await web3.eth.getBalance(accounts[0]);

    const initialBalanceInETH = web3.utils.fromWei(initialManagerBalance);
    const finalBalanceInETH = web3.utils.fromWei(finalManagerBalance);

    assert.equal(_.round(finalBalanceInETH - initialBalanceInETH), 1);
  }); 

  it("should refund all player if a draw is called", async () => {});

  it("should not be able to place bets, once the contract is not active", async () => {

    // redeploy contract so we can start bets over.
    betting = await Betting.new(["Team A", "Team B"], { from: accounts[0] });

    await betting.placeBet("Team A", { from: accounts[0], value: web3.utils.toWei("1", "ether") });

    await betting.pickWinner("Team A", { from: accounts[0] });

    await truffleAssert.fails(betting.placeBet("Team A", { from: accounts[0], value: web3.utils.toWei("1", "ether") }));
  })
});
