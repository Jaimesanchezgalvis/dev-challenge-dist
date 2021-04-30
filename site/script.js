let data = new Map();

// connect stomp
var url = "ws://localhost:8011/stomp";
var client = Stomp.client(url);

// called back after the client is connected and authenticated to the STOMP server
var connect_callback = function () {
    let createMapAndRender = function (message) {
        if (message.body) {
            let body = JSON.parse(message.body);
            let midPrice = (body.bestBid + body.bestAsk) / 2;
            let previusData = data.get(body.name);
            data.set(body.name, {
                ...body,
                sparkline: previusData
                    ? {
                        x: [
                            ...previusData.sparkline.x.filter(
                                (item) => Date.now() - item < 30000),
                            Date.now(),
                        ],
                        y: [
                            ...previusData.sparkline.y.filter(
                                (item, i) => Date.now() - previusData.sparkline.x[i] < 30000
                            ),
                            midPrice,
                        ],
                    }
                    : { x: [Date.now()], y: [midPrice] },
            });
            createTable();
        } else {
            alert("got emty message");
        }
    }
    client.subscribe("/fx/prices", createMapAndRender);

};

// display the error´s message header
var error_callback = function (error) {
    console.log("error");
    alert(error.headers.message);
};
var headers = {
    login: "mylogin",
    passcode: " mypasscode",
    // additional header
    "client-id": "my-client-id"
}
// connection and authentication
client.connect(headers, connect_callback)


// createting table rows
function createTableRow(value) {
    const sparkElement = document.createElement("span");
    const sparkline = new Sparkline(sparkElement);
    sparkline.draw(value.sparkline.y);
    let tr = document.createElement("tr");
    let name = document.createElement("th");
    name.textContent = value.name;
    let bestBid = document.createElement("td");
    bestBid.textContent = value.bestBid;
    let bestAsk = document.createElement("td");
    bestAsk.textContent = value.bestAsk;
    let lastChangeBid = document.createElement("td");
    lastChangeBid.textContent = value.lastChangeBid;
    let lastChangeAsk = document.createElement("td");
    lastChangeAsk.textContent = value.lastChangeAsk;
    let trend = document.createElement("td");
    trend.append(sparkElement);
    tr.append(name, bestBid, bestAsk, lastChangeBid, lastChangeAsk, trend);
    return tr;
}



function createTable() {
    let valuearr = [];
    let tbody = document.createElement("tbody");
    tbody.id = "table-body";
    // create an array from map 
    for (let value of data.values()) {
        valuearr.push(value);
    }
    // sort array of objetct
    valuearr.sort(function (a, b) {
        return b.lastChangeBid - a.lastChangeBid;
    });
    valuearr.forEach((value) => {
        tbody.appendChild(createTableRow(value));
    });
    // find tbody from html and repalce with new one 
    let oldTbody = document.getElementById("table-body");
    oldTbody.replaceWith(tbody);
}