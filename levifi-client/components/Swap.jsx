"use client"
import { useState, useEffect } from 'react';
import axios from 'axios';
import { pubkey } from '@/constant/constant';
import { useSelector } from 'react-redux';
import { leverage_contract_address } from '@/constant/constant';
import { v4 as uuidv4 } from 'uuid';
import { MsgExecuteContract } from "cosmjs-types/cosmwasm/wasm/v1/tx";
import { contract_execute_msg } from '@/constant/executeContractFunctions';
import { fetchUserData } from "@/lib/features/userDataInteractSlice";
import { useDispatch } from "react-redux"

const tokens = [
  { name: 'USDC', symbol: 'USDC' },
  { name: 'ARCH', symbol: 'ARCH' },
];

const Swap = ({ onOrderCreated }) => {
  const [firstToken, setFirstToken] = useState(tokens[0].symbol);
  const [secondToken, setSecondToken] = useState(tokens[1].symbol);
  const [amount, setAmount] = useState(1);
  const [result, setResult] = useState(0);
  const [rate, setRate] = useState(null);
  const [balance, setBalance] = useState(0);


  const signerData = useSelector(state => state.connectWallet);
  const user_asset = useSelector(state => state.userDataInteract);
  const dispatch = useDispatch();

  console.log(signerData);

  console.log(user_asset);

  useEffect(() => {
    if (amount > 0) {
      fetchRate(firstToken, secondToken);
    }
    console.log("chala")
    fetch_balance()
  }, [firstToken, secondToken, amount, user_asset]);

  useEffect(() => {
    if (signerData?.signer) {
        dispatch(fetchUserData({ signer: signerData?.signer, clientSigner: signerData?.clientSigner }));
    }
  }, [signerData])


  const fetchRate = async (sellToken, buyToken) => {
    try {
      const response = await axios.post('/api/price-conversion', {
        sell_token_price: sellToken,
        buy_token_price: buyToken,
      });
      const fetchedRate = response.data.data.quote[buyToken].price;
      setRate(fetchedRate);
      calculateResult(amount, fetchedRate);
    } catch (error) {
      console.error("Error fetching rate:", error);
    }
  };

  const handleFirstTokenChange = (token) => {
    setFirstToken(token);
    if (token === secondToken) {
      setSecondToken(tokens.find(t => t.symbol !== token).symbol);
    }
  };

  const handleSecondTokenChange = (token) => {
    setSecondToken(token);
    if (token === firstToken) {
      setFirstToken(tokens.find(t => t.symbol !== token).symbol);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    if (rate) {
      calculateResult(value, rate);
    }
  };

  const calculateResult = (amount, rate) => {
    if (rate && amount > 0) {
      const result = amount * rate;
      setResult(result);
    } else {
      setResult(0);
    }
  };

  const handleCreateOrder = async () => {
    try {
      const orderId = uuidv4();
      const new_order = {
        order_id: orderId,
        user_address: signerData?.signer,
        selectedMarket: "LeviFi",
        status: 1,
        createdAt: Math.floor(Date.now() / 1000),
        encrypted_order_value: firstToken === "USDC" ? pubkey.encrypt(BigInt(Number(amount) * (10 ** 6))).toString() : pubkey.encrypt(BigInt(Number(amount) * (10 ** 18))).toString(),
        buyToken: secondToken,
        sellToken: firstToken,
        trader_address: "0x0000000000000000000000000000000000000000",
        chain: "archway",
      };

      const message = {
        create_order: {
          sell_token: firstToken,
          buyToken: secondToken,
          amount: firstToken === "USDC" ? pubkey.encrypt(BigInt(Number(amount) * (10 ** 6))).toString() : pubkey.encrypt(BigInt(Number(amount) * (10 ** 18))).toString()
        }
      }
      const create_order_message = contract_execute_msg(signerData?.signer, leverage_contract_address, message, [])
      const default_fee = { amount: [{ amount: "0", denom: "aconst" }], gas: "0" };
      const sign_message = await signerData?.client?.sign(signerData?.signer, [create_order_message], default_fee, "create a new order");

      await axios.post('http://localhost:5000/add_order', new_order);

      const created_order = {
        order_id: orderId,
        sell_token: firstToken,
        buy_token: secondToken,
        sell_token_amount: amount,
        buy_token_amount: result.toFixed(4),
        time: new_order.createdAt,
        status: "Pending"
      }

      onOrderCreated(created_order);
    } catch (error) {
      console.log(error)
    }
  };

  const handleSwapTokens = () => {
    const tempToken = firstToken;
    setFirstToken(secondToken);
    setSecondToken(tempToken);
  };


  const fetch_balance = () => {

    console.log("balance fetch")

    if (firstToken === "USDC") {
      setBalance(user_asset?.usdc?.v_token_balance);
    } else {
      console.log("IDHAR")
      console.log(user_asset?.native?.v_token_balance)
      setBalance(user_asset?.native?.v_token_balance)
    }
  }

  return (
    <div className="max-w-md mx-auto rounded-3xl">
      <div className="text-center text-white font-bold my-4">Create Order</div>
      <div className="">
        <div className="flex z-0 justify-between items-center h-[100px] bg-gray-800 p-4 border border-gray-600 rounded-lg">
          <div>
            <select
              value={firstToken}
              onChange={(e) => handleFirstTokenChange(e.target.value)}
              className="bg-gray-800 p-2 text-white outline-none"
            >
              {tokens.map(token => (
                <option key={token.symbol} value={token.symbol}>{token.name}</option>
              ))}
            </select>
            <div className="pl-3 flex text-[13px] text-gray-500">
              <p>Balance: </p>
              <p className="pl-2">{balance}</p>
            </div>
          </div>
          <input
            type="text"
            value={amount}
            onChange={handleAmountChange}
            className="bg-transparent text-white outline-none text-right w-full"
            placeholder="0.0"
          />
        </div>
      </div>
      <div className="flex justify-center items-center m-[-10px]">
        <div className="bg-yellow-500 z-0 p-2 rounded-full" onClick={handleSwapTokens} style={{ cursor: 'pointer' }}>
          <svg width="32" height="32" viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="23" cy="23" r="22.5" />
            <path d="M15 28C15 28.5523 15.4477 29 16 29C16.5523 29 17 28.5523 17 28L15 28ZM16.7071 10.2929C16.3166 9.90237 15.6834 9.90237 15.2929 10.2929L8.92893 16.6569C8.53841 17.0474 8.53841 17.6805 8.92893 18.0711C9.31946 18.4616 9.95262 18.4616 10.3431 18.0711L16 12.4142L21.6569 18.0711C22.0474 18.4616 22.6805 18.4616 23.0711 18.0711C23.4616 17.6805 23.4616 17.0474 23.0711 16.6569L16.7071 10.2929ZM17 28L17 11L15 11L15 28L17 28Z" fill="black" />
            <path d="M30 19C30 18.4477 29.5523 18 29 18C28.4477 18 28 18.4477 28 19L30 19ZM28.2929 36.7071C28.6834 37.0976 29.3166 37.0976 29.7071 36.7071L36.0711 30.3431C36.4616 29.9526 36.4616 29.3195 36.0711 28.9289C35.6805 28.5384 35.0474 28.5384 34.6569 28.9289L29 34.5858L23.3431 28.9289C22.9526 28.5384 22.3195 28.5384 21.9289 28.9289C21.5384 29.3195 21.5384 29.9526 21.9289 30.3431L28.2929 36.7071ZM28 19L28 36L30 36L30 19L28 19Z" fill="black" />
          </svg>
        </div>
      </div>
      <div className="mb-4">
        <div className="flex z-0 justify-between items-center h-[100px] bg-gray-800 border border-gray-600 p-4 rounded-lg mb-4">
          <select
            value={secondToken}
            onChange={(e) => handleSecondTokenChange(e.target.value)}
            className="bg-gray-800 p-2 text-white outline-none"
          >
            {tokens.map(token => (
              <option key={token.symbol} value={token.symbol}>{token.name}</option>
            ))}
          </select>
          <div className="bg-transparent text-white text-right w-full">
            ≈ {result.toFixed(6)}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center">
        <button
          onClick={handleCreateOrder}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 mt-4 rounded-full focus:outline-none focus:shadow-outline"
          type="button" 
          disabled={amount > balance}
        >
          {Number(amount) > Number(balance) ? "Insufficient Balance" : "Create"}
        </button>
      </div>
    </div>
  );
};

export default Swap;
