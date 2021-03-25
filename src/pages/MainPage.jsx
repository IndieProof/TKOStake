import React, { useState } from "react";
import getWeb3 from "../getWeb3"
import  TKOstaking from "../contracts/TKOstaking.json"
import  TotalKnockout from "../contracts/TotalKnockOut.json"
import { Button, Modal } from "react-bootstrap";
import Spinner from 'react-bootstrap/Spinner'

export default function MainPage() {
  const [showStake, setShowStake] = useState(false);
  const [showUnStake, setShowUnStake] = useState(false);
  const [stakeVal, setStakeVal] = useState(0);
  const [unstakeVal, setUnStakeVal] = useState(0);
  const [stakedValue, setStakedValue] = useState(0);
  const [rewardValue, setRewardValue] = useState(0);
  const [availableValue, setAvailableValue] = useState(0);
  const [rewardRate, setRewardRate] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [poolBalance, setPoolBalance] = useState(0);
  const [poolTime, setPoolTime] = useState(0);
  const [rewardTime, setRewardTime] = useState("00:00:00");
  const [account, setAccount] = React.useState("Please make sure Metamask is installed for staking.");
  const [stakeContract, setStakeContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [Web3, setWeb3] = useState(null);
  const [loadingShow, setLoadingShow] = React.useState(false);
  const [loadingText, setLoadingText] = React.useState("Token Approving....");
  const [feeValue, setFeeValue] = useState(0);

  var TKOstake = null;
  var Token = null;
  var accounts = [];
  var web3 = null;

  window.onload = async(event) => {
    console.log('page is fully loaded');
    connectMetaMask();
   
  };


  window.ethereum.on('accountsChanged', function (accounts) {
    console.log("Matamask Account changed!!")
    loadAccount();
  })
  
  window.ethereum.on('networkChanged', function (networkId) {
    console.log("Matamask Network changed!!")
    loadAccount();
  })

const connectMetaMask = async () => {
  try {
    // Get network provider and web3 instance.
    console.log("event called"); 
    web3 = await getWeb3();
    setWeb3(web3);
    console.log("event web3");
    // Use web3 to get the user's accounts.
    loadAccount();
    TKOstake = new web3.eth.Contract(
      TKOstaking.abi, TKOstaking.contractAddress
    );
    Token = new web3.eth.Contract(
      TotalKnockout.abi, TotalKnockout.contractAddress
    );

    var fee = await TKOstake.methods.stakingFeeRate().call();
    setFeeValue(fee);
    setStakeContract(TKOstake);
    setTokenContract(Token);
    var poolTime = await TKOstake.methods.stakingTotalTime().call();
    var time = poolTime - Math.round(Date.now()/1000);
    if(time <= 0){
      setPoolBalance("Staking Pool is Ended!!!")
      return 0;
    }
    setInterval(() => {
      loadStakingData();
      claimRemainTime();
      poolRemainTime();

    }, 1000);
    } catch (e){
    console.log(e.message)
  }
};

  const loadAccount = async () => {
    try {
      accounts = await web3.eth.getAccounts();

    setAccount(accounts[0])
    } catch (e){
      console.log(e.message)
    }
  
    };

  const loadStakingData = async () => {
    try {
      const depositedTko = await TKOstake.methods.depositedTokens(accounts[0]).call();
      const earnedTko = await TKOstake.methods.totalEarnedTokens(accounts[0]).call();
      const balance = await Token.methods.balanceOf(accounts[0]).call();
      const rate = await TKOstake.methods.rewardRate().call();
      const poolBal = await Token.methods.balanceOf(TKOstaking.contractAddress).call();
      setStakedValue(web3.utils.fromWei(""+depositedTko));
      setRewardValue(web3.utils.fromWei(""+earnedTko));
      setAvailableValue(web3.utils.fromWei(""+balance));

      var bal = parseInt(web3.utils.fromWei(""+poolBal));
      if(bal >= 10**6 &&bal < 10**7){
        bal = parseInt((""+bal).substr(0,1))+"M";
      }if(bal >= 10**7){
        bal = parseInt((""+bal).substr(0,2))+"M";
      }
      setPoolBalance(bal);
      setRewardRate((parseFloat(rate)/100.0).toFixed(2));
      console.log("pool balance: "+web3.utils.fromWei(""+poolBal));
  
      } catch (e){
      console.log(e.message)
    }
  
    };

    const claimRemainTime = async () => {
      try {
        const lastClaimedTime = await TKOstake.methods.lastClaimedTime(accounts[0]).call();
        var timeSpent = Math.round(Date.now()/1000) - parseInt(lastClaimedTime);
        setTimeSpent(timeSpent);
        var tim = new Date(timeSpent * 1000).toISOString().substr(11, 8);
        if(timeSpent <= 0 || lastClaimedTime <= 0){
          setRewardTime("00:00:00");
        }
        else if(timeSpent < 0) {
          setRewardTime("00:00:00");
        }
       else{
         if(parseInt(timeSpent/86400)>0)
          setRewardTime(parseInt(timeSpent/86400)+":"+tim);
          else
          setRewardTime(""+tim);
        }
      }catch(e){console.log(e);}
    };

    const poolRemainTime = async () => {
      try {
        var poolTime = await TKOstake.methods.stakingTotalTime().call();
        var time = poolTime - Math.round(Date.now()/1000);
        if(time <= 0){
          setPoolTime("00:00:00");
        }else if(time<=86400){
          var tim = new Date(time * 1000).toISOString().substr(11, 8);
          setPoolTime(""+tim);
        }else{
          setPoolTime(parseInt(time/86400)+1+"Days");
        }
      }catch(e){console.log(e);}
    };
  const stakeMax = async() => {
    setStakeVal(availableValue);
    
  }
  const unStakeMax = async() => {

    setUnStakeVal(stakedValue);
  }

  const stakeTko = async() => {
    if(Web3 == null){
      setLoadingText(account);
          setLoadingShow(true);
          return;
    }
    else if(poolTime<=0) {
      setLoadingText("Staking Pool is Ended!!");
      setLoadingShow(true);
      return;
    }else if( parseInt(stakeVal) < 100 ){
      setLoadingText("You must have 100 TKO for Stake!!");
      setLoadingShow(true);
      return;
    }else if( parseFloat(availableValue) < stakeVal || parseFloat(stakeVal) <= 0 )
    {
      setLoadingText("Insufficient TKO to Stake!!");
      setLoadingShow(true);
      return;
    }
        try{
          setLoadingText("Token Approving....");
          setLoadingShow(true);
      const bal = Web3.utils.toWei(""+stakeVal);
      console.log("bal: "+ bal);
      await tokenContract.methods.approve(TKOstaking.contractAddress,bal).send({from: account});
      setLoadingText("Staking fee cost is "+((parseFloat(stakeVal)*parseFloat(feeValue))/10000).toFixed(3)+" TKO");
      await stakeContract.methods.stake(bal).send({from: account});
          setLoadingShow(false)
    }catch (e){
      setLoadingText(e.message.split(":")[1]);
      console.log(e);
    }

  };

  const unstakeTko = async() => {
    if(Web3 == null){
      setLoadingText(account);
          setLoadingShow(true);
          return;
    }
   else if(poolTime<=0) {
      setLoadingText("Staking Pool is Ended!!");
      setLoadingShow(true);
      return;
   }else if( parseInt(unstakeVal) <= 0 ){
    setLoadingText("You must enter some TKO for Unstake!!");
    setLoadingShow(true);
    return;
  }
    try{
      var available = (stakedValue*rewardRate*timeSpent/86400/100).toFixed(3);
      setLoadingText("Your Available Reward is"+available+" TKO");
      setLoadingShow(true);
      const bal = Web3.utils.toWei(""+unstakeVal);
      await stakeContract.methods.unstake(bal).send({from: account});
      setLoadingShow(false);
    }catch (e){
      setLoadingText(e.message.split(":")[1]);
    }
  };

  const claimReward = async () => {
    if(Web3 == null){
      setLoadingText(account);
          setLoadingShow(true);
          return;
    }else if(timeSpent<=0) {
      setLoadingText("Staking Pool is Ended!!");
      setLoadingShow(true);
      return;
    }
    try{
      var available = (stakedValue*rewardRate*timeSpent/86400/100).toFixed(3);
      setLoadingText("Claiming Reward of "+parseFloat(available).toFixed(3)+" TKO");
      setLoadingShow(true);
      if(available == 0.00) return;
      await stakeContract.methods.claimReward().send({from: account});
      setLoadingShow(false);
    }catch (e){
      setLoadingText(e.message.split(":")[1]);
    }
  };

  return (
    <div id="__nuxt">
      <div id="__layout">
        <div id="mainPage">
          <div className="mainContent">
            <div className="dashboardBox"   onClick={
                    showUnStake
                      ? () => {setShowUnStake(false); setUnStakeVal(0);}
                      : () => {setShowStake(false); setStakeVal(0)}
                  }>
              <div className="header">
                <div className="logo">
                  <img
                    src={require("../res/images/logo_gold.png")}
                    alt="linear"
                  />
                </div>
                <div className="websiteName">Tap-Out EZ-Staker 0.51</div>
                <div className="tipBox" style={{ opacity: 1 }}>
                  <div className="tipDesc">
                    <span>
                      {account}
                    </span>
                  </div>
                </div>
            
              </div>
              <div className="totalLina">
                <div className="totalData">
                <div className="totalReward">
                    <div className="item">
                      <span className="num">{rewardRate/1+"%"}</span>
                      <span className="label">APY-Daily</span>
                    </div>
                    <div className="item">
                      
                    </div>
                    <div className="item">
                    <span className="num">{poolTime}
                                                    </span>
                      <span className="label">Remaining Pool Time</span>
                    </div> 
                  </div>
                  <div className="totalPool">
                    <span className="num">{poolBalance}</span>
                    <span className="label">Total Pool Size</span>
                  </div>
                  <div className="totalReward">
                    <div className="item">
                      <span className="num">{(stakedValue*rewardRate*timeSpent/86400/100).toFixed(3)}</span>
                      <span className="label">Est. Reward</span>
                    </div>
                    <div className="item">
                      <span className="num">{parseFloat(rewardValue).toFixed(3)}</span>
                      <span className="label">Rewards Earned</span>
                    </div>
                    <div className="item">
                    <span className="num">{rewardTime}</span>
                      <span className="label">Staking Time</span>
                    </div> 
                  </div>
                  <div className="totalReward">
                  <div className="item"></div>
                    <div className="item">
                      <Button variant="warning" onClick={claimReward} >Claim</Button>
                    </div>
                    <div className="item"></div>
                    </div>
                </div>
              </div>
              <div className="dataArea">
                <div className="item ">
                  <span className="label">Available</span>
                  <span className="data">
                    <span className="num">{parseFloat(availableValue).toFixed(3)}</span>
                    <span className="unit">TKO</span>
                  </span>
                </div>
                <div className="item">
                  <span className="label">Staking</span>
                  <span className="data">
                    <span className="num">{parseFloat(stakedValue).toFixed(3)}</span>
                    <span className="unit">TKO</span>
                  </span>
                </div>
                <div className="item ">
                  <span className="label">Total</span>
                  <span className="data">
                    <span className="num">{(parseFloat(availableValue)+parseFloat(stakedValue)).toFixed(3)}</span>
                    <span className="unit">TKO</span>
                  </span>
                </div>
              </div>
            </div>
            <div
              className={`bedienfeldBox ${
                (showStake || showUnStake) && "boxOpen"
              }`}
            >
              <div
                className={`stake ${showStake && "open"} ${
                  showUnStake && "close"
                }`}
                onClick={() => setShowStake(true)}
              >
                <div className="floatTitle">
                  <span className={!showStake ? "openTitle" : "closeTitle"}>
                    I want to stake
                  </span>
                  <span className={showStake ? "openTitle" : "closeTitle"}>
                    STAKE
                  </span>
                </div>
                {showStake && (
                  <>
                    <div
                      className="floatEditor"
                      style={{ display: "block", opacity: 1 }}
                    >
                      <div className="input ivu-input-number ivu-input-number-default empty">
                        <div className="ivu-input-number-handler-wrap">
                          <a className="ivu-input-number-handler ivu-input-number-handler-up ivu-input-number-handler-up-disabled">
                            <span className="ivu-input-number-handler-up-inner ivu-icon ivu-icon-ios-arrow-up" />
                          </a>
                          <a className="ivu-input-number-handler ivu-input-number-handler-down ivu-input-number-handler-down-disabled">
                            <span className="ivu-input-number-handler-down-inner ivu-icon ivu-icon-ios-arrow-down" />
                          </a>
                        </div>
                        <div className="ivu-input-number-input-wrap">
                          <input
                            autoComplete="off"
                            spellCheck="false"
                            value={stakeVal}
                            className="ivu-input-number-input"
                            onChange={e => setStakeVal(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="label">TKO</div>
                      <div className="maxButton max">
                        <span onClick={stakeMax} className="label">MAX</span>
                      </div><br/><br/>
                      <div className="maxButton max">
                        <span onClick={stakeTko} className="label">Stake</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div
                className={`unstake ${showUnStake && "open"} ${
                  showStake && "close"
                }`}
                onClick={() => setShowUnStake(true)}
              >
                <div className="floatTitle">
                  <span className={showUnStake ? "closeTitle" : "openTitle"}>
                    I want to unstake
                  </span>
                  <span
                    className={!showUnStake ? "closeTitle" : "openTitle"}
                    style={{ letterSpacing: 0 }}
                  >
                    UNSTAKE
                  </span>
                </div>
                {showUnStake && (
                  <div>
                    <div
                      className="floatEditor"
                      style={{ display: "block", opacity: 1 }}
                    >
                      <div className="input ivu-input-number ivu-input-number-default empty">
                        <div className="ivu-input-number-handler-wrap">
                          <a className="ivu-input-number-handler ivu-input-number-handler-up ivu-input-number-handler-up-disabled">
                            <span className="ivu-input-number-handler-up-inner ivu-icon ivu-icon-ios-arrow-up" />
                          </a>
                          <a className="ivu-input-number-handler ivu-input-number-handler-down ivu-input-number-handler-down-disabled">
                            <span className="ivu-input-number-handler-down-inner ivu-icon ivu-icon-ios-arrow-down" />
                          </a>
                        </div>
                        <div className="ivu-input-number-input-wrap">
                          <input
                            autoComplete="off"
                            spellCheck="false"
                            value={unstakeVal}
                            className="ivu-input-number-input"
                            onChange={e => setUnStakeVal(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="label">TKO</div>
                      <div className="maxButton max">
                        <span onClick={unStakeMax} className="label">MAX</span>
                      </div><br/><br/>
                      <div onClick={unstakeTko} className="maxButton max">
                        <span className="label">Unstake</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {(showStake || showUnStake) && (
                <div
                  className="floatClose"
                  onClick={
                    showUnStake
                      ? () => {setShowUnStake(false); setUnStakeVal(0);}
                      : () => {setShowStake(false); setStakeVal(0)}
                  }
                  style={{
                    display: "block",
                    opacity: 1,
                    position: "absolute",
                    top: 15,
                    right: 20,
                    color: "#fff",
                  }}
                >
                  <h1 type="button" className="close" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                  </h1>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Modal
        show={loadingShow}
        size="md"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        onHide={() => setLoadingShow(false)}
      >
        <Modal.Header className="modal-header" closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            <h5>
            EZ-Staker Alert... <Spinner as="span" animation="border" size="sm"  role="status" >
              </Spinner> Please wait 
              </h5>

          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body">
          <div className="custom-modal">
            <div className="modal-grid">
            <div className=" gGlLBd">
                  <div color="#4A6C9B" className="ghHKdU">
                   {loadingText}
                  </div>
                </div>
            </div>
          </div>
        
        </Modal.Body>
      </Modal>

    </div>
  );
}
