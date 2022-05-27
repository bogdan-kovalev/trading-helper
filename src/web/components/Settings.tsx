import * as React from "react"
import { useEffect, useState } from "react"
import SaveIcon from "@mui/icons-material/Save"
import { Config } from "../../gas/Store"
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  FormControlLabel,
  InputAdornment,
  Stack,
  Switch,
  TextField,
} from "@mui/material"
import { circularProgress } from "./Common"
import { StableUSDCoin } from "../../shared-lib/types"
import { f2 } from "../../shared-lib/functions"

export function Settings() {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  const [config, setConfig] = useState<Config>(null)
  const [configLoaded, setConfigLoaded] = useState(false)

  const [stopLimit, setLossLimit] = useState(``)
  const [profitLimit, setProfitLimit] = useState(``)
  const [buyQuantity, setBuyQuantity] = useState(``)
  const [hideAdvanced, setHideAdvanced] = useState(true)

  useEffect(
    () =>
      google.script.run
        .withSuccessHandler((cfg) => {
          setLossLimit(f2(cfg.StopLimit * 100).toString())
          setProfitLimit(f2(cfg.ProfitLimit * 100).toString())
          setBuyQuantity(cfg.BuyQuantity.toString())
          setConfig(cfg)
          setConfigLoaded(true)
        })
        .getConfig(),
    [],
  )

  const onSave = () => {
    if (!config.StableCoin) {
      setError(`Stable Coin is required`)
      return
    }
    setError(null)

    isFinite(+stopLimit) && (config.StopLimit = +stopLimit / 100)
    isFinite(+profitLimit) && (config.ProfitLimit = +profitLimit / 100)
    isFinite(+buyQuantity) && (config.BuyQuantity = Math.floor(+buyQuantity))
    setConfig(config)
    setIsSaving(true)
    google.script.run
      .withFailureHandler((r) => {
        setIsSaving(false)
        setError(r)
      })
      .withSuccessHandler(() => {
        setIsSaving(false)
        setError(``)
      })
      .setConfig(config)
  }

  return (
    <Box
      sx={{ justifyContent: `center`, display: `flex`, "& .MuiTextField-root": { width: `25ch` } }}
    >
      {!configLoaded && circularProgress}
      {configLoaded && (
        <Stack spacing={2}>
          <Autocomplete
            selectOnFocus={false}
            disableClearable={true}
            value={config.StableCoin}
            options={Object.values(StableUSDCoin)}
            onChange={(e, val) => val && setConfig({ ...config, StableCoin: val as StableUSDCoin })}
            renderInput={(params) => <TextField {...params} label={`Stable Coin`} />}
          />
          <TextField
            value={buyQuantity}
            label={`Buy Quantity`}
            onChange={(e) => setBuyQuantity(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
          />
          <Stack direction="row" spacing={2}>
            <TextField
              value={profitLimit}
              label={`Profit Limit`}
              onChange={(e) => setProfitLimit(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start">%</InputAdornment> }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.SellAtProfitLimit}
                  onChange={(e) => setConfig({ ...config, SellAtProfitLimit: e.target.checked })}
                />
              }
              label="Auto-sell"
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              disabled={config.ProfitBasedStopLimit}
              value={stopLimit}
              label={`Stop Limit`}
              onChange={(e) => setLossLimit(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start">%</InputAdornment> }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.SellAtStopLimit}
                  onChange={(e) => setConfig({ ...config, SellAtStopLimit: e.target.checked })}
                />
              }
              label="Auto-sell"
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              value={config.PriceAnomalyAlert}
              label={`Price Anomaly Alert`}
              onChange={(e) => setConfig({ ...config, PriceAnomalyAlert: +e.target.value })}
              InputProps={{ startAdornment: <InputAdornment position="start">%</InputAdornment> }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.BuyDumps}
                  onChange={(e) => setConfig({ ...config, BuyDumps: e.target.checked })}
                />
              }
              label="Buy drops"
            />
          </Stack>
          <FormControlLabel
            sx={{ margin: 0 }}
            control={
              <Switch
                checked={config.ProfitBasedStopLimit}
                onChange={(e) => setConfig({ ...config, ProfitBasedStopLimit: e.target.checked })}
              />
            }
            label="P/L based Stop Limit"
          />
          <FormControlLabel
            control={
              <Switch
                checked={config.SwingTradeEnabled}
                onChange={(e) => setConfig({ ...config, SwingTradeEnabled: e.target.checked })}
              />
            }
            label="Swing trading"
          />
          <FormControlLabel
            control={
              <Switch
                checked={config.AveragingDown}
                onChange={(e) => setConfig({ ...config, AveragingDown: e.target.checked })}
              />
            }
            label="Averaging down"
          />
          {advancedSettings(hideAdvanced, setHideAdvanced, config, setConfig)}
          <Box alignSelf={`center`} sx={{ position: `relative` }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={onSave}
              disabled={isSaving}
            >
              Save
            </Button>
            {isSaving && circularProgress}
          </Box>
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      )}
    </Box>
  )
}

function advancedSettings(
  hide: boolean,
  setHide,
  config: Config,
  setConfig: (config: Config) => void,
) {
  return (
    <>
      <Chip onClick={() => setHide(!hide)} label="Advanced" />
      {!hide && (
        <Stack spacing={2}>
          <Autocomplete<number>
            selectOnFocus={false}
            value={config.ScoreGainersThreshold}
            options={[0.001, 0.005, 0.01, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3]}
            onChange={(e, val: number) =>
              val && setConfig({ ...config, ScoreGainersThreshold: val })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                helperText={`Current: ${
                  config.ScoreGainersThreshold * 100
                }%. Maximum percentage of market currencies that should gain or lose value for "Scores" to be updated.`}
                label={`Score Gainers Threshold`}
              />
            )}
          />
        </Stack>
      )}
    </>
  )
}
