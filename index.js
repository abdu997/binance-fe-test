(async function () {
    const seriesData = await fetchSeriesData()
    console.log('seriesData: ', seriesData)

    let barsToRender = seriesData
    const canvas = document.getElementById('kline');

    function drawGraph() {
        const ctx = canvas.getContext('2d');
        const canvasW = canvas.width;
        const canvasH = canvas.height;
        ctx.clearRect(0,0, canvasW, canvasH)

        ctx.font = "10px Arial";
        // Draw Y Axis
        ctx.beginPath();
        ctx.fillStyle = "#565d68"
        ctx.moveTo(canvasW * 0.96, canvasH);
        ctx.lineTo(canvasW * 0.96, 0);
        ctx.stroke();

        // Find the highest and lowest numbers in the set
        let highestPrice = 0
        let lowestPrice = Number(barsToRender[0][1])
        for (let bar of barsToRender) {
            for (let feature of bar.slice(1, 4)) {
                highestPrice = Number(feature) > highestPrice ? Number(feature) : highestPrice
                lowestPrice = Number(feature) < lowestPrice ? Number(feature) : lowestPrice
            }
        }

        const margin = (highestPrice - lowestPrice) * 0.1
        const lowerbound = Math.floor(lowestPrice - margin)
        const upperbound = Math.floor(highestPrice + margin)
        const bound = upperbound - lowerbound
        const currencyperunit = bound / canvasH

        // Graph the notches on the axis
        let step = lowerbound
        const interval = Math.floor((upperbound - lowerbound) / 10)
        let num = 0
        for (let i = 1; 0 < i; i -= 0.1) {
            ctx.beginPath();
            ctx.fillStyle = "#565d68"
            ctx.moveTo(canvasW * 0.96, canvasH * i);
            ctx.lineTo(canvasW * 0.97, canvasH * i);
            ctx.stroke();
            ctx.fillText(String(step), canvasW * 0.97, canvasH * (i + 0.01));
            step += interval;
            num++
        }

        // Graph each data item on the canvas
        const width = 7
        let x = 0
        let y, height, color
        for (let bar of barsToRender) {
            // Determine whether the item is green or red
            color = bar[1] < bar[4] ? '#5eba89' : '#ce3d4e'

            // bar rectangle
            y = canvasH - ((bar[1] - lowerbound) / currencyperunit);
            height = ((bar[1] - bar[4]) / bound) * canvasH
            ctx.fillStyle = color
            ctx.fillRect(x, y, width, height);

            // top whisker
            ctx.beginPath();
            ctx.moveTo(x + width * 0.5, canvasH - ((bar[2] - lowerbound) / currencyperunit))
            ctx.lineTo(x + width * 0.5, canvasH - ((bar[3] - lowerbound) / currencyperunit))
            ctx.strokeStyle = color
            ctx.stroke();

            // end of loop interval adjuster
            x += 10
        }
        ctx.closePath();
    }

    subcribe(data => { // data: [time, open, high, low, close]
        console.log('suncribe: ', data)
        if(barsToRender[barsToRender.length - 1][0] === data[0]){
            barsToRender.pop()
        }
        barsToRender.push(data)
        barsToRender = barsToRender.slice(barsToRender.length - 120)
        drawGraph()
    })

    // [time, open, high, low, close][]
    function fetchSeriesData() {
        return new Promise((resolve, reject) => {
            fetch('https://www.binance.com/api/v1/klines?symbol=BTCUSDT&interval=1m')
                .then(async res => {
                    const data = await res.json()
                    const result = data.map(([time, open, high, low, close]) => [time, open, high, low, close])
                    resolve(result)
                })
                .catch(e => reject(e))
        })
    }

    function subcribe(success) {
        try {
            const socket = new WebSocket('wss://stream.binance.com/stream?streams=btcusdt@kline_1m')
            socket.onmessage = e => {
                const res = JSON.parse(e.data)
                const {
                    t,
                    o,
                    h,
                    l,
                    c
                } = res.data.k
                success([t, o, h, l, c]);
            }
        } catch (e) {
            console.error(e.message)
        }
    }
})()