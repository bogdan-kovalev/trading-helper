import * as React from "react"
import { useEffect } from "react"
import Tabs from "@mui/material/Tabs"
import Tab from "@mui/material/Tab"
import Box from "@mui/material/Box"
import {
  Alert,
  createTheme,
  CssBaseline,
  LinearProgress,
  ThemeProvider,
  Typography,
  useMediaQuery,
} from "@mui/material"
import { Settings } from "./components/Settings"
import { Info } from "./components/Info"
import { Assets } from "./components/Assets"
import { TabPanel } from "./components/TabPanel"
import { Config } from "../gas/Store"
import { InitialSetup } from "./components/InitialSetup"
import { Scores } from "./components/Scores"

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  }
}

export default function App() {
  const [value, setValue] = React.useState(0)
  const handleChange = (e: React.SyntheticEvent, v: number) => setValue(v)

  const mode = useMediaQuery(`(prefers-color-scheme: dark)`)
  const theme = React.useMemo(
    () => createTheme({ palette: { mode: mode ? `dark` : `light` } }),
    [mode],
  )

  const [config, setConfig] = React.useState(null)

  const [initialSetup, setInitialSetup] = React.useState(true)
  const [fetchingData, setFetchingData] = React.useState(true)
  const [fetchDataError, setFetchDataError] = React.useState(null)

  useEffect(initialFetch, [])
  useEffect(() => {
    // data re-fetch happens only if it is not the initial setup state
    const interval = setInterval(() => !initialSetup && reFetchData(), 10000) // 10 seconds
    return () => clearInterval(interval)
  }, [initialSetup])

  function initialFetch() {
    setFetchingData(true)
    google.script.run
      .withSuccessHandler(handleConfig)
      .withFailureHandler((resp) => {
        setFetchingData(false)
        setInitialSetup(true)
        setFetchDataError(resp.toString())
      })
      .getConfig()
  }

  function handleConfig(cfg: Config) {
    setFetchingData(false)
    if (!cfg || !cfg.KEY || !cfg.SECRET) {
      setInitialSetup(true)
    } else {
      setInitialSetup(false)
    }
    setConfig(cfg)
  }

  function reFetchData() {
    google.script.run
      .withSuccessHandler(handleConfig)
      .withFailureHandler((resp) => setFetchDataError(resp.toString()))
      .getConfig()
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {fetchingData && (
        <Box sx={{ width: `100%` }}>
          <LinearProgress />
        </Box>
      )}
      {fetchDataError && (
        <Alert severity="error">
          <Typography variant="caption">{fetchDataError}</Typography>
          <Typography variant="caption">
            Please check your network connection and that Google Apps Script application is deployed
            and try again.
          </Typography>
        </Alert>
      )}
      {!fetchingData && initialSetup && <InitialSetup config={config} onConnect={initialFetch} />}
      {!fetchingData && !initialSetup && (
        <Box sx={{ width: `100%` }}>
          <Box sx={{ borderBottom: 1, borderColor: `divider` }}>
            <Tabs value={value} onChange={handleChange} centered>
              <Tab label="Assets" {...a11yProps(0)} />
              <Tab label="Info" {...a11yProps(1)} />
              <Tab label="Scores" {...a11yProps(2)} />
              <Tab label="Settings" {...a11yProps(3)} />
            </Tabs>
          </Box>
          <TabPanel value={value} index={0}>
            <Assets config={config} />
          </TabPanel>
          <TabPanel value={value} index={1}>
            <Info />
          </TabPanel>
          <TabPanel value={value} index={2}>
            <Scores config={config} />
          </TabPanel>
          <TabPanel value={value} index={3}>
            <Settings />
          </TabPanel>
        </Box>
      )}
    </ThemeProvider>
  )
}
