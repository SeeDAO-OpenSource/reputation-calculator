require("dotenv").config()
const { ethers } = require("ethers")
const { abi } = require("./abi.json")
const { sgnabi } = require("./sgn.json")

const FILE_TOKEN_HOLDERS = "./tokenholders/season3.csv"

// SCR Contracts
const CONTRACT_SCR = "0xc74DEE15a4700D5df797bDD3982EE649A3Bb8c6C"
const TOKEN_SGN = "0x23fDA8a873e9E46Dbe51c78754dddccFbC41CFE1"
const season = Number(process.env.CURRENT_SEASON)
const esRequire = Number(process.env.SEASON_NODE_ES_REQUIRE)
const seasonRequire = Number(process.env.SEASON_NODE_SEASON_REQUIRE)
const sgnRequire = Number(process.env.SEASON_NODE_SGN_REQUIRE)

// Load holders
const fs = require("fs")
const csv = require("csv-parser")
const now = new Date()
var writter = fs.createWriteStream(
  `./Reputations_${now.getUTCFullYear()}-${
    now.getUTCMonth() + 1
  }-${now.getUTCDate()}.csv`,
  {
    flags: "a"
  }
)

writter.on("finish", function () {
  console.log("Done.")
})

writter.on("end", function () {
  writter.end()
})

writter.on("error", function (err) {
  console.log(err.stack)
})

async function main(holders) {
  const provider = new ethers.InfuraProvider(
    process.env.ETHEREUM_NETWORK,
    process.env.INFURA_API_KEY
  )
  const signer = new ethers.Wallet(process.env.SIGNER_PRIVATE_KEY, provider)
  const contract = new ethers.Contract(CONTRACT_SCR, abi, signer)
  const sgn = new ethers.Contract(TOKEN_SGN, sgnabi, signer)

  let records = []
  for (let i = 0; i < holders.length; i++) {
    console.log(
      `calculating... ${i + 1}/${holders.length} (${
        Math.floor((10000 * (i + 1)) / holders.length) / 100
      }%)`
    )
    const holder = holders[i]
    let decays = []
    let gains = []
    let last = 0
    for (let j = 1; j < season; j++) {
      const decay = season - j
      const value = await contract.balanceOfAt(holder, j)
      const balance = Number(ethers.formatEther(value))
      const diff = Math.round(10000 * (balance - last)) / 10000
      const eff = diff * Math.pow(2, -decay)
      gains.push(diff)
      decays.push(eff)
      last = balance + 0.0
    }
    const value = await contract.balanceOf(holder)
    const balance = Number(ethers.formatEther(value))
    const diff = Math.round(10000 * (balance - last)) / 10000
    gains.push(diff)
    decays.push(diff)
    const sgns = Number(await sgn.balanceOf(holder))

    records.push({
      holder,
      decays,
      gains,
      sgns
    })
  }

  let title = `HolderAddress,isS${season}Node,ES>=${esRequire},S${
    season - 1
  }>=${seasonRequire},SGN>=${sgnRequire},EffectiveScore,TotalScore,SGN,`
  for (let i = season; i > 0; i--) {
    const distance = season - i
    const decay = 100 - Math.round(10000 * Math.pow(2, -distance)) / 100
    if (i - 1 > 0) {
      title += `S${i - 1} (Decay ${decay}%),`
    } else {
      title += `before S1 (Decay ${decay}%),`
    }
  }

  for (let i = season; i > 0; i--) {
    const distance = season - i
    const decay = Math.round(10000 * Math.pow(2, -distance)) / 100
    if (i - 1 > 0) {
      title += `S${i - 1},`
    } else {
      title += `before S1,`
    }
  }
  let text = `${title}\n`

  for (let i = 0; i < records.length; i++) {
    const record = records[i]
    let effectiveScores = record.decays.reduce((a, b) => {
      return a + b
    })
    let totalScores = record.gains.reduce((a, b) => {
      return a + b
    })
    const esPass = effectiveScores >= esRequire ? true : false
    const seasonPass = record.gains[record.gains.length - 1] >= seasonRequire ? true : false
    const sgnPass = record.sgns >= sgnRequire ? true : false
    const isNode = esPass && seasonPass && sgnPass ? true : false
    let str = `${record.holder},${isNode},${esPass},${seasonPass},${sgnPass},${effectiveScores},${totalScores},${record.sgns},`
    for (let j = record.decays.length; j > 0; j--) {
      str += `${record.decays[j - 1]},`
    }
    for (let j = record.gains.length; j > 0; j--) {
      str += `${record.gains[j - 1]},`
    }
    text += `${str}\n`
  }
  writter.write(text)
}

let holders = []
fs.createReadStream(FILE_TOKEN_HOLDERS)
  .pipe(csv())
  .on("data", (data) => {
    try {
      holders.push(data.HolderAddress)
    } catch (err) {
      console.log(err)
    }
  })
  .on("end", () => {
    main(holders)
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error)
        process.exit(1)
      })
  })
