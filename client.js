//The drop-down menu
let select = document.getElementById("vendor-select");
//Stores the currently selected vendor index to allow it to be set back when switching vendors is cancelled by user
let currentSelectIndex = select.selectedIndex;
//Stores the current vendor to easily retrieve data. The assumption is that this object is following the same format as the data included above. If you retrieve the vendor data from the server and assign it to this variable, the client order form code should work automatically.
let currentVendor;
//Stored the order data. Will have a key with each item ID that is in the order, with the associated value being the number of that item in the order.
let order = {};
//stores total price of order
let orderTotal;

//get vendor information from server and generate the vendor dropdown, and load all information for vendor
function init() {
	const selListReq = new XMLHttpRequest;
	selListReq.onload = function(){
		let vendorData = JSON.parse(this.responseText);
		document.getElementById("vendor-select").innerHTML = genSelList(vendorData);
		document.getElementById("vendor-select").onchange = selectVendor(vendorData);
		selectVendor(vendorData);
	}
	selListReq.open("GET", "/vendors");
	selListReq.send();
}

//Generate new HTML for a drop-down list containing all vendors.
//arg vendorData contains vendor information received by server side
function genSelList(vendorData) {
	let result = '<select name="vendor-select" id="vendor-select">';
	for(let i = 0; i<vendorData.length; i++){
		result += `<option value="${vendorData[i].name}">${vendorData[i].name}</option>`;
	}
	result += "</select>";
	return result;
}

//Helper function. Returns true if object is empty, false otherwise.
function isEmpty(obj) {
	for (var key in obj) {
		if (obj.hasOwnProperty(key))
			return false;
	}
	return true;
}

//updates vendor information displayed
//vendorData comes from server
function selectVendor(vendorData) {
	let result = true;

	//If order is not empty, confirm the user wants to switch vendors
	if (!isEmpty(order)) {
		result = confirm("Are you sure you want to clear your order and switch vendor?");
	}

	//If switch is confirmed, load the new vendor data
	if (result) {	
		//set currentVendor to waht the user selected
		currentSelectIndex = select.selectedIndex;
		currentVendor = vendorData[currentSelectIndex];

		//Update the page contents to contain the new supply list
		document.getElementById("left").innerHTML = getCategoryHTML(currentVendor);
		document.getElementById("middle").innerHTML = getSuppliesHTML(currentVendor);

		//Clear the current oder and update the order summary
		order = {};
		updateOrder();
		
		//Update the vendor info on the page
		let info = document.getElementById("info");
		let otherInfo = document.getElementById("otherInfo");
		info.innerHTML = "<h1>" + currentVendor.name + "</h1>";
		otherInfo.innerHTML = "<br>Minimum Order: $" + currentVendor.min_order + "<br>Delivery Fee: $" + currentVendor.delivery_fee + "<br><br>";
	} else {
		//If user refused the change of vendor, reset the selected index to what it was before they changed it
		let select = document.getElementById("vendor-select");
		select.selectedIndex = currentSelectIndex;
	}
}

//Given a vendor object, produces HTML for the left column
function getCategoryHTML(vend) {
	let supplies = vend.supplies;
	let result = "<h3>Categories</h3><br>";
	Object.keys(supplies).forEach(key => {
		result += `<a href="#${key}">${key}</a><br>`;
	});

	//add HTML for Add Item to Category section
	result += "<h3>Add Item To Category</h3>";

	//create a dropdown to select a category
	result += `<div id="addItemCategory"><select id="categoryDropdown" class="categoryDropdown">`;
	Object.keys(supplies).forEach(key => {
		result += `<option value="${key}">${key}</option>`;
	})
	result += `</select><br><br>`

	//input fields item name, item price, item stock
	result += `<label for="itemName">Item Name:</label><input type="text" id="catItemName" name="catItemName"><br><br>`;
	result += `<label for="itemPrice">Item Price:</label><input type="text" id="catItemPrice" name="catItemPrice"><br><br>`;
	result += `<label for="itemStock">Item Stock:</label><input type="text" id="catItemStock" name="catItemStock"><br><br>`;

	//button for adding the new item
	result += `<button type="button" id="submit" onclick="addToCategory()">Add New Item</button>`
	result += `</div>`
	return result;
}

//adds the item to category if everything is valid
function addToCategory(){
	//do not allow add to category if the order contains items already
	if (!isEmpty(order)) {
		alert("Order cart must be empty to add an item to a category.");
		return;
	}
	//do some value checking, return and alert user if error
	//check that no field is empty
	if(document.getElementById("catItemName").value == "" || document.getElementById("catItemPrice").value == "" || document.getElementById("catItemStock").value == ""){
		alert("Field cannot be empty");
		return;
	}
	//check that the price is a number greater than 0
	if (document.getElementById("catItemPrice").value < 0 || isNaN(document.getElementById("catItemPrice").value)){
		alert("Invalid Price");
		return;
	}
	//check that the stock is an integer greater than 0
	if (document.getElementById("catItemStock").value < 0 || !Number.isInteger(parseFloat(document.getElementById("catItemStock").value))){
		alert("Invalid Stock");
		return;
	}

	//send this information to the server in the form an object
	let catAddInfo = {
		vendor: currentVendor.name,
		category: document.getElementById("categoryDropdown").options[document.getElementById("categoryDropdown").selectedIndex].text,
		name: document.getElementById("catItemName").value,
		price: document.getElementById("catItemPrice").value,
		stock: document.getElementById("catItemStock").value
	}
	let catAddSend = new XMLHttpRequest;
	catAddSend.onload = function(){
		//console.log(JSON.stringify(order));
	}
	catAddSend.open("POST", "/addToCategory");
	catAddSend.send(JSON.stringify(catAddInfo));

	//alert user
	//update view
	updateDisplay();
	alert("Item added!");
}

//Given a vendor object, produces the supplies HTML for the middle column
function getSuppliesHTML(vend) {
	let supplies = vend.supplies;
	let result = "";
	//For each category in the supply list
	Object.keys(supplies).forEach(key => {
		result += `<b>${key}</b><a name="${key}"></a><br>`;
		//For each item in the category
		Object.keys(supplies[key]).forEach(id => {
			item = supplies[key][id];
			result += `${item.name} (\$${item.price}, stock=${item.stock}) <img src='add.png' style='height:20px;vertical-align:bottom;' onclick='addItem(${item.stock}, ${id})'/> <br>`;
			result += item.description + "<br><br>";
		});
	});
	return result;
}

//Responsible for adding one of the items with given id to the order, updating the summary, and alerting if "Out of stock"
function addItem(stock, id) {
	if (order.hasOwnProperty(id) && (stock == order[id])){
		alert("Out of stock >:C");
		return;
	} else if (order.hasOwnProperty(id)) {
		order[id] += 1;
	} else {
		order[id] = 1;
	}
	updateOrder();
}

//Responsible for removing one of the items with given id from the order and updating the summary
function removeItem(id) {
	if (order.hasOwnProperty(id)) {
		order[id] -= 1;
		if (order[id] <= 0) {
			delete order[id];
		}
	}
	updateOrder();
}

//Reproduces new HTML containing the order summary and updates the page
//This is called whenever an item is added/removed in the order
function updateOrder() {
	let result = "";
	let subtotal = 0;

	//For each item ID currently in the order
	Object.keys(order).forEach(id => {
		//Retrieve the item from the supplies data using helper function
		//Then update the subtotal and result HTML
		let item = getItemById(id);
		subtotal += (item.price * order[id]);
		result += `${item.name} x ${order[id]} (${(item.price * order[id]).toFixed(2)}) <img src='remove.png' style='height:15px;vertical-align:bottom;' onclick='removeItem(${id})'/><br>`;
	});

	//Add the summary fields to the result HTML, rounding to two decimal places
	result += `<br>Subtotal: \$${subtotal.toFixed(2)}<br>`;
	result += `Tax: \$${(subtotal * 0.1).toFixed(2)}<br>`;
	result += `Delivery Fee: \$${currentVendor.delivery_fee.toFixed(2)}<br>`;
	let total = subtotal + (subtotal * 0.1) + currentVendor.delivery_fee;
	orderTotal = subtotal + (subtotal * 0.1) + currentVendor.delivery_fee;
	result += `Total: \$${total.toFixed(2)}<br>`;

	//Decide whether to show the Submit Order button or the "Order X more" label
	if (subtotal >= currentVendor.min_order) {
		result += `<button type="button" id="submit" onclick="submitOrder()">Submit Order</button>`
	} else {
		result += `Add \$${(currentVendor.min_order - subtotal).toFixed(2)} more to reach the minimum order.`;
	}

	document.getElementById("right").innerHTML = result;
}

//submitting the order
function submitOrder() {
	alert("Order placed!");
	//send order information to server
	let infoToSend = [currentVendor.name, order, orderTotal]
	let sendOrderToServer = new XMLHttpRequest;
	sendOrderToServer.onload = function(){
		//console.log(JSON.stringify(order));
	}
	sendOrderToServer.open("POST", "/order");
	sendOrderToServer.send(JSON.stringify(infoToSend));

	//reset order information and refresh the browser
	order = {};
	window.location.reload();
}

//Helper function. Given an ID of an item in the current vendors' supply list, returns that item object if it exists.
function getItemById(id) {
	let categories = Object.keys(currentVendor.supplies);
	for (let i = 0; i < categories.length; i++) {
		if (currentVendor.supplies[categories[i]].hasOwnProperty(id)) {
			return currentVendor.supplies[categories[i]][id];
		}
	}
	return null;
}

//updates the displayed information by taking information from server again
function updateDisplay(){
	const updateListReq = new XMLHttpRequest;
	updateListReq.onload = function(){
		let vendorData = JSON.parse(this.responseText);
		selectVendor(vendorData);
	}
	updateListReq.open("GET", "/vendors");
	updateListReq.send();
}

//event listener to update the display anytime user selects another vendor
document.getElementById("vendor-select").addEventListener("change", updateDisplay);


