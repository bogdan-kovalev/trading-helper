import * as React from "react"
import { useEffect, useState } from "react"
import SaveIcon from "@mui/icons-material/Save"
import {
  Alert,
  Box,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputAdornment,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material"
import { capitalizeWord, cardWidth, circularProgress, selectivityColorMap } from "./Common"
import {
  AutoTradeBestScores,
  Config,
  enumKeys,
  f2,
  ScoreSelectivityKeys,
  StableUSDCoin,
} from "trading-helper-lib"
import { ScoreSelectivity } from "trading-helper-lib/dist/Types"

export function Settings({
  config,
  setConfig,
}: {
  config: Config
  setConfig: (config: Config) => void
}) {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  const [stopLimit, setLossLimit] = useState(f2(config.StopLimit * 100).toString())
  const [profitLimit, setProfitLimit] = useState(f2(config.ProfitLimit * 100).toString())
  const [buyQuantity, setBuyQuantity] = useState(config.BuyQuantity.toString())

  const [initialFbURL, setInitialFbURL] = useState(``)
  const [newFbURL, setNewFbURL] = useState(``)

  useEffect(() => setNewFbURL(initialFbURL), [initialFbURL])
  useEffect(() => {
    google.script.run
      .withSuccessHandler(setInitialFbURL)
      .withFailureHandler(setError)
      .getFirebaseURL()
  }, [])

  const onSave = () => {
    if (initialFbURL !== newFbURL) {
      google.script.run
        .withSuccessHandler(() => {
          setInitialFbURL(newFbURL)
        })
        .withFailureHandler(setError)
        .setFirebaseURL(newFbURL)
    }

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
      .setConfig(config as any)
  }

  return (
    <Box sx={{ justifyContent: `center`, display: `flex` }}>
      <Stack spacing={2} divider={<Divider />}>
        <FormControl>
          <FormLabel>Stable Coin</FormLabel>
          <RadioGroup
            row
            value={config.StableCoin}
            onChange={(e, val) => setConfig({ ...config, StableCoin: val as StableUSDCoin })}
          >
            {Object.values(StableUSDCoin).map((coin) => (
              <FormControlLabel key={coin} value={coin} control={<Radio />} label={coin} />
            ))}
          </RadioGroup>
        </FormControl>
        <TextField
          value={buyQuantity}
          label={`Buy Quantity`}
          onChange={(e) => setBuyQuantity(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
        />
        <Stack spacing={2}>
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
        </Stack>
        <Stack spacing={1}>
          <TextField
            value={config.PriceAnomalyAlert}
            label={`Price Anomaly Alert`}
            onChange={(e) => setConfig({ ...config, PriceAnomalyAlert: +e.target.value })}
            InputProps={{ startAdornment: <InputAdornment position="start">%</InputAdornment> }}
          />
          <Select
            value={[!!config.BuyDumps, !!config.SellPumps].toString()}
            onChange={(e) => {
              const [buyDumps, sellPumps] = e.target.value.split(`,`)
              setConfig({
                ...config,
                BuyDumps: buyDumps === `true`,
                SellPumps: sellPumps === `true`,
              })
            }}
          >
            <MenuItem value={[false, false].toString()}>No Action</MenuItem>
            <MenuItem value={[true, false].toString()}>Buy Dumps</MenuItem>
            <MenuItem value={[false, true].toString()}>Sell Pumps</MenuItem>
            <MenuItem value={[true, true].toString()}>Buy Dumps & Sell Pumps</MenuItem>
          </Select>
        </Stack>
        {switchers(config, setConfig)}
        {autonomousTrading(config, setConfig)}
        {scoreThresholdSelector(config, setConfig)}
        <TextField
          value={newFbURL}
          label={`Firebase URL`}
          onChange={(e) => setNewFbURL(e.target.value)}
          sx={{ maxWidth: `389px` }}
          helperText={`Firebase Realtime Database can be used as a persistent storage. Provide the URL to seamlessly switch to it. Remove the URL to switch back to the built-in Google Apps Script storage. Your data won't be lost.`}
        />
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
        {error && <Alert severity="error">{error.toString()}</Alert>}
      </Stack>
    </Box>
  )
}

function switchers(
  config: Config,
  setConfig: (value: ((prevState: Config) => Config) | Config) => void,
) {
  return (
    <Stack>
      <FormControlLabel
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
    </Stack>
  )
}

const scoreSelectorCaption: { [key in ScoreSelectivityKeys]: string } = {
  EXTREME: `Best for manual trading. Reliable score starts at ~15 points.`,
  HIGH: `Best for manual or supervised autonomous trading. Reliable score starts at ~30 points.`,
  MODERATE: `Best for unsupervised fully-autonomous trading. Reliable score starts at ~90 points.`,
  MINIMAL: `Best for manual or supervised autonomous trading. Reliable score starts at ~210 points.`,
}

function scoreThresholdSelector(config: Config, setConfig: (config: Config) => void) {
  return (
    <FormControl sx={{ maxWidth: cardWidth }}>
      <FormLabel>Score Selectivity</FormLabel>
      <RadioGroup
        value={config.ScoreSelectivity}
        onChange={(e) =>
          setConfig({ ...config, ScoreSelectivity: e.target.value as ScoreSelectivityKeys })
        }
      >
        {enumKeys<ScoreSelectivityKeys>(ScoreSelectivity).map((key) => (
          <FormControlLabel
            key={key}
            labelPlacement="end"
            value={key}
            control={<Radio size={`small`} color={selectivityColorMap[key]} />}
            label={
              <Box sx={{ lineHeight: `1` }}>
                <Typography marginBottom={`-4px`}>{capitalizeWord(key)}</Typography>
                <Typography variant={`caption`}>{scoreSelectorCaption[key]}</Typography>
              </Box>
            }
          />
        ))}
      </RadioGroup>
    </FormControl>
  )
}

function autonomousTrading(config: Config, setConfig: (config: Config) => void) {
  return (
    <FormControl sx={{ paddingRight: `28px` }}>
      <FormLabel>Autonomous Trading</FormLabel>
      <Slider
        sx={{ marginLeft: `10px` }}
        value={config.AutoTradeBestScores}
        onChange={(e, value) =>
          setConfig({ ...config, AutoTradeBestScores: value as AutoTradeBestScores })
        }
        step={null}
        min={0}
        max={10}
        marks={enumKeys<string>(AutoTradeBestScores).map((key) => ({
          value: AutoTradeBestScores[key],
          label: capitalizeWord(key),
        }))}
      />
    </FormControl>
  )
}
