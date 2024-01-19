//require the mysql package and create a MySQL connection
const mysql = require('mysql2'); //mysql

//import dotenv from 'dotenv'
const dotenv = require('dotenv');
dotenv.config()

//import bcrypt from 'bcryptjs'
//const bcrypt = require('bcrypt');

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

//------EVENTSMODELS------
exports.getEventsByUserId = (userId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT id, type, is_read, DATE_FORMAT(created_at, "%Y-%m-%d %H:%i:%s") AS created_at, summary, image \
    FROM events WHERE userId = ?\
    ORDER BY id DESC';
    connection.query(query, userId, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

exports.getEventsById = (eventId, senderId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM events WHERE id = ? AND userId = ?';
    connection.query(query, [eventId, senderId], (error, results) => {
      if (error) {
        reject(error);
      } else {
         //console.log(results);
        resolve(results);
      }
    });
  });
};

exports.insertEvent = (userId, senderPicture, senderName, event) => {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO events (userId, type, image, summary, is_read)\
    VALUES (?, ?, ?, ?, ?);';
    connection.query(query, [userId, 'friend_request', senderPicture, `${senderName} ${event}`, false ], (error, results) => {
      if (error) {
        reject(error);
      } else {
        console.log('Event inserted successfully');
        resolve(results);
      }
    });
  });
};

exports.updateEventsIsRead = (status, eventId) => {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE events SET is_read = ? WHERE id = ?';
    connection.query(query, [status, eventId], (error, results) => {
      if (error) {
        reject(error);
      } else {
        console.log('Event updated successfully');
        resolve(results);
      }
    });
  });
};
