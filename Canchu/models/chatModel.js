//require the mysql package and create a MySQL connection
const mysql = require('mysql2'); //mysql

//import dotenv from 'dotenv'
const dotenv = require('dotenv');
dotenv.config()

// Create a MySQL connection
const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,//'canchu_mysql'// 資料庫主機位址
  user: process.env.MYSQL_USER,//'root'// 資料庫使用者名稱
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
});
exports.connection = connection;

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL server');
});

//------CHATMODELS------
//create new message
exports.insertMessage = (message, senderId, receiverId) => {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO chat (message, senderId, receiverId) VALUES (?, ?, ?)';
      connection.query(query, [message, senderId, receiverId], (error, results) => {
        if (error) {
          reject(error);
        }else{
          resolve(results);
        }
      });
    });
};

// Search Keyword
exports.searchByUserIdOrCursor = (userId, receiverId, cursor, limit) => {
    return new Promise((resolve, reject) => {
      let query, params;
      let nextCursor = null;
      //ORDER BY p.id DESC: show newest posts
      if(cursor == undefined){
        //filter by receiverId
        query = 'SELECT c.id, c.message, c.created_at, c.senderId, u.name, u. picture FROM chat c\
        INNER JOIN users u ON u.id = c.senderId\
        WHERE (c.senderId = ? AND c.receiverId = ?) OR (c.senderId = ? AND c.receiverId = ?)\
        ORDER BY c.id DESC LIMIT ?';
        params = [userId, receiverId, receiverId, userId, limit];
      }else{
        //filter by receiverId & cursor
        query = 'SELECT c.id, c.message, c.created_at, c.senderId, u.name, u. picture FROM chat c\
        INNER JOIN users u ON u.id = c.senderId\
        WHERE id < ? AND (c.senderId = ? AND c.receiverId = ?) OR (c.senderId = ? AND c.receiverId = ?)\
        ORDER BY id DESC LIMIT ?';
        params = [cursor, userId, receiverId, receiverId, userId, limit];
      }
      connection.query(query, params, (error, results) => {
          if (error) {
            reject(error);
          } else {
            if (results.length < limit) {
              // No more data
              nextCursor = null;
            } else {
              // If there are more results, update nextCursor
              const lastPostId = results[results.length - 1].id;
              nextCursor = lastPostId;
            }
            //(`nextCursor:${nextCursor}`);
            resolve({ results, nextCursor });
            
          }
        });
      });
  };
  