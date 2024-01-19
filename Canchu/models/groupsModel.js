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

//------GROUPSMODELS------

//create new group
exports.insertGroup = (name, userId) => {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO groups_ (name, userId) VALUES (?, ?)';
    connection.query(query, [name, userId], (error, results) => {
      if (error) {
        reject(error);
      }else{
        resolve(results);
      }
    });
  });
};

//Check Group Id
exports.checkGroupExists = (groupId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM groups_ WHERE id = ?';
    connection.query(query, [groupId], (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

//Group delete
exports.deleteGroup = (groupId, userId) => {
  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM groups_ WHERE id = ? AND userId = ?';
    connection.query(query, [groupId, userId], (error, results) => {
      if (error) {
        reject(error);
      }else{
        resolve(results);
      }
    });
  });
};

//Check membership
exports.checkMembershipStatus =(groupId, userId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT status FROM membership \
    WHERE groupId = ? AND userId = ?';
    connection.query(query, [groupId, userId], (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

//send member request
exports.memberRequest = (groupId, userId, status) => {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO membership (userId, groupId, status) VALUES (?, ?, ?)';
    connection.query(query, [userId, groupId, status], (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

//group pending request
exports.getPending = (groupId, status) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM membership WHERE groupId = ? AND status = ?';
    connection.query(query, [groupId, status], (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

exports.getUserById = (userId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT id, name, picture FROM users WHERE id = ?';
    connection.query(query, userId, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

//agree membershiip
exports.updateMembership = (groupId, applicantId, status) => {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE membership SET status = ? WHERE groupId = ? AND userId = ?';
    connection.query(query, [status, groupId, applicantId], (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

//Check Group Membership
exports.checkMembership = (groupId, userId, ststus) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT COUNT(*) AS count FROM membership WHERE groupId = ? AND userId = ? AND status = ?';
    connection.query(query, [groupId, userId ,ststus], (error, results) => {
      if (error) {
        reject(error);
      } else {
        const count = results[0].count;
        resolve(count);
      }
    });
  });
};

//create new post
exports.insertPost = (groupId, userId, context) => {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO groupPosts (groupId, userId, context) VALUES (?, ?, ?)';
    connection.query(query, [groupId, userId, context], (error, results) => {
      if (error) {
        reject(error);
      }else{
        resolve(results);
      }
    });
  });
};

exports.getPostDetails = (groupId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT u.name, u.picture, p.id, p.userId, DATE_FORMAT(p.created_at, "%Y-%m-%d %H:%i:%s") AS created_at, p.context, p.is_liked, p.like_count, p.comment_count \
    FROM users u \
    INNER JOIN groupPosts p ON u.id = p.userId \
    WHERE p.groupId = ?';
    connection.query(query, groupId, (error, results) => {
      if (error) {
        reject(error);
      } else {
        console.log(results[0]);
        resolve(results);
      }
    });
  });
};