import { calculateFee, GasPrice } from "@cosmjs/stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { contract_execute_msg } from "@/constant/executeContractFunctions"
import { leverage_contract_address } from "@/constant/constant"

export const POST = async (request) => {

  const archwayTestnetOptions = {
    rpcEndpoint: "https://rpc.constantine.archway.io:443",
    gasPrice: "0.2aconst",
    chainId: "constantine-3",
    fees: {
      upload: 2000000
    }
  };

  try {

    console.log(process.env.MNEMONICS);

    const default_fee = { amount: [{ amount: "510000000000000000", denom: "aconst" }], gas: "3000000" };

    const mnemonic = process.env.MNEMONICS;
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: "archway" });
    const [account] = await wallet.getAccounts();
    const addr = account.address;
    const gasPrice = GasPrice.fromString(archwayTestnetOptions.gasPrice);
    const client = await SigningCosmWasmClient.connectWithSigner(archwayTestnetOptions.rpcEndpoint, wallet, { gasPrice });

    const message = await request.json();
    console.log(message);
    const exe_message = contract_execute_msg(addr, leverage_contract_address, message, []);
    console.log(exe_message);
    const execute_transaction = await client.signAndBroadcast(addr, [exe_message], default_fee, "")

    console.log(execute_transaction)
    return Response.json({ txHash: execute_transaction.transactionHash }, { status: 200 })
  } catch (error) {
    return Response.error({ error }, { status: 500 })
  }
}