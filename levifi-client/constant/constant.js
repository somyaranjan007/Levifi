import * as paillierBigint from "paillier-bigint";

export const pubkey = new paillierBigint.PublicKey(
    1678481375462202042297541766968126908461n,
    1678481375462202042297541766968126908462n
);

export const leverage_contract_address = "archway12qvt9frcu24cp7k3tenkvjafsthf4u8grrqq66vp60lugfpc07usl2w2cl";
export const usdc_contract_address = "archway1hcctxstwswmctpk0zkj0f06fy3he38akujp5pvxf3754wl7pyw9sjmzyh5";

export const usdc_token_name = "USDC"
export const native_token_name = "ARCH";

export const tokens = [
    { name: "usdc", address: usdc_token_name },
    { name: "native", address: native_token_name }
]
export const queryBalanceMethods = [
    { method: 'user_collateral_token_balance', key: 'collateral_balance' },
    { method: 'user_wrapped_token_balance', key: 'wrapped_leverage_balance' },
    { method: 'user_borrow_token_balance', key: 'borrow_balance' },
    { method: 'user_v_token_balance', key: 'v_token_balance' }
]

