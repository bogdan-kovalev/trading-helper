// GitHub Copilot rules.
import {TradeMemo} from "../../apps-script/TradeMemo";
import * as React from "react";
import {useState} from "react";
import {ExchangeSymbol} from "../../apps-script/TradeResult";
import {Autocomplete, Dialog, DialogActions, DialogContent, DialogTitle, TextField} from "@mui/material";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import {StableUSDCoin} from "../../apps-script/shared-lib/types";

export function TradeEditDialog(props: {
  tradeMemo: TradeMemo,
  onClose: () => void,
  onCancel: () => void,
  onSave: (tradeMemo: TradeMemo) => Promise<Error | string>,
}) {
  const {tradeMemo, onClose, onCancel, onSave} = props;
  const [quantity, setQuantity] = useState(tradeMemo.tradeResult.quantity);
  const [paid, setPaid] = useState(tradeMemo.tradeResult.paid);
  const [coinName, setCoinName] = useState(tradeMemo.getCoinName());
  const [stableName, setStableName] = useState(tradeMemo.tradeResult.symbol.priceAsset);
  const [stopLimit, setStopLimit] = useState(tradeMemo.stopLimitPrice);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const onSaveClick = () => {
    setIsSaving(true);
    const newTm = TradeMemo.copy(tradeMemo);
    newTm.tradeResult.symbol = new ExchangeSymbol(coinName, stableName);
    newTm.tradeResult.quantity = quantity;
    newTm.tradeResult.paid = paid;
    newTm.stopLimitPrice = stopLimit;

    onSave(newTm).then(() => {
      setIsSaving(false);
      onClose();
    }).catch(e => {
      setIsSaving(false);
      setError(e.message);
    });
  };

  return (
    <Dialog open={true} onClose={onCancel}>
      <DialogTitle>Edit {tradeMemo.getCoinName()}</DialogTitle>
      <DialogContent>
        <TextField autoFocus margin="dense" id="name" label="Coin Name" type="text" fullWidth
                   value={coinName} onChange={e => setCoinName(e.target.value)}/>
        <Autocomplete
          disableClearable
          value={stableName}
          defaultValue={StableUSDCoin.USDT}
          options={Object.values(StableUSDCoin)}
          onChange={(e, val) => setStableName(val)}
          renderInput={(params) => <TextField {...params} fullWidth margin="dense" id="stable" label={"Stable Coin"}/>}
        />
        <TextField margin="dense" id="quantity" label="Quantity" type="number" fullWidth
                   value={quantity} onChange={e => setQuantity(parseFloat(e.target.value))}/>
        <TextField margin="dense" id="paid" label="Paid" type="number" fullWidth
                   value={paid} onChange={e => setPaid(parseFloat(e.target.value))}/>
        <TextField margin="dense" id="stop" label="Stop Limit Price" type="number" fullWidth
                   value={stopLimit} onChange={e => setStopLimit(parseFloat(e.target.value))}/>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onSaveClick} color="primary" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
      </DialogActions>
      {error && <DialogContent><Typography color="error">{error}</Typography></DialogContent>}
    </Dialog>
  );
}