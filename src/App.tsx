import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import {
  Alert,
  createTheme,
  CssBaseline, LinearProgress,
  ThemeProvider,
  useMediaQuery,
  Typography
} from "@mui/material";
import {Settings} from "./components/Settings";
import {Info} from "./components/Info";
import {Assets} from "./components/Assets";
import {TabPanel} from "./components/TabPanel";
import {TradeMemo} from "../apps-script/TradeMemo";
import {useEffect} from "react";
import {Config} from "../apps-script/Store";
import {InitialSetup} from "./components/InitialSetup";
import {Survivors} from "./components/Survivors";

// @ts-ignore
export const gsr = google.script.run;

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function App() {
  const [value, setValue] = React.useState(0);
  const handleChange = (e: React.SyntheticEvent, v: number) => setValue(v);

  const mode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = React.useMemo(() => createTheme({palette: {mode: mode ? 'dark' : 'light'}}), [mode]);

  const [config, setConfig] = React.useState(null);
  const [trades, setTrades] = React.useState<{ [k: string]: TradeMemo }>({});

  const [initialSetup, setInitialSetup] = React.useState(true);
  const [fetchingData, setFetchingData] = React.useState(true);
  const [fetchDataError, setFetchDataError] = React.useState(null);

  function initialFetch() {
    setFetchingData(true);
    gsr
      .withSuccessHandler((config: Config) => {
        setFetchingData(false);
        setConfig(config);
        if (!config || !config.KEY || !config.SECRET) {
          setInitialSetup(true);
        } else {
          setInitialSetup(false);
          gsr.withSuccessHandler(setTrades).getTrades()
        }
      })
      .withFailureHandler(resp => {
        setFetchingData(false);
        setInitialSetup(true)
        setFetchDataError(resp.toString());
      })
      .getConfig()
  }

  useEffect(initialFetch, []);

  function reFetchData() {
    if (!initialSetup) {
      gsr.withSuccessHandler((config: Config) => {
        setConfig(config);
        gsr.withSuccessHandler(setTrades).getTrades()
      }).getConfig()
    }
  }

  useEffect(() => {
    const interval = setInterval(reFetchData, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [initialSetup]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline/>
      {fetchingData && <Box sx={{width: '100%'}}><LinearProgress/></Box>}
      {fetchDataError && <Alert severity="error">
        <Typography variant="caption">{fetchDataError}</Typography>
        <Typography variant="caption">Please check your Google Apps Script application is deployed and try again.</Typography>
      </Alert>}
      {!fetchingData && initialSetup && <InitialSetup config={config} onConnect={initialFetch}/>}
      {!fetchingData && !initialSetup &&
        <Box sx={{width: '100%'}}>
          <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
            <Tabs value={value} onChange={handleChange} centered allowScrollButtonsMobile={true}>
              <Tab label="Assets" {...a11yProps(0)} />
              <Tab label="Settings" {...a11yProps(1)} />
              <Tab label="Info" {...a11yProps(2)} />
              <Tab label="Survivors" {...a11yProps(3)} />
            </Tabs>
          </Box>
          <TabPanel value={value} index={0}><Assets config={config} trades={trades}/></TabPanel>
          <TabPanel value={value} index={1}><Settings/></TabPanel>
          <TabPanel value={value} index={2}><Info/></TabPanel>
          <TabPanel value={value} index={3}><Survivors/></TabPanel>
        </Box>
      }
    </ThemeProvider>
  );
}
