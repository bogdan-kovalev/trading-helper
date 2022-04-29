import * as React from "react";
import Box from "@mui/material/Box";
import Trade from "./Trade";
import {TradeMemo, TradeState} from "../../apps-script/TradeMemo";
import {Badge, Button, Stack, TextField, ToggleButton, ToggleButtonGroup} from "@mui/material";
import {Config} from "../../apps-script/Store";
import {gsr} from "../App";

const byProfit = (t1: TradeMemo, t2: TradeMemo): number => t1.profit() < t2.profit() ? 1 : -1;

const groupByState = (trades: { [key: string]: TradeMemo }): Map<TradeState, TradeMemo[]> => {
  const groupsMap = Object.keys(TradeState).reduce((map, key) => {
    map.set(TradeState[key], []);
    return map;
  }, new Map<TradeState, TradeMemo[]>());

  Object.values(trades).forEach(obj => {
    const tradeMemo = TradeMemo.fromObject(obj);
    groupsMap.get(tradeMemo.getState()).push(tradeMemo);
  });

  return groupsMap;
}

export function Assets({trades, config}: { trades: { [k: string]: TradeMemo }, config: Config }) {
  const [state, setState] = React.useState<TradeState>(TradeState.BOUGHT);
  const changeState = (e, newState) => setState(newState);

  const [coinName, setCoinName] = React.useState("BTC");

  function buy() {
    if (confirm(`Are you sure you want to buy ${coinName}?`)) {
      gsr.withSuccessHandler(alert).buyCoin(coinName);
    }
  }

  const tradesMap = groupByState(trades);
  const sx = {m: '10px', width: "332px", display: "inline-flex"};
  return (
    <>
      <Box>
        <ToggleButtonGroup sx={sx} fullWidth={true} color="primary" value={state} exclusive onChange={changeState}>
          <ToggleButton value={TradeState.BOUGHT}>
            <Badge badgeContent={tradesMap.get(TradeState.BOUGHT).length}>Bought</Badge>
          </ToggleButton>
          <ToggleButton value={TradeState.SOLD}>
            <Badge badgeContent={tradesMap.get(TradeState.SOLD).length}>Sold</Badge>
          </ToggleButton>
          <ToggleButton value={TradeState.SELL}>
            <Badge badgeContent={tradesMap.get(TradeState.SELL).length}>Selling</Badge>
          </ToggleButton>
          <ToggleButton value={TradeState.BUY}>
            <Badge badgeContent={tradesMap.get(TradeState.BUY).length}>Buying</Badge>
          </ToggleButton>
        </ToggleButtonGroup>
        <Stack sx={sx} direction={"row"} spacing={2}>
          <TextField fullWidth={true} label="Coin name" value={coinName} onChange={(e) => setCoinName(e.target.value)}/>
          <Button variant="contained" onClick={buy}>Buy</Button>
        </Stack>
      </Box>
      {tradesMap.get(state).sort(byProfit).map(t =>
        <Box sx={{display: 'inline-flex', margin: '10px'}}>
          <Trade key={t.tradeResult.symbol.quantityAsset}
                 name={t.tradeResult.symbol.quantityAsset} data={t} config={config}/>
        </Box>
      )}
    </>
  );
}
