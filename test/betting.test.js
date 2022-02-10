

const Betting = artifacts.require("BettingSystem");

contract("Betting", () => {


  it('should deploy smart contract properly', async () => {
    const betting = await Betting.deployed();
    assert.ok(betting.address);
  }); 

  it("Should create a contract with Team A and team B", async () => {

    // deploy betting contract
    const betting = await Betting.deployed();

     const teamA = await betting.allowedTeams.call(0);
    const teamB = await betting.allowedTeams.call(1);
 
    assert.ok(teamA === "Team A");
    assert.ok(teamB === "Team B");


  })


});
