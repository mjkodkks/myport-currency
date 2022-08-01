// deno-lint-ignore-file no-explicit-any
import { Application, Router } from "https://deno.land/x/oak@v10.6.0/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import "https://deno.land/x/dotenv@v3.2.0/load.ts";
import { cron, daily } from "https://deno.land/x/deno_cron@v1.0.0/cron.ts";

const port = Number.parseInt(Deno.env.get("PORT") || "8080") ;
const app = new Application();

const router = new Router();
let number = 0
const baseCurrency = ['usd', 'thb']
const apiKey = Deno.env.get("API_KEY")
let currency: {
    date: string
    [key:string]: any
}[] = []
const useOfficial = false

async function init() {
    number += 1
    const promiseCall = []
    if (useOfficial) {
        for (let i = 0; i < baseCurrency.length; i++) {
            for (let j = 0; j < baseCurrency.length; j++) {
                if (baseCurrency[i] !== baseCurrency[j]) {
                    const header = {
                        headers: {
                            apiKey: apiKey ? apiKey : ''
                        },
                    }
                    const url = `https://api.apilayer.com/fixer/latest?base=${baseCurrency[i]}&symbols=${baseCurrency[j]}`
                    const res = await fetch(url, header).then(response => response.json())
                    promiseCall.push(res)
                }
            }
        }
    } else {
        for (let i = 0; i < baseCurrency.length; i++) {
            const url = `https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/${baseCurrency[i]}.json`
            const res = await fetch(url).then(response => response.json())
            promiseCall.push(res)
        }
    }
    const data = await Promise.all(promiseCall)
    const mapResponse = useOfficial ? data.map(m => {
        const template:{[key:string]:any} = {}
        template['date'] = new Date().toLocaleDateString('fr-CA')
        template[m.base] = toLowerKeys(m.rates)
        return toLowerKeys(template)
    }) : data
    console.log(mapResponse)
    currency = mapResponse
    return mapResponse
}

// for lower Key
function toLowerKeys(obj: {[key:string]: any}) {
  return Object.keys(obj).reduce((accumulator, key) => {
    accumulator[key.toLowerCase()] = obj[key];
    return accumulator;
  }, {} as {[key:string]: any});
}

async function heartbeat() {
    const res = await fetch('https://currency-myport.deno.dev/heartbeat')
    console.log(res)
    return res
}

// test cron job every min
cron('* * * * *', () => {
    console.log(`[TestCron] updated at : ${new Date()}`)
});

// update everyday at 23:00 
cron('0 23 * * *', async () => {
    await init();
    console.log(`[Update] updated at : ${new Date()}`)
});

router.get("/", async (ctx) => {
    number += 1
    ctx.response.body = currency;
    console.log(number)
    if (currency.length) {
        ctx.response.body = currency;
    } 
    else {
        await init()
        ctx.response.body = currency;
    }
});

router.get("/init", async (ctx) => {
    await init()
    ctx.response.body = {
        text: 'Success Init',
        currency
    };
});

app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener("listen", () => {
    console.log(`Listening on localhost:${port}`);
});

app.addEventListener("error", () => {
    console.log(`Error case`);
});

await app.listen({ port });