import * as React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Padding } from '@mui/icons-material';

function createData(time, fee, events) {
  return {
    time,
    fee,
    events,
  };
}

function Row(props) {
  const { row } = props;
  const [open, setOpen] = React.useState(false);

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {row.time}
        </TableCell>
        <TableCell align="center">{row.fee}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                History
              </Typography>
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <TableRow>
                    <TableCell>TXN HASH</TableCell>
                    <TableCell>TIME</TableCell>
                    <TableCell align="center">SENDER</TableCell>
                    <TableCell align="center">AMOUNT</TableCell> {/* FROM AMOUNT */}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.events.map((event) => (
                    <TableRow key={event.index}>
                      <TableCell component="th" scope="row">
                        {event.transactionHash}
                      </TableCell>
                      <TableCell>{convertTime(event.timestamp)}</TableCell>
                      <TableCell align="center">{event.args.sender}</TableCell>
                      <TableCell align="center">
                        {parseFloat(((event.args.toAmount * 0.0001) * 10 ** -18).toFixed(6))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

const convertTime = (time) => {
  const timestamp = time; // timestamp của ngày 28/07/2021 15:00:00 (giờ GMT+0)
  const date = new Date(timestamp * 1000);

  const options = { timeZone: 'Asia/Bangkok' };
  const dateTimeString = date.toLocaleString('en-US', options);

  return dateTimeString
}

Row.propTypes = {
  row: PropTypes.shape({
    calories: PropTypes.number.isRequired,
    carbs: PropTypes.number.isRequired,
    fat: PropTypes.number.isRequired,
    history: PropTypes.arrayOf(
      PropTypes.shape({
        amount: PropTypes.number.isRequired,
        customerId: PropTypes.string.isRequired,
        date: PropTypes.string.isRequired,
      }),
    ).isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    protein: PropTypes.number.isRequired,
  }).isRequired,
};


export default function CollapsibleTable() {
  const [feeData, setFeeData] = React.useState()
  const [minute, setMinute] = React.useState(15)
  const [token, setToken] = React.useState("USDT")
  const [tokenIsRendered, setTokenIsRendered] = React.useState(true)

  let rows = [];
  const url = `http://127.0.0.1:8000/${token}/event?minute=${minute}`

  React.useEffect(() => {
    var requestOptions = {
      method: 'GET',
      redirect: 'follow'
    };

    fetch(url, requestOptions)
      .then(response => response.text())
      .then(result => {
        setFeeData(JSON.parse(result))
      })
      .catch(error => console.log('error', error));

    setTimeout(() => { setTokenIsRendered(true) }, 500)
  }, [minute, token])

  const blockArray = () => {
    let blockArrays = []

    const initBlockNumber = feeData?.time.from_block
    const endBlockNumber = feeData?.time.to_block
    const initTime = feeData?.time.from_time

    if (minute === 15) {
      var granulartityBlocks = 20
      var timeAdd = 60
    } else if (minute === 60) {
      var granulartityBlocks = 100
      var timeAdd = 300
    } else if (minute === 240) {
      var granulartityBlocks = 300
      var timeAdd = 900
    } else if (minute === 720) {
      var granulartityBlocks = 1200
      var timeAdd = 3600
    }

    let totalFee = 0
    let feeArray = []
    let eventArray = []
    let timeArray = []
    for (let i = 0; i < (endBlockNumber - initBlockNumber) / granulartityBlocks; i++) {
      eventArray.push([])
      let blockArray = []
      for (let j = i * granulartityBlocks; j < (i + 1) * granulartityBlocks; j++) {
        blockArray.push(initBlockNumber + j)
        for (let k = 0; k < feeData?.events.length; k++) {
          if (initBlockNumber + j === feeData?.events[k].blockNumber) {
            totalFee += feeData?.events[k].args.toAmount * 0.0001
            eventArray[i]?.push(feeData?.events[k])
          }
        }
      }
      timeArray.push(initTime + i * timeAdd)
      feeArray.push(totalFee)
      totalFee = 0
      blockArrays.push(blockArray)
      blockArray = []
    }
    return { "blockArrays": blockArrays, "feeArray": feeArray, "eventArray": eventArray, "timeArray": timeArray }
  }

  const createRows = () => {
    for (let i = 0; i < blockArray().blockArrays?.length; i++) {
      rows.push(createData(`${convertTime(blockArray().timeArray[i])}`, parseFloat((blockArray().feeArray[i] * 10 ** -18).toFixed(6)), blockArray().eventArray[i].slice(-5)))
    }
  }

  createRows()
  const handleChangeGranularities = (e) => {
    setMinute(parseInt(e.target.value))
  }

  const handleChangeTokens = (e) => {
    setToken(e.target.value)
    setTokenIsRendered(false)
  }

  console.log(token, feeData);

  return (
    <TableContainer component={Paper}>
      <Table aria-label="collapsible table">
        <TableHead>
          <TableRow>
            <TableCell>
              <div>
                <select name="collapsibleTable" id="collapsibleTable" value={minute} onChange={handleChangeGranularities}>
                  <option value="15">15 minute</option>
                  <option value="60">1 hour</option>
                  <option value="240">4 hours</option>
                  <option value="720">12 hours</option>
                </select>
                <select name="collapsibleTable" id="collapsibleTable" value={token} onChange={handleChangeTokens} style={{ marginLeft: "5%" }}>
                  <option value="USDT">USDT</option>
                  <option value="USDC">USDC</option>
                  <option value="BUSD">BUSD</option>
                  <option value="DAI">DAI</option>
                </select>
              </div>
            </TableCell>
            <TableCell align="left" style={{ fontWeight: "700", paddingLeft: "70px" }}>TIME</TableCell>
            <TableCell align="center" style={{ fontWeight: "700" }}>FEE</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length > 10 && rows.length < 20 && token === feeData.token ? rows.map((row) => (
            <Row key={row.index} row={row} />
          )) : <div style={{ padding: "20px" }}>loading...</div>}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
