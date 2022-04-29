import * as React from 'react';
import {useEffect, useState} from 'react';
import SaveIcon from '@mui/icons-material/Save';
import {Config} from "../../apps-script/Store";
import {Box, Button, FormControlLabel, InputAdornment, Snackbar, Stack, Switch, TextField,} from "@mui/material";
import {circularProgress} from "./Common";
import {PriceProvider} from "../../apps-script/TradeResult";

export function Settings() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [config, setConfig] = useState<Config>({
    BuyQuantity: 0,
    LossLimit: 0,
    PriceAsset: "",
    SellAtStopLimit: false,
    SellAtTakeProfit: false,
    TakeProfit: 0,
    SwingTradeEnabled: false,
    PriceProvider: PriceProvider.Binance,
  });

  const [lossLimit, setLossLimit] = useState(0);
  const [takeProfit, setTakeProfit] = useState(0);

  useEffect(() => {
    setLossLimit(+(config.LossLimit * 100).toFixed(2));
    setTakeProfit(+(config.TakeProfit * 100).toFixed(2));
  }, [config]);

  // @ts-ignore
  useEffect(() => google.script.run.withSuccessHandler(setConfig).getConfig(), [])

  const onSave = () => {
    config.LossLimit = lossLimit / 100;
    config.TakeProfit = takeProfit / 100;
    setConfig(config);
    setIsSaving(true);
    // @ts-ignore
    google.script.run
      .withFailureHandler(r => {
        setIsSaving(false);
        setError(r);
      })
      .withSuccessHandler(() => {
        setIsSaving(false);
        setError('');
      })
      .setConfig(config);
  }

  return (
    <Box sx={{display: 'flex', '& .MuiTextField-root': {width: '25ch'}}}>
      <Stack spacing={2}>
        <TextField value={config.PriceAsset} label={"Stable Coin"}
                   onChange={e => setConfig({...config, PriceAsset: e.target.value})}
        />
        <TextField value={config.BuyQuantity} label={"Buy Quantity"}
                   onChange={e => setConfig({...config, BuyQuantity: +e.target.value})}
                   InputProps={{startAdornment: <InputAdornment position="start">$</InputAdornment>}}
        />
        <Stack direction="row" spacing={2}>
          <TextField value={takeProfit} label={"Profit Limit"} onChange={e => setTakeProfit(+e.target.value)}
                     InputProps={{startAdornment: <InputAdornment position="start">%</InputAdornment>}}
          />
          <FormControlLabel
            control={
              <Switch checked={config.SellAtTakeProfit}
                      onChange={e => setConfig({...config, SellAtTakeProfit: e.target.checked})}/>
            }
            label="Auto-sell"
          />
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField value={lossLimit} label={"Loss Limit"} onChange={e => setLossLimit(+e.target.value)}
                     InputProps={{startAdornment: <InputAdornment position="start">%</InputAdornment>}}
          />
          <FormControlLabel
            control={
              <Switch checked={config.SellAtStopLimit}
                      onChange={e => setConfig({...config, SellAtStopLimit: e.target.checked})}/>
            }
            label="Auto-sell"
          />
        </Stack>
        <FormControlLabel
          control={
            <Switch checked={config.SwingTradeEnabled}
                    onChange={e => setConfig({...config, SwingTradeEnabled: e.target.checked})}/>
          }
          label="Swing trade"
        />
        <Stack direction={"row"}>
          <Box sx={{position: 'relative'}}>
            <Button variant="contained" color="primary" startIcon={<SaveIcon/>}
                    onClick={onSave} disabled={isSaving}>Save</Button>
            {isSaving && circularProgress}
          </Box>
        </Stack>
      </Stack>
      {error && <Snackbar open={!!error} message={error}/>}
    </Box>
  );
}
