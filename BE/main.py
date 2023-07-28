from fastapi import FastAPI, HTTPException
from web3 import Web3
from web3.middleware import geth_poa_middleware
from fastapi.middleware.cors import CORSMiddleware
from model.token_model import TokenEvent,TokenFee
import uvicorn


app = FastAPI(
    title = "BE_HAILSTONE",
    description="API for Hailstone",
)
origins = [
    # "http://localhost.tiangolo.com",
    # "https://localhost.tiangolo.com",
    # "http://localhost",
    # "http://localhost:8080",
    # "http://localhost:3000"
    "*"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

web3 = Web3(Web3.HTTPProvider("https://bsc.blockpi.network/v1/rpc/public"))
web3.middleware_onion.inject(geth_poa_middleware, layer=0)
abi = open('./ABI/abi.json', 'r').read()
proxy_contract_address = '0x312Bc7eAAF93f1C60Dc5AfC115FcCDE161055fb0'
target_contract_address = '0x2C3C340233338D875637304B06f4F6fAf9BeBd20'

def count_block(start, end):
    result_array = []
    current_number = start
    while current_number <= end:
        result_array.append(current_number)
        current_number += 1024
    if result_array[-1] < end:
        result_array.append(end)
    return result_array



@app.get("/{token}/event",tags=["Token"],response_model=TokenEvent,summary="Get event of token in range of time")
async def get_token(token: str,minute:int = 0):
    to_block = web3.eth.blockNumber
    from_block = int(to_block - (minute * 60 / 3))
    from_time = web3.eth.getBlock(from_block)['timestamp']
    to_time = web3.eth.getBlock(to_block)['timestamp']
    total_fee = 0.0
    token_address = ""
    events = []
    if token == "USDC":
        token_address = "0x19609B03C976CCA288fbDae5c21d4290e9a4aDD7"
    elif token == "USDT":
        token_address = "0x55d398326f99059fF775485246999027B3197955"
    elif token == "BUSD":
        token_address = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"
    elif token == "DAI":
        token_address = "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3"
    else:
        raise HTTPException(status_code=404, detail={"message": "Token not found"})
    if from_block > to_block:
        raise HTTPException(status_code=402, detail={"message": "from_block must be smaller than to_block"})
    if from_block == to_block:
        from_time = web3.eth.getBlock((from_block - 1024))['timestamp']
        from_block = from_block - 1024
        events = web3.eth.contract(address=proxy_contract_address, abi=abi).events.Swap().getLogs(fromBlock=(to_block - 1024))
    else:
        if (to_block - from_block) <1024:
            events = web3.eth.contract(address=proxy_contract_address, abi=abi).events.Swap().getLogs(fromBlock=from_block,toBlock=to_block)
        else:
            block_array = count_block(from_block, to_block)
            for i in range(len(block_array)-1):
                target_events = web3.eth.contract(address=proxy_contract_address, abi=abi).events.Swap().getLogs(fromBlock=block_array[i],toBlock=block_array[i+1])
                for target in target_events:
                    events.append(dict(dict(target)))
    all_event_logs = []
    for event in events:
        event = dict(event)
        if dict(dict(event)['args'])['toToken'] == token_address:
            event['args'] = dict(event['args'])
            event['transactionHash'] =(event['transactionHash']).hex()
            event['blockHash'] = (event['blockHash']).hex()
            event['timestamp'] = web3.eth.getBlock(event['blockNumber'])['timestamp']
            all_event_logs.append(dict(dict(event)))
    return {"token": token,"token_address":token_address,"pool_address":"0x312Bc7eAAF93f1C60Dc5AfC115FcCDE161055fb0","events":all_event_logs,"time":{"from_time":from_time,"to_time":to_time,"from_block":from_block,"to_block":to_block}}

@app.get("/{token}/fee",tags=["Token"],response_model=TokenFee,summary="Get total fee of token")
async def get_token_fee(token: str,minute: int = 0):
    to_block = web3.eth.blockNumber
    from_block = int(to_block - (minute * 60 / 3))
    total_fee = 0.0
    token_address = ""
    events = []
    if token == "USDC":
        token_address = "0x19609B03C976CCA288fbDae5c21d4290e9a4aDD7"
    elif token == "USDT":
        token_address = "0x55d398326f99059fF775485246999027B3197955"
    elif token == "BUSD":
        token_address = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"
    elif token == "DAI":
        token_address = "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3"
    else:
        raise HTTPException(status_code=404, detail={"message": "Token not found"})
    if from_block > to_block:
        raise HTTPException(status_code=402, detail={"message": "from_block must be smaller than to_block"})
    if from_block == to_block:
        events = web3.eth.contract(address=proxy_contract_address, abi=abi).events.Swap().getLogs(fromBlock=(to_block - 1024))
    else:
        if (to_block - from_block) <1025:
            events = web3.eth.contract(address=proxy_contract_address, abi=abi).events.Swap().getLogs(fromBlock=from_block,toBlock=to_block)
        else:
            block_array = count_block(from_block, to_block)
            for i in range(len(block_array)-1):
                target_events = web3.eth.contract(address=proxy_contract_address, abi=abi).events.Swap().getLogs(fromBlock=block_array[i],toBlock=block_array[i+1])
                for target in target_events:
                    events.append(dict(dict(target)))
    for event in events:
        if dict(dict(event)['args'])['toToken'] == token_address:
            fee = dict(dict(event)['args'])['toAmount'] * 0.0001
            total_fee += fee
    return {"token": token,"token_address":token_address,"pool_address":"0x312Bc7eAAF93f1C60Dc5AfC115FcCDE161055fb0","total_fee":web3.fromWei(total_fee,'ether')}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8002)