import * as React from "react"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Typography from "@mui/material/Typography"
import { f2 } from "trading-helper-lib"
import { cardWidth } from "./Common"

type StableCoinProps = {
  name: string
  balance: number
}

export default function StableCoin({ name, balance }: StableCoinProps) {
  return (
    <>
      <Card sx={{ width: cardWidth }}>
        <CardContent sx={{ ":last-child": { paddingBottom: `16px` } }}>
          <Typography variant="h5" display={`flex`}>
            <span>{name}</span>
            <span style={{ marginLeft: `auto` }}>{f2(balance)}</span>
          </Typography>
        </CardContent>
      </Card>
    </>
  )
}
