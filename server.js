const http = require('http');
const fs = require("fs");
const pug = require('pug');
const compiledStats = pug.compileFile('stats.pug');

let vendorArray = [];

//read JSON files, store vendor information in vendorArray
fs.readdir("./vendors", function(err, data){
    if(err){
        console.log("error");
        return;
    }
    //let vendorArray = [];
    data.forEach(file => {
        let x = require("./vendors/" + file);
        vendorArray.push(x);
    });
    saveVendorData(vendorArray);
});

//store vendor objects from JSON, can update later on the server side
function saveVendorData(vendorData){
    vendorArray = vendorData;
}

//store vendor stats (for stats page) here, initialize default values.
let vendorStats = {
    "Staples": {numOfOrders: 0, totalsOfOrders: [], avgTotal: 0, qtyPerItem: {}, mostPopular: "n/a"},
    "Indigo": {numOfOrders: 0, totalsOfOrders: [], avgTotal: 0, qtyPerItem: {}, mostPopular: "n/a"},
    "Grand and Toy": {numOfOrders: 0, totalsOfOrders: [], avgTotal: 0, qtyPerItem: {}, mostPopular: "n/a"}
};

//create server
const server = http.createServer(function (request, response){
    console.log(request.url);

    if(request.method === "GET"){
        if(request.url == "/"){
            //load order page
            fs.readFile("orderform.html", function(err, data){
                if(err){
                    response.statusCode = 500;
                    response.write("Server error.");
                    response.end();
                    return;
                }
                response.statusCode = 200;
                response.setHeader("Content-Type", "text/html");
                response.write(data);
                response.end();
            });
        }
        else if(request.url == "/stats.pug"){
            //load stats page, send information for each vendor
            let data = compiledStats({
                grandNumOrders: vendorStats['Grand and Toy'].numOfOrders,
                grandAvgTotal: vendorStats['Grand and Toy'].avgTotal.toFixed(2),
                grandPopular: vendorStats['Grand and Toy'].mostPopular,

                indigoNumOrders: vendorStats['Indigo'].numOfOrders,
                indigoAvgTotal: vendorStats['Indigo'].avgTotal.toFixed(2),
                indigoPopular: vendorStats['Indigo'].mostPopular,

                staplesNumOrders: vendorStats['Staples'].numOfOrders,
                staplesAvgTotal: vendorStats['Staples'].avgTotal.toFixed(2),
                staplesPopular: vendorStats['Staples'].mostPopular,
            });
            response.statusCode = 200;
            response.setHeader("Content-Type", "text/html");
            response.end(data);
        }
        else if(request.url === "/client.js"){
            fs.readFile("client.js", function(err, data){
                if(err){
                    response.statusCode = 500;
                    response.write("Server error.");
                    response.end();
                    return;
                }
                response.statusCode = 200;
                response.setHeader("Content-Type", "application/javascript");
                response.write(data);
                response.end();
            });
        } 
        else if(request.url === "/styles.css"){
            fs.readFile("styles.css", function(err, data){
                if(err){
                    response.statusCode = 500;
                    response.write("Server error.");
                    response.end();
                    return;
                }
                response.statusCode = 200;
                response.setHeader("Content-Type", "text/css");
                response.write(data);
                response.end();
            });
        }
        else if(request.url === "/add.png"){
            fs.readFile("add.png", function(err, data){
                if(err){
                    response.statusCode = 500;
                    response.write("Server error.");
                    response.end();
                    return;
                }
                response.statusCode = 200;
                response.setHeader("Content-Type", "image/png");
                response.write(data);
                response.end();
            });
        }
        else if(request.url === "/remove.png"){
            fs.readFile("remove.png", function(err, data){
                if(err){
                    response.statusCode = 500;
                    response.write("Server error.");
                    response.end();
                    return;
                }
                response.statusCode = 200;
                response.setHeader("Content-Type", "image/png");
                response.write(data);
                response.end();
            });
        }
        //send vendor data to client
        else if(request.url === "/vendors"){
           response.statusCode = 200;
           response.write(JSON.stringify(vendorArray));
           response.end();
        } 
    }
    else if(request.method === "POST"){
        if(request.url === "/order"){
            //read order information sent by client
            let body = "";
			request.on('data', (chunk) => {
				body += chunk;
			});
			request.on('end', () => {
                order = body;
                //call a function that will update stats by using this data
                updateOrderStats(JSON.parse(order));
			})
			response.statusCode = 200;
			response.end();
        }
        else if(request.url === "/addToCategory"){
            //read item information sent by client
            let body = "";
			request.on('data', (chunk) => {
				body += chunk;
			});
			request.on('end', () => {
                //call function that updates the category
                updateCategory(JSON.parse(body));
			})
		
			response.statusCode = 200;
			response.end();
        }
    }
});

//update vendor order stats
function updateOrderStats(orderData){
    //orderData[0] contains the name of the vendor
    let vend = vendorStats[orderData[0]];

    //update number of orders
    vend.numOfOrders++;
    vend.totalsOfOrders.push(parseInt(orderData[2]));

    //re-compute average of totals
    let average = vend.totalsOfOrders.reduce((a, b) => a + b, 0) / vend.totalsOfOrders.length;
    vend.avgTotal = average;

    //update the quantyPerItem object that has key:value pairs of item id : quantity bought
    for (let [key, value] of Object.entries(orderData[1])) {
        if(key in vend.qtyPerItem){
            vend.qtyPerItem[key] += value;
        }
        else{
            vend.qtyPerItem[key] = value;
        }
    }
    //use helper function to find and update most popular item
    vend.mostPopular = findPopular(vend.qtyPerItem, orderData);
}

//return most popular item name
function findPopular(qtyItems, order){
    if(Object.keys(qtyItems).length == 0){
        return "n/a";
    }
    
    //find key with highest value
    let maxKey = Object.keys(qtyItems).reduce(function(a, b){ return qtyItems[a] > qtyItems[b] ? a : b });

    //find the name of the object at maxKey
    let index;
    if(order[0] == 'Grand and Toy'){
        index = 0;
    } else if(order[0] == 'Indigo'){
        index = 1;
    } else if(order[0] == 'Staples'){
        index = 2;
    } else{
        return "n/a";
    }

    let maxItemName = "n/a";
    for (let [category, item] of Object.entries(vendorArray[index].supplies)) {
        for (let [key, value] of Object.entries(item)) {
            if(key == maxKey){
                maxItemName = value.name;
            }
        }
    }

    return maxItemName;
}

//add the item to the category
function updateCategory(itemData){
    //find the correct vendor to update in vendor array
    let vend = vendorArray.find(vendor => vendor.name === itemData.vendor);

    let catName = itemData.category;
    let idOfNew = vend.items;

    //add the item to the category
    vend.supplies[catName][idOfNew] = {"name":itemData.name,"description":"added by user","stock":itemData.stock,"price":itemData.price}
    vend.items++;
}
server.listen(3000);
console.log('Server running at http://127.0.0.1:3000/');