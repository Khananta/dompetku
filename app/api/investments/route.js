import { NextResponse } from "next/server";

// Fallback jika API eksternal down/timeout
const FALLBACK_DATA = {
  timestamp: new Date().toISOString(),
  marketStatus: "Buka (Sesi Reguler)",
  indices: {
    ihsg: {
      symbol: "^JKSE",
      name: "IHSG (Indeks Gabungan)",
      price: 7285.45,
      change: 32.18,
      changePercent: 0.44,
      high: 7310.2,
      low: 7255.8,
      volume: "18.4 T",
    },
    gold: {
      symbol: "XAU/IDR",
      name: "Emas Antam (1 Gram)",
      price: 2785000,
      buybackPrice: 2540000,
      change: 15000,
      changePercent: 0.54,
      high: 2810000,
      low: 2760000,
      unit: "/gram",
    },
    usdIdr: {
      symbol: "USD/IDR",
      name: "Kurs Dolar AS",
      price: 16480,
      change: 25,
      changePercent: 0.15,
    },
  },
  stocks: [
    {
      code: "BBCA",
      name: "Bank Central Asia Tbk",
      sector: "Keuangan",
      price: 10450,
      change: 150,
      changePercent: 1.46,
      high: 10500,
      low: 10325,
      volume: "78.4M",
      pe: 22.4,
      sparkline: [10250, 10300, 10275, 10350, 10400, 10375, 10450],
    },
    {
      code: "BBRI",
      name: "Bank Rakyat Indonesia Tbk",
      sector: "Keuangan",
      price: 5025,
      change: -50,
      changePercent: -0.98,
      high: 5125,
      low: 4990,
      volume: "142.1M",
      pe: 12.8,
      sparkline: [5150, 5100, 5075, 5125, 5050, 5000, 5025],
    },
    {
      code: "BMRI",
      name: "Bank Mandiri Tbk",
      sector: "Keuangan",
      price: 6725,
      change: 75,
      changePercent: 1.13,
      high: 6775,
      low: 6650,
      volume: "65.3M",
      pe: 11.6,
      sparkline: [6600, 6650, 6625, 6675, 6700, 6680, 6725],
    },
    {
      code: "TLKM",
      name: "Telkom Indonesia Tbk",
      sector: "Infrastruktur",
      price: 3120,
      change: 40,
      changePercent: 1.3,
      high: 3150,
      low: 3080,
      volume: "88.9M",
      pe: 14.2,
      sparkline: [3050, 3080, 3060, 3100, 3090, 3110, 3120],
    },
    {
      code: "ASII",
      name: "Astra International Tbk",
      sector: "Industri",
      price: 5200,
      change: -25,
      changePercent: -0.48,
      high: 5275,
      low: 5175,
      volume: "42.5M",
      pe: 7.8,
      sparkline: [5300, 5250, 5225, 5250, 5200, 5190, 5200],
    },
    {
      code: "BBNI",
      name: "Bank Negara Indonesia Tbk",
      sector: "Keuangan",
      price: 5450,
      change: 100,
      changePercent: 1.87,
      high: 5500,
      low: 5375,
      volume: "38.2M",
      pe: 9.8,
      sparkline: [5300, 5350, 5325, 5400, 5380, 5420, 5450],
    },
    {
      code: "AMMN",
      name: "Amman Mineral Internasional Tbk",
      sector: "Bahan Baku",
      price: 11200,
      change: 225,
      changePercent: 2.05,
      high: 11350,
      low: 10975,
      volume: "52.4M",
      pe: 45.1,
      sparkline: [10800, 10950, 11000, 10900, 11100, 11050, 11200],
    },
    {
      code: "GOTO",
      name: "GoTo Gojek Tokopedia Tbk",
      sector: "Teknologi",
      price: 68,
      change: 2,
      changePercent: 3.03,
      high: 70,
      low: 66,
      volume: "1.2B",
      pe: -15.4,
      sparkline: [65, 66, 65, 67, 66, 67, 68],
    },
  ],
  mutualFunds: [
    {
      code: "SUCOR-MM",
      name: "Sucorinvest Sharia Money Market Fund",
      manager: "Sucor Asset Management",
      type: "Pasar Uang",
      risk: "Rendah",
      nav: 1582.4,
      change: 0.25,
      changePercent: 0.02,
      return1Y: 6.24,
      return3Y: 19.8,
      aum: "4.8 T",
      minBuy: 10000,
      sparkline: [1570, 1572, 1574, 1577, 1579, 1581, 1582.4],
    },
    {
      code: "BATAVIA-KAS",
      name: "Batavia Dana Kas Maxima",
      manager: "Batavia Prosperindo Aset Manajemen",
      type: "Pasar Uang",
      risk: "Rendah",
      nav: 1748.2,
      change: 0.22,
      changePercent: 0.01,
      return1Y: 5.78,
      return3Y: 18.2,
      aum: "8.2 T",
      minBuy: 10000,
      sparkline: [1735, 1738, 1740, 1742, 1745, 1746, 1748.2],
    },
    {
      code: "MANULIFE-OBL",
      name: "Manulife Obligasi Unggulan Kelas A",
      manager: "Manulife Aset Manajemen",
      type: "Pendapatan Tetap",
      risk: "Sedang",
      nav: 3245.8,
      change: 4.8,
      changePercent: 0.15,
      return1Y: 7.42,
      return3Y: 22.4,
      aum: "3.5 T",
      minBuy: 50000,
      sparkline: [3200, 3215, 3210, 3225, 3230, 3240, 3245.8],
    },
    {
      code: "SUCOR-STABLE",
      name: "Sucorinvest Stable Fund",
      manager: "Sucor Asset Management",
      type: "Pendapatan Tetap",
      risk: "Sedang",
      nav: 2895.1,
      change: 3.5,
      changePercent: 0.12,
      return1Y: 7.95,
      return3Y: 25.1,
      aum: "9.6 T",
      minBuy: 100000,
      sparkline: [2860, 2870, 2865, 2880, 2888, 2892, 2895.1],
    },
    {
      code: "SCHRODER-PRESTASI",
      name: "Schroder Dana Prestasi Plus",
      manager: "Schroder Investment Management",
      type: "Saham",
      risk: "Tinggi",
      nav: 32680.0,
      change: 245.0,
      changePercent: 0.75,
      return1Y: 9.85,
      return3Y: 28.6,
      aum: "5.1 T",
      minBuy: 100000,
      sparkline: [31800, 32100, 31950, 32300, 32450, 32550, 32680],
    },
    {
      code: "ASHMORE-PROGRESS",
      name: "Ashmore Dana Progresif Nusantara",
      manager: "Ashmore Asset Management",
      type: "Saham",
      risk: "Tinggi",
      nav: 1845.5,
      change: 18.2,
      changePercent: 1.0,
      return1Y: 11.2,
      return3Y: 31.4,
      aum: "2.8 T",
      minBuy: 100000,
      sparkline: [1790, 1810, 1805, 1825, 1830, 1835, 1845.5],
    },
  ],
  crypto: [
    {
      code: "BTC",
      name: "Bitcoin",
      symbol: "BTC/IDR",
      price: 1450200000,
      changePercent: -0.82,
      high: 1475000000,
      low: 1438000000,
      volume: "420.5 T",
      sparkline: [1420000000, 1445000000, 1430000000, 1460000000, 1455000000, 1468000000, 1450200000],
    },
    {
      code: "ETH",
      name: "Ethereum",
      symbol: "ETH/IDR",
      price: 42180000,
      changePercent: -1.09,
      high: 43200000,
      low: 41850000,
      volume: "185.2 T",
      sparkline: [41500000, 42300000, 42000000, 42800000, 42500000, 42400000, 42180000],
    },
    {
      code: "SOL",
      name: "Solana",
      symbol: "SOL/IDR",
      price: 1835000,
      changePercent: 2.45,
      high: 1860000,
      low: 1780000,
      volume: "65.4 T",
      sparkline: [1750000, 1780000, 1770000, 1810000, 1800000, 1825000, 1835000],
    },
    {
      code: "BNB",
      name: "BNB (Binance)",
      symbol: "BNB/IDR",
      price: 9480000,
      changePercent: 0.65,
      high: 9600000,
      low: 9380000,
      volume: "24.8 T",
      sparkline: [9300000, 9380000, 9350000, 9420000, 9400000, 9450000, 9480000],
    },
  ],
  commodities: [
    {
      code: "EMAS",
      name: "Emas Batangan Antam",
      unit: "1 Gram",
      price: 2785000,
      buybackPrice: 2540000,
      change: 15000,
      changePercent: 0.54,
      sparkline: [2720000, 2735000, 2750000, 2760000, 2770000, 2775000, 2785000],
    },
    {
      code: "PERAK",
      name: "Perak Murni (Silver)",
      unit: "1 Gram",
      price: 32500,
      buybackPrice: 28400,
      change: 250,
      changePercent: 0.78,
      sparkline: [31200, 31500, 31800, 32000, 32200, 32350, 32500],
    },
  ],
};

export async function GET() {
  try {
    const result = JSON.parse(JSON.stringify(FALLBACK_DATA));

    // 1. Coba ambil data crypto live dari CoinGecko (Gratis, No API Key)
    try {
      const cgRes = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin&vs_currencies=idr&include_24hr_change=true",
        { next: { revalidate: 60 } }
      );
      if (cgRes.ok) {
        const cgData = await cgRes.json();
        if (cgData.bitcoin?.idr) {
          result.crypto[0].price = cgData.bitcoin.idr;
          result.crypto[0].changePercent = Math.round(cgData.bitcoin.idr_24h_change * 100) / 100;
        }
        if (cgData.ethereum?.idr) {
          result.crypto[1].price = cgData.ethereum.idr;
          result.crypto[1].changePercent = Math.round(cgData.ethereum.idr_24h_change * 100) / 100;
        }
        if (cgData.solana?.idr) {
          result.crypto[2].price = cgData.solana.idr;
          result.crypto[2].changePercent = Math.round(cgData.solana.idr_24h_change * 100) / 100;
        }
        if (cgData.binancecoin?.idr) {
          result.crypto[3].price = cgData.binancecoin.idr;
          result.crypto[3].changePercent = Math.round(cgData.binancecoin.idr_24h_change * 100) / 100;
        }
      }
    } catch (e) {
      // Gunakan fallback
    }

    // 2. Coba ambil data saham live dari Yahoo Finance
    try {
      const symbols = ["%5EJKSE", "BBCA.JK", "BBRI.JK", "BMRI.JK", "TLKM.JK", "ASII.JK", "GC=F", "IDR=X"];
      const promises = symbols.map(async (sym) => {
        try {
          const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=5d`, {
            headers: { "User-Agent": "Mozilla/5.0" },
            next: { revalidate: 60 },
          });
          if (res.ok) {
            const data = await res.json();
            const meta = data?.chart?.result?.[0]?.meta;
            const quote = data?.chart?.result?.[0]?.indicators?.quote?.[0];
            return { sym, meta, quote };
          }
        } catch (e) {}
        return null;
      });

      const yfResults = await Promise.all(promises);

      let usdRate = 16480;
      const usdItem = yfResults.find((it) => it?.sym === "IDR=X");
      if (usdItem?.meta?.regularMarketPrice) {
        usdRate = usdItem.meta.regularMarketPrice;
        result.indices.usdIdr.price = Math.round(usdRate);
      }

      yfResults.forEach((item) => {
        if (!item || !item.meta) return;
        const { sym, meta, quote } = item;
        const curPrice = meta.regularMarketPrice;
        const prevClose = meta.previousClose || curPrice;
        const chg = curPrice - prevClose;
        const chgPct = prevClose > 0 ? (chg / prevClose) * 100 : 0;

        if (sym === "%5EJKSE") {
          result.indices.ihsg.price = Math.round(curPrice * 100) / 100;
          result.indices.ihsg.change = Math.round(chg * 100) / 100;
          result.indices.ihsg.changePercent = Math.round(chgPct * 100) / 100;
          if (meta.regularMarketDayHigh) result.indices.ihsg.high = meta.regularMarketDayHigh;
          if (meta.regularMarketDayLow) result.indices.ihsg.low = meta.regularMarketDayLow;
        } else if (sym === "GC=F") {
          // Hitung harga emas ritel Antam per gram real-time
          // 1 troy ounce = 31.1035 gram. Ditambah biaya pencetakan sertifikasi & margin ritel (~15%)
          const rawPerGram = (curPrice * usdRate) / 31.1035;
          const antamPrice = Math.round((rawPerGram * 1.15) / 1000) * 1000;
          const buybackPrice = Math.round((rawPerGram * 1.04) / 1000) * 1000;
          const prevRaw = (prevClose * usdRate) / 31.1035;
          const prevAntam = Math.round((prevRaw * 1.15) / 1000) * 1000;
          const goldChg = antamPrice - prevAntam;

          result.indices.gold.price = antamPrice;
          result.indices.gold.buybackPrice = buybackPrice;
          result.indices.gold.change = goldChg;
          result.indices.gold.changePercent = Math.round(chgPct * 100) / 100;

          const goldCommodity = result.commodities.find((c) => c.code === "EMAS");
          if (goldCommodity) {
            goldCommodity.price = antamPrice;
            goldCommodity.buybackPrice = buybackPrice;
            goldCommodity.change = goldChg;
            goldCommodity.changePercent = Math.round(chgPct * 100) / 100;
          }
        } else if (sym !== "IDR=X") {
          const stockCode = sym.replace(".JK", "");
          const target = result.stocks.find((s) => s.code === stockCode);
          if (target && curPrice) {
            target.price = curPrice;
            target.change = Math.round(chg);
            target.changePercent = Math.round(chgPct * 100) / 100;
            if (meta.regularMarketDayHigh) target.high = meta.regularMarketDayHigh;
            if (meta.regularMarketDayLow) target.low = meta.regularMarketDayLow;
            if (quote?.close && quote.close.length > 2) {
              const validCloses = quote.close.filter((c) => typeof c === "number");
              if (validCloses.length >= 4) {
                target.sparkline = validCloses.slice(-7);
              }
            }
          }
        }
      });
    } catch (e) {
      // Gunakan fallback
    }

    result.timestamp = new Date().toISOString();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(FALLBACK_DATA, { status: 200 });
  }
}
