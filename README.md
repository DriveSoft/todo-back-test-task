# Todo with JWT authentication

This is a backend project that provides REST API endpoints for managing user accounts and to-do lists.

## Installation

Clone the repository and install the dependencies using ```npm```
```shell
$ git clone https://github.com/DriveSoft/todo-back-test-task.git
$ cd todo-back-test-task
$ npm install
```

## Usage

To start the server, run the following
```shell
$ npm start
```

This will start the server at http://localhost:5000.

## API Endpoints

|Endpoint|Description|
|--------|-----------|
|```/api/todos (GET)```| This endpoint returns a list of all the to-do tasks for the current user. You need to provide access token in a header: ```Authorization: Bearer <token>```|
|```/api/todos (POST)```|This endpoint allows you to create a new to-do task for the current user. You need to provide a ```title``` (string), ```description``` (string), and ```completed``` (boolean) in the request body.|
|```/api/todos/:id (POST)```|This endpoint allows you to update a to-do task with the given ```id```. You need to provide a ```title``` (string), ```description``` (string), and ```completed``` (boolean) in the request body.
|```/api/todos/:id (DELETE)```|This endpoint allows you to delete a to-do task with the given ```id```.
|```/api/users (POST)```|This endpoint allows you to create a new user account. You need to provide an ```email``` (string), ```password``` (string), and ```confirmPassword``` (string) in the request body.
|```/api/users/login (POST)```|This endpoint allows you to log in a user. You need to provide an ```email``` (string) and ```password``` (string) in the request body.
|```/api/users/logout (GET)```|This endpoint allows you to log out a user. You need to send a cookie with the ```refreshToken```. After this, the ```refreshToken``` will be removed from the cookie and the database.
|```/api/users/refreshaccesstoken (GET)```|This endpoint allows you to refresh the access token. You need to send a cookie with the ```refreshToken```. This will generate a new access token.Contributing


## This project is licensed under the MIT License. 

