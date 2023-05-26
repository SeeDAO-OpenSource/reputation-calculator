# 🧮 SeeDAO 声誉计算器

在 SeeDAO 中，你的声誉有两种形式：你获得的总积分，以及有效积分。在日常活动中，总积分在社区内彰显你是第几级的贡献者。

而有效积分透过声誉衰减的方式，会计算出一个避免声誉贵族的数值，这个有效积分会作为治理身份计算的基础，我们以这个数值作为节点判断的依据。

具体计算方式，请参见 [SIP-20: 节点共识大会规则修订版](https://forum.seedao.xyz/thread/v3-40828)

## 查看历史数据

请到 `reputations/` 目录下查看每一季度的统计结果。

## 💡快速开始

1. 下载代码库和安装 (建议 Node.js 14+)

```bash
git clone https://github.com/SeeDAO-OpenSource/reputation-calculator.git
cd seedao-reputation-calculator
npm install
```

2. 编辑环境变量

你可以随意生成一个钱包，然后去 [Infura](https://www.infura.io) 注册，然后创建一个项目，然后将项目的 `API_KEY` 和你钱包的 `private key` 填入到 `.env` 文件中

```js
ETHEREUM_NETWORK= "mainnet"
INFURA_API_KEY="" // 你的 infura api key
SIGNER_PRIVATE_KEY="" // 你申请 infura 的钱包的 private key

CURRENT_SEASON=3 // 现在第几季, 若 S2 积分上链完成, 那这里要填 3
SEASON_NODE_ES_REQUIRE=20000 // 季度的有效积分门槛 (请参考上届节点大会投票结果)
SEASON_NODE_SEASON_REQUIRE=5000 // 季度的当季积分门槛 (请参考上届节点大会投票结果)
SEASON_NODE_SGN_REQUIRE=1 // 要求的 SGN 数量 (原则上是 1)
```

3. 接着到 [Token Score (SCR) - Holders](https://etherscan.io/token/0xc74dee15a4700d5df797bdd3982ee649a3bb8c6c#balances) 右下角 `[ Download: CSV Export ]` 下载当前的 token holders 列表，下载后放到 `tokenholders` 目录下，并到 `index.js` 中修改 `FILE_TOKEN_HOLDERS` 指向新的文件

```js
// index.js

// ....
const { sgnabi } = require("./sgn.json")

const FILE_TOKEN_HOLDERS = "./tokenholders/season3.csv" // <----------- 修改这里
// ....
```

```bash
npm run start

# calculating... 1/300 (0%)
# calculating... 30/300 (10%)
# ... 需要一点时间，大概是 HOLDER 数的 1.2 倍的秒数 (400 个 Holder, 那就大概要 480 秒 = 8 分钟)
```

4. 执行完毕后，你会看到一个档案 `Reputations_20XX-XX-XX.csv` 此即为计算结果，你可以用 Excel 打开，或者用其他工具打开

```csv
HolderAddress,isS3Node,ES>=20000,S2>=5000,SGN>=1,EffectiveScore,TotalScore,SGN,S2 (Decay 0%),S1 (Decay 50%),before S1 (Decay 75%),S2,S1,before S1,
0x01116bff69113dc1125dd9fc465eed55cf32e9ca,false,false,false,false,1027.5,4110,0,0,0,1027.5,0,0,4110,
0x01175ef4738b825cd12f4d1ff2d2904d52144531,true,true,true,true,963045.65,1858767.9,2,389135.9,413003.5,160906.25,389135.9,826007,643625,
0x016df27c5a9e479ab01e3053cd5a1967f96ecd6e,false,false,false,false,2600,2900,0,2300,300,0,2300,600,0,
0x01917dfa012027d59c86250e887a45f6d8f49f6d,false,false,false,false,475.5,1902,0,0,0,475.5,0
...
```

CSV 栏位会自动展延，相应标题也会展延，只需要设定好 `env` 和 `index.js 的 FILE_TOKEN_HOLDERS`，完全一键计算不需要多做思考。

## 🙋 联系方式

如果有任何问题，请到 [SeeDAO Discord](https://discord.com/invite/seedao) 的 `#基础设施` 频道，或 [SeeDAO Telegram](https://t.me/theseedao) 询问。

## ⚠️ 注意事项

[Infura - Rate limits](https://docs.infura.io/infura/networks/ethereum/how-to/secure-a-project/set-rate-limits) 中说明一日可以使用 2 万次，而且 Etherscan 下载的 Token Holders 也只有 10000 个钱包，倘若 SeeDAO 发展到有 10000 人以上具有积分，可能本代码建议的操作流程将会遇到问题。