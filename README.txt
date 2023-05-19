        Author: Saugat Shrestha
Student Number: 101225868

    Program: 2406, Assignment 2
Description: Web page where user can place orders from several vendors. This program stores
             vendor data on the server side, and follows the request-response model.

Design Choices: The vendor data gets read from the JSON files in server.js when the server is loaded.
                The JSON files never get updated. When a user adds a new item to a categroy, the vendor
                object stored in server.js gets updated. Refreshing the browser will not reset the items,
                but reloading the server would remove items added by the user.
                There is a default value for the description of items added to category by the user.
                The user cannot add an item to a category if the order cart is not empty.
                The header bar containing links was coded into every html or pug file.
                
Running the server: From the directory that contains server.js, install pug. 'npm install pug'
                    From the same directory, use 'node server.js' 